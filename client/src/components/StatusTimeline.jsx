function fmtDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}

function isFuture(iso) {
  return iso && new Date(iso) > new Date();
}

const STATUS_META = {
  Reported: { icon: "📍", color: "#3b82f6" },
  "Complaint Drafted": { icon: "✉️", color: "#7c3aed" },
  "Under Review": { icon: "🔍", color: "#f59e0b" },
  "In Progress": { icon: "🔧", color: "#f97316" },
  "Follow-up Due": { icon: "⏰", color: "#f59e0b" },
  Resolved: { icon: "✅", color: "#047857" },
};

export default function StatusTimeline({ report }) {
  const { statusHistory, followUpDate, createdAt, riskAssessment } = report;

  // Reconstruct from available data if statusHistory doesn't exist (legacy reports).
  const history = statusHistory ?? [
    { status: "Reported", at: createdAt, note: "Issue detected by AI pipeline" },
    ...(report.complaint
      ? [
          {
            status: "Complaint Drafted",
            at: report.updatedAt || createdAt,
            note: `Filed to ${report.department}`,
          },
        ]
      : []),
  ];

  // Add pending future steps.
  const pendingSteps = [];

  const resolvedDays = riskAssessment?.estimatedResolutionDays;
  if (followUpDate && isFuture(followUpDate)) {
    pendingSteps.push({
      status: "Follow-up Due",
      at: followUpDate,
      note: "Scheduled check-in with department",
      future: true,
    });
  }
  if (createdAt && resolvedDays) {
    const expectedAt = new Date(
      new Date(createdAt).getTime() + resolvedDays * 86_400_000
    ).toISOString();
    if (isFuture(expectedAt)) {
      pendingSteps.push({
        status: "Resolved",
        at: expectedAt,
        note: `Expected in ${resolvedDays} working days`,
        future: true,
      });
    }
  }

  const steps = [...history, ...pendingSteps];
  if (steps.length === 0) return null;

  return (
    <div className="status-timeline" aria-label="Complaint status timeline">
      {steps.map((step, i) => {
        const meta = STATUS_META[step.status] ?? { icon: "●", color: "#7b8299" };
        const isLast = i === steps.length - 1;
        return (
          <div key={i} className={`st-step${step.future ? " st-future" : ""}`}>
            <div className="st-track">
              <div
                className="st-dot"
                style={{
                  borderColor: step.future ? "var(--border)" : meta.color,
                  background: step.future ? "white" : meta.color,
                }}
              >
                <span aria-hidden>{step.future ? "○" : "●"}</span>
              </div>
              {!isLast && <div className={`st-line${step.future ? " st-line-dashed" : ""}`} />}
            </div>
            <div className="st-content">
              <div className="st-row">
                <span
                  className="st-status"
                  style={{ color: step.future ? "var(--muted)" : meta.color }}
                >
                  {meta.icon} {step.status}
                </span>
                <span className="st-date">{fmtDate(step.at)}</span>
              </div>
              {step.note && <div className="st-note">{step.note}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
