<div align="center">

<img src="https://img.shields.io/badge/Node.js-20-339933?style=flat-square&logo=node.js&logoColor=white" />
<img src="https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black" />
<img src="https://img.shields.io/badge/Gemini-2.5_Flash-4285F4?style=flat-square&logo=google&logoColor=white" />
<img src="https://img.shields.io/badge/Cloud_Run-Deployed-4285F4?style=flat-square&logo=google-cloud&logoColor=white" />
<img src="https://img.shields.io/badge/Firestore-Database-FF6F00?style=flat-square&logo=firebase&logoColor=white" />
<img src="https://img.shields.io/badge/Cloud_Storage-Photos-4285F4?style=flat-square&logo=google-cloud&logoColor=white" />
<img src="https://img.shields.io/badge/ESLint-Passing-4B32C3?style=flat-square&logo=eslint&logoColor=white" />
<img src="https://img.shields.io/badge/Vitest-Tested-6E9F18?style=flat-square&logo=vitest&logoColor=white" />
<img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" />
<img src="https://img.shields.io/badge/PRs-Welcome-brightgreen?style=flat-square" />
<img src="https://img.shields.io/badge/ES_Modules-Native-f7df1e?style=flat-square&logo=javascript&logoColor=black" />
<img src="https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker&logoColor=white" />

# Community Hero

**AI-powered civic issue reporting for Indian municipalities.**

Photograph a pothole, broken streetlight, or garbage dump. Seven Gemini agents classify the issue, score its risk, draft a formal complaint, and file it with the responsible department — all in under 30 seconds.

