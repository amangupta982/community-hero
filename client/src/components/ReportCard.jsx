import { useNavigate } from "react-router-dom";
import { SEVERITY_COLOR, getIssueMeta } from "../constants/index.js";

function riskBadgeClass(score) {
  if (!score && score !== 0) return "";
  if (score >= 75) return "risk-critical";
  if (score >= 50) return "risk-high";
  if (score >= 25) return "risk-medium";
  return "risk-low";
}

function fmtDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function ReportCard({ report: r, index = 0, isMerged = false }) {
  const navigate = useNavigate();
  const meta = getIssueMeta(r.issueType);
  const hasRisk = r.riskAssessment?.priorityScore != null;
  const geo = r.geoContext?.available && r.geoContext;
  const locationLabel = geo ? [geo.road, geo.suburb || geo.city].filter(Boolean).join(", ") : null;

  return (
    <article
      className={`card${isMerged ? " card--merged" : ""}`}
      style={{ "--card-delay": `${Math.min(index * 55, 280)}ms` }}
    >
      {isMerged && (
        <div className="merge-banner" role="status">
          🔀 Duplicate detected — merged with existing report
          {r.reportCount > 1 && ` · ${r.reportCount} citizens reported`}
        </div>
      )}

      {/* Photo */}
      <div className="card-photo-wrap">
        <img src={r.photo} alt={r.issueType || "Issue photo"} loading="lazy" />
        {r.reportCount > 1 && <span className="photo-count">{r.reportCount}</span>}
        <span
          className="photo-sev-bar"
          style={{ background: SEVERITY_COLOR[r.severity] }}
          aria-label={`Severity: ${r.severity}`}
        />
      </div>

      {/* Body */}
      <div className="card-body">
        <div className="card-header">
          <span className="issue-chip" style={{ background: meta.bg, color: meta.color }}>
            <span aria-hidden>{meta.emoji}</span>
            {r.issueType || "Issue"}
          </span>
          <span className="sev-pill" style={{ background: SEVERITY_COLOR[r.severity] }}>
            {(r.severity ?? "").toUpperCase()}
          </span>
        </div>

        <p className="desc">{r.description}</p>

        {locationLabel && (
          <div className="loc-pill">
            <span aria-hidden>📍</span>
            {locationLabel}
          </div>
        )}

        <div className="meta">
          {r.confidence != null &&
            (() => {
              const pct = Math.round(r.confidence <= 1 ? r.confidence * 100 : r.confidence);
              return pct > 0 ? <span className="meta-conf">AI {pct}%</span> : null;
            })()}
          {hasRisk && (
            <span className={`risk-badge ${riskBadgeClass(r.riskAssessment.priorityScore)}`}>
              ⚡ {r.riskAssessment.priorityScore}/100
            </span>
          )}
        </div>

        {/* Footer row */}
        <div className="card-footer">
          <span className="card-date">Reported {fmtDate(r.createdAt)}</span>
          <button
            className="card-view-btn"
            onClick={() => navigate(`/reports/${r.id}`)}
            aria-label="View report details"
          >
            View Details →
          </button>
        </div>
      </div>
    </article>
  );
}
