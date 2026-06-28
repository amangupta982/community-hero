import StatCard from "./StatCard.jsx";
import { getIssueMeta } from "../../constants/index.js";

function urgencyCls(score) {
  if (score >= 8) return "urg-critical";
  if (score >= 6) return "urg-high";
  if (score >= 4) return "urg-medium";
  return "urg-low";
}

const SEV_COLOR = {
  Critical: "#ef4444",
  High: "#f97316",
  Medium: "#f59e0b",
  Low: "#3b82f6",
};

const TRF_CLS = { Minor: "trf-minor", Moderate: "trf-moderate", Severe: "trf-severe" };

export default function OfficerView({ stats }) {
  const { urgentActions, overview, sla } = stats;

  return (
    <div className="dash-view">
      <div className="dash-kpi-row">
        <StatCard label="In Queue" value={urgentActions.length} icon="📋" />
        <StatCard label="Critical Issues" value={overview.critical} icon="🚨" accent="#ef4444" />
        <StatCard label="SLA Breached" value={sla.breached} icon="⚠️" accent="#f59e0b" />
        <StatCard
          label="Complaints Ready"
          value={overview.complaintDrafted}
          icon="✉️"
          accent="#047857"
        />
      </div>

      <div className="dash-panel">
        <div className="dash-panel-head">
          <span className="dash-panel-title">Field Assignment Queue</span>
          <span className="dash-panel-sub">
            act on Critical first · urgency 10 = life-threatening
          </span>
        </div>

        {urgentActions.length === 0 ? (
          <div className="officer-empty">
            No high-urgency issues at this time. All issues are within normal priority ranges.
          </div>
        ) : (
          <div className="officer-queue">
            {urgentActions.map((a, i) => {
              const meta = getIssueMeta(a.issueType);
              const urgCls = urgencyCls(a.urgencyScore ?? 0);
              return (
                <div key={i} className={`officer-item ${urgCls}`}>
                  {/* Urgency score pill */}
                  <div className="officer-urg-col">
                    <div className="officer-urg-num">{a.urgencyScore ?? "—"}</div>
                    <div className="officer-urg-label">/10</div>
                  </div>

                  {a.photo && <img src={a.photo} className="officer-thumb" alt="" loading="lazy" />}

                  <div className="officer-body">
                    <div className="officer-top">
                      <span
                        className="issue-chip"
                        style={{ background: meta.bg, color: meta.color }}
                      >
                        {meta.emoji} {a.issueType}
                      </span>
                      <span
                        className="sev-pill"
                        style={{ background: SEV_COLOR[a.severity] ?? "#7b8299" }}
                      >
                        {a.severity}
                      </span>
                      {a.trafficImpact && a.trafficImpact !== "None" && (
                        <span className={`urgent-trf ${TRF_CLS[a.trafficImpact] ?? ""}`}>
                          🚗 {a.trafficImpact}
                        </span>
                      )}
                    </div>

                    <div className="officer-loc">📍 {a.location}</div>

                    {a.firstAction && (
                      <div className="officer-action-row">
                        <span className="officer-timeline">
                          {a.firstAction.timeline === "Immediate" ? "⚡" : "📅"}{" "}
                          {a.firstAction.timeline}
                        </span>
                        <span className="officer-action-text">{a.firstAction.action}</span>
                        {a.firstAction.responsible && (
                          <span className="officer-dept">{a.firstAction.responsible}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
