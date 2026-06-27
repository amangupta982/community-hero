import { FieldValue } from "@google-cloud/firestore";
import { db } from "../config/index.js";

// Mirrors each drafted complaint into its own collection for audit/analytics.
// Schema: { clusterId, text, department, draftedAt }
export function recordComplaint({ clusterId, text, department }) {
  db.collection("complaints")
    .add({ clusterId, text, department, draftedAt: FieldValue.serverTimestamp() })
    .catch((err) => console.warn("[complaint_record]", err.message));
}
