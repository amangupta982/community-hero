import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GoogleGenAI, Type } from "@google/genai";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Community Hero — Phase 1 backend
// One job: take a photo, ask Gemini what civic issue it shows, return strict JSON.
// Storage is an in-memory array for Phase 1 (swap to Firestore in the final build).
// ---------------------------------------------------------------------------

const app = express();
// Photos arrive as base64 data URLs, so we need a generous body limit.
app.use(express.json({ limit: "12mb" }));
app.use(cors());

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.warn("[warn] GEMINI_API_KEY not set — /api/report will fail until it is.");
}
const ai = new GoogleGenAI({ apiKey: API_KEY });

// In-memory store. Resets on restart — fine for Phase 1 / demo.
const reports = [];
let nextId = 1;

// The schema we FORCE Gemini to return. Locking this now means Phase 2
// (clustering + complaint drafting) can rely on clean fields without a rewrite.
const issueSchema = {
  type: Type.OBJECT,
  properties: {
    issueType: {
      type: Type.STRING,
      enum: ["Pothole", "Streetlight", "Water Leakage", "Garbage", "Damaged Sidewalk", "Other"],
      description: "The single best-matching civic issue category.",
    },
    severity: {
      type: Type.STRING,
      enum: ["Low", "Medium", "High", "Critical"],
      description: "How urgent/dangerous the issue is to the public.",
    },
    description: {
      type: Type.STRING,
      description: "One short factual sentence describing only what is visible in the photo.",
    },
    confidence: {
      type: Type.NUMBER,
      description: "Confidence 0-100 that issueType is correct.",
    },
    isCivicIssue: {
      type: Type.BOOLEAN,
      description: "False if the photo shows no public/civic infrastructure problem at all.",
    },
  },
  required: ["issueType", "severity", "description", "confidence", "isCivicIssue"],
};

const SYSTEM_INSTRUCTION = `You are a municipal civic-infrastructure inspector.
Given a citizen's photo, identify the public infrastructure problem it shows.
Judge severity by public risk: a deep pothole on a fast road or an exposed live
wire is Critical; minor cosmetic wear is Low. Be factual and conservative.

CRITICAL RULE: Only real, visible PUBLIC infrastructure problems count as civic
issues. If the photo shows a personal object (laptop, phone, food, snack packet,
a person, a pet, a screen, indoor items) or anything that is NOT a public
infrastructure problem, you MUST set isCivicIssue to false, issueType to "Other",
and severity to "Low". NEVER invent a hazard that is not plainly visible. Do not
speculate about wiring, panels, or dangers that you cannot actually see. Describe
only what is literally in the image.`;

// Strip a data-URL prefix and return {data, mimeType} for Gemini.
function parseDataUrl(dataUrl) {
  const match = /^data:(.+?);base64,(.*)$/.exec(dataUrl || "");
  if (!match) return null;
  return { mimeType: match[1], data: match[2] };
}

// ---------------------------------------------------------------------------
// CLUSTERING (agentic step 1)
// Two reports describe the SAME real-world issue if they share an issueType
// and sit within CLUSTER_RADIUS_M metres of each other. We use the Haversine
// formula for real great-circle distance. This is deterministic geo-math, not
// an AI guess — so it can never hallucinate a false merge.
// ---------------------------------------------------------------------------
const CLUSTER_RADIUS_M = 50;

