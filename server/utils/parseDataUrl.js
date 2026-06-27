// Strip a data-URL prefix and return {data, mimeType} for Gemini, or null if invalid.
export function parseDataUrl(dataUrl) {
  const match = /^data:(.+?);base64,(.*)$/.exec(dataUrl || "");
  if (!match) return null;
  return { mimeType: match[1], data: match[2] };
}
