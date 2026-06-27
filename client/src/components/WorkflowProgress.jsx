function fmtDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

const STEPS = [
  { id: "reported",   label: "Reported",          isDone: ()  => true,                                                          getDate: (r) => r.createdAt },
  { id: "ai",         label: "AI Analysis",       isDone: ()  => true,                                                          getDate: (r) => r.createdAt },
  { id: "complaint",  label: "Complaint Drafted",  isDone: (r) => !!r.complaint,                                                 getDate: (r) => r.statusHistory?.find(s => s.status === "Complaint Drafted")?.at },
  { id: "workorder",  label: "Work Order Created", isDone: (r) => !!r.workOrder,                                                 getDate: (r) => null },
  { id: "inprogress", label: "In Progress",        isDone: (r) => ["In Progress", "Resolved"].includes(r.status),               getDate: (r) => r.statusHistory?.find(s => s.status === "In Progress")?.at },
  { id: "followup",   label: "Follow Up",          isDone: (r) => !!r.followUpDate && new Date(r.followUpDate) < new Date(),    getDate: (r) => r.followUpDate },
  { id: "resolved",   label: "Resolved",           isDone: (r) => r.status === "Resolved",                                      getDate: (r) => r.statusHistory?.find(s => s.status === "Resolved")?.at },
];

export default function WorkflowProgress({ report }) {
  if (!report) return null;

  let activeIdx = -1;
  for (let i = 0; i < STEPS.length; i++) {
    if (!STEPS[i].isDone(report)) { activeIdx = i; break; }
  }

  return (
    <div className="wf-wrap">
      <div className="wf-head">
        <span className="wf-icon" aria-hidden>⚡</span>
        <span className="wf-title">Workflow Progress</span>
      </div>
      <div className="wf-stepper" role="list">
        {STEPS.map((step, idx) => {
          const done   = step.isDone(report);
          const active = idx === activeIdx;
          const date   = step.getDate(report);
          const isLast = idx === STEPS.length - 1;
          return (
            <div
              key={step.id}
              className={`wf-step${done ? " wf-done" : ""}${active ? " wf-active" : ""}`}
              role="listitem"
            >
              {!isLast && <div className={`wf-connector${done ? " wf-conn-done" : ""}`} aria-hidden />}
              <div className="wf-circle">
                {done ? "✓" : active ? <span className="wf-spin">⟳</span> : ""}
              </div>
              <div className="wf-label">{step.label}</div>
              {date && <div className="wf-date">{fmtDate(date)}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
