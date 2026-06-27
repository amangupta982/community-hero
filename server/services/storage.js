import { bucket, SERVICE_ACCOUNT_EMAIL } from "../config/index.js";
import { parseDataUrl } from "../utils/parseDataUrl.js";

// Cloud Run always injects K_SERVICE.  Absent locally → we are in dev mode.
const IS_CLOUD_RUN = !!process.env.K_SERVICE;

const SIGNED_URL_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function uploadPhoto(base64DataUrl) {
  if (!bucket) throw new Error("GCS_BUCKET_NAME is not configured.");

  const parsed = parseDataUrl(base64DataUrl);
  if (!parsed) throw new Error("Invalid base64 data URL passed to uploadPhoto.");

  const { mimeType, data } = parsed;
  const ext        = mimeType.split("/")[1]?.replace("jpeg", "jpg") || "jpg";
  const objectName = `photos/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const file = bucket.file(objectName);
  await file.save(Buffer.from(data, "base64"), {
    metadata: { contentType: mimeType },
    resumable: false,
  });

  // ── Local development ─────────────────────────────────────────────────────
  //
  // Two approaches are blocked by Google Cloud org policy in this project:
  //
  //  • getSignedUrl()  — requires `client_email` in the credential.  ADC user
  //    credentials (gcloud auth application-default login) are personal OAuth2
  //    tokens; they have no service-account email and cannot sign blobs.
  //
  //  • Public object URL — the bucket has Public Access Prevention enforced at
  //    the org level (HTTP 412 when attempting allUsers IAM binding), so no
  //    object can ever be fetched without credentials.
  //
  // The only approach that lets the browser render <img src="..."> without
  // auth headers is a base64 data URL.  The object is still uploaded to GCS
  // (verifying connectivity and IAM write access), but the `photo` field stored
  // in Firestore points to the data URL instead of a GCS HTTPS URL.
  // On Cloud Run the same field holds a signed URL — the rest of the app never
  // inspects the scheme, so nothing else needs to change.
  if (!IS_CLOUD_RUN) {
    console.log(`[storage:dev] Uploaded → gs://${bucket.name}/${objectName}`);
    console.log("[storage:dev] Returning base64 data URL (Public Access Prevention blocks public GCS URLs)");
    return base64DataUrl;
  }

  // ── Cloud Run (workload identity) ─────────────────────────────────────────
  //
  // The revision's service account can sign via the IAM Credentials API.
  // Pass its email so the library uses signBlob instead of a local private key.
  const signOptions = {
    version:  "v4",
    action:   "read",
    expires:  Date.now() + SIGNED_URL_TTL_MS,
  };
  if (SERVICE_ACCOUNT_EMAIL) {
    signOptions.serviceAccountEmail = SERVICE_ACCOUNT_EMAIL;
  }

  const [signedUrl] = await file.getSignedUrl(signOptions);
  return signedUrl;
}
