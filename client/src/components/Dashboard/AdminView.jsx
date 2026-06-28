import StatCard from "./StatCard.jsx";
import SLAGauge from "./SLAGauge.jsx";
import TrendChart from "./TrendChart.jsx";

function formatINR(n) {
  if (!n) return "₹0";
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(1)}Cr`;
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(1)}L`;
  if (n >= 1e3) return `₹${Math.round(n / 1e3)}K`;
  return `₹${n}`;
}

const SEV_COLORS = {
  Critical: "#ef4444",
  High: "#f97316",
  Medium: "#f59e0b",
  Low: "#3b82f6",
};

export default function AdminView({ stats }) {
  const { overview, wardRankings, sla, trend, bySeverity } = stats;

  return (
    <div className="dash-view">
      <div className="dash-kpi-row">
        <StatCard label="Total Active" value={overview.total} icon="📋" />
        <StatCard
          label="SLA Compliance"
          value={sla.compliance}
          icon="⏱️"
          accent="#047857"
          fmtOverride={(v) => `${v}%`}
        />
        <StatCard label="Breached SLA" value={sla.breached} icon="⚠️" accent="#ef4444" />
        <StatCard
          label="Est. Budget"
          value={overview.estimatedCostInr}
          icon="💰"
          accent="#f59e0b"
          fmtOverride={formatINR}
        />
      </div>

      <div className="dash-grid-2">
        {/* SLA gauge */}
        <div className="dash-panel">
          <div className="dash-panel-head">
            <span className="dash-panel-title">SLA Compliance</span>
          </div>
          <SLAGauge
            compliance={sla.compliance}
            onTrack={sla.onTrack}
            atRisk={sla.atRisk}
            breached={sla.breached}
          />
        </div>

        {/* Trend + severity breakdown */}
        <div className="dash-panel">
          <div className="dash-panel-head">
            <span className="dash-panel-title">Issue Volume Trend</span>
          </div>
          <TrendChart data={trend} />
          <div className="sev-breakdown">
            {Object.entries(SEV_COLORS).map(([sev, color]) => {
              const count = bySeverity[sev] || 0;
              const pct = overview.total > 0 ? (count / overview.total) * 100 : 0;
              return (
                <div key={sev} className="sev-row">
                  <span className="sev-dot" style={{ background: color }} />
                  <span className="sev-name">{sev}</span>
                  <div className="sev-bar-track">
                    <div className="sev-bar-fill" style={{ width: `${pct}%`, background: color }} />
                  </div>
                  <span className="sev-count">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Ward performance table */}
      <div className="dash-panel">
        <div className="dash-panel-head">
          <span className="dash-panel-title">Ward Performance Matrix</span>
        </div>
        <div className="ward-table-scroll">
          <table className="ward-table">
            <thead>
              <tr>
                <th>Ward</th>
                <th>Issues</th>
                <th>Critical</th>
                <th>Avg Priority</th>
                <th>SLA Breached</th>
                <th>Budget</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {wardRankings.map((w, i) => {
                const status =
                  w.criticalCount > 0 ? "Urgent" : w.slaBreached > 0 ? "At Risk" : "On Track";
                return (
                  <tr key={i} className={w.criticalCount > 0 ? "wt-row-urgent" : ""}>
                    <td className="wt-ward">{w.ward}</td>
                    <td>{w.count}</td>
                    <td>
                      <span
                        className={`wt-chip ${w.criticalCount > 0 ? "wt-chip-red" : "wt-chip-ok"}`}
                      >
                        {w.criticalCount}
                      </span>
                    </td>
                    <td>
                      <div className="wt-priority">
                        <div
                          className="wt-priority-fill"
                          style={{
                            width: `${w.avgPriority}%`,
                            background:
                              w.avgPriority >= 75
                                ? "#ef4444"
                                : w.avgPriority >= 50
                                  ? "#f97316"
                                  : "#3b82f6",
                          }}
                        />
                        <span className="wt-priority-val">{w.avgPriority}</span>
                      </div>
                    </td>
                    <td>
                      <span
                        className={`wt-chip ${w.slaBreached > 0 ? "wt-chip-amber" : "wt-chip-ok"}`}
                      >
                        {w.slaBreached}
                      </span>
                    </td>
                    <td className="wt-cost">{formatINR(w.estimatedCostInr)}</td>
                    <td>
                      <span
                        className={`wt-status wt-status-${status.toLowerCase().replace(" ", "-")}`}
                      >
                        {status}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {wardRankings.length === 0 && (
                <tr>
                  <td colSpan="7" className="wt-empty">
                    No ward data yet — submit reports with GPS to populate this table.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
