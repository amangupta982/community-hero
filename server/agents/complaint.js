import { Type } from "@google/genai";
import { BaseAgent } from "./base.js";
import { ai } from "../config/index.js";
import { DEPARTMENT_BY_ISSUE } from "../constants/index.js";

const SCHEMA = {
  type: Type.OBJECT,
  properties: {
    letter: { type: Type.STRING },
    subject: { type: Type.STRING },
    urgencyTag: { type: Type.STRING, enum: ["NORMAL", "HIGH", "URGENT"] },
    ccDepartments: { type: Type.ARRAY, items: { type: Type.STRING } },
    citizenSummary: { type: Type.STRING },
    followUpDays: { type: Type.NUMBER },
    workOrder: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        priority: {
          type: Type.STRING,
          enum: ["P1 - Emergency", "P2 - Urgent", "P3 - Standard", "P4 - Low"],
        },
        issueSummary: { type: Type.STRING },
        steps: { type: Type.ARRAY, items: { type: Type.STRING } },
        requiredResources: { type: Type.ARRAY, items: { type: Type.STRING } },
        safetyPrecautions: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ["title", "priority", "steps", "requiredResources", "safetyPrecautions"],
    },
  },
  required: [
    "letter",
    "subject",
    "urgencyTag",
    "ccDepartments",
    "citizenSummary",
    "followUpDays",
    "workOrder",
  ],
};

const SYSTEM = `You are a civic advocacy specialist drafting formal complaints and field work orders for Indian municipal corporations.
Given a verified civic issue with enriched context, produce four outputs in one pass:

FORMAL COMPLAINT (letter):
- Professional, respectful, and firm tone.
- Under 220 words, plain text, ready to send as-is.
- Subject: a one-line subject line (no "Subject:" prefix).
- Include priorityScore and citizen count if > 1 to convey community urgency.
- Reference specific location if available.
- Request concrete action with the resolution timeframe from risk data.
- No placeholders. End with "Submitted via Community Hero".
- ccDepartments: 0-2 additional departments to CC (empty array if none).

CITIZEN SUMMARY (citizenSummary):
- 2-3 sentences in plain, friendly language (Grade 8 level). No jargon.
- Tell the citizen: what the AI found, what action was taken, what to expect next.
- Start with "A [severity] [issue] was detected at [location]."

FOLLOW-UP SCHEDULE (followUpDays):
- Integer 3–30. Base on: Critical=3, High=5, Medium=7, Low=14.
- Adjust if estimatedResolutionDays is provided (follow up at 50% of that).

WORK ORDER (workOrder) for the field officer team:
- title: concise work order title including issue type and location.
- priority: exactly "P1 - Emergency" for Critical, "P2 - Urgent" for High, "P3 - Standard" for Medium, "P4 - Low" for Low.
- issueSummary: one technical sentence describing the defect.
- steps: 4-6 ordered repair/remediation steps as complete instructions.
- requiredResources: 2-5 materials, equipment, and personnel needed.
- safetyPrecautions: 1-3 safety measures specific to this repair type.`;

class ComplaintAgent extends BaseAgent {
  constructor() {
    super("complaint");
  }

  startMessage({ classification }) {
    return `Drafting complaint, work order & citizen summary for ${DEPARTMENT_BY_ISSUE[classification?.issueType] || "General Grievance Cell"}…`;
  }

  publicResult(r) {
    return {
      subject: r.subject,
      urgencyTag: r.urgencyTag,
      department: r.department,
      followUpDays: r.followUpDays,
    };
  }

  async execute({ finalClassification, geoResult, riskResult, contextResult, reportCount }) {
    const department =
      DEPARTMENT_BY_ISSUE[finalClassification.issueType] || "General Grievance Cell";
    const locationStr = geoResult?.available
      ? [geoResult.road, geoResult.suburb, geoResult.city].filter(Boolean).join(", ")
      : finalClassification.lat !== null
        ? `GPS ${finalClassification.lat.toFixed(5)}, ${finalClassification.lng.toFixed(5)}`
        : "location attached in app";

    const weather = contextResult?.weather;
    const places = contextResult?.places ?? [];
    const sensitiveNearby = places.filter((p) =>
      [
        "hospital",
        "clinic",
        "school",
        "college",
        "kindergarten",
        "fire_station",
        "police",
      ].includes(p.type)
    );

    const prompt = `Generate a formal complaint, work order, citizen summary, and follow-up schedule for:

ISSUE
Type: ${finalClassification.issueType}
Severity: ${finalClassification.severity}
Description: ${finalClassification.description}
Location: ${locationStr}
Jurisdiction: ${geoResult?.jurisdiction || department}
Citizens who reported this: ${reportCount}

RISK ASSESSMENT
Priority Score: ${riskResult?.priorityScore ?? "N/A"}/100 (${riskResult?.publicRiskLevel ?? "Unknown"} risk)
Urgency Score: ${riskResult?.urgencyScore ?? "N/A"}/10
Risk factors: ${riskResult?.riskFactors?.join("; ") ?? "N/A"}
Affected population: ${riskResult?.affectedPopulationEstimate ?? "Unknown"}
Recommended resolution: ${riskResult?.estimatedResolutionDays ?? 14} working days
Traffic impact: ${riskResult?.trafficImpact ?? "None"}
Escalation reason: ${riskResult?.escalationReason ?? "N/A"}

CONTEXT
${weather ? `Weather: ${weather.condition}, ${weather.temperature}°C${weather.isRaining ? " — RAINING NOW (increases urgency)" : ""}` : "Weather: unavailable"}
${sensitiveNearby.length > 0 ? `Sensitive facilities within 400m: ${sensitiveNearby.map((p) => `${p.type} "${p.name}" at ${p.distanceM}m`).join("; ")}` : "No sensitive facilities nearby"}

TO: The ${department}`;

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
      throw new Error("Complaint Agent: unparseable Gemini output");
    }
    return { ...parsed, department };
  }
}

export const complaintAgent = new ComplaintAgent();