function haversineMetres(a, b) {
  const R = 6371000; // earth radius in metres
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Severity ranking so a cluster can inherit the worst severity reported.
const SEVERITY_RANK = { Low: 1, Medium: 2, High: 3, Critical: 4 };
const RANK_SEVERITY = ["", "Low", "Medium", "High", "Critical"];

// Find an existing report this new one should merge into. Returns it or null.
function findClusterMatch(candidate) {
  if (candidate.lat == null || candidate.lng == null) return null;
  for (const r of reports) {
    if (r.issueType !== candidate.issueType) continue;
    if (r.lat == null || r.lng == null) continue;
    if (haversineMetres(r, candidate) <= CLUSTER_RADIUS_M) return r;
  }
  return null;
}

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.get("/api/reports", (_req, res) => {
  // Newest first.
  res.json([...reports].reverse());
});

app.post("/api/report", async (req, res) => {
  try {
    const { photo, lat, lng } = req.body || {};
    const img = parseDataUrl(photo);
    if (!img) {
      return res.status(400).json({ error: "photo must be a base64 data URL" });
    }

    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            { inlineData: { mimeType: img.mimeType, data: img.data } },
            { text: "Analyze this photo and classify the civic issue." },
          ],
        },
      ],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: issueSchema,
      },
    });

    let analysis;
    try {
      analysis = JSON.parse(result.text);
    } catch {
      return res.status(502).json({ error: "Gemini returned unparseable output", raw: result.text });
    }

    const incoming = {
      issueType: analysis.issueType,
      lat: typeof lat === "number" ? lat : null,
      lng: typeof lng === "number" ? lng : null,
    };

    // AGENTIC: does this duplicate an existing nearby report?
    const match = findClusterMatch(incoming);
    if (match) {
      // Merge into the existing case instead of creating a duplicate.
      match.reportCount = (match.reportCount || 1) + 1;
      // Escalate severity to the worst anyone has reported.
      const worst = Math.max(
        SEVERITY_RANK[match.severity] || 1,
        SEVERITY_RANK[analysis.severity] || 1
      );
      match.severity = RANK_SEVERITY[worst];
      match.photos = match.photos || [match.photo];
      match.photos.push(photo);
      match.updatedAt = new Date().toISOString();
      return res.json({ ...match, merged: true });
    }

    // New, distinct issue.
    const report = {
      id: nextId++,
      photo,                       // keep for the demo; in prod store in Cloud Storage
      photos: [photo],
      ...analysis,
      lat: incoming.lat,
      lng: incoming.lng,
      status: "Reported",
      reportCount: 1,              // how many citizens have flagged this case
      complaint: null,             // filled by the auto-complaint agent
      createdAt: new Date().toISOString(),
    };
    reports.push(report);
    res.json({ ...report, merged: false });
  } catch (err) {
    console.error("[/api/report]", err);
    res.status(500).json({ error: err.message || "classification failed" });
  }
});

// ---------------------------------------------------------------------------
// AUTO-COMPLAINT (agentic step 2)
// The agent drafts a formal, department-addressed municipal complaint for a
// given report/cluster. The cluster weight (reportCount) makes the letter more
// forceful: "23 residents have reported this." This is the action a citizen
// usually doesn't know how to take — the core of our agentic value.
// ---------------------------------------------------------------------------
const DEPARTMENT_BY_ISSUE = {
  Pothole: "Roads & Infrastructure Department",
  "Damaged Sidewalk": "Roads & Infrastructure Department",
  Streetlight: "Electrical / Street Lighting Department",
  "Water Leakage": "Water Supply & Sewerage Board",
  Garbage: "Solid Waste Management Department",
  Other: "General Grievance Cell",
};

app.post("/api/report/:id/complaint", async (req, res) => {
  try {
    const report = reports.find((r) => r.id === Number(req.params.id));
    if (!report) return res.status(404).json({ error: "report not found" });

    // GUARD: never draft an official complaint for something that isn't a real
    // civic issue. The agent must refuse rather than hallucinate a hazard.
    if (report.isCivicIssue === false || report.issueType === "Other") {
      return res.status(422).json({
        error: "not_civic",
        message:
          "This doesn't appear to be a public infrastructure issue, so no official complaint was drafted.",
      });
    }

    const department = DEPARTMENT_BY_ISSUE[report.issueType] || "General Grievance Cell";
    const locationStr =
      report.lat != null ? `GPS ${report.lat.toFixed(5)}, ${report.lng.toFixed(5)}` : "location attached in app";
    const count = report.reportCount || 1;

    const prompt = `Draft a formal civic complaint letter to the municipal corporation.

Addressed to: The ${department}
Issue type: ${report.issueType}
Severity: ${report.severity}
Observed: ${report.description}
Location: ${locationStr}
Number of citizens who have reported this: ${count}

Requirements:
- Professional, respectful, firm tone.
- State the public-safety risk clearly.
- If multiple citizens reported it, cite that number to convey urgency.
- Request a specific action and a reasonable resolution timeframe.
- Keep under 180 words. Plain text, ready to send. No placeholders like [Name].
- End with "Submitted via Community Hero".`;

    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    report.complaint = result.text.trim();
    report.department = department;
    report.status = "Complaint Drafted";
    res.json(report);
  } catch (err) {
    console.error("[/api/complaint]", err);
    res.status(500).json({ error: err.message || "complaint drafting failed" });
  }
});

// ---------------------------------------------------------------------------
// Serve the built React frontend (production). In dev you still use Vite's
// server with its proxy; in production Cloud Run runs ONLY this server, which
// serves both the API and the static frontend from one URL.
// ---------------------------------------------------------------------------
const clientDist = path.join(__dirname, "..", "client", "dist");
app.use(express.static(clientDist));
// SPA fallback: any non-API route returns index.html so React Router/refresh works.
app.get(/^\/(?!api).*/, (_req, res) => {
  res.sendFile(path.join(clientDist, "index.html"));
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Community Hero server on :${PORT}`));
