import { Type } from "@google/genai";
import { BaseAgent } from "./base.js";
import { ai } from "../config/index.js";

const SCHEMA = {
  type: Type.OBJECT,
  properties: {
    issueType: {
      type: Type.STRING,
      enum: ["Pothole", "Streetlight", "Water Leakage", "Garbage", "Damaged Sidewalk", "Other"],
    },
    severity: { type: Type.STRING, enum: ["Low", "Medium", "High", "Critical"] },
    description: { type: Type.STRING },
    confidence: { type: Type.NUMBER },
    isCivicIssue: { type: Type.BOOLEAN },
    rawObservations: { type: Type.ARRAY, items: { type: Type.STRING } },
    affectedInfrastructure: { type: Type.STRING },
  },
  required: [
    "issueType",
    "severity",
    "description",
    "confidence",
    "isCivicIssue",
    "rawObservations",
    "affectedInfrastructure",
  ],
};

const SYSTEM = `You are a first-pass municipal civic-infrastructure inspector.
Your role is to make an initial classification of a citizen's photo.
A second agent will verify your output, so be thorough and honest about your confidence.

Enumerate every visible thing in rawObservations (3-6 items). Be factual.
Identify the specific piece of infrastructure affected in affectedInfrastructure.

CRITICAL RULE: Only classify real, visible PUBLIC infrastructure problems as civic issues.
Personal items, indoor scenes, people, pets, screens → isCivicIssue: false, issueType: "Other", severity: "Low".
Never invent a hazard that is not plainly visible.`;

class VisionAgent extends BaseAgent {
  constructor() {
    super("vision");
  }

  startMessage() {
    return "Analyzing photo for civic infrastructure issues...";
  }

  publicResult(r) {
    return {
      issueType: r.issueType,
      severity: r.severity,
      confidence: r.confidence,
      isCivicIssue: r.isCivicIssue,
    };
  }

  async execute({ img }) {
    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            { inlineData: { mimeType: img.mimeType, data: img.data } },
            { text: "Analyze this photo and classify the civic infrastructure issue." },
          ],
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
      throw new Error(`Vision Agent: unparseable Gemini output`);
    }
    return parsed;
  }
}

export const visionAgent = new VisionAgent();
