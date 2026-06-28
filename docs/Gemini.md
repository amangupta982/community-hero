# Gemini Integration

## Overview

Community Hero uses **Google Gemini 2.5 Flash** (`gemini-2.5-flash`) for four distinct purposes across six of the seven agents. The model is called via the `@google/genai` SDK.

The client singleton is initialized in `server/config/index.js`:

```javascript
import { GoogleGenAI } from "@google/genai";
export const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
```

Get an API key at [aistudio.google.com](https://aistudio.google.com/).

---

## Agent Calls Summary

| Agent | Model | Input | Output schema |
|---|---|---|---|
| Vision (Agent 1) | `gemini-2.5-flash` | Image + text prompt | `issueSchema` JSON |
| Verification (Agent 2) | `gemini-2.5-flash` | Image + Agent 1 result | `verificationSchema` JSON |
| Risk (Agent 5) | `gemini-2.5-flash` | Classification + context | `riskSchema` JSON |
| Complaint (Agent 6) | `gemini-2.5-flash` | Full enrichment data | `complaintSchema` JSON |
| Dashboard Insights | `gemini-2.5-flash` | Statistics snapshot | `insightsSchema` JSON |

Agents 3 (Geo), 4 (Context), and 7 (Monitoring) do **not** call Gemini.

---

## Structured Output (JSON Schema)

All Gemini calls use **constrained JSON output** via `responseMimeType: "application/json"` and `responseSchema`. This eliminates parsing ambiguity — the model is forced to return valid JSON matching the schema.

### Vision schema (`constants/index.js`)

```javascript
{
  type: Type.OBJECT,
  properties: {
    issueType:              { type: Type.STRING, enum: ["Pothole", "Streetlight", "Water Leakage", "Garbage", "Damaged Sidewalk", "Other"] },
    severity:               { type: Type.STRING, enum: ["Low", "Medium", "High", "Critical"] },
    description:            { type: Type.STRING },
    confidence:             { type: Type.NUMBER },
    isCivicIssue:           { type: Type.BOOLEAN },
    rawObservations:        { type: Type.ARRAY, items: { type: Type.STRING } },
    affectedInfrastructure: { type: Type.STRING },
  },
  required: ["issueType", "severity", "description", "confidence", "isCivicIssue", "rawObservations", "affectedInfrastructure"],
}
```

### System instruction (`constants/index.js`)

```
You are a municipal civic-infrastructure inspector.
Given a citizen's photo, identify the public infrastructure problem it shows.
Judge severity by public risk...

CRITICAL RULE: Only real, visible PUBLIC infrastructure problems count as civic
issues. If the photo shows a personal object (laptop, phone, food, snack packet,
a person, a pet, a screen, indoor items)... you MUST set isCivicIssue to false...
```

The system instruction is the primary defence against prompt injection via photo descriptions and against false-positive classifications of non-civic images.

---

## Retry Strategy

All agents extend `BaseAgent` which implements exponential-backoff retry:

```javascript
for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
  try {
    return await this.execute(input);
  } catch (err) {
    if (attempt < this.maxRetries) {
      await new Promise(r => setTimeout(r, 500 * 2 ** attempt)); // 500ms, 1000ms
      emit({ type: "agent_retry", attempt: attempt + 1, ... });
    }
  }
}
```

- Default `maxRetries`: 2 (3 total attempts)
- Retry delays: 500ms → 1000ms
- Each retry emits an `agent_retry` SSE event visible in the pipeline progress UI

Retries handle transient Gemini errors: network timeouts, 503 responses, and rare JSON parse failures.

---

## Non-Civic Detection

Two layers prevent non-civic content from entering Firestore:

**Layer 1 — Vision Agent system instruction:** The system prompt explicitly forbids classifying personal items, indoor scenes, or people as civic issues. `isCivicIssue: false` triggers an early exit in `pipeline.js`:

```javascript
if (!visionResult.isCivicIssue) {
  emit({ type: "pipeline_skipped", reason: "Vision Agent: not a civic issue" });
  return { visionResult, skipped: true };
}
```

**Layer 2 — Verification Agent:** A second independent Gemini call re-examines the image. If it disagrees with Vision Agent's civic classification, `pass: false` causes another early exit:

```javascript
if (!finalClassification.isCivicIssue) {
  emit({ type: "pipeline_skipped", reason: "Verification Agent: not a civic issue" });
  return { ..., skipped: true };
}
```

Skipped reports return a minimal response to the client and are not persisted to Firestore.

---

## Dashboard Insights

`controllers/dashboardController.js` makes a separate Gemini call with a text-only prompt containing a structured city statistics snapshot:

```
CITY SNAPSHOT (28 Jun 2026):
- Total active issues: 42
- Critical issues: 5 (12% of total)
- SLA compliance: 95%
...
```

The model returns:
- **3 insights** (warning/info/success/critical with titles and metrics)
- **2 predictions** (with confidence percentages and timeframes)
- **3 city-wide action recommendations**

This response is cached in-memory per Cloud Run instance for **5 minutes** (`CACHE_TTL = 5 * 60_000`). On multi-replica deployments each instance has its own cache, which means up to N simultaneous Gemini calls on a cold cache. Replace with Cloud Memorystore for a shared cache.

---

## Quota and Cost

**Gemini 2.5 Flash** pricing (as of June 2026 — verify current pricing at [ai.google.dev/pricing](https://ai.google.dev/pricing)):

| Category | Rate |
|---|---|
| Input (text) | $0.075 / 1M tokens |
| Input (image) | $0.075 / 1M tokens |
| Output (text) | $0.30 / 1M tokens |

**Per report submission (7 agents, 4 Gemini calls):**
- Agents 1+2: two image+text calls (~800 input tokens + ~200 output tokens each)
- Agents 5+6: two text-only calls (~1500 input + ~500 output tokens each)
- Estimated cost: **< $0.01 per report** at current pricing

**Dashboard insights (1 call, text-only):**
- ~800 input + ~400 output tokens
- Estimated cost: **< $0.001 per call**, cached for 5 minutes

---

## Error Handling

All agents catch Gemini errors and emit `agent_error` SSE events. The pipeline propagates the error to `streamController.js` which emits `pipeline_error` and closes the SSE stream.

Common errors:
- `GoogleGenerativeAIError: 429 RESOURCE_EXHAUSTED` — quota exceeded; retries help but may not resolve if the daily limit is hit
- `SyntaxError: JSON.parse failed` — Gemini returned malformed JSON despite `responseMimeType: "application/json"`; extremely rare with 2.5 Flash; retries resolve it
- `Error: fetch failed` — network connectivity issue; retries resolve transient failures

---

## Updating Prompts

All Gemini prompts and schemas are centralised:

| File | Contents |
|---|---|
| `server/constants/index.js` | `issueSchema`, `SYSTEM_INSTRUCTION` (shared across agents) |
| `server/agents/vision.js` | Vision-specific schema and system instruction |
| `server/agents/verification.js` | Verification schema |
| `server/agents/risk.js` | Risk scoring schema and prompt template |
| `server/agents/complaint.js` | Complaint drafting prompt |
| `server/controllers/dashboardController.js` | Insights prompt and schema |

To update a prompt: edit the relevant file and redeploy. No database migrations required. Prompt changes affect all future pipeline runs immediately after deployment.
