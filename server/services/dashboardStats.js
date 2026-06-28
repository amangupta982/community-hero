function avg(arr) {
  return arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0;
}

function getLast7Days() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    days.push(d);
  }
  return days;
}

function sameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function slaStatus(c) {
  if (!c.createdAt) return "unknown";
  const ageDays = (Date.now() - new Date(c.createdAt)) / 86_400_000;
  const slaDays = c.riskAssessment?.estimatedResolutionDays ?? 14;
  if (ageDays > slaDays) return "breached";
  if (ageDays > slaDays * 0.75) return "at_risk";
  return "on_track";
}

export function computeDashboardStats(clusters) {
  const total = clusters.length;

  // Severity counts
  const bySeverity = { Critical: 0, High: 0, Medium: 0, Low: 0 };
  clusters.forEach((c) => {
    if (c.severity in bySeverity) bySeverity[c.severity]++;
  });

  // Status counts
  const byStatus = {};
  clusters.forEach((c) => {
    const s = c.status || "Reported";
    byStatus[s] = (byStatus[s] || 0) + 1;
  });

  // Ward grouping (suburb → city → Unknown)
  const byWard = {};
  clusters.forEach((c) => {
    const ward = c.geoContext?.suburb || c.geoContext?.city || "Unknown";
    if (!byWard[ward]) byWard[ward] = [];
    byWard[ward].push(c);
  });

  // SLA
  const slaMap = clusters.map((c) => slaStatus(c));
  const slaCounts = {
    onTrack: slaMap.filter((s) => s === "on_track").length,
    atRisk: slaMap.filter((s) => s === "at_risk").length,
    breached: slaMap.filter((s) => s === "breached").length,
  };
  const slaCompliance =
    total > 0 ? Math.round(((slaCounts.onTrack + slaCounts.atRisk) / total) * 100) : 100;

  // 7-day trend
  const days7 = getLast7Days();
  const trend = days7.map((day) => {
    const dayItems = clusters.filter((c) => {
      const d = c.createdAt ? new Date(c.createdAt) : null;
      return d && sameDay(d, day);
    });
    return {
      date: day.toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
      count: dayItems.length,
      critical: dayItems.filter((c) => c.severity === "Critical").length,
    };
  });

  // Issue type breakdown
  const typeMap = {};
  clusters.forEach((c) => {
    const t = c.issueType || "Other";
    if (!typeMap[t]) typeMap[t] = { count: 0, priorities: [] };
    typeMap[t].count++;
    if (c.riskAssessment?.priorityScore) typeMap[t].priorities.push(c.riskAssessment.priorityScore);
  });
  const byType = Object.entries(typeMap)
    .map(([type, d]) => ({
      type,
      count: d.count,
      avgPriority: d.priorities.length ? Math.round(avg(d.priorities)) : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  // Ward rankings
  const wardRankings = Object.entries(byWard)
    .map(([ward, items]) => {
      const priorities = items.map((c) => c.riskAssessment?.priorityScore).filter(Boolean);
      const breachedCount = items.filter((c) => slaStatus(c) === "breached").length;
      return {
        ward,
        count: items.length,
        criticalCount: items.filter((c) => c.severity === "Critical").length,
        avgPriority: priorities.length ? Math.round(avg(priorities)) : 0,
        totalCitizenReports: items.reduce((s, c) => s + (c.reportCount || 1), 0),
        estimatedCostInr: items.reduce(
          (s, c) => s + (c.riskAssessment?.repairCostEstimate?.high ?? 0),
          0
        ),
        slaBreached: breachedCount,
      };
    })
    .sort((a, b) => b.criticalCount * 20 + b.avgPriority - (a.criticalCount * 20 + a.avgPriority))
    .slice(0, 8);

  // Top 8 urgent actions by urgencyScore × priority
  const urgentActions = clusters
    .filter(
      (c) => c.riskAssessment?.urgencyScore !== null && c.riskAssessment?.urgencyScore !== undefined
    )
    .sort((a, b) => {
      const sa = a.riskAssessment.urgencyScore * 10 + (a.riskAssessment.priorityScore ?? 0);
      const sb = b.riskAssessment.urgencyScore * 10 + (b.riskAssessment.priorityScore ?? 0);
      return sb - sa;
    })
    .slice(0, 8)
    .map((c) => ({
      id: c.id,
      issueType: c.issueType,
      severity: c.severity,
      location:
        [c.geoContext?.road, c.geoContext?.suburb].filter(Boolean).join(", ") || "Unknown location",
      urgencyScore: c.riskAssessment.urgencyScore,
      priorityScore: c.riskAssessment.priorityScore,
      trafficImpact: c.riskAssessment.trafficImpact,
      firstAction: c.riskAssessment.recommendedActions?.[0] ?? null,
      photo: c.photo,
    }));

  const validPriorities = clusters
    .map((c) => c.riskAssessment?.priorityScore)
    .filter((v) => v !== null && v !== undefined && v > 0);

  return {
    overview: {
      total,
      critical: bySeverity.Critical,
      high: bySeverity.High,
      medium: bySeverity.Medium,
      low: bySeverity.Low,
      complaintDrafted: byStatus["Complaint Drafted"] || 0,
      totalCitizenReports: clusters.reduce((s, c) => s + (c.reportCount || 1), 0),
      avgPriorityScore: validPriorities.length ? Math.round(avg(validPriorities)) : 0,
      estimatedCostInr: clusters.reduce(
        (s, c) => s + (c.riskAssessment?.repairCostEstimate?.high ?? 0),
        0
      ),
    },
    trend,
    byType,
    bySeverity,
    byStatus,
    wardRankings,
    sla: { ...slaCounts, compliance: slaCompliance },
    urgentActions,
    generatedAt: new Date().toISOString(),
  };
}
