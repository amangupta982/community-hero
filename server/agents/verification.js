import { Type } from "@google/genai";
import { BaseAgent } from "./base.js";
import { ai } from "../config/index.js";

const SCHEMA = {
  type: Type.OBJECT,
  properties: {
    confirmsIssueType: { type: Type.BOOLEAN },
    confirmsIsCivicIssue: { type: Type.BOOLEAN },
    suggestedIssueType: {
      type: Type.STRING,
      enum: ["Pothole", "Streetlight", "Water Leakage", "Garbage", "Damaged Sidewalk", "Other"],
    },
    suggestedSeverity: { type: Type.STRING, enum: ["Low", "Medium", "High", "Critical"] },
    verificationNotes: { type: Type.STRING },
    pass: { type: Type.BOOLEAN },
  },
  required: [
    "confirmsIssueType",
    "confirmsIsCivicIssue",
    "suggestedIssueType",
    "suggestedSeverity",
    "verificationNotes",
    "pass",
  ],
};

const SYSTEM = `You are a senior verification inspector providing a second opinion.
A junior inspector has already classified a civic infrastructure photo.
Re-examine the same image independently.

If you agree, set confirmsIssueType: true and suggestedIssueType to the same value.
If you disagree, set confirmsIssueType: false and provide suggestedIssueType with your preferred classification.
Set pass: false ONLY if the image genuinely shows no civic issue at all.
Be strict: prefer the junior's classification unless you have clear visual evidence of an error.

verificationNotes must explain your reasoning in one sentence.`;

class VerificationAgent extends BaseAgent {
  constructor() {
    super("verification");
  }

  startMessage() {
    return "Cross-checking classification with independent analysis...";
  }

  publicResult(r) {
    return {
      confirmsIssueType: r.confirmsIssueType,
      confirmsIsCivicIssue: r.confirmsIsCivicIssue,
      pass: r.pass,
      overrode: !r.confirmsIssueType,
    };
  }

  async execute({ img, visionResult }) {
    const prompt = `A junior inspector classified this image as:
- Issue Type: ${visionResult.issueType}
- Severity: ${visionResult.severity}
- Confidence: ${visionResult.confidence}%
- Description: ${visionResult.description}
- Is Civic Issue: ${visionResult.isCivicIssue}

Independently examine the same image and verify or correct this classification.`;

    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [{ inlineData: { mimeType: img.mimeType, data: img.data } }, { text: prompt }],
        },
      ],
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
      throw new Error(`Verification Agent: unparseable Gemini output`);
    }
    return parsed;
  }
}

export const verificationAgent = new VerificationAgent();
