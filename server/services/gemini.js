import { ai } from "../config/index.js";
import { issueSchema, SYSTEM_INSTRUCTION, DEPARTMENT_BY_ISSUE } from "../constants/index.js";

export async function analyzePhoto(img) {
  const result = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        role: "user",
        parts: [
          { inlineData: { mimeType: img.mimeType, data: img.data } },
          { text: "Analyze this photo and classify the civic issue." },
        ],
      },
    ],
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: issueSchema,
    },
  });

  let analysis;
  try {
    analysis = JSON.parse(result.text);
  } catch {
    throw new Error(`Gemini returned unparseable output: ${result.text}`);
  }
  return analysis;
}

export async function draftComplaint(report) {
  const department = DEPARTMENT_BY_ISSUE[report.issueType] || "General Grievance Cell";
  const locationStr =
    report.lat != null
      ? `GPS ${report.lat.toFixed(5)}, ${report.lng.toFixed(5)}`
      : "location attached in app";
  const count = report.reportCount || 1;

  const prompt = `Draft a formal civic complaint letter to the municipal corporation.

Addressed to: The ${department}
Issue type: ${report.issueType}
Severity: ${report.severity}
Observed: ${report.description}
Location: ${locationStr}
Number of citizens who have reported this: ${count}

Requirements:
- Professional, respectful, firm tone.
- State the public-safety risk clearly.
- If multiple citizens reported it, cite that number to convey urgency.
- Request a specific action and a reasonable resolution timeframe.
- Keep under 180 words. Plain text, ready to send. No placeholders like [Name].
- End with "Submitted via Community Hero".`;

  const result = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  });

  return { text: result.text.trim(), department };
}
