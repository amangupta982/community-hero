import { findClusterById, updateCluster } from "../store/clusters.js";
import { recordComplaint } from "../store/complaints.js";
import { logActivity } from "../store/activity_logs.js";
import { draftComplaint } from "../services/gemini.js";

export async function generateComplaint(req, res) {
  // IDs are now Firestore document ID strings — no Number() cast needed.
  const cluster = await findClusterById(req.params.id);
  if (!cluster) return res.status(404).json({ error: "report not found" });

  if (cluster.isCivicIssue === false || cluster.issueType === "Other") {
    return res.status(422).json({
      error: "not_civic",
      message:
        "This doesn't appear to be a public infrastructure issue, so no official complaint was drafted.",
    });
  }

  const { text, department } = await draftComplaint(cluster);

  await updateCluster(req.params.id, {
    complaint: text,
    department,
    status: "Complaint Drafted",
  });

  // Mirror to the complaints collection for audit (fire-and-forget).
  recordComplaint({ clusterId: req.params.id, text, department });
  logActivity("complaint_drafted", req.params.id, { department });

  res.json({ ...cluster, complaint: text, department, status: "Complaint Drafted" });
}
