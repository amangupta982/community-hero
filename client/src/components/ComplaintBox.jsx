import { useState } from "react";
import { DEPARTMENT_EMAIL_MAP } from "../constants/index.js";
import { openComplaintPDF } from "../utils/pdf.js";

const WORK_ORDER_PRIORITY_CLS = {
  "P1 - Emergency": "wo-p1",
  "P2 - Urgent":    "wo-p2",
  "P3 - Standard":  "wo-p3",
  "P4 - Low":       "wo-p4",
};

function ComplaintTab({ complaint }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard?.writeText(complaint).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="doc-tab-pane">
      <pre className="complaint-text">{complaint}</pre>
      <button className={`doc-copy-btn${copied ? " copied" : ""}`} onClick={copy}>
        {copied ? "✓ Copied" : "📋 Copy text"}
      </button>
    </div>
  );
}

function WorkOrderTab({ workOrder }) {
  if (!workOrder) {
    return <div className="doc-tab-empty">Work order not available on this report.<br />Regenerate the complaint to produce one.</div>;
  }
  const priCls = WORK_ORDER_PRIORITY_CLS[workOrder.priority] ?? "wo-p3";
  return (
    <div className="doc-tab-pane wo-pane">
      <div className="wo-header">
        <span className={`wo-priority-badge ${priCls}`}>{workOrder.priority}</span>
        <span className="wo-title">{workOrder.title}</span>
      </div>
      {workOrder.issueSummary && (
        <p className="wo-summary">{workOrder.issueSummary}</p>
      )}

      <div className="wo-section-label">Repair Steps</div>
      <ol className="wo-steps">
        {workOrder.steps?.map((step, i) => <li key={i}>{step}</li>)}
      </ol>

      {workOrder.requiredResources?.length > 0 && (
        <>
          <div className="wo-section-label">Required Resources</div>
          <ul className="wo-list">
            {workOrder.requiredResources.map((r, i) => <li key={i}>{r}</li>)}
          </ul>
        </>
      )}

      {workOrder.safetyPrecautions?.length > 0 && (
        <>
          <div className="wo-section-label wo-safety-label">⚠ Safety Precautions</div>
          <ul className="wo-list wo-safety-list">
            {workOrder.safetyPrecautions.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </>
      )}
    </div>
  );
}

function CitizenTab({ citizenSummary, followUpDate }) {
  const followUpStr = followUpDate
    ? new Date(followUpDate).toLocaleDateString("en-IN", { month: "long", day: "numeric", year: "numeric" })
    : null;
  return (
    <div className="doc-tab-pane citizen-pane">
      <div className="citizen-summary-icon">🏙️</div>
      {citizenSummary ? (
        <p className="citizen-summary-text">{citizenSummary}</p>
      ) : (
        <p className="doc-tab-empty">Summary not available on this report. Regenerate the complaint to produce one.</p>
      )}
      {followUpStr && (
        <div className="citizen-followup">
          <span className="citizen-followup-icon">📅</span>
          <div>
            <div className="citizen-followup-label">Follow-up scheduled</div>
            <div className="citizen-followup-date">{followUpStr}</div>
          </div>
        </div>
      )}
      <div className="citizen-what-next">
        <div className="citizen-what-label">What happens next?</div>
        <div className="citizen-what-steps">
          <div className="citizen-what-step">
            <span>1</span> Your complaint has been filed with the responsible department
          </div>
          <div className="citizen-what-step">
            <span>2</span> A field officer will be assigned based on the AI urgency score
          </div>
          <div className="citizen-what-step">
            <span>3</span> We'll check back at the follow-up date to confirm resolution
          </div>
        </div>
      </div>
    </div>
  );
}

const TABS = [
  { id: "complaint", label: "📄 Complaint" },
  { id: "workorder", label: "🔧 Work Order" },
  { id: "summary",   label: "📱 For You"   },
];

export default function ComplaintBox({ report }) {
  const {
    complaint, department, complaintSubject,
    workOrder, citizenSummary, followUpDate,
  } = report;

  const [tab,      setTab]      = useState("complaint");
  const [expanded, setExpanded] = useState(false);

  const deptEmail = DEPARTMENT_EMAIL_MAP[department] ?? "";

  function openEmail() {
    const sub  = encodeURIComponent(complaintSubject || `Civic Complaint: ${report.issueType}`);
    const body = encodeURIComponent(complaint || "");
    window.open(`mailto:${deptEmail}?subject=${sub}&body=${body}`, "_blank");
  }

  return (
    <div className="complaint-box v2">
      {/* Header */}
      <div className="complaint-head">
        <div className="complaint-to">
          <span className="complaint-to-label">✉️ To:</span>
          <strong className="complaint-dept">{department}</strong>
          {deptEmail && <span className="complaint-dept-email">{deptEmail}</span>}
        </div>
        <button
          className="cbox-toggle-btn"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          aria-label={expanded ? "Collapse complaint" : "Expand complaint"}
        >
          {expanded ? "▲ Collapse" : "▼ Open"}
        </button>
      </div>

      {expanded && (
        <>
          {/* Tabs */}
          <div className="doc-tabs" role="tablist">
            {TABS.map((t) => (
              <button
                key={t.id}
                role="tab"
                aria-selected={tab === t.id}
                className={`doc-tab${tab === t.id ? " active" : ""}`}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div role="tabpanel">
            {tab === "complaint" && <ComplaintTab complaint={complaint} />}
            {tab === "workorder" && <WorkOrderTab workOrder={workOrder} />}
            {tab === "summary"   && <CitizenTab citizenSummary={citizenSummary} followUpDate={followUpDate} />}
          </div>

          {/* Action bar */}
          <div className="doc-action-bar">
            {deptEmail && (
              <button className="doc-action-btn doc-email-btn" onClick={openEmail}>
                📧 Email Dept
              </button>
            )}
            <button className="doc-action-btn doc-pdf-btn" onClick={() => openComplaintPDF(report)}>
              📥 Download PDF
            </button>
          </div>
        </>
      )}
    </div>
  );
}
