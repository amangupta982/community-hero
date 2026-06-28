// qs — optional URLSearchParams query string, e.g. "limit=20&after=<id>"
export async function fetchReport(id) {
  const r = await fetch(`/api/reports/${id}`);
  if (r.status === 404) throw new Error("Report not found");
  if (!r.ok) throw new Error("Failed to load report");
  return r.json();
}

export async function fetchReports(qs = "") {
  const url = qs ? `/api/reports?${qs}` : "/api/reports";
  const r = await fetch(url);
  if (!r.ok) throw new Error("Failed to load reports");
  return r.json();
}

// Non-streaming fallback (original path — kept for backward compat).
export async function submitReport({ photo, lat, lng }) {
  const res = await fetch("/api/report", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ photo, lat: lat ?? null, lng: lng ?? null }),
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(j.error || "Analysis failed");
  }
  return res.json();
}

export async function requestComplaint(id) {
  const res = await fetch(`/api/report/${id}/complaint`, { method: "POST" });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(j.error || "Could not draft complaint");
  }
  return res.json();
}

// ── Multi-agent streaming endpoint ────────────────────────────────────────────
// Yields structured SSE events as they arrive.
// Each yielded object has a `type` field matching the server's event types:
//   agent_start, agent_complete, agent_retry, agent_error,
//   storage_start, storage_complete, pipeline_complete, pipeline_error, pipeline_skipped

export async function* streamReport({ photo, lat, lng }) {
  const res = await fetch("/api/report/stream", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ photo, lat: lat ?? null, lng: lng ?? null }),
  });

  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(j.error || "Stream request failed");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let currentEventType = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop(); // hold incomplete line

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("event: ")) {
        currentEventType = trimmed.slice(7);
      } else if (trimmed.startsWith("data: ") && currentEventType) {
        try {
          const data = JSON.parse(trimmed.slice(6));
          yield { type: currentEventType, ...data };
        } catch {
          // malformed JSON — skip
        }
        currentEventType = null;
      }
    }
  }
}
