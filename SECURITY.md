# Security Policy

## Supported Versions

| Version | Supported |
|---|---|
| Latest (`main`) | ✅ |
| Previous releases | ❌ |

We only provide security fixes for the current `main` branch. Update to the latest version before reporting.

## Reporting a Vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

Please report security issues by emailing:

**hashminer67@gmail.com**

Include in your report:
- A description of the vulnerability and its potential impact
- Steps to reproduce or a proof-of-concept (if safe to include)
- Affected component(s) (e.g., API endpoint, Gemini prompt injection, Firestore rules)
- Your suggested fix (optional but appreciated)

We aim to acknowledge reports within **48 hours** and provide a remediation plan within **7 days** for confirmed vulnerabilities.

## Scope

### In scope

- Authentication or authorization bypass
- Gemini prompt injection via crafted photo descriptions or lat/lng values
- Firestore data exposure or unauthorized write access
- GEMINI_API_KEY or other secret leakage via API response or client bundle
- Server-Side Request Forgery (SSRF) via the Geo or Context agents
- Rate limit bypass for the AI pipeline endpoints
- Cross-site scripting (XSS) in the React frontend
- Path traversal or arbitrary file read in the Express server

### Out of scope

- Denial-of-service via Gemini quota exhaustion (the rate limiter is intentionally lenient for demo purposes)
- Issues requiring physical access to the deployment infrastructure
- Bugs in third-party dependencies (report those to the respective upstream project)
- Demo mode data seeding/reset (these routes are intentionally unprotected)

## Security Design

| Control | Implementation |
|---|---|
| Secret management | `GEMINI_API_KEY` injected at Cloud Run runtime, never in the image or client bundle |
| Input validation | `validateReport` middleware rejects malformed photos and out-of-range coordinates |
| Rate limiting | 5 req/min for pipeline, 120 req/min for all API endpoints in production |
| HTTP security headers | `helmet` middleware (minus CSP due to Google Maps cross-origin requirements) |
| CORS | Disabled in production; permissive only in development |
| Storage access | All photos require V4 signed URLs (7-day TTL); no public object access |
| Firestore access | Server-side only (Admin SDK bypasses Firestore security rules); no client SDK |

## Known Limitations

- **No authentication**: Report submission and viewing are currently unauthenticated. Anyone can submit reports and view all reports. This is intentional for the current civic hackathon scope.
- **Helmet CSP disabled**: Google Maps requires cross-origin scripts. A Maps-compatible CSP policy is a future improvement.
- **Demo routes unprotected**: `/api/demo/seed` and `/api/demo/reset` require no authentication. Protect these routes before deploying to a production environment with real municipal data.

## Disclosure Policy

We follow **coordinated disclosure**. We ask that you:
1. Give us a reasonable time (minimum 7 days) to address the issue before public disclosure
2. Make a good-faith effort to avoid data destruction, privacy violations, or service disruption during research
3. Not disclose the issue publicly until we have released a fix

We will credit researchers in the release notes unless anonymity is requested.
