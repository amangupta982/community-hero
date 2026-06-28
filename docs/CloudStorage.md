# Cloud Storage

## Overview

Community Hero stores citizen-submitted photos in **Google Cloud Storage**. Each photo is uploaded to a `photos/` prefix with a timestamped, random filename. The stored URL (or data URL in development) is persisted in the Firestore cluster document as the `photo` field.

---

## Bucket Setup

```bash
# Create the bucket in the same region as Cloud Run and Firestore
gsutil mb -l asia-south1 gs://YOUR_BUCKET_NAME

# Grant the Cloud Run service account write access
PROJECT_NUMBER=$(gcloud projects describe YOUR_PROJECT --format='value(projectNumber)')
SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

gcloud storage buckets add-iam-policy-binding gs://YOUR_BUCKET_NAME \
  --member="serviceAccount:${SA}" \
  --role="roles/storage.objectAdmin"
```

Set `GCS_BUCKET_NAME=YOUR_BUCKET_NAME` in `server/.env` (local) and via `--update-env-vars` (Cloud Run).

---

## Upload Flow

`services/storage.js` handles all upload logic:

1. `parseDataUrl(base64DataUrl)` extracts `{mimeType, data}` from the base64 string.
2. A unique object name is generated: `photos/{timestamp}-{random}.{ext}`.
3. `bucket.file(name).save(buffer, { resumable: false })` uploads the binary.
4. The function then returns a URL appropriate for the environment:

---

## Photo URL Strategy: Local vs Cloud Run

The bucket has **Public Access Prevention** enforced at the org level. This means:

- `allUsers` IAM bindings are rejected (HTTP 412)
- No object can be fetched without credentials
- Public object URLs (`storage.googleapis.com/...`) do not work

Two different strategies are used depending on the environment:

### Local Development

`K_SERVICE` is absent → `IS_CLOUD_RUN = false`

The function skips signed URL generation and **returns the original base64 data URL**. The object is still uploaded to GCS (verifying IAM write access), but the `photo` field in Firestore stores the data URL.

```
Pros:  Works without service account key or IAM Credentials API
Cons:  Firestore documents are larger; data URLs don't expire
```

### Cloud Run (Production)

`K_SERVICE` is present → `IS_CLOUD_RUN = true`

The function calls `file.getSignedUrl()` with V4 signing:

- TTL: 7 days (`SIGNED_URL_TTL_MS`)
- Signing method: workload identity (no key file needed)
- `serviceAccountEmail` is passed if `SERVICE_ACCOUNT_EMAIL` is set — required for the IAM Credentials API to sign on behalf of the SA

```
Pros:  Short-lived, tamper-proof URLs; standard HTTPS access
Cons:  URLs expire after 7 days; requires iam.serviceAccountTokenCreator role
```

---

## Required IAM Roles for Signed URLs

The Cloud Run service account needs both:

| Role                                   | Purpose                                      |
| -------------------------------------- | -------------------------------------------- |
| `roles/storage.objectAdmin`            | Upload, read, and delete objects             |
| `roles/iam.serviceAccountTokenCreator` | Sign blobs for V4 signed URLs (self-signing) |

Grant self-signing permission:

```bash
gcloud iam service-accounts add-iam-policy-binding "${SA}" \
  --member="serviceAccount:${SA}" \
  --role="roles/iam.serviceAccountTokenCreator"
```

> If you see `Error: Could not load the default credentials` or `invalid_grant` when generating signed URLs on Cloud Run, the `SERVICE_ACCOUNT_EMAIL` environment variable is missing or the `serviceAccountTokenCreator` role has not been granted.

---

## File Naming Convention

```
photos/{Date.now()}-{Math.random().toString(36).slice(2)}.{ext}
```

Example: `photos/1719484800000-k7m3xqz.jpg`

This guarantees:

- No collisions (random suffix + millisecond timestamp)
- Chronological sortability by prefix
- MIME type expressed in extension (`jpg`, `png`, `webp`)

---

## Lifecycle Management

By default, photos are stored indefinitely. For cost control, add a lifecycle rule to delete objects older than 90 days:

```bash
cat > /tmp/lifecycle.json << 'EOF'
{
  "lifecycle": {
    "rule": [
      {
        "action": { "type": "Delete" },
        "condition": { "age": 90 }
      }
    ]
  }
}
EOF

gsutil lifecycle set /tmp/lifecycle.json gs://YOUR_BUCKET_NAME
```

Note: Signed URLs pointing to deleted objects will return `404`. The Firestore document will still reference the now-invalid URL. A cleanup job to reconcile orphaned references is a future improvement.

---

## CORS Configuration

The bucket does not need a CORS configuration because photos are accessed via **signed URLs** (direct HTTP GET from the browser to GCS) rather than via XMLHttpRequest from the same origin. Signed URL requests bypass CORS checks.

If you add a feature that requires direct browser upload to GCS (bypassing the Express server), add a CORS policy:

```bash
cat > /tmp/cors.json << 'EOF'
[
  {
    "origin": ["https://your-domain.com"],
    "method": ["GET", "PUT"],
    "responseHeader": ["Content-Type"],
    "maxAgeSeconds": 3600
  }
]
EOF

gsutil cors set /tmp/cors.json gs://YOUR_BUCKET_NAME
```
