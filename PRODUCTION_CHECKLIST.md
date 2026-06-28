# Production Checklist

Use this checklist before deploying Community Hero to a real municipal environment (beyond the hackathon demo).

---

## Google Cloud Project

- [ ] Billing enabled on the GCP project
- [ ] Required APIs enabled:
  - [ ] `run.googleapis.com`
  - [ ] `cloudbuild.googleapis.com`
  - [ ] `firestore.googleapis.com`
  - [ ] `storage.googleapis.com`
  - [ ] `iam.googleapis.com`
- [ ] Project ID recorded: `_____________________`

---

## Firestore

- [ ] Firestore database created in **Native mode** (not Datastore mode)
- [ ] Region: `asia-south1` (or your chosen region)
- [ ] Composite indexes deployed: `firebase deploy --only firestore:indexes`
- [ ] Index status: both indexes show **Enabled** in the Firebase Console (not building)
- [ ] Firestore security rules reviewed and deployed (`firestore.rules`)
- [ ] Backup / export schedule configured (Cloud Scheduler + `gcloud firestore export`)
- [ ] Alert configured for Firestore write quota (> 80% of daily 20K writes)

### Verify indexes

```bash
firebase firestore:indexes
```

Both indexes should show `READY` state.

---

## Cloud Storage

- [ ] Bucket created in the same region as Cloud Run: `gsutil mb -l asia-south1 gs://BUCKET`
- [ ] Public Access Prevention is enabled (default for new buckets in restricted orgs)
- [ ] Cloud Run service account has `roles/storage.objectAdmin` on the bucket
- [ ] Service account has `roles/iam.serviceAccountTokenCreator` (for V4 signed URLs)
- [ ] `SERVICE_ACCOUNT_EMAIL` set on the Cloud Run service
- [ ] Object lifecycle rule configured (delete objects older than 90 days)
- [ ] CORS policy reviewed (no client-side uploads currently, so no CORS needed)

### Test signed URL generation

After deploying, submit a test photo and verify the `photo` field in the returned cluster is an `https://storage.googleapis.com/...` URL (not a `data:` URL).

---

## IAM Permissions

Verify the Cloud Run service account has exactly the required roles — no more:

```bash
PROJECT_NUMBER=$(gcloud projects describe YOUR_PROJECT --format='value(projectNumber)')
SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

# Check project-level roles
gcloud projects get-iam-policy YOUR_PROJECT \
  --flatten="bindings[].members" \
  --filter="bindings.members:serviceAccount:${SA}" \
  --format="table(bindings.role)"

# Check bucket-level roles
gcloud storage buckets get-iam-policy gs://YOUR_BUCKET \
  --flatten="bindings[].members" \
  --filter="bindings.members:serviceAccount:${SA}" \
  --format="table(bindings.role)"
```

Expected roles:
- [ ] `roles/datastore.user` (project level)
- [ ] `roles/storage.objectAdmin` (bucket level)
- [ ] `roles/iam.serviceAccountTokenCreator` (SA self-policy)

---

## Environment Variables

Verify on Cloud Run:

```bash
gcloud run services describe community-hero \
  --region asia-south1 \
  --format="yaml(spec.template.spec.containers[0].env)"
```

- [ ] `GEMINI_API_KEY` — present, non-empty
- [ ] `GOOGLE_CLOUD_PROJECT` — correct project ID
- [ ] `GCS_BUCKET_NAME` — correct bucket name
- [ ] `SERVICE_ACCOUNT_EMAIL` — Cloud Run SA email
- [ ] `NODE_ENV` — `production`

---

## Cloud Run Service

- [ ] Service deployed in the correct region
- [ ] `--allow-unauthenticated` (required for public civic access)
- [ ] Minimum instances set to avoid cold-start latency for real users (optional: `--min-instances=1`)
- [ ] Memory: default (256Mi) is usually sufficient; increase to 512Mi if OOM errors appear
- [ ] Request timeout: default (300s) covers longest pipeline runs (typically < 40s)
- [ ] Health check passing: `curl SERVICE_URL/api/health` → `{"ok":true,...}`
- [ ] All `checks` fields in health response are `true`

---

## Security Checklist

- [ ] `server/.env` is in `.gitignore` and has never been committed
- [ ] `client/.env` is in `.gitignore` (it is uploaded via `.gcloudignore` but not committed to git)
- [ ] `GEMINI_API_KEY` is not visible in:
  - [ ] Git history (`git log -p | grep GEMINI`)
  - [ ] Docker image environment (`docker inspect IMAGE | grep GEMINI`)
  - [ ] Client bundle (`grep -r "AIza" client/dist/`)
- [ ] Google Maps JS API key has HTTP-referrer restrictions set in the Google Cloud Console
- [ ] `GEMINI_API_KEY` has API usage restrictions set (limit to `Generative Language API`)
- [ ] Demo routes (`/api/demo/seed`, `/api/demo/reset`) are protected or removed for production
- [ ] Rate limits reviewed — 5 req/min pipeline, 120 req/min API (adjust for expected traffic)
- [ ] Helmet CSP policy reviewed (currently disabled due to Google Maps; add CSP when Maps keys are domain-locked)
- [ ] Cloud Logging alerts configured for `severity>=ERROR`

---

## Pre-Launch Testing

- [ ] Submit a real photo of a pothole → verify the full 7-agent pipeline completes
- [ ] Verify the cluster appears in `GET /api/reports`
- [ ] Verify the complaint is drafted and `department` field is correctly populated
- [ ] Submit the same photo twice from the same location → verify cluster is merged (not duplicated)
- [ ] Submit a non-civic photo (e.g., a selfie) → verify it is rejected (`pipeline_skipped`)
- [ ] Open the City Dashboard → verify stats and AI insights load
- [ ] Check signed URL expiry date in the `photo` field (should be ~7 days from now)
- [ ] Open the app on a mobile browser → verify responsive layout

---

## Monitoring

- [ ] Cloud Monitoring dashboard configured for:
  - [ ] Cloud Run: request count, error rate, latency (p50/p95/p99), instance count
  - [ ] Firestore: read/write operations per day
  - [ ] Cloud Build: build success/failure rate
- [ ] Alert policy: error rate > 1% for 5 minutes → PagerDuty / email
- [ ] Alert policy: p99 latency > 30 seconds → warning
- [ ] Alert policy: Gemini API quota > 80% → warning

---

## Operational Runbook

- **Rollback**: `gcloud run services update-traffic community-hero --to-revisions PREV_REVISION=100`
- **Re-deploy**: `gcloud run deploy community-hero --source . --region asia-south1 --update-env-vars GEMINI_API_KEY=KEY`
- **View logs**: `gcloud run services logs tail community-hero --region asia-south1`
- **Check index status**: Firebase Console → Firestore → Indexes
- **Flush insights cache**: Restart the Cloud Run service (redeploy or manually trigger a new revision)
