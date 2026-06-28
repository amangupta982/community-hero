import { Type } from "@google/genai";
import { BaseAgent } from "./base.js";
import { ai } from "../config/index.js";

const SCHEMA = {
  type: Type.OBJECT,
  properties: {
    priorityScore: { type: Type.NUMBER },
    publicRiskLevel: { type: Type.STRING, enum: ["Low", "Medium", "High", "Critical"] },
    urgencyScore: { type: Type.NUMBER },
    riskFactors: { type: Type.ARRAY, items: { type: Type.STRING } },
    estimatedResolutionDays: { type: Type.NUMBER },
    repairDurationDays: { type: Type.NUMBER },
    escalationReason: { type: Type.STRING },
    affectedPopulationEstimate: {
      type: Type.STRING,
      enum: ["Minimal", "Moderate", "Significant", "Large"],
    },
    trafficImpact: { type: Type.STRING, enum: ["None", "Minor", "Moderate", "Severe"] },
    repairCostEstimate: {
      type: Type.OBJECT,
      properties: {
        low: { type: Type.NUMBER },
        high: { type: Type.NUMBER },
        currency: { type: Type.STRING },
        basis: { type: Type.STRING },
      },
      required: ["low", "high", "currency"],
    },
    recommendedActions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          timeline: { type: Type.STRING },
          action: { type: Type.STRING },
          responsible: { type: Type.STRING },
        },
        required: ["timeline", "action"],
      },
    },
    reasoningChain: { type: Type.ARRAY, items: { type: Type.STRING } },
    weatherInfluence: { type: Type.STRING },
    proximityRisk: { type: Type.STRING },
  },
  required: [
    "priorityScore",
    "publicRiskLevel",
    "urgencyScore",
    "riskFactors",
    "estimatedResolutionDays",
    "repairDurationDays",
    "escalationReason",
    "affectedPopulationEstimate",
    "trafficImpact",
    "repairCostEstimate",
    "recommendedActions",
    "reasoningChain",
  ],
};

const SYSTEM = `You are a public works risk analyst for an Indian municipal corporation.
Given a verified civic issue with full environmental context, produce a structured risk and impact assessment.

SCORING RULES (additive):
- Severity base: Low=20, Medium=40, High=65, Critical=85
- Rain/wet (+10), Active storm (+20)
- Hospital or school within 400m: +15 each (max +30 total)
- Fire station or police within 400m: +8
- Bus stop within 200m (high footfall): +8
- Recurring issue — same type seen 2+ times nearby in 60 days: +15
- Multiple citizen reports: +5 per extra report, max +10
- Cap final score at 100

REPAIR COST RANGES (2025 India CPWD rates, in INR):
- Minor pothole (< 30cm): ₹5,000–25,000
- Major pothole / road damage: ₹25,000–80,000
- Streetlight repair/replacement: ₹8,000–30,000
- Water pipe leak (minor): ₹20,000–80,000
- Water main break: ₹80,000–3,00,000
- Sidewalk / footpath repair: ₹15,000–60,000
- Flooding / drainage: ₹50,000–5,00,000
- Garbage clearance: ₹3,000–15,000
- Graffiti removal: ₹5,000–20,000

recommendedActions: 2–4 items. timeline must be exactly one of: "Immediate", "24 hours", "1 week", "1 month".
reasoningChain: 3–5 plain-English sentences explaining how context shaped your assessment.
urgencyScore: integer 1–10 (10 = life-threatening, act now; 1 = cosmetic, low priority).
trafficImpact: assess based on road type, nearby bus stops, and issue blockage.
weatherInfluence: one sentence on how current weather affects this specific issue (or "Weather conditions nominal").
proximityRisk: one sentence on the most significant nearby sensitive facility and how it elevates risk (or "No sensitive facilities nearby").`;

class RiskAgent extends BaseAgent {
  constructor() {
    super("risk");
  }

  startMessage() {
    return "Analysing public safety risk with local context…";
  }

  publicResult(r) {
    return {
      priorityScore: r.priorityScore,
      publicRiskLevel: r.publicRiskLevel,
      urgencyScore: r.urgencyScore,
      trafficImpact: r.trafficImpact,
      estimatedResolutionDays: r.estimatedResolutionDays,
      affectedPopulationEstimate: r.affectedPopulationEstimate,
    };
  }

  async execute({ finalClassification, geoResult, reportCount, contextResult }) {
    const location = geoResult?.available
      ? `${geoResult.road ? geoResult.road + ", " : ""}${geoResult.city || "Unknown city"}, ${geoResult.state || "India"}`
      : "Location not available";

    // ── Build contextual sections for the prompt ──────────────────────────────
    const weather = contextResult?.weather;
    const places = contextResult?.places ?? [];
    const hist = contextResult?.historical ?? { count: 0 };

    const weatherSection = weather
      ? `Weather: ${weather.condition}, ${weather.temperature}°C, precipitation ${weather.precipitation} mm
Rain ongoing: ${weather.isRaining} — ${weather.isRaining ? "wet conditions increase slip/structural risk" : "dry conditions, nominal"}`
      : "Weather data: unavailable";

    const placesSection =
      places.length > 0
        ? `Sensitive locations within 400m:\n${places.map((p) => `  • ${p.type}: "${p.name}" at ${p.distanceM}m`).join("\n")}`
        : "Sensitive locations: none found within 400m";

    const histSection =
      hist.count > 0
        ? `Historical recurrence: ${hist.count} same-type issue(s) within 500m in last 60 days` +
          `\n  Citizens affected (cumulative): ${hist.totalCitizenReports}` +
          `\n  Recurring: ${hist.isRecurring}` +
          (hist.lastSeenDaysAgo !== null && hist.lastSeenDaysAgo !== undefined
            ? `\n  Last occurrence: ${hist.lastSeenDaysAgo} day(s) ago`
            : "")
        : "Historical recurrence: no prior similar issues found recently in this area";

    const prompt = `Civic Issue Risk Assessment

ISSUE
Type: ${finalClassification.issueType}
Description: "${finalClassification.description}"
Verified Severity: ${finalClassification.severity}
Location: ${location}
Jurisdiction: ${geoResult?.jurisdiction || "Unknown"}
Citizens who reported this: ${reportCount}

ENVIRONMENTAL CONTEXT
${weatherSection}

${placesSection}

${histSection}

Produce a full risk assessment following the system instructions. Reference specific context data in your reasoningChain.`;

    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        systemInstruction: SYSTEM,
        responseMimeType: "application/json",
        responseSchema: SCHEMA,
      },
    });

    let parsed;
    try {
      parsed = JSON.parse(result.text);
    } catch {
      throw new Error("Risk Agent: unparseable Gemini output");
    }
    return parsed;
  }
}

export const riskAgent = new RiskAgent();
