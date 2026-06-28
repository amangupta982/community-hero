import { useState, useRef, useCallback } from "react";
import { DEMO_SPOTS } from "../constants/index.js";

// ── Scenario definitions ───────────────────────────────────────────────────
// Each scenario is shown as a step in DemoPanel. `action` drives what happens
// when the judge clicks it:
//   "seed"      → POST /api/demo/seed then reload reports
//   "pipeline"  → set GPS override + open file picker (live AI pipeline)
//   "duplicate" → set GPS near existing seeded pothole + open file picker
//   "dashboard" → navigate to dashboard view
//   "reset"     → POST /api/demo/reset then reload reports

export const DEMO_SCENARIOS = [
  {
    id: "seed",
    step: 1,
    icon: "🌱",
    title: "Seed Reports",
    subtitle: "Populate the city with 6 realistic civic issues",
    detail:
      "Inserts pre-built Bangalore reports into Firestore — map, cards, and dashboard all populate instantly.",
    action: "seed",
    color: "#10b981",
  },
  {
    id: "pipeline",
    step: 2,
    icon: "🤖",
    title: "Live AI Pipeline",
    subtitle: "Upload any photo → watch 7 agents run in real-time",
    detail:
      "GPS is automatically set to MG Road. Gemini Vision → Risk → Complaint Agent all fire live.",
    action: "pipeline",
    spot: DEMO_SPOTS[2], // Koramangala — fresh location, no merge
    color: "#6366f1",
  },
  {
    id: "duplicate",
    step: 3,
    icon: "🔀",
    title: "Duplicate Detection",
    subtitle: "Submit a second report 12 m from the seeded pothole",
    detail:
      "The geo-clustering agent detects proximity and MERGES the reports. Watch the card animate.",
    action: "duplicate",
    spot: DEMO_SPOTS[1], // 12 m from DEMO_SPOTS[0] = seeded pothole location
    color: "#f59e0b",
  },
  {
    id: "dashboard",
    step: 4,
    icon: "📊",
    title: "City Dashboard",
    subtitle: "AI insights, ward rankings, SLA tracking",
    detail:
      "Live stats computed from all reports. Gemini generates predictive analytics every 5 minutes.",
    action: "dashboard",
    color: "#3b82f6",
  },
  {
    id: "reset",
    step: 5,
    icon: "🔄",
    title: "Reset",
    subtitle: "Remove seeded data for a clean run",
    detail: "Deletes only demo-seeded clusters — any real submissions you made are preserved.",
    action: "reset",
    color: "#6b7280",
  },
];

export function useDemo() {
  const [demoMode, setDemoMode] = useState(false);
  const [seedStatus, setSeedStatus] = useState("idle"); // idle | loading | done | error
  const [resetStatus, setResetStatus] = useState("idle");
  const [activeScenario, setActiveScenario] = useState(null);

  const stepRef = useRef(0);
  const overrideSpotRef = useRef(null); // consumed once by onPhotoChosen

  // Called by useReports to get the GPS coordinates for this submission.
  const getDemoCoords = useCallback(() => {
    if (overrideSpotRef.current) {
      const spot = overrideSpotRef.current;
      overrideSpotRef.current = null;
      return spot;
    }
    const spot = DEMO_SPOTS[stepRef.current % DEMO_SPOTS.length];
    stepRef.current += 1;
    return spot;
  }, []);

  function toggleDemoMode(enabled) {
    setDemoMode(enabled);
    stepRef.current = 0;
    overrideSpotRef.current = null;
  }

  async function seedDemoData(onDone) {
    setSeedStatus("loading");
    try {
      const r = await fetch("/api/demo/seed", { method: "POST" });
      await r.json();
      setSeedStatus(r.ok ? "done" : "error");
      if (r.ok && onDone) await onDone();
    } catch {
      setSeedStatus("error");
    }
  }

  async function resetDemoData(onDone) {
    setResetStatus("loading");
    setSeedStatus("idle");
    try {
      const r = await fetch("/api/demo/reset", { method: "POST" });
      setResetStatus(r.ok ? "idle" : "error");
      if (r.ok && onDone) await onDone();
    } catch {
      setResetStatus("error");
    }
  }

  // Called by DemoPanel to set GPS for a specific scenario before file pick.
  function prepareScenario(spot) {
    overrideSpotRef.current = spot;
  }

  const nextSpotLabel =
    overrideSpotRef.current?.label ?? DEMO_SPOTS[stepRef.current % DEMO_SPOTS.length].label;

  // demoStep is kept for backward-compat with useReports signature.
  const demoStep = stepRef;

  return {
    demoMode,
    demoStep,
    getDemoCoords,
    toggleDemoMode,
    seedStatus,
    resetStatus,
    activeScenario,
    setActiveScenario,
    seedDemoData,
    resetDemoData,
    prepareScenario,
    nextSpotLabel,
  };
}
