import { FieldValue } from "@google-cloud/firestore";
import { db } from "../config/index.js";

// Fire-and-forget audit writes — never await these on the request path.
// Schema: { action, clusterId, metadata, timestamp }
export function logActivity(action, clusterId, metadata = {}) {
  db.collection("activity_logs")
    .add({ action, clusterId, metadata, timestamp: FieldValue.serverTimestamp() })
    .catch((err) => console.warn("[activity_log]", err.message));
}
