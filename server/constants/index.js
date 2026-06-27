import { Type } from "@google/genai";

export const CLUSTER_RADIUS_M = 50;

export const SEVERITY_RANK = { Low: 1, Medium: 2, High: 3, Critical: 4 };
export const RANK_SEVERITY = ["", "Low", "Medium", "High", "Critical"];

export const DEPARTMENT_BY_ISSUE = {
  Pothole: "Roads & Infrastructure Department",
  "Damaged Sidewalk": "Roads & Infrastructure Department",
  Streetlight: "Electrical / Street Lighting Department",
  "Water Leakage": "Water Supply & Sewerage Board",
  Garbage: "Solid Waste Management Department",
  Other: "General Grievance Cell",
};

export const issueSchema = {
  type: Type.OBJECT,
  properties: {
    issueType: {
      type: Type.STRING,
      enum: ["Pothole", "Streetlight", "Water Leakage", "Garbage", "Damaged Sidewalk", "Other"],
      description: "The single best-matching civic issue category.",
    },
    severity: {
      type: Type.STRING,
      enum: ["Low", "Medium", "High", "Critical"],
      description: "How urgent/dangerous the issue is to the public.",
    },
    description: {
      type: Type.STRING,
      description: "One short factual sentence describing only what is visible in the photo.",
    },
    confidence: {
      type: Type.NUMBER,
      description: "Confidence 0-100 that issueType is correct.",
    },
    isCivicIssue: {
      type: Type.BOOLEAN,
      description: "False if the photo shows no public/civic infrastructure problem at all.",
    },
  },
  required: ["issueType", "severity", "description", "confidence", "isCivicIssue"],
};

export const SYSTEM_INSTRUCTION = `You are a municipal civic-infrastructure inspector.
Given a citizen's photo, identify the public infrastructure problem it shows.
Judge severity by public risk: a deep pothole on a fast road or an exposed live
wire is Critical; minor cosmetic wear is Low. Be factual and conservative.

CRITICAL RULE: Only real, visible PUBLIC infrastructure problems count as civic
issues. If the photo shows a personal object (laptop, phone, food, snack packet,
a person, a pet, a screen, indoor items) or anything that is NOT a public
infrastructure problem, you MUST set isCivicIssue to false, issueType to "Other",
and severity to "Low". NEVER invent a hazard that is not plainly visible. Do not
speculate about wiring, panels, or dangers that you cannot actually see. Describe
only what is literally in the image.`;
