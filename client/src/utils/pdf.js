function fmtDate(iso) {
  if (!iso) return new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" });
  return new Date(iso).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" });
}

function fmtINR(n) {
  if (!n) return "N/A";
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(1)} L`;
  if (n >= 1e3) return `₹${Math.round(n / 1e3)}K`;
  return `₹${n}`;
}

function sevColor(sev) {
  return sev === "Critical" ? "#ef4444"
       : sev === "High"     ? "#f97316"
       : sev === "Medium"   ? "#f59e0b"
       : "#3b82f6";
}

function sevBg(sev) {
  return sev === "Critical" ? "#fef2f2"
       : sev === "High"     ? "#fff7ed"
       : "#fffbeb";
}

export function openComplaintPDF(report) {
  const {
    id, issueType, severity, complaint, department,
    riskAssessment: risk, geoContext: geo,
    confidence, createdAt, complaintSubject, reportCount,
  } = report;

  const ref      = `CH-${(id || "XXXXXXXX").slice(0, 8).toUpperCase()}`;
  const date     = fmtDate(createdAt);
  const color    = sevColor(severity);
  const bg       = sevBg(severity);
  const location = geo?.available
    ? [geo.road, geo.suburb, geo.city].filter(Boolean).join(", ")
    : "Location data unavailable";
  const costStr  = risk?.repairCostEstimate
    ? `${fmtINR(risk.repairCostEstimate.low)} – ${fmtINR(risk.repairCostEstimate.high)}`
    : "N/A";
  const isUrgent = severity === "Critical" || severity === "High";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${ref} — ${issueType} Complaint</title>
<style>
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: Georgia, "Times New Roman", serif; font-size: 12.5px; color: #111; line-height: 1.65; background: white; }
.page { max-width: 720px; margin: 36px auto; padding: 0 48px; }

/* Letterhead */
.letterhead { display: flex; align-items: flex-start; justify-content: space-between; padding-bottom: 14px; border-bottom: 2.5px solid #1E2A78; margin-bottom: 22px; }
.logo { font-family: Arial, sans-serif; font-size: 21px; font-weight: 900; color: #1E2A78; letter-spacing: -0.5px; }
.logo-sub { font-size: 10.5px; color: #666; font-weight: 400; font-family: Arial, sans-serif; margin-top: 2px; }
.ref-block { text-align: right; font-family: Arial, sans-serif; font-size: 11px; color: #555; line-height: 1.5; }
.ref-num { font-weight: 700; font-size: 13px; color: #1E2A78; }

/* Urgency banner */
.urgency-bar { background: ${bg}; border-left: 4px solid ${color}; padding: 8px 14px; margin-bottom: 20px; font-family: Arial, sans-serif; font-size: 12px; font-weight: 700; color: ${color}; border-radius: 0 4px 4px 0; }

/* Meta grid */
.meta-table { width: 100%; border-collapse: collapse; margin-bottom: 22px; }
.meta-table td { padding: 6px 12px; font-size: 12px; border: 1px solid #ddd; }
.meta-table td:first-child { font-family: Arial, sans-serif; font-weight: 700; color: #444; background: #f8f9fa; width: 48%; }

/* Letter body */
.to-block { margin-bottom: 12px; font-family: Arial, sans-serif; }
.to-label { font-size: 12px; color: #555; }
.to-name { font-size: 14px; font-weight: 700; color: #111; }
.subject { font-size: 13px; font-weight: 700; text-decoration: underline; margin-bottom: 18px; font-family: Arial, sans-serif; }
.letter-body { white-space: pre-wrap; line-height: 1.75; }

/* Footer */
.footer { margin-top: 40px; padding-top: 14px; border-top: 1px solid #ccc; font-family: Arial, sans-serif; font-size: 10.5px; color: #888; display: flex; justify-content: space-between; gap: 12px; }
.footer-badge { font-size: 10px; background: #1E2A78; color: white; padding: 3px 8px; border-radius: 4px; }

@media print {
  @page { margin: 20mm 22mm; size: A4; }
  body  { margin: 0; }
  .page { margin: 0; padding: 0; max-width: 100%; }
}
</style>
</head>
<body>
<div class="page">
  <div class="letterhead">
    <div>
      <div class="logo">🏙️ Community Hero</div>
      <div class="logo-sub">AI-Powered Civic Issue Tracker · Bengaluru, India</div>
    </div>
    <div class="ref-block">
      <div class="ref-num">${ref}</div>
      <div>Date: ${date}</div>
      <div>AI Confidence: ${Math.round(confidence ?? 0)}%</div>
      ${reportCount > 1 ? `<div>Citizens Reporting: ${reportCount}</div>` : ""}
    </div>
  </div>

  ${isUrgent ? `<div class="urgency-bar">⚠ ${severity.toUpperCase()} SEVERITY — Immediate attention required</div>` : ""}

  <table class="meta-table">
    <tr><td>Issue Type</td><td>${issueType}</td></tr>
    <tr><td>Severity</td><td>${severity}</td></tr>
    <tr><td>Priority Score</td><td>${risk?.priorityScore ?? "N/A"}/100 — ${risk?.publicRiskLevel ?? "Unknown"} Risk</td></tr>
    <tr><td>Location</td><td>${location}</td></tr>
    <tr><td>Est. Repair Cost</td><td>${costStr}</td></tr>
    <tr><td>Resolution Expected</td><td>${risk?.estimatedResolutionDays ?? 14} working days</td></tr>
    <tr><td>Traffic Impact</td><td>${risk?.trafficImpact ?? "None"}</td></tr>
  </table>

  <div class="to-block">
    <div class="to-label">To:</div>
    <div class="to-name">${department}</div>
  </div>

  ${complaintSubject ? `<div class="subject">Subject: ${complaintSubject}</div>` : ""}

  <div class="letter-body">${complaint || ""}</div>

  <div class="footer">
    <span>Generated by Community Hero AI Platform · ${new Date().toLocaleTimeString("en-IN")}</span>
    <span class="footer-badge">Report ID: ${id?.slice(0, 12)}</span>
  </div>
</div>
</body>
</html>`;

  const w = window.open("", "_blank", "width=820,height=1060,scrollbars=yes");
  if (!w) { alert("Please allow pop-ups for this site to download the PDF."); return; }
  w.document.write(html);
  w.document.close();
  w.addEventListener("load", () => {
    setTimeout(() => { try { w.focus(); w.print(); } catch { /* user closed */ } }, 300);
  });
}
