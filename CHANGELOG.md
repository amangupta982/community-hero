# Changelog

All notable changes to Community Hero are documented here.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
- Professional documentation suite (`docs/` folder with Architecture, API, Deployment, Firestore, CloudStorage, Gemini, Troubleshooting, Contributing)
- GitHub Actions CI workflow (lint → build → test)
- Vitest unit test suite for server utilities and middleware
- ESLint + Prettier + EditorConfig configuration
- GitHub issue templates (Bug Report, Feature Request)
- Pull request template
- `PRODUCTION_CHECKLIST.md` for deployment verification
- `SECURITY.md`, `CODE_OF_CONDUCT.md`, `CONTRIBUTING.md`, `LICENSE`

---

## [1.3.0] — 2026-06-28

### Added
- **Light-theme UI redesign**: Civic-modern design system with white cards, blue primary accent, and 3-column layout (sidebar + center + detail panel)
- **`ReportDetail` component**: Right-side 4-tab detail panel (Overview / AI Analysis / Timeline / Documents) replacing inline card expansion
- **`WorkflowProgress` component**: 7-step horizontal stepper derived from report status history
- **Compact `ReportCard`**: Stripped to photo + badges + description + "View Details →" footer
- Sidebar nav items (Map View, My Reports) now scroll to their respective sections
- Detail panel de-congestion: status timeline + impact metrics rendered in a horizontal strip below main content

### Changed
- `App.jsx`: Introduced `selectedReportId` state and `reports.find()` pattern so the detail panel always reflects fresh data
- `Navbar.jsx`: SVG shield logo replacing emoji; full sidebar layout with Smart Tools section and community card
- `ReportList.jsx`: Added `onSelect` prop and "Sorted by: Latest ▾" header

---

## [1.2.0] — 2026-06-27

### Added
- **Firestore composite indexes**: Deployed two composite indexes for geo-clustering and historical context queries
- **Graceful index-build degradation**: Server catches `FAILED_PRECONDITION` (gRPC code 9) and skips geo-clustering while indexes build
- `firebase.json` and `.firebaserc` for Firebase CLI deployment

### Fixed
- `FAILED_PRECONDITION: The query requires an index` error on first deploy
- `FAILED_PRECONDITION: That index is currently building` intermittent error

---

## [1.1.0] — 2026-06-26

### Added
- **7-agent AI pipeline** with Server-Sent Events streaming:
  - Agent 1: Vision (Gemini image classification)
  - Agent 2: Verification (second-opinion override)
  - Agent 3: Geo (Nominatim reverse geocoding)
  - Agent 4: Context (Overpass nearby places + Open-Meteo weather + Firestore history)
  - Agent 5: Risk scoring (urgency, priority, cost, traffic impact)
  - Agent 6: Complaint drafting (formal letter + work order + citizen summary)
  - Agent 7: Monitoring (anomaly detection + audit log)
- **`BaseAgent` class**: retry (×2, exponential backoff), timing, SSE event emission
- **`PipelineProgress` component**: live 7-step progress UI consuming SSE stream
- **`streamController.js`**: SSE endpoint with abort detection and graceful cleanup
- **`DashboardShell` + role views**: Citizen / Officer / City Administrator analytics with Gemini-powered AI insights
- **Haversine geo-clustering**: 50 m radius, Firestore transaction, composite index support
- Rate limiting: 5 req/min (pipeline), 120 req/min (API)
- `validateReport` middleware with photo size limit (12 MB) and coordinate range validation
- `helmet` security headers
- Graceful SIGTERM shutdown for Cloud Run scale-down

### Changed
- Photo upload now returns base64 data URL locally and V4 signed URL on Cloud Run
- `submitReport()` upgraded to store full agent enrichment (geo, context, risk, complaint, monitoring)

---

## [1.0.0] — 2026-06-24

### Added
- Initial release
- Express server with Firestore persistence
- React + Vite client with Google Maps integration
- Basic Gemini photo classification (`analyzePhoto`)
- Complaint drafting (`draftComplaint`)
- Cloud Run deployment via `gcloud run deploy --source .`
- Demo mode with seed/reset
- Cursor-based Firestore pagination
- Dark-theme premium UI

[Unreleased]: https://github.com/YOUR_USERNAME/community-hero/compare/v1.3.0...HEAD
[1.3.0]: https://github.com/YOUR_USERNAME/community-hero/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/YOUR_USERNAME/community-hero/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/YOUR_USERNAME/community-hero/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/YOUR_USERNAME/community-hero/releases/tag/v1.0.0
