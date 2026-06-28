# API Reference

Base URL (production): `https://community-hero-222244874663.asia-south1.run.app/api`

Base URL (local dev): `http://localhost:3001/api`

All endpoints accept and return `application/json` unless noted. Rate limits apply in production (`NODE_ENV=production`): **5 req/min** for pipeline endpoints, **120 req/min** for all other endpoints.

---

## Table of Contents

- [Health Check](#health-check)
- [Reports](#reports)
  - [List Reports](#list-reports)
  - [Submit Report (SSE)](#submit-report-sse)
  - [Submit Report (JSON)](#submit-report-json)
  - [Regenerate Complaint](#regenerate-complaint)
- [Dashboard](#dashboard)
  - [Dashboard Statistics](#dashboard-statistics)
  - [AI Insights](#ai-insights)
- [Demo](#demo)
  - [Seed Demo Data](#seed-demo-data)
  - [Reset Demo Data](#reset-demo-data)
- [SSE Event Reference](#sse-event-reference)
- [Error Codes](#error-codes)

---

## Health Check

### `GET /api/health`

Lightweight liveness probe. Used by Cloud Run container health checks.

**Response `200 OK`**

```json
{
  "ok": true,
  "uptime": 3672,
  "memory": "48MB",
  "checks": {
    "gemini": true,
    "firestore": true,
    "storage": true
  }
}
```

`checks` values are `true` if the corresponding environment variable is present. They do not verify actual connectivity.

---

## Reports

### List Reports

`GET /api/reports`

Returns the most recent civic issue clusters from Firestore, ordered by `createdAt` descending.

**Query Parameters**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `limit` | integer | `50` | Number of results (max `100`) |
| `after` | string | — | Cluster document ID for cursor pagination |

**Response `200 OK`**

```json
[
  {
    "id": "abc123",
    "issueType": "Pothole",
    "severity": "High",
    "description": "A large pothole filled with muddy water on the main road.",
    "confidence": 94,
    "isCivicIssue": true,
    "lat": 12.9716,
    "lng": 77.5946,
    "status": "Complaint Drafted",
    "reportCount": 3,
    "statusHistory": [
      { "status": "Reported", "at": "2026-06-27T10:00:00.000Z", "note": "7-agent AI pipeline completed" },
      { "status": "Complaint Drafted", "at": "2026-06-27T10:00:05.000Z", "note": "Formal complaint filed to Roads & Infrastructure Department" }
    ],
    "photo": "https://storage.googleapis.com/...",
    "photos": ["https://storage.googleapis.com/..."],
    "complaint": "Dear The Roads & Infrastructure Department,\n\nI write...",
    "complaintSubject": "Urgent: Pothole at BWSSB Pipeline Track, Jakkasandra",
    "department": "Roads & Infrastructure Department",
    "workOrder": { ... },
    "citizenSummary": "A high-severity pothole was detected...",
    "followUpDate": "2026-06-30T10:00:00.000Z",
    "geoContext": {
      "available": true,
      "road": "BWSSB Pipeline Track",
      "suburb": "Jakkasandra",
      "city": "Bengaluru",
      "district": "Bengaluru Urban"
    },
    "riskAssessment": {
      "urgencyScore": 8,
      "priorityScore": 65,
      "trafficImpact": "Moderate",
      "repairCostEstimate": { "low": 25000, "high": 80000 },
      "repairDurationDays": 2,
      "recommendedActions": ["Install warning signs immediately", "Schedule patching within 48 hours"],
      "reasoningChain": ["High vehicle traffic area", "Near school zone"]
    },
    "createdAt": "2026-06-27T10:00:00.000Z",
    "updatedAt": null
  }
]
```

**Pagination example**

```bash
# First page
GET /api/reports?limit=20

# Next page (use the id of the last result)
GET /api/reports?limit=20&after=abc123
```

---

### Submit Report (SSE)

`POST /api/report/stream`

Submits a photo through the full 7-agent pipeline and streams progress via Server-Sent Events. **This is the primary submission endpoint used by the browser.**

> **Important:** Use `fetch()` with `ReadableStream`, not `EventSource`. EventSource only supports GET requests.

**Request Body**

```json
{
  "photo": "data:image/jpeg;base64,/9j/4AAQSkZJRgAB...",
  "lat": 12.9716,
  "lng": 77.5946
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `photo` | string | ✅ | Base64 data URL (`data:image/jpeg;base64,...`). Max ~12 MB. |
| `lat` | number | Optional | Latitude (-90 to 90). Omit if location unavailable. |
| `lng` | number | Optional | Longitude (-180 to 180). Omit if location unavailable. |

**Response**

`Content-Type: text/event-stream`

The server streams SSE events. See [SSE Event Reference](#sse-event-reference) for all event types.

**Example (fetch + ReadableStream)**

```javascript
const res = await fetch('/api/report/stream', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ photo, lat, lng }),
});

const reader = res.body.getReader();
const decoder = new TextDecoder();
let buffer = '';

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  buffer += decoder.decode(value, { stream: true });
  const lines = buffer.split('\n\n');
  buffer = lines.pop();
  for (const chunk of lines) {
    const dataLine = chunk.split('\n').find(l => l.startsWith('data:'));
    if (dataLine) {
      const event = JSON.parse(dataLine.slice(5));
      console.log(event.type, event);
    }
  }
}
```

**Error Responses**

| Status | Error | Condition |
|---|---|---|
| `400` | `invalid_input` | Missing or malformed `photo` |
| `413` | `image_too_large` | Photo exceeds 12 MB |
| `400` | `invalid_input` | `lat` or `lng` out of range |
| `429` | `rate_limited` | Exceeded 5 requests/min |

---

### Submit Report (JSON)

`POST /api/report`

Non-streaming fallback. Same agent pipeline, returns a single JSON response after all agents complete. Use this for programmatic integrations that cannot consume SSE.

**Request / Response:** Same structure as the SSE endpoint, but the response is the final `pipeline_complete` payload as a single JSON object.

---

### Regenerate Complaint

`POST /api/report/:id/complaint`

Re-runs Agent 6 (Complaint Agent) for an existing cluster and updates the Firestore document. Idempotent — safe to call multiple times.

**Path Parameters**

| Parameter | Type | Description |
|---|---|---|
| `id` | string | Cluster document ID from Firestore |

**Response `200 OK`**

```json
{
  "id": "abc123",
  "complaint": "Dear The Roads & Infrastructure Department,\n\n...",
  "department": "Roads & Infrastructure Department",
  "status": "Complaint Drafted"
}
```

**Error Responses**

| Status | Condition |
|---|---|
| `404` | Cluster not found |
| `400` | Cluster is not a civic issue (`isCivicIssue: false`) |

---

## Dashboard

### Dashboard Statistics

`GET /api/dashboard/stats`

Returns aggregated statistics computed from all clusters. No caching — reads live Firestore data.

**Response `200 OK`**

```json
{
  "overview": {
    "total": 42,
    "critical": 5,
    "high": 12,
    "medium": 18,
    "low": 7,
    "complaintDrafted": 38,
    "totalCitizenReports": 67,
    "avgPriorityScore": 58,
    "estimatedCostInr": 2850000
  },
  "trend": [
    { "date": "22 Jun", "count": 4, "critical": 1 },
    { "date": "23 Jun", "count": 7, "critical": 2 }
  ],
  "byType": [
    { "type": "Pothole", "count": 18, "avgPriority": 64 }
  ],
  "bySeverity": { "Critical": 5, "High": 12, "Medium": 18, "Low": 7 },
  "byStatus": { "Complaint Drafted": 38, "Reported": 4 },
  "wardRankings": [
    {
      "ward": "Jakkasandra",
      "count": 8,
      "criticalCount": 2,
      "avgPriority": 71,
      "totalCitizenReports": 14,
      "estimatedCostInr": 640000,
      "slaBreached": 1
    }
  ],
  "sla": {
    "onTrack": 35,
    "atRisk": 5,
    "breached": 2,
    "compliance": 95
  },
  "urgentActions": [
    {
      "id": "abc123",
      "issueType": "Pothole",
      "severity": "Critical",
      "location": "BWSSB Pipeline Track, Jakkasandra",
      "urgencyScore": 9,
      "priorityScore": 88,
      "trafficImpact": "Severe",
      "firstAction": "Install warning signs immediately",
      "photo": "https://..."
    }
  ],
  "generatedAt": "2026-06-27T10:00:00.000Z"
}
```

---

### AI Insights

`GET /api/dashboard/insights`

Calls Gemini 2.5 Flash to generate city-intelligence insights based on current statistics. Response is cached per instance for **5 minutes**.

**Response `200 OK`**

```json
{
  "insights": [
    {
      "type": "critical",
      "title": "Pothole surge in South Bengaluru",
      "body": "18 pothole reports in 7 days represents a 3× increase versus baseline. Road quality has deteriorated significantly post-monsoon.",
      "metric": "18 reports"
    }
  ],
  "predictions": [
    {
      "title": "Streetlight failures expected to increase",
      "confidence": 75,
      "timeframe": "30 days",
      "reason": "Monsoon season typically corrodes electrical fittings..."
    }
  ],
  "cityActions": [
    "Dispatch Roads & Infrastructure to Jakkasandra ward immediately — 2 critical potholes",
    "Brief Electrical Department on monsoon-season streetlight inspection schedule"
  ],
  "generatedAt": "2026-06-27T10:00:00.000Z",
  "fromCache": false
}
```

**Error Responses**

| Status | Condition |
|---|---|
| `503` | Gemini call failed and no stale cache available |

---

## Demo

### Seed Demo Data

`POST /api/demo/seed`

Writes realistic demo civic issue clusters to Firestore. Safe to call multiple times (uses upsert semantics internally). Intended for demo and development use only.

**Response `200 OK`**

```json
{ "seeded": 5, "message": "Demo data seeded successfully." }
```

---

### Reset Demo Data

`POST /api/demo/reset`

Deletes all demo-seeded clusters from Firestore.

**Response `200 OK`**

```json
{ "deleted": 5, "message": "Demo data reset successfully." }
```

---

## SSE Event Reference

All events have a `type` string field. The `event:` SSE line matches `type`.

### Agent lifecycle events

| `type` | Emitted by | Key fields |
|---|---|---|
| `agent_start` | `BaseAgent.run()` | `agent`, `message` |
| `agent_complete` | `BaseAgent.run()` | `agent`, `result` (public summary), `durationMs` |
| `agent_retry` | `BaseAgent.run()` | `agent`, `attempt`, `maxRetries`, `error` |
| `agent_error` | `BaseAgent.run()` | `agent`, `error` |

### Pipeline-level events

| `type` | Emitted by | Key fields |
|---|---|---|
| `pipeline_skipped` | `pipeline.js` | `reason`, `visionResult` (or `verificationResult`) |
| `storage_start` | `streamController.js` | `message` |
| `storage_complete` | `streamController.js` | `message` |
| `pipeline_complete` | `streamController.js` | `cluster`, `merged`, `pipelineId` |
| `pipeline_error` | `streamController.js` | `error` |

### Agent `result` shapes (public summaries)

**Vision / Verification**
```json
{
  "issueType": "Pothole",
  "severity": "High",
  "confidence": 94,
  "isCivicIssue": true
}
```

**Geo**
```json
{
  "available": true,
  "road": "BWSSB Pipeline Track",
  "suburb": "Jakkasandra"
}
```

**Context**
```json
{
  "nearbyCount": 3,
  "hasSensitiveNearby": true,
  "weather": "Partly cloudy, 28°C",
  "historicalCount": 2
}
```

**Risk**
```json
{
  "urgencyScore": 8,
  "priorityScore": 65,
  "trafficImpact": "Moderate"
}
```

**Complaint**
```json
{
  "department": "Roads & Infrastructure Department",
  "hasDraft": true,
  "urgency": "URGENT"
}
```

**Monitoring**
```json
{
  "pipelineId": "pipe_abc123",
  "totalDurationMs": 18420,
  "anomalies": []
}
```

---

## Error Codes

All error responses follow the shape:

```json
{
  "error": "error_code",
  "message": "Human-readable description"
}
```

| HTTP Status | `error` | Meaning |
|---|---|---|
| `400` | `invalid_input` | Missing required field or invalid format |
| `404` | `not_found` | Cluster document not found |
| `413` | `image_too_large` | Photo data URL exceeds 12 MB |
| `429` | `rate_limited` | Rate limit exceeded |
| `500` | (varies) | Internal server error — check server logs |
| `503` | (varies) | External dependency unavailable (Gemini, Firestore) |
