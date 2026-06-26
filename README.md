# Community Hero — Hyperlocal Civic Issue Resolver

An agentic civic platform built for the Vibe2Ship hackathon (Community Hero problem statement).

A citizen photographs a civic issue (pothole, broken streetlight, garbage, water leak).
The app's AI agent then:

1. **Classifies** the issue type + severity from the photo (Gemini Vision, structured JSON).
2. **Geo-locates** the report.
3. **Clusters** it with nearby duplicate reports so 30 complaints about one pothole
   become one weighted, prioritized case. *(Phase 2)*
4. **Auto-drafts** a formal, jurisdiction-aware complaint to the right department. *(Phase 2)*
5. **Tracks** status until resolved.

The differentiator: existing civic apps are *passive forms*. Community Hero *takes the
actions a citizen doesn't know how to take* — that's the agentic depth.

## Stack
- **Frontend:** React (Vite)
- **Backend:** Node.js + Express (holds the Gemini key server-side — never exposed to the browser)
- **AI:** Google Gemini (vision + reasoning, structured output)
- **Maps:** Google Maps JavaScript API
- **Storage:** Phase 1 uses in-memory + a simple JSON file; swap to Firestore for the final build.
- **Deploy:** Google Cloud Run (mandatory per hackathon rules)

## Phases
- **Phase 1 (this drop):** photo → Gemini classification → map + list. End-to-end working loop.
- **Phase 2:** duplicate clustering + auto-drafted complaint (the 20% Agentic Depth lever).
- **Phase 3:** polish, status tracking, demo prep.

## Run locally
See `server/README.md` and `client/README.md`. TL;DR:
```bash
# terminal 1
cd server && npm install && GEMINI_API_KEY=your_key npm start
# terminal 2
cd client && npm install && npm run dev
```
