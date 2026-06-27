const AGENT_META = {
  vision:       { icon: "🔍", label: "Vision",     desc: "Analyzing photo"          },
  verification: { icon: "✅", label: "Verify",      desc: "Cross-checking"           },
  geo:          { icon: "📍", label: "Geo",         desc: "Locating area"            },
  context:      { icon: "🌐", label: "Context",     desc: "Places · weather · history" },
  risk:         { icon: "⚡", label: "Risk",        desc: "Assessing risk"           },
  complaint:    { icon: "✍️", label: "Complaint",   desc: "Drafting letter"          },
  monitoring:   { icon: "📊", label: "Monitor",     desc: "Logging trace"            },
};

function circleContent(step) {
  if (step.status === "done")    return "✓";
  if (step.status === "error")   return "✗";
  if (step.status === "running") return "·";
  if (step.status === "skipped") return "–";
  return AGENT_META[step.agent]?.icon ?? "?";
}

function resultSummary(agent, result) {
  if (!result) return null;
  switch (agent) {
    case "vision":
      return result.issueType ? `${result.issueType} (${result.confidence}%)` : null;
    case "verification":
      return result.overrode ? `→ ${result.suggestedIssueType}` : "Confirmed";
    case "geo":
      return result.city || (result.formattedAddress?.split(",").slice(-3, -2)[0]?.trim()) || null;
    case "context": {
      if (!result.available) return "No coordinates";
      const parts = [];
      if (result.placeCount > 0)     parts.push(`${result.placeCount} places`);
      if (result.weather?.condition) parts.push(result.weather.condition);
      if (result.historicalCount > 0) parts.push(`${result.historicalCount} prior`);
      return parts.join(" · ") || "Gathered";
    }
    case "risk":
      return result.priorityScore != null ? `${result.priorityScore}/100 · ${result.publicRiskLevel}` : null;
    case "complaint":
      return result.urgencyTag ? result.urgencyTag : "Drafted";
    case "monitoring":
      return result.totalDurationMs != null
        ? `${(result.totalDurationMs / 1000).toFixed(1)}s`
        : "Done";
    default:
      return null;
  }
}

function detailText(step) {
  if (step.status === "running")
    return step.retrying
      ? `Retrying (${step.retryAttempt}/2)…`
      : (step.message || AGENT_META[step.agent]?.desc);
  if (step.status === "done")  return resultSummary(step.agent, step.result);
  if (step.status === "error") return step.error;
  return null;
}

export default function PipelineProgress({ steps, onDismiss, busy }) {
  return (
    <div className="pipeline-wrap">
      <div className="pipeline-head">
        <div className="pipeline-title-row">
          {busy
            ? <><span className="pipeline-spin" aria-hidden>⟳</span> AI pipeline running…</>
            : <><span style={{ color: "#047857" }}>✓</span> Analysis complete</>
          }
        </div>
        {!busy && (
          <button className="pipeline-dismiss" onClick={onDismiss} aria-label="Dismiss">✕</button>
        )}
      </div>

      <div className="pipeline-stepper" role="list">
        {steps.map((step, idx) => {
          const meta   = AGENT_META[step.agent];
          const detail = detailText(step);
          const isLast = idx === steps.length - 1;

          return (
            <div
              key={step.agent}
              className={`pst-step pst-${step.status}${isLast ? " pst-last" : ""}`}
              role="listitem"
            >
              <div className="pst-connector" aria-hidden />
              <div className="pst-circle" aria-label={`${meta.label}: ${step.status}`}>
                <span className={step.status === "running" ? "pst-spin" : ""}>{circleContent(step)}</span>
              </div>
              <div className="pst-labels">
                <span className="pst-name">
                  <span className="pst-emoji" aria-hidden>{meta.icon}</span>
                  {meta.label}
                </span>
                {detail && (
                  <span className="pst-detail" title={detail}>{detail}</span>
                )}
              </div>
              {step.durationMs != null && step.status === "done" && (
                <span className="pst-time">{step.durationMs}ms</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
