# Deployment Guide

## Overview

Community Hero deploys as a **single Cloud Run service**. One Docker container runs:

- The Express API (`/api/*`)
- The pre-built React SPA (all other routes)

This means one public URL, one build, one service to monitor. The Dockerfile handles the full build pipeline.

---

## Prerequisites

- [gcloud CLI](https://cloud.google.com/sdk/docs/install) installed and authenticated
- Docker is **not** required locally — Cloud Build handles the image build
- `client/.env` must exist and contain `VITE_MAPS_KEY` (it is uploaded as part of `--source .`)
- `GEMINI_API_KEY` is passed at deploy time via `--update-env-vars` (never committed)

---

## One-Command Deploy

From the **project root** (not `server/` or `client/`):

```bash
gcloud run deploy community-hero \
  --source . \
  --region asia-south1 \
  --allow-unauthenticated \
  --update-env-vars GEMINI_API_KEY=YOUR_GEMINI_KEY
```

Cloud Build uploads your source, runs the Dockerfile, pushes the image to Artifact Registry, and deploys a new Cloud Run revision. Traffic shifts to 100% automatically.

Typical build time: **3–5 minutes**.

---

## Environment Variables on Cloud Run

Runtime environment variables are set via `--update-env-vars`. They persist across redeploys unless explicitly changed.

| Variable                | How to set                                                                   |
| ----------------------- | ---------------------------------------------------------------------------- |
| `GEMINI_API_KEY`        | `--update-env-vars GEMINI_API_KEY=...` at deploy time                        |
| `GOOGLE_CLOUD_PROJECT`  | Set automatically by Cloud Run if using workload identity; or set explicitly |
| `GCS_BUCKET_NAME`       | `--update-env-vars GCS_BUCKET_NAME=...`                                      |
| `SERVICE_ACCOUNT_EMAIL` | `--update-env-vars SERVICE_ACCOUNT_EMAIL=...` (if using custom SA)           |
| `NODE_ENV`              | Defaults to `production` from the Dockerfile `ENV` instruction               |

To update multiple variables at once:

```bash
gcloud run services update community-hero \
  --region asia-south1 \
  --update-env-vars "GEMINI_API_KEY=key1,GCS_BUCKET_NAME=bucket1,SERVICE_ACCOUNT_EMAIL=sa@project.iam.gserviceaccount.com"
```

---

## How the Dockerfile Works

```dockerfile
FROM node:20-slim

WORKDIR /app

# Install server production deps first (layer caches when server deps unchanged)
COPY server/package*.json ./server/
RUN npm install --prefix server --omit=dev

# Install client dev deps (needed for vite build)
COPY client/package*.json ./client/
RUN npm install --prefix client

# Copy all source (including client/.env which contains VITE_MAPS_KEY)
COPY . .

# Build React frontend — Vite reads client/.env for VITE_MAPS_KEY
RUN npm run build --prefix client

ENV NODE_ENV=production
EXPOSE 8080
CMD ["npm", "start", "--prefix", "server"]
```

**Why `VITE_MAPS_KEY` goes in `client/.env` rather than `ENV`:**
Vite prioritizes `process.env` over `.env` files. Setting `ENV VITE_MAPS_KEY` in the Dockerfile would require the key to be present at build time via `--build-arg`, which Cloud Build does not easily support. The `.env` file approach is simpler and is explicitly included in `.dockerignore` (which excludes `server/.env` but not `client/.env`).

---

## `.gcloudignore` and What Gets Uploaded

```
#!include:.gitignore   ← inherits .gitignore rules

# Override: include client/.env (contains public Maps key needed at build time)
!client/.env

# Keep server/.env excluded (contains GEMINI_API_KEY — never upload)
server/.env

client/dist/
.DS_Store
```

Critical: `server/.env` is **never** uploaded to Cloud Build. `GEMINI_API_KEY` flows only via `--update-env-vars` at deploy time.

---

## Service Account and IAM

Cloud Run runs under the **default Compute Engine service account** unless you specify `--service-account`. The SA needs:

| Role                                   | Purpose                                 |
| -------------------------------------- | --------------------------------------- |
| `roles/datastore.user`                 | Firestore read/write                    |
| `roles/storage.objectAdmin`            | GCS photo upload + delete               |
| `roles/iam.serviceAccountTokenCreator` | V4 signed URL generation (self-signing) |

Grant them with:

```bash
PROJECT_NUMBER=$(gcloud projects describe YOUR_PROJECT --format='value(projectNumber)')
SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

gcloud projects add-iam-policy-binding YOUR_PROJECT \
  --member="serviceAccount:${SA}" --role="roles/datastore.user"

gcloud storage buckets add-iam-policy-binding gs://YOUR_BUCKET \
  --member="serviceAccount:${SA}" --role="roles/storage.objectAdmin"

gcloud iam service-accounts add-iam-policy-binding "${SA}" \
  --member="serviceAccount:${SA}" --role="roles/iam.serviceAccountTokenCreator"
```

---

## Rollback

List revisions:

```bash
gcloud run revisions list --service community-hero --region asia-south1
```

Roll back to a previous revision:

```bash
gcloud run services update-traffic community-hero \
  --region asia-south1 \
  --to-revisions community-hero-00012-abc=100
```

---

## Custom Domain

```bash
gcloud run domain-mappings create \
  --service community-hero \
  --domain your-domain.com \
  --region asia-south1
```

Then add the CNAME record shown in the output to your DNS provider.

---

## CI/CD with GitHub Actions

The `.github/workflows/ci.yml` workflow runs on every push and pull request:

1. Install dependencies
2. Lint (ESLint)
3. Build the React frontend
4. Run unit tests

Automated deployment to Cloud Run on merge to `main` can be added using the `google-github-actions/deploy-cloudrun` action with Workload Identity Federation. Example:

```yaml
- name: Deploy to Cloud Run
  uses: google-github-actions/deploy-cloudrun@v2
  with:
    service: community-hero
    region: asia-south1
    source: .
    env_vars: |
      GEMINI_API_KEY=${{ secrets.GEMINI_API_KEY }}
      GCS_BUCKET_NAME=${{ secrets.GCS_BUCKET_NAME }}
```

Store `GEMINI_API_KEY` and `GCS_BUCKET_NAME` as GitHub Actions Secrets, never as plain environment variables.

---

## Monitoring

- **Cloud Run metrics**: CPU utilization, request count, latency, instance count — in the Cloud Console under Cloud Run › community-hero › Metrics.
- **Cloud Logging**: All `console.log` and `console.error` output is captured automatically. Use Log Explorer with filter `resource.type="cloud_run_revision"`.
- **Health check**: `GET /api/health` — returns uptime, memory, and presence of required environment variables.
- **Alerting**: Set up Cloud Monitoring alerts on error rate > 1% or p99 latency > 30s.

---

## Estimating Costs

All Google Cloud services used have free tiers. At small scale (< 1,000 reports/month):

| Service       | Estimated cost                                              |
| ------------- | ----------------------------------------------------------- |
| Cloud Run     | ~$0 (free tier: 2M req/month, 360,000 vCPU-seconds)         |
| Firestore     | ~$0 (free tier: 1GB storage, 50K reads/day, 20K writes/day) |
| Cloud Storage | ~$0 (free tier: 5GB)                                        |
| Gemini API    | ~$0–$1 (2.5 Flash pricing; 7 calls per report)              |
| Cloud Build   | ~$0 (free tier: 120 build-minutes/day)                      |

At scale, the main cost driver is **Gemini API calls** (7 per report submission + 1 per dashboard insights refresh).
