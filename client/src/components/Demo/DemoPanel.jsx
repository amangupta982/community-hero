import { useState } from "react";
import { DEMO_SCENARIOS } from "../../hooks/useDemo.js";

// Status badge shown next to each scenario step.
function StepStatus({ status }) {
  if (status === "loading") return <span className="dp-status dp-loading">⟳</span>;
  if (status === "done") return <span className="dp-status dp-done">✓</span>;
  if (status === "error") return <span className="dp-status dp-err">✕</span>;
  return null;
}

export default function DemoPanel({
  seedStatus,
  resetStatus,
  onSeed,
  onReset,
  onPipeline,
  onDuplicate,
  onDashboard,
  onClose,
}) {
  const [expanded, setExpanded] = useState(true);
  const [hint, setHint] = useState("");

  function handleScenario(scenario) {
    switch (scenario.action) {
      case "seed":
        onSeed();
        break;
      case "pipeline":
        setHint("📷 File picker is open — choose any photo to run the live AI pipeline.");
        onPipeline(scenario.spot);
        break;
      case "duplicate":
        setHint(
          "📷 File picker is open — submit any photo 12 m from the seeded pothole to trigger duplicate detection."
        );
        onDuplicate(scenario.spot);
        break;
      case "dashboard":
        onDashboard();
        break;
      case "reset":
        setHint("");
        onReset();
        break;
      default:
        break;
    }
  }

  function buttonLabel(scenario) {
    if (scenario.action === "seed")
      return seedStatus === "loading" ? "Seeding…" : seedStatus === "done" ? "Re-seed" : "▶ Run";
    if (scenario.action === "reset") return resetStatus === "loading" ? "Resetting…" : "↺ Reset";
    if (scenario.action === "dashboard") return "Open →";
    return "▶ Run";
  }

  function stepStatus(scenario) {
    if (scenario.action === "seed") return seedStatus;
    if (scenario.action === "reset") return resetStatus;
    return "idle";
  }

  return (
    <div
      className={`demo-panel${expanded ? " dp-expanded" : ""}`}
      role="complementary"
      aria-label="Demo playbook"
    >
      {/* Header */}
      <div className="dp-head">
        <div className="dp-head-left">
          <span className="dp-pulse" aria-hidden />
          <span className="dp-title">Demo Playbook</span>
        </div>
        <div className="dp-head-right">
          <button
            className="dp-collapse-btn"
            onClick={() => setExpanded((v) => !v)}
            title={expanded ? "Collapse" : "Expand"}
            aria-label={expanded ? "Collapse demo panel" : "Expand demo panel"}
          >
            {expanded ? "▼" : "▲"}
          </button>
          <button
            className="dp-close-btn"
            onClick={onClose}
            title="Exit demo mode"
            aria-label="Exit demo mode"
          >
            ✕
          </button>
        </div>
      </div>

      {expanded && (
        <>
          <p className="dp-tagline">Step-by-step judge guide · laptop-friendly</p>

          {/* Scenario steps */}
          <ol className="dp-scenarios">
            {DEMO_SCENARIOS.map((s) => (
              <li key={s.id} className="dp-scenario">
                <div className="dp-scenario-icon" style={{ "--s-color": s.color }}>
                  {s.icon}
                </div>
                <div className="dp-scenario-body">
                  <div className="dp-scenario-title">
                    <span>{s.title}</span>
                    <StepStatus status={stepStatus(s)} />
                  </div>
                  <p className="dp-scenario-sub">{s.subtitle}</p>
                </div>
                <button
                  className="dp-run-btn"
                  style={{ "--s-color": s.color }}
                  onClick={() => handleScenario(s)}
                  disabled={
                    (s.action === "seed" && seedStatus === "loading") ||
                    (s.action === "reset" && resetStatus === "loading")
                  }
                >
                  {buttonLabel(s)}
                </button>
              </li>
            ))}
          </ol>

          {/* Contextual hint (shown after pipeline/duplicate scenarios) */}
          {hint && (
            <div className="dp-hint">
              {hint}
              <button
                className="dp-hint-dismiss"
                onClick={() => setHint("")}
                aria-label="Dismiss hint"
              >
                ✕
              </button>
            </div>
          )}

          {/* Footer */}
          <div className="dp-footer">
            <span className="dp-footer-note">GPS is simulated — no real location needed</span>
          </div>
        </>
      )}
    </div>
  );
}
