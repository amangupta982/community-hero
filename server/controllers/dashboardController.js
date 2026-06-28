import { Type } from "@google/genai";
import { ai } from "../config/index.js";
import { listAllClusters } from "../store/clusters.js";
import { computeDashboardStats } from "../services/dashboardStats.js";

// Per-instance in-memory cache (5-minute TTL).
let insightsCache = null;
let insightsCachedAt = 0;
const CACHE_TTL = 5 * 60_000;

const INSIGHTS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    insights: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          type: { type: Type.STRING, enum: ["warning", "info", "success", "critical"] },
          title: { type: Type.STRING },
          body: { type: Type.STRING },
          metric: { type: Type.STRING },
        },
        required: ["type", "title", "body"],
      },
    },
    predictions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          confidence: { type: Type.NUMBER },
          timeframe: { type: Type.STRING },
          reason: { type: Type.STRING },
        },
        required: ["title", "confidence", "timeframe", "reason"],
      },
    },
    cityActions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
  },
  required: ["insights", "predictions", "cityActions"],
};

function formatINR(n) {
  if (!n) return "₹0";
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(1)} Cr`;
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(1)} L`;
  if (n >= 1e3) return `₹${Math.round(n / 1e3)}K`;
  return `₹${n}`;
}

async function generateInsights(stats) {
  if (stats.overview.total === 0) {
    return {
      insights: [
        {
          type: "info",
          title: "System ready — awaiting first reports",
          body: "No civic reports have been submitted yet. The AI pipeline will begin analysing issues as citizens submit photos.",
          metric: "0 reports",
        },
      ],
      predictions: [
        {
          title: "First citizen reports expected within hours of launch",
          confidence: 85,
          timeframe: "24 hours",
          reason: "Typical engagement patterns after civic app launch in Indian cities.",
        },
      ],
      cityActions: [
        "Share the app link with ward councillors to seed early reports",
        "Enable demo mode to showcase AI pipeline capabilities to stakeholders",
        "Brief field officers on how urgency scores translate to dispatch priority",
      ],
    };
  }

  const topTypes = stats.byType
    .slice(0, 5)
    .map((t) => `${t.type} (${t.count})`)
    .join(", ");
  const topWard = stats.wardRankings[0];
  const trendStr = stats.trend.map((d) => `${d.date}: ${d.count}`).join(", ");
  const criticalPct = Math.round((stats.overview.critical / stats.overview.total) * 100);

  const prompt = `You are a City Intelligence AI for an Indian municipal corporation analysing real-time civic data.

CITY SNAPSHOT (${new Date().toLocaleDateString("en-IN")}):
- Total active issues: ${stats.overview.total}
- Critical issues: ${stats.overview.critical} (${criticalPct}% of total)
- SLA compliance: ${stats.sla.compliance}% (${stats.sla.breached} issues breaching SLA, ${stats.sla.atRisk} at risk)
- Total estimated repair budget: ${formatINR(stats.overview.estimatedCostInr)}
- Citizens engaged (total reports): ${stats.overview.totalCitizenReports}
- Average priority score: ${stats.overview.avgPriorityScore}/100
- Complaints drafted and filed: ${stats.overview.complaintDrafted}

ISSUE BREAKDOWN (most common): ${topTypes}
HIGHEST-RISK WARD: ${topWard ? `${topWard.ward} — ${topWard.count} issues, ${topWard.criticalCount} critical, avg priority ${topWard.avgPriority}, budget ${formatINR(topWard.estimatedCostInr)}` : "N/A"}
7-DAY TREND: ${trendStr}

Generate:
1. Exactly 3 insights mixing types (warning/info/success/critical) grounded in this specific data. 2 sentences max each. Reference real numbers.
2. Exactly 2 data-driven predictions for the next 30 days. Confidence 50–90%. Be specific about the Indian civic context.
3. Exactly 3 city-wide action recommendations. Be specific, actionable, and urgent. Reference departments or wards where appropriate.`;

  const result = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      responseMimeType: "application/json",
      responseSchema: INSIGHTS_SCHEMA,
      temperature: 0.7,
    },
  });

  let parsed;
  try {
    parsed = JSON.parse(result.text);
  } catch {
    throw new Error("Dashboard insights: unparseable Gemini output");
  }
  return parsed;
}

export async function getDashboardStats(req, res) {
  const clusters = await listAllClusters();
  const stats = computeDashboardStats(clusters);
  res.json(stats);
}

export async function getDashboardInsights(req, res) {
  if (insightsCache && Date.now() - insightsCachedAt < CACHE_TTL) {
    return res.json(insightsCache);
  }

  const clusters = await listAllClusters();
  const stats = computeDashboardStats(clusters);

  try {
    const data = await generateInsights(stats);
    insightsCache = { ...data, generatedAt: new Date().toISOString(), fromCache: false };
    insightsCachedAt = Date.now();
    res.json(insightsCache);
  } catch (err) {
    // Serve stale cache rather than returning an error during demo.
    if (insightsCache) return res.json({ ...insightsCache, fromCache: true });
    res.status(503).json({ error: "Insights temporarily unavailable", details: err.message });
  }
}
