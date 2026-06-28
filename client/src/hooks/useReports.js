import { useState, useEffect, useCallback, useRef } from "react";
import { fetchReports, streamReport, requestComplaint } from "../services/api.js";
import { fileToDataUrl, getLocation } from "../utils/file.js";

export const AGENT_ORDER = [
  "vision",
  "verification",
  "geo",
  "context",
  "risk",
  "complaint",
  "monitoring",
];

const PAGE_SIZE = 20;

function initialSteps() {
  return AGENT_ORDER.map((agent) => ({ agent, status: "waiting" }));
}

export function useReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [draftingId, setDraftingId] = useState(null);
  const [pipelineSteps, setPipelineSteps] = useState(initialSteps());
  const [showPipeline, setShowPipeline] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [mergedClusterId, setMergedClusterId] = useState(null); // drives merge animation

  const cursorRef = useRef(null);

  // Auto-clear non-fatal errors after 8 seconds.
  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(""), 8_000);
    return () => clearTimeout(t);
  }, [error]);

  // Auto-clear merge banner after 6 seconds.
  useEffect(() => {
    if (!mergedClusterId) return;
    const t = setTimeout(() => setMergedClusterId(null), 6_000);
    return () => clearTimeout(t);
  }, [mergedClusterId]);

  const loadReports = useCallback(async ({ after = null, replace = true } = {}) => {
    const qs = new URLSearchParams({ limit: String(PAGE_SIZE) });
    if (after) qs.set("after", after);
    try {
      const data = await fetchReports(qs.toString());
      if (replace) {
        setReports(data);
        cursorRef.current = data.length > 0 ? data[data.length - 1].id : null;
      } else {
        setReports((prev) => [...prev, ...data]);
        if (data.length > 0) cursorRef.current = data[data.length - 1].id;
      }
      setHasMore(data.length === PAGE_SIZE);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  async function loadMore() {
    if (!cursorRef.current || loadingMore || !hasMore) return;
    setLoadingMore(true);
    await loadReports({ after: cursorRef.current, replace: false });
  }

  function updateStep(agent, patch) {
    setPipelineSteps((prev) => prev.map((s) => (s.agent === agent ? { ...s, ...patch } : s)));
  }

  // getDemoCoords comes from useDemo — it returns the next GPS spot and handles
  // scenario overrides. demoMode is a boolean gate.
  async function onPhotoChosen(file, { demoMode, getDemoCoords }) {
    setError("");
    setBusy(true);
    setPipelineSteps(initialSteps());
    setShowPipeline(true);

    try {
      let photo, coords;
      if (demoMode) {
        photo = await fileToDataUrl(file);
        coords = getDemoCoords();
      } else {
        const locResult = await getLocation();
        photo = await fileToDataUrl(file);
        coords = locResult.coords;
        if (!coords) {
          const msg =
            {
              denied:
                "Location permission is blocked. Enable location for this site to map the report.",
              unavailable:
                "Couldn't get a GPS fix (common on laptops/indoors). Report saved without a pin.",
              timeout: "Location timed out. Report saved without a pin — try again outdoors.",
              unsupported: "This device can't provide location. Report saved without a pin.",
            }[locResult.reason] || "Location unavailable. Report saved without a pin.";
          setError(msg);
        }
      }

      for await (const event of streamReport({ photo, lat: coords?.lat, lng: coords?.lng })) {
        switch (event.type) {
          case "agent_start":
            updateStep(event.agent, { status: "running", message: event.message });
            break;
          case "agent_complete":
            updateStep(event.agent, {
              status: "done",
              result: event.result,
              durationMs: event.durationMs,
            });
            break;
          case "agent_retry":
            updateStep(event.agent, {
              status: "running",
              retrying: true,
              retryAttempt: event.attempt,
            });
            break;
          case "agent_error":
            updateStep(event.agent, { status: "error", error: event.error });
            break;
          case "pipeline_complete":
            // Highlight the cluster if it was merged from a duplicate detection.
            if (event.merged && event.cluster?.id) {
              setMergedClusterId(event.cluster.id);
            }
            await loadReports({ replace: true });
            break;
          case "pipeline_skipped":
            setPipelineSteps((prev) =>
              prev.map((s) => (s.status === "waiting" ? { ...s, status: "skipped" } : s))
            );
            await loadReports({ replace: true });
            break;
          case "pipeline_error":
            setError(event.error || "Pipeline failed");
            break;
          default:
            break;
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function onGenerateComplaint(id) {
    setDraftingId(id);
    setError("");
    setReports((prev) => prev.map((r) => (r.id === id ? { ...r, _drafting: true } : r)));
    try {
      await requestComplaint(id);
      await loadReports({ replace: true });
    } catch (err) {
      setReports((prev) => prev.map((r) => (r.id === id ? { ...r, _drafting: undefined } : r)));
      setError(err.message);
    } finally {
      setDraftingId(null);
    }
  }

  function dismissPipeline() {
    setShowPipeline(false);
    setPipelineSteps(initialSteps());
  }

  return {
    reports,
    loading,
    busy,
    error,
    draftingId,
    pipelineSteps,
    showPipeline,
    hasMore,
    loadingMore,
    mergedClusterId,
    loadReports,
    onPhotoChosen,
    onGenerateComplaint,
    loadMore,
    dismissPipeline,
  };
}
