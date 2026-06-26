# Server — Community Hero

## Run locally
```bash
npm install
GEMINI_API_KEY=your_gemini_key npm start
# -> Community Hero server on :8080
```
Get a Gemini key at https://aistudio.google.com/apikey

## Endpoints
- `GET  /api/health`  → `{ ok: true }`
- `GET  /api/reports` → all reports, newest first
- `POST /api/report`  → body `{ photo: "<base64 data URL>", lat, lng }` → classified report

## Deploy to Google Cloud Run (MANDATORY for the hackathon)
From the repo root, with gcloud installed and a project selected:
```bash
gcloud run deploy community-hero-server \
  --source ./server \
  --region asia-south1 \
  --allow-unauthenticated \
  --set-env-vars GEMINI_API_KEY=your_gemini_key
```
Cloud Run auto-detects the Node app (it reads PORT from env — already handled).
You'll get a public HTTPS URL. That URL is your deployed backend.

> Alternative blessed path: build the whole thing in AI Studio Build mode and hit
> Publish — it deploys to Cloud Run for you and injects GEMINI_API_KEY automatically.
> This local code mirrors that setup so you can move between them.
