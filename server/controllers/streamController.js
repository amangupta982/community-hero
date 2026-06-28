import { parseDataUrl } from "../utils/parseDataUrl.js";
import { uploadPhoto } from "../services/storage.js";
import { submitReport } from "../store/clusters.js";
import { logActivity } from "../store/activity_logs.js";
import { recordComplaint } from "../store/complaints.js";
import { runAgentPipeline } from "../agents/pipeline.js";

// ── SSE helpers ───────────────────────────────────────────────────────────────

function sseHeaders(res) {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no"); // disable nginx/Cloud Run proxy buffering
  res.flushHeaders();
}

function sseEmit(res, event) {
  if (res.writableEnded) return;
  res.write(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`);
}

function sseEnd(res) {
  if (!res.writableEnded) res.end();
}

// ── Streaming report endpoint ─────────────────────────────────────────────────
// POST /api/report/stream
// Returns Server-Sent Events. Client reads via fetch + ReadableStream (not EventSource,
// since EventSource only supports GET).

export async function streamReport(req, res) {
  const { photo, lat, lng } = req.body || {};
  const img = parseDataUrl(photo);
  if (!img) {
    // SSE headers not set yet — can return normal JSON error
    return res.status(400).json({ error: "photo must be a base64 data URL" });
  }

  sseHeaders(res);

  const latNum = typeof lat === "number" ? lat : null;
  const lngNum = typeof lng === "number" ? lng : null;
  const emit = (event) => sseEmit(res, event);

  // Abort pipeline if client disconnects.
  let aborted = false;
  req.on("close", () => {
    aborted = true;
  });

  try {
    // ── Run all six agents ────────────────────────────────────────────────────
    const pipeline = await runAgentPipeline({
      img,
      lat: latNum,
      lng: lngNum,
      reportCount: 1, // will be updated on merge
      emit,
    });

    if (aborted) return sseEnd(res);

    if (pipeline.skipped) {
      emit({ type: "pipeline_complete", merged: false, skipped: true, isCivicIssue: false });
      return sseEnd(res);
    }

    // ── Upload image to GCS ───────────────────────────────────────────────────
    emit({ type: "storage_start", message: "Uploading image to secure storage..." });
    const photoUrl = await uploadPhoto(photo);
    emit({ type: "storage_complete", message: "Image stored securely." });

    if (aborted) return sseEnd(res);

    // ── Save to Firestore (transactional cluster-or-create) ───────────────────
    const { cluster, merged } = await submitReport({
      analysis: pipeline.finalClassification,
      photoUrl,
      lat: latNum,
      lng: lngNum,
      enriched: {
        geoResult: pipeline.geoResult,
        contextResult: pipeline.contextResult,
        riskResult: pipeline.riskResult,
        complaintResult: pipeline.complaintResult,
        monitoringResult: pipeline.monitoringResult,
      },
    });

    // Fire-and-forget audit writes.
    logActivity(merged ? "cluster_merged" : "report_created", cluster.id, {
      merged,
      pipelineId: pipeline.monitoringResult?.pipelineId,
      agentCount: 7,
    });
    if (pipeline.complaintResult) {
      recordComplaint({
        clusterId: cluster.id,
        text: pipeline.complaintResult.letter,
        department: pipeline.complaintResult.department,
      });
    }

    emit({
      type: "pipeline_complete",
      cluster,
      merged,
      pipelineId: pipeline.monitoringResult?.pipelineId,
    });
  } catch (err) {
    console.error("[stream] pipeline error:", err);
    emit({ type: "pipeline_error", error: err.message });
  } finally {
    sseEnd(res);
  }
}
