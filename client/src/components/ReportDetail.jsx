import { useState } from "react";
import StatusTimeline from "./StatusTimeline.jsx";
import ReasoningPanel from "./ReasoningPanel.jsx";
import ComplaintBox from "./ComplaintBox.jsx";
import { getIssueMeta, SEVERITY_COLOR, DEPARTMENT_EMAIL_MAP } from "../constants/index.js";
import { openComplaintPDF } from "../utils/pdf.js";

function fmtDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function fmtFollowUp(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function fmtReportId(id) {
  if (!id) return "CH-NEW";
  return "CH-" + id.slice(0, 4).toUpperCase() + "-" + id.slice(4, 7).toUpperCase();
}

function fmtCost(cost) {
  if (!cost) return null;
  const f = (n) => (n >= 100_000 ? `₹${(n / 100_000).toFixed(1)}L` : `₹${(n / 1_000).toFixed(0)}K`);
  return `${f(cost.low)} – ${f(cost.high)}`;
}

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "analysis", label: "AI Analysis" },
  { id: "timeline", label: "Timeline" },
  { id: "documents", label: "Documents" },
];

export default function ReportDetail({ report: r, onClose, onGenerateComplaint, draftingId }) {
  const [tab, setTab] = useState("overview");

  const meta = getIssueMeta(r.issueType);
  const geo = r.geoContext?.available && r.geoContext;
  const title = geo
    ? [geo.road, geo.suburb || geo.city].filter(Boolean).join(", ")
    : `${r.issueType || "Civic"} Issue`;
  const risk = r.riskAssessment;
  const cost = risk?.repairCostEstimate;
  const reportDate = fmtDate(r.createdAt);
  const reportId = fmtReportId(r.id);
  const followUp = fmtFollowUp(r.followUpDate);
  const isCivic = r.isCivicIssue !== false && r.issueType !== "Other";
  const isDrafting = draftingId === r.id;
  const deptEmail = DEPARTMENT_EMAIL_MAP[r.department] ?? "";

  function openEmail() {
    const sub = encodeURIComponent(r.complaintSubject || `Civic Complaint: ${r.issueType}`);
    const body = encodeURIComponent(r.complaint || "");
    window.open(`mailto:${deptEmail}?subject=${sub}&body=${body}`, "_blank");
  }

  return (
    <aside className="detail-panel">
      {/* ── Header ─────────────────────────────────────── */}
      <div className="dp2-header">
        <button className="dp2-back-btn" onClick={onClose} aria-label="Back to all reports">
          ← Back to all reports
        </button>
        <div className="dp2-header-actions">
          <button className="dp2-icon-btn" aria-label="Share">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path
                d="M12 1a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM4 6a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm8 4a2 2 0 1 1 0 4 2 2 0 0 1 0-4z"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path d="M5.9 7.1l4.2-2.2M5.9 8.9l4.2 2.2" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            Share
          </button>
          <button className="dp2-icon-btn dp2-icon-more" aria-label="More options">
            ···
          </button>
        </div>
      </div>

      {/* ── Title ──────────────────────────────────────── */}
      <div className="dp2-title-section">
        <h2 className="dp2-title">{title}</h2>
        <div className="dp2-badges">
          <span className="dp2-type-badge" style={{ background: meta.bg, color: meta.color }}>
            {meta.emoji} {r.issueType || "Issue"}
          </span>
          <span
            className="dp2-sev-badge"
            style={{ background: SEVERITY_COLOR[r.severity] ?? "#6b7280" }}
          >
            {(r.severity ?? "Unknown").toUpperCase()}
          </span>
        </div>
        <p className="dp2-subtitle">
          Reported on {reportDate} &nbsp;•&nbsp; Report ID: {reportId}
        </p>
      </div>

      {/* ── Tabs ───────────────────────────────────────── */}
      <div className="dp2-tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            className={`dp2-tab${tab === t.id ? " active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab body ───────────────────────────────────── */}
      <div className="dp2-body">
        {tab === "overview" && (
          <div className="dp2-overview-grid">
            {/* ── Left column ── */}
            <div className="dp2-main-col">
              {/* AI Summary */}
              <div className="dp2-card">
                <div className="dp2-card-head">
                  <span className="dp2-card-icon">✨</span>
                  <span className="dp2-card-title">AI Analysis Summary</span>
                </div>
                <p className="dp2-summary-text">
                  {r.citizenSummary ||
                    r.description ||
                    "The AI pipeline successfully analyzed and processed this report."}
                </p>
              </div>

              {/* Follow-up */}
              {followUp && (
                <div className="dp2-followup-card">
                  <div className="dp2-followup-cal">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <rect
                        x="2"
                        y="4"
                        width="20"
                        height="18"
                        rx="3"
                        stroke="#d97706"
                        strokeWidth="1.5"
                      />
                      <path d="M8 2v4M16 2v4M2 9h20" stroke="#d97706" strokeWidth="1.5" />
                      <text
                        x="12"
                        y="19"
                        textAnchor="middle"
                        fill="#d97706"
                        fontSize="7"
                        fontWeight="700"
                      >
                        {new Date(r.followUpDate).getDate()}
                      </text>
                    </svg>
                  </div>
                  <div>
                    <div className="dp2-followup-label">Follow-up scheduled</div>
                    <div className="dp2-followup-date">{followUp}</div>
                  </div>
                </div>
              )}

              {/* What happens next */}
              {isCivic && r.complaint && (
                <div className="dp2-card">
                  <div className="dp2-card-title-plain">What happens next?</div>
                  <div className="dp2-next-steps">
                    <div className="dp2-next-step">
                      <span className="dp2-step-num">1</span>Your complaint has been filed with the
                      responsible department
                    </div>
                    <div className="dp2-next-step">
                      <span className="dp2-step-num">2</span>A field officer will be assigned based
                      on the AI urgency score
                    </div>
                    <div className="dp2-next-step">
                      <span className="dp2-step-num">3</span>We'll check back at the follow-up date
                      to confirm resolution
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              {isCivic && r.complaint && (
                <div className="dp2-actions">
                  {deptEmail && (
                    <button className="dp2-action-btn dp2-email-btn" onClick={openEmail}>
                      <svg width="14" height="14" viewBox="0 0 20 16" fill="none" aria-hidden>
                        <rect
                          x="1"
                          y="1"
                          width="18"
                          height="14"
                          rx="2"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        />
                        <path d="M1 4l9 6 9-6" stroke="currentColor" strokeWidth="1.5" />
                      </svg>
                      Email Dept
                    </button>
                  )}
                  <button
                    className="dp2-action-btn dp2-pdf-btn"
                    onClick={() => openComplaintPDF(r)}
                  >
                    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden>
                      <path
                        d="M10 3v10M6 9l4 4 4-4"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                      <path
                        d="M3 14v2a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />
                    </svg>
                    Download PDF
                  </button>
                </div>
              )}

              {/* Generate complaint if missing */}
              {isCivic && !r.complaint && (
                <button
                  className={`complaint-btn${isDrafting ? " agent-working" : ""}`}
                  onClick={() => onGenerateComplaint(r.id)}
                  disabled={isDrafting}
                >
                  {isDrafting ? "⟳ Agent drafting…" : "✍️ Generate Complaint"}
                </button>
              )}

              {/* AI Reasoning (collapsed) */}
              {risk?.reasoningChain?.length > 0 && (
                <details className="dp2-reasoning">
                  <summary className="dp2-reasoning-toggle">
                    ✨ AI Reasoning ({risk.reasoningChain.length} steps)
                  </summary>
                  <ol className="dp2-reasoning-list">
                    {risk.reasoningChain.map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ol>
                </details>
              )}
            </div>

            {/* ── Bottom strip: timeline + impact ── */}
            <div className="dp2-side-col">
              <div className="dp2-bottom-strip">
                {/* Status Timeline */}
                <div className="dp2-timeline-section">
                  <div className="dp2-side-label">Status Timeline</div>
                  <StatusTimeline report={r} />
                </div>

                {/* Impact metrics */}
                {(risk?.urgencyScore != null ||
                  cost ||
                  risk?.repairDurationDays ||
                  (risk?.trafficImpact && risk.trafficImpact !== "None")) && (
                  <div className="dp2-impact-section">
                    <div className="dp2-side-label">Impact &amp; Priority</div>
                    <div className="dp2-impact-grid">
                      {risk?.urgencyScore != null && (
                        <div className="dp2-impact-item">
                          <span
                            className="dp2-impact-val"
                            style={{
                              color:
                                risk.urgencyScore >= 8
                                  ? "#dc2626"
                                  : risk.urgencyScore >= 6
                                    ? "#ea580c"
                                    : "#d97706",
                            }}
                          >
                            {risk.urgencyScore}/10
                          </span>
                          <span className="dp2-impact-sub">Urgency</span>
                        </div>
                      )}
                      {cost && (
                        <div className="dp2-impact-item">
                          <span className="dp2-impact-val">{fmtCost(cost)}</span>
                          <span className="dp2-impact-sub">Est. Cost</span>
                        </div>
                      )}
                      {risk?.repairDurationDays && (
                        <div className="dp2-impact-item">
                          <span className="dp2-impact-val">{risk.repairDurationDays}d</span>
                          <span className="dp2-impact-sub">Repair Time</span>
                        </div>
                      )}
                      {risk?.trafficImpact && risk.trafficImpact !== "None" && (
                        <div className="dp2-impact-item">
                          <span className="dp2-impact-val dp2-traffic-val">
                            ⚠ {risk.trafficImpact}
                          </span>
                          <span className="dp2-impact-sub">Traffic</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {tab === "analysis" && (
          <div className="dp2-tab-scroll">
            <ReasoningPanel report={r} />
            {!r.contextResult && !r.riskAssessment && (
              <p className="dp2-empty-note">No AI analysis data available for this report.</p>
            )}
          </div>
        )}

        {tab === "timeline" && (
          <div className="dp2-tab-scroll">
            <StatusTimeline report={r} />
          </div>
        )}

        {tab === "documents" && (
          <div className="dp2-tab-scroll">
            {r.complaint ? (
              <ComplaintBox report={r} />
            ) : (
              <div className="dp2-empty-note">
                <p>No complaint has been generated yet.</p>
                {isCivic && (
                  <button
                    className={`complaint-btn${isDrafting ? " agent-working" : ""}`}
                    onClick={() => onGenerateComplaint(r.id)}
                    disabled={isDrafting}
                  >
                    {isDrafting ? "⟳ Agent drafting…" : "✍️ Generate Complaint"}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
