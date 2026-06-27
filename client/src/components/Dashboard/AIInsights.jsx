const INSIGHT_META = {
  warning:  { icon: "⚠️",  cls: "insight-warning"  },
  critical: { icon: "🚨",  cls: "insight-critical" },
  success:  { icon: "✅",  cls: "insight-success"  },
  info:     { icon: "ℹ️",  cls: "insight-info"     },
};

function InsightSkeleton() {
  return (
    <div className="ai-insight-skeleton">
      {[72, 80, 64].map((h, i) => (
        <div key={i} className="skeleton" style={{ height: `${h}px`, borderRadius: "var(--r-md)", marginBottom: "10px" }} />
      ))}
    </div>
  );
}

export default function AIInsights({ insights }) {
  if (!insights) return <InsightSkeleton />;

  return (
    <div className="ai-insights-wrap">
      {insights.insights?.map((insight, i) => {
        const meta = INSIGHT_META[insight.type] ?? INSIGHT_META.info;
        return (
          <div key={i} className={`ai-insight-card ${meta.cls}`}>
            <span className="ai-insight-icon" aria-hidden>{meta.icon}</span>
            <div className="ai-insight-body">
              <div className="ai-insight-title">{insight.title}</div>
              <div className="ai-insight-text">{insight.body}</div>
              {insight.metric && <div className="ai-insight-metric">{insight.metric}</div>}
            </div>
          </div>
        );
      })}

      {insights.predictions?.length > 0 && (
        <div className="ai-predictions-section">
          <div className="ai-section-label">Predictive analytics · 30 days</div>
          {insights.predictions.map((p, i) => (
            <div key={i} className="ai-prediction">
              <div className="prediction-conf-wrap">
                <div className="prediction-conf-bar" style={{ width: `${p.confidence}%` }} />
                <span className="prediction-conf-pct">{p.confidence}%</span>
              </div>
              <div className="prediction-title">{p.title}</div>
              <div className="prediction-meta">{p.timeframe} · {p.confidence}% confidence</div>
              {p.reason && <div className="prediction-reason">{p.reason}</div>}
            </div>
          ))}
        </div>
      )}

      {insights.cityActions?.length > 0 && (
        <div className="ai-actions-section">
          <div className="ai-section-label">Recommended city actions</div>
          <ol className="city-actions-list">
            {insights.cityActions.map((action, i) => <li key={i}>{action}</li>)}
          </ol>
        </div>
      )}

      {insights.generatedAt && (
        <div className="ai-footer">
          🤖 Analysis generated {new Date(insights.generatedAt).toLocaleTimeString("en-IN")}
          {insights.fromCache ? " (cached)" : ""}
        </div>
      )}
    </div>
  );
}
