# DEPLOY.md — Get Community Hero live on Google Cloud Run

You deploy ONE service. The Express server serves both the API and the built
React frontend, so you get ONE public URL — exactly what the hackathon wants.

## What you need
- A Google Cloud project (create at https://console.cloud.google.com)
- Billing enabled on it (Cloud Run has a free tier; new accounts get $300 credit)
- The `gcloud` CLI installed: https://cloud.google.com/sdk/docs/install
- Your two keys: GEMINI_API_KEY (server, secret) and a Maps JS key (client, baked at build)

## One-time setup (≈5 min)
```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
gcloud services enable run.googleapis.com cloudbuild.googleapis.com
```

## The deploy command

This project includes a Dockerfile, so Cloud Run builds it explicitly (reliable —
no buildpack guesswork). Run this from the PROJECT ROOT:

```bash
gcloud run deploy community-hero \
  --source . \
  --region asia-south1 \
  --allow-unauthenticated \
  --update-env-vars GEMINI_API_KEY=your_real_gemini_key
```

### How the Maps key works (build-time)

Vite bakes `VITE_MAPS_KEY` into the frontend JS bundle at **build time**.
The key lives in `client/.env`:

```bash
echo "VITE_MAPS_KEY=your_real_maps_key" > client/.env
```

When you run `gcloud run deploy --source .`, the CLI uploads your source to
Cloud Build. The `.gcloudignore` file controls what gets uploaded:
- `client/.env` **IS uploaded** (it contains the public Maps JS key).
- `server/.env` **IS excluded** (it contains secret keys like GEMINI_API_KEY).

Inside the Docker build, `COPY . .` copies `client/.env` into the image, and
`npm run build --prefix client` (Vite) reads it automatically.

> **IMPORTANT:** If the map shows "Add VITE_MAPS_KEY to see the map" after
> deploying, check that:
> 1. `client/.env` exists and contains `VITE_MAPS_KEY=AIza...`
> 2. `.gcloudignore` does NOT have a blanket `.env` exclusion
> 3. `.gitignore` exclusions don't override `.gcloudignore` (check `.gcloudignore` has its own explicit `server/.env` exclusion)

GEMINI_API_KEY is the real secret and is passed at **runtime** via `--update-env-vars`,
so it never ends up in the frontend bundle. Keep it OUT of `client/.env`.

Notes:
- `--source .` with a Dockerfile present → Cloud Build uses the Dockerfile.
- `asia-south1` is Mumbai. Use any region you like.
- `--allow-unauthenticated` makes the URL public (required — judges must open it).

When it finishes you'll see:
```
Service [community-hero] ... is serving traffic at https://community-hero-xxxx.a.run.app
```
**That URL is your submission's Deployed Application Link.** Open it on your phone,
take a photo, generate a complaint — confirm the whole flow works live.

## After deploy — lock down the Maps key (2 min, important)
The Maps key is visible in the browser (normal). In Cloud Console →
APIs & Services → Credentials → your Maps key → Application restrictions →
HTTP referrers → add your Cloud Run URL (e.g. https://community-hero-xxxx.a.run.app/*).
This stops anyone copying it from your live site.

## Redeploying after changes
Just run the same `gcloud run deploy --source .` command again. It rebuilds and
ships a new revision. Do a final redeploy after your last code change, then DON'T
touch it — verify the link works and leave it live through the evaluation period.

## If the build fails
- "PERMISSION_DENIED" on cloudbuild → re-run the `gcloud services enable` line.
- Build can't find a script → make sure you're in the ROOT folder (root package.json present).
- App loads but map is blank → `VITE_MAPS_KEY` wasn't in `client/.env`, or Maps
  JavaScript API isn't enabled in your project. Check Cloud Run logs for the
  `[static]` diagnostic line to confirm the bundle was built.
- App loads but "Analysis failed" → GEMINI_API_KEY wasn't passed or is wrong.
  Check: Cloud Run → your service → Revisions → the env vars are listed.

