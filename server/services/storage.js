import { bucket } from "../config/index.js";
import { parseDataUrl } from "../utils/parseDataUrl.js";

// Cloud Run always injects K_SERVICE.  Absent locally → we are in dev mode.
const IS_CLOUD_RUN = !!process.env.K_SERVICE;

export async function uploadPhoto(base64DataUrl) {
  if (!bucket) throw new Error("GCS_BUCKET_NAME is not configured.");

  const parsed = parseDataUrl(base64DataUrl);
  if (!parsed) throw new Error("Invalid base64 data URL passed to uploadPhoto.");

  const { mimeType, data } = parsed;
  const ext = mimeType.split("/")[1]?.replace("jpeg", "jpg") || "jpg";
  const objectName = `photos/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const file = bucket.file(objectName);
  await file.save(Buffer.from(data, "base64"), {
    metadata: { contentType: mimeType },
    resumable: false,
  });

  // ── Local development ─────────────────────────────────────────────────────
  // Return the raw base64 data URL so the browser can render the image without
  // needing GCS credentials. The object is still written to GCS (verifying
  // connectivity), but the stored URL is the data URL.
  if (!IS_CLOUD_RUN) {
    console.log(`[storage:dev] Uploaded → gs://${bucket.name}/${objectName}`);
    return base64DataUrl;
  }

  // ── Cloud Run ─────────────────────────────────────────────────────────────
  // Return a server-side proxy path (/api/photo/<objectName>) instead of a
  // GCS signed URL. The Cloud Run server reads the object from GCS using its
  // own workload-identity credentials — no signBlob permission required, and
  // the URL never expires.
  console.log(`[storage] Uploaded → gs://${bucket.name}/${objectName} (proxy URL)`);
  return `/api/photo/${objectName}`;
}
