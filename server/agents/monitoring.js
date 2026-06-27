import { BaseAgent } from "./base.js";
import { logActivity } from "../store/activity_logs.js";

class MonitoringAgent extends BaseAgent {
  constructor() { super("monitoring", { maxRetries: 0 }); }

  startMessage() { return "Logging pipeline trace and checking for anomalies..."; }

  publicResult(r) {
    return {
      pipelineId: r.pipelineId,
      totalDurationMs: r.totalDurationMs,
      anomalies: r.anomalies,
      verificationOverride: r.verificationOverride,
    };
  }

  async execute({ timings, visionResult, verificationResult, riskResult, clusterId, merged, retryCount }) {
    const pipelineId = `ph3-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
    const totalDurationMs = timings.reduce((s, t) => s + t.durationMs, 0);
    const anomalies = [];

    if ((visionResult?.confidence ?? 100) < 60) {
      anomalies.push(`Low classification confidence: ${visionResult.confidence}%`);
    }
    if (verificationResult && !verificationResult.confirmsIssueType) {
      anomalies.push(`Issue type corrected by Verification Agent → ${verificationResult.suggestedIssueType}`);
    }
    if ((riskResult?.estimatedResolutionDays ?? 0) > 30) {
      anomalies.push(`Extended resolution estimate: ${riskResult.estimatedResolutionDays} days`);
    }
    if (retryCount > 0) {
      anomalies.push(`${retryCount} agent retry/retries detected during pipeline`);
    }
    if ((riskResult?.priorityScore ?? 0) >= 80 && visionResult?.severity !== "Critical") {
      anomalies.push("High priority score but non-Critical severity — may warrant escalation");
    }

    const monitoringResult = {
      pipelineId,
      totalDurationMs,
      agentTimings: timings,
      anomalies,
      verificationOverride: verificationResult ? !verificationResult.confirmsIssueType : false,
      confidenceScore: visionResult?.confidence ?? null,
    };

    // Fire-and-forget audit log — does not block the response.
    logActivity("pipeline_complete", clusterId ?? "unknown", {
      pipelineId,
      merged,
      totalDurationMs,
      anomalyCount: anomalies.length,
    });

    return monitoringResult;
  }
}

export const monitoringAgent = new MonitoringAgent();
