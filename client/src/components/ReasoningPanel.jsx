const PLACE_EMOJI = {
  hospital:      "🏥", clinic:       "🏥",
  school:        "🏫", college:      "🏛️", university: "🏛️", kindergarten: "🏫",
  fire_station:  "🚒", police:       "👮",
  bus_stop:      "🚌", bus_station:  "🚌",
  pharmacy:      "💊",
};

const SENSITIVE = new Set(["hospital", "clinic", "school", "college", "university", "kindergarten", "fire_station", "police"]);

const TRAFFIC_BADGE = {
  None:     { label: "No impact",            cls: "trf-none"     },
  Minor:    { label: "Minor disruption",     cls: "trf-minor"    },
  Moderate: { label: "Moderate disruption",  cls: "trf-moderate" },
  Severe:   { label: "Severe disruption",    cls: "trf-severe"   },
};

const TIMELINE_EMOJI = {
  "Immediate": "⚡",
  "24 hours":  "🕐",
  "1 week":    "📅",
  "1 month":   "📋",
};

function weatherEmoji(w) {
  if (!w)              return "🌤️";
  if (w.isStormy)      return "⛈️";
  if (w.isRaining)     return "🌧️";
  if (w.precipitation) return "🌦️";
  const c = w.condition?.toLowerCase() ?? "";
  if (c.includes("cloud")) return "☁️";
  if (c.includes("fog"))   return "🌫️";
  return "☀️";
}

function formatCost(cost) {
  if (!cost) return null;
  const fmt = (n) =>
    n >= 100000
      ? `₹${(n / 100000).toFixed(1)}L`
      : n >= 1000
      ? `₹${(n / 1000).toFixed(0)}K`
      : `₹${n}`;
  return `${fmt(cost.low)} – ${fmt(cost.high)}`;
}

export default function ReasoningPanel({ report }) {
  const ctx  = report.contextResult;
  const risk = report.riskAssessment;

  // Nothing to show if neither context nor the new risk fields are present.
  const hasPlaces    = ctx?.available && ctx.places?.length > 0;
  const hasWeather   = ctx?.available && ctx.weather != null;
  const hasHistory   = ctx?.available && ctx.historical?.count > 0;
  const hasActions   = risk?.recommendedActions?.length > 0;
  const hasReasoning = risk?.reasoningChain?.length > 0;
  const hasCost      = risk?.repairCostEstimate?.low != null;
  const hasTraffic   = risk?.trafficImpact && risk.trafficImpact !== "None";

  if (!hasPlaces && !hasWeather && !hasHistory && !hasActions && !hasReasoning) return null;

  return (
    <div className="rp-panel">
      {/* ── Nearby Infrastructure ─────────────────────────────────── */}
      {hasPlaces && (
        <div className="rp-section">
          <span className="rp-label">Nearby</span>
          <div className="rp-places">
            {ctx.places.slice(0, 6).map((p, i) => (
              <span
                key={i}
                className={`rp-place-chip${SENSITIVE.has(p.type) ? " rp-place-sensitive" : ""}`}
                title={`${p.distanceM}m away`}
              >
                {PLACE_EMOJI[p.type] ?? "📌"} {p.name}
                <span className="rp-place-dist">{p.distanceM}m</span>
              </span>
            ))}
          </div>
          {risk?.proximityRisk && (
            <p className="rp-note">{risk.proximityRisk}</p>
          )}
        </div>
      )}

      {/* ── Current Conditions ────────────────────────────────────── */}
      {hasWeather && (
        <div className="rp-section">
          <span className="rp-label">Conditions</span>
          <div className="rp-weather-row">
            <span className="rp-weather-icon">{weatherEmoji(ctx.weather)}</span>
            <span className="rp-weather-text">
              {ctx.weather.condition} · {ctx.weather.temperature}°C
              {ctx.weather.windSpeed > 20 ? ` · 💨 ${Math.round(ctx.weather.windSpeed)} km/h` : ""}
            </span>
            {ctx.weather.isRaining && (
              <span className="rp-alert">⚠️ Rain active — slip risk elevated</span>
            )}
          </div>
          {risk?.weatherInfluence && ctx.weather.isRaining && (
            <p className="rp-note">{risk.weatherInfluence}</p>
          )}
        </div>
      )}

      {/* ── Historical Pattern ────────────────────────────────────── */}
      {hasHistory && (
        <div className="rp-section">
          <span className="rp-label">History</span>
          <div className="rp-history-row">
            <span className="rp-history-count">
              {ctx.historical.isRecurring ? "🔁" : "📌"}&nbsp;
              {ctx.historical.count} similar report{ctx.historical.count > 1 ? "s" : ""} in 500m / 60 days
            </span>
            {ctx.historical.isRecurring && (
              <span className="rp-recurring-badge">Recurring</span>
            )}
          </div>
          {ctx.historical.lastSeenDaysAgo != null && (
            <p className="rp-note">Last seen {ctx.historical.lastSeenDaysAgo} day{ctx.historical.lastSeenDaysAgo !== 1 ? "s" : ""} ago · {ctx.historical.totalCitizenReports} total citizens affected</p>
          )}
        </div>
      )}

      {/* ── Impact Assessment ─────────────────────────────────────── */}
      {(hasCost || hasTraffic || risk?.urgencyScore != null || risk?.repairDurationDays != null) && (
        <div className="rp-section">
          <span className="rp-label">Impact</span>
          <div className="rp-impact-grid">
            {risk?.urgencyScore != null && (
              <div className="rp-impact-item">
                <span className="rp-impact-value rp-urgency" data-score={risk.urgencyScore}>
                  {risk.urgencyScore}/10
                </span>
                <span className="rp-impact-sub">Urgency</span>
              </div>
            )}
            {hasCost && (
              <div className="rp-impact-item">
                <span className="rp-impact-value">{formatCost(risk.repairCostEstimate)}</span>
                <span className="rp-impact-sub">Est. cost</span>
              </div>
            )}
            {risk?.repairDurationDays != null && (
              <div className="rp-impact-item">
                <span className="rp-impact-value">
                  {risk.repairDurationDays} day{risk.repairDurationDays !== 1 ? "s" : ""}
                </span>
                <span className="rp-impact-sub">Repair time</span>
              </div>
            )}
            {hasTraffic && (
              <div className="rp-impact-item">
                <span className={`rp-traffic-badge ${TRAFFIC_BADGE[risk.trafficImpact]?.cls}`}>
                  🚗 {TRAFFIC_BADGE[risk.trafficImpact]?.label ?? risk.trafficImpact}
                </span>
                <span className="rp-impact-sub">Traffic</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Recommended Actions ───────────────────────────────────── */}
      {hasActions && (
        <div className="rp-section">
          <span className="rp-label">Recommended actions</span>
          <div className="rp-actions">
            {risk.recommendedActions.map((a, i) => (
              <div key={i} className="rp-action-row">
                <span className="rp-timeline">
                  {TIMELINE_EMOJI[a.timeline] ?? "📌"} {a.timeline}
                </span>
                <span className="rp-action-text">{a.action}</span>
                {a.responsible && (
                  <span className="rp-responsible">{a.responsible}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── AI Reasoning Chain ────────────────────────────────────── */}
      {hasReasoning && (
        <details className="rp-reasoning">
          <summary className="rp-reasoning-toggle">
            🤖 AI reasoning ({risk.reasoningChain.length} steps)
          </summary>
          <ol className="rp-reasoning-list">
            {risk.reasoningChain.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </details>
      )}
    </div>
  );
}
