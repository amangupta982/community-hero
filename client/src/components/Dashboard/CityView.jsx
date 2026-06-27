import StatCard    from "./StatCard.jsx";
import TrendChart  from "./TrendChart.jsx";
import BarChart    from "./BarChart.jsx";
import AIInsights  from "./AIInsights.jsx";
import { getIssueMeta } from "../../constants/index.js";

function formatINR(n) {
  if (!n) return "₹0";
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(1)}Cr`;
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(1)}L`;
  if (n >= 1e3) return `₹${Math.round(n / 1e3)}K`;
  return `₹${n}`;
}

const TRF_CLS = { None: "trf-none", Minor: "trf-minor", Moderate: "trf-moderate", Severe: "trf-severe" };

export default function CityView({ stats, insights }) {
  const { overview, trend, byType, wardRankings, sla, urgentActions } = stats;

  return (
    <div className="dash-view">
      {/* ── KPIs ─────────────────────────────────────────────────── */}
      <div className="dash-kpi-row">
        <StatCard label="Total Issues"       value={overview.total}               icon="📋" accent="#6366f1" />
        <StatCard label="Critical"           value={overview.critical}            icon="🚨" accent="#ef4444" />
        <StatCard label="SLA Compliance"     value={sla.compliance}               icon="⏱️" accent="#047857" fmtOverride={(v) => `${v}%`} />
        <StatCard label="Citizens Engaged"   value={overview.totalCitizenReports} icon="👥" accent="#7c3aed" />
        <StatCard label="Est. Repair Budget" value={overview.estimatedCostInr}    icon="💰" accent="#f59e0b" fmtOverride={formatINR} />
        <StatCard label="Avg Priority"       value={overview.avgPriorityScore}    icon="⚡" accent="#6366f1" fmtOverride={(v) => `${v}/100`} />
      </div>

      {/* ── Trend + AI 2-col ─────────────────────────────────────── */}
      <div className="dash-grid-2">
        <div className="dash-panel">
          <div className="dash-panel-head">
            <span className="dash-panel-title">7-Day Report Trend</span>
          </div>
          <TrendChart data={trend} />
        </div>
        <div className="dash-panel">
          <div className="dash-panel-head">
            <span className="dash-panel-title">AI City Intelligence</span>
            <span className="dash-panel-badge">Gemini 2.5</span>
          </div>
          <AIInsights insights={insights} />
        </div>
      </div>

      {/* ── Ward rankings + Issue distribution 2-col ──────────────── */}
      <div className="dash-grid-2">
        <div className="dash-panel">
          <div className="dash-panel-head">
            <span className="dash-panel-title">Ward Risk Rankings</span>
            <span className="dash-panel-sub">by avg priority score</span>
          </div>
          <BarChart items={wardRankings} labelKey="ward" valueKey="avgPriority" color="#6366f1" maxItems={6} />
          <div className="ward-details">
            {wardRankings.slice(0, 6).map((w, i) => (
              <div key={i} className="ward-detail-row">
                <span className="ward-detail-name" title={w.ward}>{w.ward}</span>
                <span className="ward-detail-chips">
                  {w.criticalCount > 0 && (
                    <span className="ward-chip ward-chip-crit">{w.criticalCount} critical</span>
                  )}
                  {w.slaBreached > 0 && (
                    <span className="ward-chip ward-chip-breach">{w.slaBreached} SLA breach</span>
                  )}
                  <span className="ward-chip ward-chip-cost">{formatINR(w.estimatedCostInr)}</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="dash-panel">
          <div className="dash-panel-head">
            <span className="dash-panel-title">Issue Distribution</span>
          </div>
          <div className="issue-dist">
            {byType.map((t, i) => {
              const meta = getIssueMeta(t.type);
              const pct  = Math.max((t.count / (byType[0]?.count || 1)) * 100, 3);
              return (
                <div key={i} className="issue-dist-row">
                  <span
                    className="issue-dist-chip"
                    style={{ background: meta.bg, color: meta.color }}
                  >
                    {meta.emoji} {t.type}
                  </span>
                  <div className="issue-dist-track">
                    <div
                      className="issue-dist-fill"
                      style={{ width: `${pct}%`, background: meta.color, "--bar-delay": `${i * 55}ms` }}
                    />
                  </div>
                  <span className="issue-dist-n">{t.count}</span>
                </div>
              );
            })}
            {byType.length === 0 && (
              <div className="dash-empty-note">No issues submitted yet</div>
            )}
          </div>
        </div>
      </div>

      {/* ── Urgent action queue ───────────────────────────────────── */}
      {urgentActions.length > 0 && (
        <div className="dash-panel">
          <div className="dash-panel-head">
            <span className="dash-panel-title">Urgent Field Actions</span>
            <span className="dash-panel-sub">sorted by urgency · deploy resources in order</span>
          </div>
          <div className="urgent-queue">
            {urgentActions.map((a, i) => {
              const meta = getIssueMeta(a.issueType);
              return (
                <div
                  key={i}
                  className={`urgent-item sev-border-${(a.severity || "").toLowerCase()}`}
                >
                  <div className="urgent-rank">#{i + 1}</div>
                  {a.photo && (
                    <img src={a.photo} className="urgent-thumb" alt="" loading="lazy" />
                  )}
                  <div className="urgent-body">
                    <div className="urgent-top">
                      <span className="issue-chip" style={{ background: meta.bg, color: meta.color }}>
                        {meta.emoji} {a.issueType}
                      </span>
                      <span className="urgent-score-badge">Urgency {a.urgencyScore}/10</span>
                      {a.trafficImpact && a.trafficImpact !== "None" && (
                        <span className={`urgent-trf ${TRF_CLS[a.trafficImpact] ?? ""}`}>
                          🚗 {a.trafficImpact}
                        </span>
                      )}
                    </div>
                    <div className="urgent-loc">📍 {a.location}</div>
                    {a.firstAction && (
                      <div className="urgent-action-row">
                        <span className="urgent-timeline-badge">
                          {a.firstAction.timeline === "Immediate" ? "⚡" : "📅"} {a.firstAction.timeline}
                        </span>
                        <span className="urgent-action-text">{a.firstAction.action}</span>
                        {a.firstAction.responsible && (
                          <span className="urgent-dept">{a.firstAction.responsible}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
