import { visionAgent }       from "./vision.js";
import { verificationAgent } from "./verification.js";
import { geoAgent }          from "./geo.js";
import { contextAgent }      from "./context.js";
import { riskAgent }         from "./risk.js";
import { complaintAgent }    from "./complaint.js";
import { monitoringAgent }   from "./monitoring.js";

// Counts retry events across the pipeline run so Monitoring Agent can detect degradation.
function makeRetryCountingEmit(emit, counter) {
  return (event) => {
    if (event.type === "agent_retry") counter.count++;
    emit(event);
  };
}

// ── Pipeline Orchestrator ─────────────────────────────────────────────────────
//
// Runs all seven agents in sequence, emitting SSE events at each step.
// Returns the enriched analysis ready for Firestore + API response.
//
// Agent order:
//   1. Vision      — image classification
//   2. Verification — second opinion / override
//   3. Geo         — reverse geocode via Nominatim
//   4. Context     — nearby places (Overpass), weather (Open-Meteo), history (Firestore)
//   5. Risk        — context-aware priority scoring + cost/action estimates
//   6. Complaint   — formal letter draft
//   7. Monitoring  — anomaly detection + audit log

export async function runAgentPipeline({ img, lat, lng, reportCount = 1, emit }) {
  const timings      = [];
  const retryCounter = { count: 0 };
  const track        = makeRetryCountingEmit(emit, retryCounter);

  const time = async (agentName, fn) => {
    const start  = Date.now();
    const result = await fn();
    timings.push({ agent: agentName, durationMs: Date.now() - start });
    return result;
  };

  // ── Agent 1: Vision ───────────────────────────────────────────────────────
  const visionResult = await time("vision", () =>
    visionAgent.run({ img }, track)
  );

  if (!visionResult.isCivicIssue) {
    emit({ type: "pipeline_skipped", reason: "Vision Agent: not a civic issue", visionResult });
    return { visionResult, skipped: true };
  }

  // ── Agent 2: Verification ─────────────────────────────────────────────────
  const verificationResult = await time("verification", () =>
    verificationAgent.run({ img, visionResult }, track)
  );

  const finalClassification = {
    ...visionResult,
    issueType:    verificationResult.confirmsIssueType  ? visionResult.issueType  : verificationResult.suggestedIssueType,
    severity:     verificationResult.confirmsIssueType  ? visionResult.severity   : verificationResult.suggestedSeverity,
    isCivicIssue: verificationResult.confirmsIsCivicIssue && verificationResult.pass,
  };

  if (!finalClassification.isCivicIssue) {
    emit({ type: "pipeline_skipped", reason: "Verification Agent: not a civic issue", verificationResult });
    return { visionResult, verificationResult, finalClassification, skipped: true };
  }

  // ── Agent 3: Geo ──────────────────────────────────────────────────────────
  const geoResult = await time("geo", () =>
    geoAgent.run({ lat, lng }, track)
  );

  // ── Agent 4: Context ──────────────────────────────────────────────────────
  // Fetches nearby places, current weather, and historical recurrence data.
  // Degrades gracefully: each sub-fetch is individually wrapped in Promise.allSettled
  // inside ContextAgent.execute(), so partial failures don't block the pipeline.
  const contextResult = await time("context", () =>
    contextAgent.run({
      lat,
      lng,
      issueType: finalClassification.issueType,
      severity:  finalClassification.severity,
      reportCount,
    }, track)
  );

  // ── Agent 5: Risk ─────────────────────────────────────────────────────────
  const riskResult = await time("risk", () =>
    riskAgent.run({ finalClassification, geoResult, reportCount, contextResult }, track)
  );

  // ── Agent 6: Complaint ────────────────────────────────────────────────────
  const complaintResult = await time("complaint", () =>
    complaintAgent.run({
      finalClassification: { ...finalClassification, lat, lng },
      geoResult,
      riskResult,
      contextResult,
      reportCount,
      classification: finalClassification, // for startMessage
    }, track)
  );

  // ── Agent 7: Monitoring ───────────────────────────────────────────────────
  const monitoringResult = await time("monitoring", () =>
    monitoringAgent.run({
      timings,
      visionResult,
      verificationResult,
      riskResult,
      clusterId:  null,  // back-filled by controller after Firestore write
      merged:     false,
      retryCount: retryCounter.count,
    }, track)
  );

  return {
    visionResult,
    verificationResult,
    finalClassification,
    geoResult,
    contextResult,
    riskResult,
    complaintResult,
    monitoringResult,
    skipped: false,
  };
}
