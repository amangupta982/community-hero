import { parseDataUrl } from "../utils/parseDataUrl.js";
import { uploadPhoto } from "../services/storage.js";
import { submitReport, listClusters, findClusterById } from "../store/clusters.js";
import { logActivity } from "../store/activity_logs.js";
import { recordComplaint } from "../store/complaints.js";
import { runAgentPipeline } from "../agents/pipeline.js";

export async function getReport(req, res) {
  const cluster = await findClusterById(req.params.id);
  if (!cluster) return res.status(404).json({ error: "Report not found" });
  res.json(cluster);
}

export async function getReports(req, res) {
  const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
  const after = req.query.after || null;
  res.json(await listClusters({ limit, after }));
}

// Non-streaming version: runs the full agent pipeline, saves to Firestore,
// returns the cluster object in a single JSON response.
export async function createReport(req, res) {
  const { photo, lat, lng } = req.body || {};
  if (!parseDataUrl(photo)) {
    return res.status(400).json({ error: "photo must be a base64 data URL" });
  }

  const latNum = typeof lat === "number" ? lat : null;
  const lngNum = typeof lng === "number" ? lng : null;

  const img = parseDataUrl(photo);
  const emit = () => {}; // no-op — pipeline events discarded in non-streaming mode

  const pipeline = await runAgentPipeline({ img, lat: latNum, lng: lngNum, reportCount: 1, emit });

  if (pipeline.skipped) {
    // Store a minimal record even for non-civic issues so the user sees feedback.
    return res.json({
      isCivicIssue: false,
      issueType: pipeline.visionResult?.issueType ?? "Other",
      description: pipeline.visionResult?.description ?? "",
      merged: false,
      skipped: true,
    });
  }

  const photoUrl = await uploadPhoto(photo);
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

  res.json({ ...cluster, merged });
}
