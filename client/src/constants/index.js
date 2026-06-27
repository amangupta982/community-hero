export const MAPS_KEY = import.meta.env.VITE_MAPS_KEY || "";

export const SEVERITY_COLOR = {
  Low: "#3b82f6",
  Medium: "#f59e0b",
  High: "#f97316",
  Critical: "#ef4444",
};

// Bengaluru as a sensible default center until we have the user's location.
export const DEFAULT_CENTER = { lat: 12.9716, lng: 77.5946 };

// DEMO MODE coordinates. The first two are ~12m apart, so same-type reports
// there will MERGE into one cluster ("2 citizens reported"). The third is far
// away and stays separate.
export const DEMO_SPOTS = [
  { lat: 12.97160, lng: 77.59460, label: "MG Road" },
  { lat: 12.97168, lng: 77.59466, label: "MG Road (nearby)" },
  { lat: 12.93420, lng: 77.62100, label: "Koramangala" },
];

// Issue-type visual identity (emoji, text color, background chip color).
// getIssueMeta falls back gracefully for unknown AI-generated types.
const ISSUE_META_MAP = {
  "Pothole":              { emoji: "🕳️",  color: "#92400e", bg: "#FEF3C7" },
  "Road Damage":          { emoji: "🛣️",  color: "#92400e", bg: "#FEF3C7" },
  "Streetlight":          { emoji: "💡",  color: "#1d4ed8", bg: "#DBEAFE" },
  "Streetlight Outage":   { emoji: "💡",  color: "#1d4ed8", bg: "#DBEAFE" },
  "Broken Streetlight":   { emoji: "💡",  color: "#1d4ed8", bg: "#DBEAFE" },
  "Water Leakage":        { emoji: "💧",  color: "#0e7490", bg: "#CFFAFE" },
  "Broken Pipe":          { emoji: "🔧",  color: "#0e7490", bg: "#CFFAFE" },
  "Garbage":              { emoji: "🗑️",  color: "#15803d", bg: "#DCFCE7" },
  "Garbage Dump":         { emoji: "🗑️",  color: "#15803d", bg: "#DCFCE7" },
  "Open Manhole":         { emoji: "⚠️",  color: "#b91c1c", bg: "#FEE2E2" },
  "Damaged Sidewalk":     { emoji: "🚶",  color: "#7c3aed", bg: "#EDE9FE" },
  "Footpath Damage":      { emoji: "🚶",  color: "#7c3aed", bg: "#EDE9FE" },
  "Flooding":             { emoji: "🌊",  color: "#0369a1", bg: "#e0f2fe" },
  "Waterlogging":         { emoji: "🌊",  color: "#0369a1", bg: "#e0f2fe" },
  "Waterlogging/Flooding":{ emoji: "🌊",  color: "#0369a1", bg: "#e0f2fe" },
  "Tree Fallen/Hazard":   { emoji: "🌳",  color: "#15803d", bg: "#DCFCE7" },
  "Tree Hazard":          { emoji: "🌳",  color: "#15803d", bg: "#DCFCE7" },
  "Graffiti":             { emoji: "🎨",  color: "#be185d", bg: "#fce7f3" },
  "Other":                { emoji: "⚠️",  color: "#374151", bg: "#F3F4F6" },
};

// Department email lookup for the "Email Dept" button.
// These are realistic demo addresses — replace with real ones before production.
export const DEPARTMENT_EMAIL_MAP = {
  "Roads & Infrastructure Department":      "roads.dept@bbmp.gov.in",
  "Electrical / Street Lighting Department": "streetlighting@bescom.co.in",
  "Water Supply & Sewerage Board":          "complaints@bwssb.co.in",
  "Solid Waste Management Department":      "swm@bbmp.gov.in",
  "Storm Water Drain Management Department":"drainage@bbmp.gov.in",
  "Parks & Horticulture Department":        "parks@bbmp.gov.in",
  "General Grievance Cell":                 "pgms@bbmp.gov.in",
};

export function getIssueMeta(issueType) {
  if (!issueType) return ISSUE_META_MAP["Other"];
  if (ISSUE_META_MAP[issueType]) return ISSUE_META_MAP[issueType];
  const lc = issueType.toLowerCase();
  if (lc.includes("pothole") || lc.includes("road") || lc.includes("asphalt"))
    return ISSUE_META_MAP["Pothole"];
  if (lc.includes("manhole") || lc.includes("sewer"))
    return ISSUE_META_MAP["Open Manhole"];
  if (lc.includes("light") || lc.includes("lamp") || lc.includes("streetlamp"))
    return ISSUE_META_MAP["Streetlight"];
  if (lc.includes("garbage") || lc.includes("waste") || lc.includes("trash") || lc.includes("litter") || lc.includes("dump"))
    return ISSUE_META_MAP["Garbage Dump"];
  if (lc.includes("tree") || lc.includes("fallen") || lc.includes("hazard"))
    return ISSUE_META_MAP["Tree Fallen/Hazard"];
  if (lc.includes("flood") || lc.includes("waterlog") || lc.includes("water"))
    return ISSUE_META_MAP["Waterlogging"];
  if (lc.includes("sidewalk") || lc.includes("footpath") || lc.includes("pavement"))
    return ISSUE_META_MAP["Footpath Damage"];
  if (lc.includes("pipe") || lc.includes("leak"))
    return ISSUE_META_MAP["Water Leakage"];
  return ISSUE_META_MAP["Other"];
}