[**Live Demo →**](https://community-hero-222244874663.asia-south1.run.app) · [Architecture](docs/Architecture.md) · [API Reference](docs/API.md) · [Deploy Guide](docs/Deployment.md)

</div>

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Screenshots](#screenshots)
- [Tech Stack](#tech-stack)
- [Architecture Overview](#architecture-overview)
- [AI Pipeline](#ai-pipeline)
- [Project Structure](#project-structure)
- [Local Setup](#local-setup)
- [Environment Variables](#environment-variables)
- [Google Cloud Setup](#google-cloud-setup)
- [Firebase Setup](#firebase-setup)
- [Deployment](#deployment)
- [API Overview](#api-overview)
- [Running Tests](#running-tests)
- [CI/CD](#cicd)
- [Contributing](#contributing)
- [Future Improvements](#future-improvements)
- [License](#license)

---

## Overview

Community Hero is a civic-tech SaaS application that lets Indian citizens report public infrastructure issues by simply taking a photo. A seven-agent AI pipeline — built on **Google Gemini 2.5 Flash** — automatically:

1. Classifies the issue type and severity from the image
2. Verifies the classification with a second-opinion agent
3. Reverse-geocodes the location via Nominatim
4. Fetches contextual data (nearby sensitive locations, weather, recurrence history)
5. Scores urgency, estimates repair cost and timeline
6. Drafts a formal complaint letter addressed to the correct municipal department
7. Monitors pipeline health and writes an audit log

Reports are stored in **Firestore** with Haversine-based geo-clustering (50 m radius), so duplicate reports from the same location are merged and escalated rather than creating noise.

A **City Intelligence Dashboard** aggregates live data for three roles — citizen, field officer, and city administrator — powered by Gemini-generated insights and predictions.

---

## Features

| Category                    | Details                                                                                          |
| --------------------------- | ------------------------------------------------------------------------------------------------ |
| **AI Classification**       | Gemini 2.5 Flash vision + verification agents with structured JSON output                        |
| **Dual-agent verification** | Second opinion agent overrides Vision Agent on low-confidence classifications                    |
| **Live SSE streaming**      | Seven pipeline steps streamed in real-time via Server-Sent Events                                |
| **Geo-clustering**          | Haversine deduplication within 50 m merges duplicate reports and escalates severity              |
| **Context enrichment**      | Overpass API (nearby hospitals, schools), Open-Meteo weather, Firestore history                  |
| **Risk scoring**            | Urgency 1–10, priority 0–100, estimated cost (INR), repair timeline, traffic impact              |
| **Complaint drafting**      | Formal letter auto-addressed to the correct municipal department, work order included            |
| **Report Detail Page**      | Dedicated route (`/reports/:id`) with 4-tab panel: Overview / AI Analysis / Timeline / Documents |
| **City Dashboard**          | Four-role analytics: Citizen / Officer / Ward Admin / City Administrator views                   |
| **AI Insights**             | Gemini-powered predictions, anomaly detection, and city-wide action recommendations              |
| **Pagination**              | Cursor-based Firestore pagination with "Load more"                                               |
| **Demo Mode**               | Realistic seed scenarios with a single click, safe reset                                         |
| **Rate limiting**           | 5 pipeline requests/min per IP, 120 API requests/min                                             |
| **Graceful shutdown**       | SIGTERM drain for Cloud Run scale-down events                                                    |

---

## Screenshots

| Main View                               | City Dashboard                               | Report Detail                                   |
| --------------------------------------- | -------------------------------------------- | ----------------------------------------------- |
| ![Main View](docs/images/main-view.png) | ![City Dashboard](docs/images/dashboard.png) | ![Report Detail](docs/images/report-detail.png) |

| AI Pipeline Progress                              | Map View                              |
| ------------------------------------------------- | ------------------------------------- |
| ![AI Pipeline Progress](docs/images/pipeline.png) | ![Map View](docs/images/map-view.png) |

---

## Tech Stack

### Backend

| Package                   | Purpose                                                            |
| ------------------------- | ------------------------------------------------------------------ |
| Node.js 20 (ESM)          | Runtime — native ES modules, no transpilation                      |
| Express 4                 | HTTP server, routing, middleware                                   |
| `@google/genai`           | Gemini 2.5 Flash — vision, verification, risk, complaint, insights |
| `@google-cloud/firestore` | Primary database — clusters, complaints, activity logs             |
| `@google-cloud/storage`   | Photo uploads (V4 signed URLs on Cloud Run)                        |
| `express-rate-limit`      | Pipeline (5/min) and API (120/min) rate limiting                   |
| `helmet`                  | HTTP security headers                                              |
| `cors`                    | Cross-origin support in development; disabled in production        |
| `dotenv`                  | Environment variable loading                                       |

### Frontend

| Package                  | Purpose                                                         |
| ------------------------ | --------------------------------------------------------------- |
| React 18                 | UI library (new JSX transform, no `React` import needed)        |
| Vite 5                   | Build tool and development server                               |
| React Router 6           | Client-side routing — `/` main view, `/reports/:id` detail page |
| `@react-google-maps/api` | Google Maps JS integration with heatmap library                 |
| Inter + Space Grotesk    | Typography (Google Fonts)                                       |

### External APIs

| Service                   | Usage                                                     |
| ------------------------- | --------------------------------------------------------- |
| Nominatim (OpenStreetMap) | Reverse geocoding — road/suburb/city from lat/lng         |
| Overpass API              | Nearby POIs — hospitals, schools, critical infrastructure |
| Open-Meteo                | Current weather conditions for context enrichment         |

### Infrastructure

| Service          | Usage                                                  |
| ---------------- | ------------------------------------------------------ |
| Google Cloud Run | Single-container hosting (server + built React client) |
| Firestore        | Document database with transactional geo-clustering    |
| Cloud Storage    | Photo persistence with V4 signed URLs (7-day TTL)      |
| Cloud Build      | Container builds via `gcloud run deploy --source .`    |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                     Browser (React 18 + Vite)                        │
│  Navbar │ WorkflowProgress │ MapView │ ReportList │ ReportDetail    │
│                     React Router (/ and /reports/:id)               │
└──────────────────────────────┬──────────────────────────────────────┘
                               │  HTTP / SSE
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Express Server (Cloud Run)                         │
│                                                                      │
│  app.js ──► routes/api.js                                           │
│               │                                                      │
│               ├─ GET  /api/health                                    │
│               ├─ GET  /api/reports                                   │
│               ├─ POST /api/report/stream ──► Agent Pipeline (SSE)   │
│               ├─ POST /api/report         ──► Agent Pipeline (JSON) │
│               ├─ POST /api/report/:id/complaint                      │
│               ├─ GET  /api/dashboard/stats                           │
│               ├─ GET  /api/dashboard/insights ──► Gemini            │
│               ├─ POST /api/demo/seed                                 │
│               └─ POST /api/demo/reset                                │
│                                                                      │
│  Middleware: helmet │ cors │ express.json(12 MB) │ rateLimiter      │
│             validateReport │ asyncHandler │ errorHandler              │
└───────────────────────┬─────────────────┬────────────────────────────┘
                        │                 │
          ┌─────────────▼──┐    ┌─────────▼──────────┐
          │   Firestore     │    │   Cloud Storage     │
          │  clusters       │    │  photos/            │
          │  complaints     │    │  (V4 signed URLs)   │
          │  activity_logs  │    └────────────────────┘
          └────────────────┘
```

See [docs/Architecture.md](docs/Architecture.md) for the full Mermaid diagram and data-flow details.

---

## AI Pipeline

The 7-agent pipeline runs sequentially. Each agent emits SSE events the browser renders in real-time via `WorkflowProgress`.

```
Photo (base64 data URL)
       │
       ▼
┌─────────────────────────────────────────────────────────────────┐
│ Agent 1 · Vision        │ Gemini vision + JSON schema           │
│                         │ → issueType, severity, confidence     │
├─────────────────────────────────────────────────────────────────┤
│ Agent 2 · Verification  │ Second Gemini call with full image    │
│                         │ → confirms or overrides Agent 1       │
│                         │ → non-civic images rejected here      │
├─────────────────────────────────────────────────────────────────┤
│ Agent 3 · Geo           │ Nominatim reverse geocode             │
│                         │ → road, suburb, city, district        │
├─────────────────────────────────────────────────────────────────┤
│ Agent 4 · Context       │ Overpass nearby places (≤500 m)       │
│                         │ + Open-Meteo current weather          │
│                         │ + Firestore recurrence count          │
├─────────────────────────────────────────────────────────────────┤
│ Agent 5 · Risk          │ Gemini: urgency 1–10, priority 0–100  │
│                         │ + cost estimate (INR) + actions       │
├─────────────────────────────────────────────────────────────────┤
│ Agent 6 · Complaint     │ Gemini: formal letter + work order    │
│                         │ + citizen summary + follow-up date    │
├─────────────────────────────────────────────────────────────────┤
│ Agent 7 · Monitoring    │ Anomaly detection, audit log          │
│                         │ + pipeline health metrics             │
└─────────────────────────────────────────────────────────────────┘
       │
       ▼
Cloud Storage: photo upload → V4 signed URL
       │
       ▼
Firestore transaction: geo-cluster or create new cluster
       │
       ▼
SSE: pipeline_complete → { cluster, merged, pipelineId }
```

See [docs/Gemini.md](docs/Gemini.md) for prompts, schemas, and retry strategy.

---

## Project Structure

```
community-hero/
├── client/                        # React 18 + Vite frontend
│   ├── src/
│   │   ├── App.jsx                # Root — React Router, main view / detail route
│   │   ├── pages/
│   │   │   └── ReportDetailPage.jsx  # /reports/:id — standalone detail page
│   │   ├── components/
│   │   │   ├── Dashboard/         # City Intelligence Dashboard (4 role views)
│   │   │   │   ├── DashboardShell.jsx  # Role switcher shell
│   │   │   │   ├── CityView.jsx        # City administrator view
│   │   │   │   ├── AdminView.jsx       # Ward admin / SLA view
│   │   │   │   ├── OfficerView.jsx     # Field officer view
│   │   │   │   ├── CitizenView.jsx     # Citizen transparency view
│   │   │   │   ├── AIInsights.jsx      # Gemini-powered insight cards
│   │   │   │   ├── StatCard.jsx        # KPI card component
│   │   │   │   ├── TrendChart.jsx      # Issue trend bar chart
│   │   │   │   ├── BarChart.jsx        # Generic bar chart
│   │   │   │   └── SLAGauge.jsx        # SLA compliance gauge
│   │   │   ├── Demo/              # Demo mode panel
│   │   │   │   └── DemoPanel.jsx
│   │   │   ├── MapView.jsx        # Google Maps with cluster markers
│   │   │   ├── ReportCard.jsx     # Compact issue card with "View Details →"
│   │   │   ├── ReportDetail.jsx   # 4-tab detail panel (Overview / AI / Timeline / Docs)
│   │   │   ├── ReportList.jsx     # Paginated list with load-more
│   │   │   ├── WorkflowProgress.jsx # 7-step horizontal stepper
│   │   │   ├── PipelineProgress.jsx # Live agent pipeline progress
│   │   │   ├── StatusTimeline.jsx # Issue lifecycle timeline
│   │   │   ├── ReasoningPanel.jsx # AI reasoning breakdown
│   │   │   ├── ComplaintBox.jsx   # Complaint / work-order / citizen tabs
│   │   │   ├── Navbar.jsx         # Sidebar navigation
│   │   │   ├── Header.jsx         # Top header bar
│   │   │   ├── ReportButton.jsx   # Camera / file picker trigger
│   │   │   ├── DemoToggle.jsx     # Demo mode toggle chip
│   │   │   └── SkeletonCard.jsx   # Loading placeholder card
│   │   ├── hooks/
│   │   │   ├── useReports.js      # Report CRUD + SSE stream consumer
│   │   │   ├── useDemo.js         # Demo mode state management
│   │   │   └── useDashboard.js    # Dashboard data fetching
│   │   ├── services/api.js        # All API calls + SSE async generator
│   │   ├── constants/index.js     # Issue types, severity colors, dept emails
│   │   └── utils/
│   │       ├── file.js            # File → base64 conversion
│   │       └── pdf.js             # Client-side complaint PDF generation
│   └── vite.config.js
│
├── server/                        # Express API (Node.js 20 ESM)
│   ├── agents/
│   │   ├── base.js                # BaseAgent: retry (×2), timing, SSE events
│   │   ├── pipeline.js            # Orchestrator: runs all 7 agents in sequence
│   │   ├── vision.js              # Agent 1: Gemini image classification
│   │   ├── verification.js        # Agent 2: second-opinion override
│   │   ├── geo.js                 # Agent 3: Nominatim geocoding
│   │   ├── context.js             # Agent 4: Overpass + weather + history
│   │   ├── risk.js                # Agent 5: urgency/priority scoring
│   │   ├── complaint.js           # Agent 6: letter + work order
│   │   └── monitoring.js          # Agent 7: anomaly detection + audit
│   ├── config/index.js            # Gemini AI, Firestore, GCS singletons
│   ├── constants/index.js         # Issue enums, dept map, Gemini schemas
│   ├── controllers/               # Route handlers (report, stream, dashboard, demo)
│   ├── middleware/                # errorHandler, rateLimiter, validateReport
│   ├── routes/api.js              # All route definitions
│   ├── services/                  # clustering, dashboardStats, gemini, storage
│   ├── store/                     # Firestore CRUD (clusters, complaints, logs)
│   ├── utils/                     # asyncHandler, parseDataUrl
│   ├── demo/seedData.js           # Demo scenario data
│   ├── tests/                     # Vitest unit tests
│   │   ├── asyncHandler.test.js
│   │   ├── clustering.test.js
│   │   ├── parseDataUrl.test.js
│   │   └── validateReport.test.js
│   ├── app.js                     # Express app factory
│   └── index.js                   # Entry point + graceful SIGTERM shutdown
│
├── docs/                          # Extended documentation
│   ├── Architecture.md            # Mermaid system diagram + data model
│   ├── API.md                     # Full API reference with SSE event types
│   ├── Deployment.md              # Cloud Run, IAM, rollback, custom domains
│   ├── Firestore.md               # Collections, indexes, clustering algorithm
│   ├── CloudStorage.md            # Photo upload, signed URLs, local vs Cloud Run
│   ├── Gemini.md                  # Prompts, schemas, retry strategy, cost
│   ├── Troubleshooting.md         # Common errors and fixes
│   └── Contributing.md            # Technical contribution guide
├── .github/
│   ├── workflows/ci.yml           # CI: lint → build → test → smoke
│   ├── ISSUE_TEMPLATE/            # Bug report + feature request templates
│   └── PULL_REQUEST_TEMPLATE.md
├── Dockerfile                     # Single-container build
├── firestore.indexes.json         # Composite index definitions
├── firebase.json                  # Firebase CLI config
├── eslint.config.js               # ESLint flat config (server + client)
└── package.json                   # Root coordinator scripts
```

---

## Local Setup

### Prerequisites

- **Node.js ≥ 20** (`node --version`)
- **gcloud CLI** — [install guide](https://cloud.google.com/sdk/docs/install)
- **Firebase CLI** — `npm install -g firebase-tools`
- A Google Cloud project with billing enabled

### 1. Clone and install

```bash
git clone https://github.com/amangupta982/community-hero.git
cd community-hero
npm run install:all
```

### 2. Configure environment variables

```bash
cp server/.env.example server/.env
# Edit server/.env with your GEMINI_API_KEY, GOOGLE_CLOUD_PROJECT, GCS_BUCKET_NAME

cp client/.env.example client/.env
# Edit client/.env with your VITE_MAPS_KEY
```

### 3. Authenticate with Google Cloud

```bash
gcloud auth application-default login
gcloud config set project YOUR_PROJECT_ID
```

### 4. Start development servers

```bash
# Terminal 1 — Express API
npm run dev --prefix server          # :3001 (or PORT env var)

# Terminal 2 — Vite dev server (proxies /api → :3001)
npm run dev --prefix client          # :5174
```

Open [http://localhost:5174](http://localhost:5174).

> **Local photo storage note:** Outside Cloud Run, `storage.js` detects the absence of `K_SERVICE` and returns the base64 data URL as the photo reference instead of a signed URL. The object still uploads to GCS. See [docs/CloudStorage.md](docs/CloudStorage.md) for details.

---

## Environment Variables

### `server/.env`

| Variable                         | Required  | Description                                                                |
| -------------------------------- | --------- | -------------------------------------------------------------------------- |
| `GEMINI_API_KEY`                 | ✅        | Google AI Studio key — [aistudio.google.com](https://aistudio.google.com/) |
| `GOOGLE_CLOUD_PROJECT`           | ✅        | GCP project ID                                                             |
| `GCS_BUCKET_NAME`                | ✅        | Cloud Storage bucket for photo uploads                                     |
| `SERVICE_ACCOUNT_EMAIL`          | Cloud Run | Service account email for V4 signed URL signing                            |
| `GOOGLE_APPLICATION_CREDENTIALS` | Local dev | Path to service account JSON key (alternative to ADC)                      |
| `PORT`                           | Optional  | Server port (default: `8080`)                                              |
| `NODE_ENV`                       | Optional  | `production` disables CORS permissiveness and rate-limit skipping          |

### `client/.env`

| Variable        | Required | Description                                                  |
| --------------- | -------- | ------------------------------------------------------------ |
| `VITE_MAPS_KEY` | ✅       | Google Maps JS API key — baked into the bundle at build time |

---

## Google Cloud Setup

```bash
# Enable required APIs
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  firestore.googleapis.com \
  storage.googleapis.com \
  iam.googleapis.com

# Create Firestore (Native mode)
gcloud firestore databases create --location=asia-south1

# Create Cloud Storage bucket
gsutil mb -l asia-south1 gs://YOUR_BUCKET_NAME

# Grant the Cloud Run SA storage write access
PROJECT_NUMBER=$(gcloud projects describe YOUR_PROJECT_ID --format='value(projectNumber)')
SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

gcloud storage buckets add-iam-policy-binding gs://YOUR_BUCKET_NAME \
  --member="serviceAccount:${SA}" \
  --role="roles/storage.objectAdmin"

# Allow SA to create V4 signed URLs (workload identity)
gcloud iam service-accounts add-iam-policy-binding "${SA}" \
  --member="serviceAccount:${SA}" \
  --role="roles/iam.serviceAccountTokenCreator"
```

---

## Firebase Setup

```bash
npm install -g firebase-tools
firebase login
firebase use YOUR_PROJECT_ID

# Deploy composite indexes (takes 1–10 minutes to build)
firebase deploy --only firestore:indexes
```

The server degrades gracefully while indexes are building — it falls back to unindexed queries and continues serving. See [docs/Firestore.md](docs/Firestore.md).

---

## Deployment

```bash
gcloud run deploy community-hero \
  --source . \
  --region asia-south1 \
  --allow-unauthenticated \
  --update-env-vars GEMINI_API_KEY=YOUR_GEMINI_KEY
```

The Dockerfile builds the React client during the container build (Vite reads `client/.env` for `VITE_MAPS_KEY`). The same container serves both the API at `/api/*` and the React SPA at all other paths, including the `/reports/:id` detail route.

See [docs/Deployment.md](docs/Deployment.md) for rollback, custom domains, IAM, and environment configuration.

---

## API Overview

| Method | Path                        | Auth | Description                      |
| ------ | --------------------------- | ---- | -------------------------------- |
| `GET`  | `/api/health`               | None | Liveness probe                   |
| `GET`  | `/api/reports`              | None | List clusters (`?limit=&after=`) |
| `POST` | `/api/report/stream`        | None | Submit photo → SSE pipeline      |
| `POST` | `/api/report`               | None | Submit photo → JSON response     |
| `POST` | `/api/report/:id/complaint` | None | Re-draft complaint               |
| `GET`  | `/api/dashboard/stats`      | None | Aggregated statistics            |
| `GET`  | `/api/dashboard/insights`   | None | Gemini predictions (5-min cache) |
| `POST` | `/api/demo/seed`            | None | Seed demo data                   |
| `POST` | `/api/demo/reset`           | None | Reset demo data                  |

See [docs/API.md](docs/API.md) for full schemas, SSE event types, and error codes.

---

## Running Tests

```bash
# Run server unit tests
npm test --prefix server

# Watch mode during development
npm run test:watch --prefix server

# With coverage report
npm run test:coverage --prefix server
```

Tests live in `server/tests/` and use **Vitest** (ESM-native). They cover:

| Test file                | What it covers                                            |
| ------------------------ | --------------------------------------------------------- |
| `clustering.test.js`     | Haversine radius logic, bounding-box pre-filter           |
| `parseDataUrl.test.js`   | Base64 data URL parsing edge cases                        |
| `validateReport.test.js` | Middleware: missing fields, coordinate ranges, size limit |
| `asyncHandler.test.js`   | Error propagation through async middleware wrapper        |

---

## CI/CD

The `.github/workflows/ci.yml` pipeline runs on every push to `main`/`develop` and on all pull requests:

| Job              | What it does                                                                                         |
| ---------------- | ---------------------------------------------------------------------------------------------------- |
| **Lint**         | `npx eslint . --max-warnings 0` + Prettier format check                                              |
| **Build client** | `npm run build --prefix client` — verifies Vite bundle produces `dist/index.html`                    |
| **Unit tests**   | `npm test --prefix server` with coverage upload                                                      |
| **Smoke test**   | Loads the full module graph (`config/index.js` → `app.js`) with stub env vars to catch import errors |

For automated deployment on merge to `main`, use the `google-github-actions/deploy-cloudrun` action with Workload Identity Federation. See [docs/Deployment.md](docs/Deployment.md#cicd-with-github-actions) for the full workflow snippet.

---

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a PR.

- **Bug reports:** [Bug Report template](.github/ISSUE_TEMPLATE/bug_report.yml)
- **Feature requests:** [Feature Request template](.github/ISSUE_TEMPLATE/feature_request.yml)
- **Security issues:** See [SECURITY.md](SECURITY.md) — do **not** open a public issue

---

## Future Improvements

- [ ] Authentication — Firebase Auth for per-user report ownership and officer accounts
- [ ] Push notifications — status update alerts when a complaint is actioned
- [ ] Offline / PWA — background sync for poor-connectivity areas
- [ ] Multi-language complaint drafting — Kannada, Hindi, Tamil
- [ ] Webhook integration — direct API calls to BBMP, BMC, or MCGM portals
- [ ] Map heatmap toggle — density overlay for ward-level hotspot visualization
- [ ] Persistent insight cache — Redis/Memcached instead of per-instance in-memory
- [ ] Admin portal — officer login, claim/resolve workflow, field assignment
- [ ] E2E tests — Playwright suite for report → pipeline → detail flow
- [ ] APM / tracing — Cloud Trace integration for per-agent timing dashboards
- [ ] Signed URL refresh — background job to renew expiring GCS photo URLs

---

## docs/images Guide

Create a `docs/images/` directory and add screenshots of the app for the README table above. Recommended filenames:

| Filename            | Content                                                            |
| ------------------- | ------------------------------------------------------------------ |
| `main-view.png`     | Full app — 3-column layout with map, report list, and detail panel |
| `dashboard.png`     | City Intelligence Dashboard — City Official role                   |
| `report-detail.png` | Report Detail Page — Overview tab showing AI analysis              |
| `pipeline.png`      | Live pipeline progress during a photo submission                   |
| `map-view.png`      | Map with multiple cluster markers                                  |

To take screenshots: run the app locally (`npm run dev --prefix client`), navigate to each view, and capture with your OS screenshot tool or browser DevTools.

---

## License

MIT © 2026 Aman Gupta — see [LICENSE](LICENSE).
