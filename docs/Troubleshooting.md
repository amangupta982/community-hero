# Troubleshooting

## Quick Diagnostics

First, check the health endpoint:

```bash
curl https://community-hero-222244874663.asia-south1.run.app/api/health
# Expected: { "ok": true, "checks": { "gemini": true, "firestore": true, "storage": true } }
```

All `checks` fields should be `true`. A `false` value means the corresponding environment variable is missing from the Cloud Run service.

---

## Error: `FAILED_PRECONDITION: The query requires an index`

**Cause:** The composite Firestore indexes have not been deployed, or the index was deleted.

**Fix:**
```bash
firebase deploy --only firestore:indexes
```

Wait 1–10 minutes for the index to build. The server logs this error during the build window but degrades gracefully — it skips geo-clustering and creates a new cluster instead.

---

## Error: `FAILED_PRECONDITION: That index is currently building and cannot be used yet`

**Cause:** `firebase deploy --only firestore:indexes` completed, but the index is still being built by Firestore (can take up to 10 minutes).

**Fix:** Wait. Check index status at:
```
https://console.firebase.google.com/project/YOUR_PROJECT/firestore/indexes
```

---

## Map shows "Add VITE_MAPS_KEY to see the map"

**Cause:** `client/.env` is missing or `VITE_MAPS_KEY` is empty.

**Fix (local dev):**
```bash
echo "VITE_MAPS_KEY=AIza..." > client/.env
npm run dev --prefix client
```

**Fix (Cloud Run):** Rebuild and redeploy. The Maps key is baked into the bundle at build time — it cannot be injected at runtime via `--update-env-vars`.

```bash
# Ensure client/.env exists before deploying
cat client/.env   # Should show VITE_MAPS_KEY=AIza...
gcloud run deploy community-hero --source . --region asia-south1 ...
```

**Verify `.gcloudignore`** does not exclude `client/.env`:
```bash
grep "client/.env" .gcloudignore   # Should print: !client/.env
```

---

## Photos not displaying in production

**Cause A:** `SERVICE_ACCOUNT_EMAIL` environment variable is missing on Cloud Run.

The `storage.js` service needs this to generate V4 signed URLs via workload identity.

**Fix:**
```bash
gcloud run services update community-hero \
  --region asia-south1 \
  --update-env-vars SERVICE_ACCOUNT_EMAIL=PROJECT_NUMBER-compute@developer.gserviceaccount.com
```

**Cause B:** The Cloud Run service account lacks `roles/iam.serviceAccountTokenCreator`.

**Fix:**
```bash
SA="PROJECT_NUMBER-compute@developer.gserviceaccount.com"
gcloud iam service-accounts add-iam-policy-binding "${SA}" \
  --member="serviceAccount:${SA}" \
  --role="roles/iam.serviceAccountTokenCreator"
```

**Cause C:** Signed URLs have expired (7-day TTL).

Signed URLs in Firestore documents expire after 7 days. Re-submitting the report generates a new URL. A background job to refresh expiring URLs is a future improvement.

---

## Photos displaying in dev as very long data: URLs

**Expected behaviour.** In local development, `storage.js` detects the absence of `K_SERVICE` and returns the base64 data URL instead of a signed URL. The photo is still uploaded to GCS — only the reference stored in Firestore differs. This is documented in [CloudStorage.md](CloudStorage.md).

---

## Error: `9 FAILED_PRECONDITION` in server logs during demo

**Full error:** `Error: 9 FAILED_PRECONDITION: The query requires an index. That index is currently building and cannot be used yet.`

This is the index-building grace period error (see above). It resolves automatically once the index finishes building.

---

## Rate limit hit: `429 rate_limited`

The pipeline endpoint is limited to **5 requests per minute per IP**. This protects against Gemini quota exhaustion.

- In development: rate limiting is skipped (`skip: () => process.env.NODE_ENV !== "production"`)
- In production: wait 60 seconds between report submissions from the same IP

---

## Agent error in SSE stream: `agent_error`

The browser receives `{ type: "agent_error", agent: "vision", error: "..." }`. The pipeline stops at the failing agent.

Common causes:

| Agent | Common errors |
|---|---|
| vision, verification | Gemini quota exhausted, network timeout, unparseable JSON response |
| geo | Nominatim rate limit (1 req/sec) — BaseAgent retry resolves most cases |
| context | Overpass timeout (free tier can be slow) — partial failures degrade gracefully |
| risk, complaint | Same as vision |

Check server logs:
```bash
gcloud logging read "resource.type=cloud_run_revision AND textPayload=~agent_error" \
  --project YOUR_PROJECT --limit 20 --format json
```

---

## Dashboard shows empty state / no insights

**Cause A:** No reports in Firestore. The dashboard shows a placeholder when `total === 0`.

**Cause B:** Gemini insights call failed. The endpoint falls back to a stale cache if available, then returns `503`. Check server logs for `Dashboard insights: unparseable Gemini output`.

**Cause C:** The `GET /api/dashboard/stats` call is failing. Check the browser Network tab for the response.

---

## `npm run dev` server starts but API calls fail (local)

**Check 1:** Is the server actually running on `PORT=3001`?
```bash
curl http://localhost:3001/api/health
```

**Check 2:** Does the Vite proxy match? `vite.config.js` should proxy `/api` to `http://localhost:3001`.

**Check 3:** Is `server/.env` populated?
```bash
cat server/.env | grep -v KEY   # Check non-secret vars
```

**Check 4:** Are Google Cloud credentials available?
```bash
gcloud auth application-default print-access-token
```

If this fails, run `gcloud auth application-default login`.

---

## `Cannot find module` errors when starting the server

The server uses **ES modules** (`"type": "module"` in `server/package.json`). All imports must use the full file extension (`.js`).

**Wrong:**  `import { foo } from "./bar"`
**Correct:** `import { foo } from "./bar.js"`

If you add new modules, include the `.js` extension in all import paths.

---

## `ERR_REQUIRE_ESM` when running tests

Ensure the test runner config uses ESM. The project uses **Vitest** which handles ESM natively. If you see this error, check:

1. `server/vitest.config.js` exists
2. You are running `npm test --prefix server` (not `jest` directly)
3. The `test` script in `server/package.json` is `vitest run`

---

## Cloud Build fails during deployment

**Cause A:** `client/.env` is missing locally, so `VITE_MAPS_KEY` is empty during `vite build`. The build succeeds but the map won't render.

**Cause B:** npm install fails due to a version conflict. Check the Cloud Build logs:
```bash
gcloud builds list --limit 5
gcloud builds log BUILD_ID
```

**Cause C:** The Dockerfile `COPY . .` context is very large. Ensure `node_modules/` is in `.dockerignore`.

---

## Checking Cloud Run logs

```bash
# Live logs
gcloud run services logs tail community-hero --region asia-south1

# Recent errors
gcloud logging read \
  "resource.type=cloud_run_revision AND severity>=ERROR" \
  --project YOUR_PROJECT --limit 50 --format "table(timestamp,textPayload)"
```

---

## Getting Help

1. Check this guide and [docs/Architecture.md](Architecture.md) first.
2. Search [existing GitHub Issues](https://github.com/YOUR_USERNAME/community-hero/issues).
3. Open a [Bug Report](../.github/ISSUE_TEMPLATE/bug_report.yml) with server logs and the full error message.
4. For Gemini API issues, check [Google AI Studio status](https://status.cloud.google.com/).
