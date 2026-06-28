import { describe, it, expect } from "vitest";
import { parseDataUrl } from "../utils/parseDataUrl.js";

describe("parseDataUrl", () => {
  // ── Valid inputs ───────────────────────────────────────────────────────────

  it("parses a JPEG data URL", () => {
    const input = "data:image/jpeg;base64,/9j/4AAQSkZJRg==";
    const result = parseDataUrl(input);
    expect(result).toEqual({
      mimeType: "image/jpeg",
      data: "/9j/4AAQSkZJRg==",
    });
  });

  it("parses a PNG data URL", () => {
    const input = "data:image/png;base64,iVBORw0KGgo=";
    const result = parseDataUrl(input);
    expect(result).toEqual({
      mimeType: "image/png",
      data: "iVBORw0KGgo=",
    });
  });

  it("parses a WebP data URL", () => {
    const input = "data:image/webp;base64,UklGRg==";
    const result = parseDataUrl(input);
    expect(result).toEqual({
      mimeType: "image/webp",
      data: "UklGRg==",
    });
  });

  it("parses an empty base64 payload", () => {
    const input = "data:image/jpeg;base64,";
    const result = parseDataUrl(input);
    expect(result).toEqual({ mimeType: "image/jpeg", data: "" });
  });

  it("correctly extracts mimeType with subtype parameters", () => {
    const input = "data:image/jpeg;base64,abc123";
    expect(parseDataUrl(input)?.mimeType).toBe("image/jpeg");
  });

  it("handles a real-world large base64 string", () => {
    const largeData = "A".repeat(10_000);
    const input = `data:image/jpeg;base64,${largeData}`;
    const result = parseDataUrl(input);
    expect(result?.data).toBe(largeData);
    expect(result?.mimeType).toBe("image/jpeg");
  });

  // ── Invalid inputs ─────────────────────────────────────────────────────────

  it("returns null for undefined", () => {
    expect(parseDataUrl(undefined)).toBeNull();
  });

  it("returns null for null", () => {
    expect(parseDataUrl(null)).toBeNull();
  });

  it("returns null for an empty string", () => {
    expect(parseDataUrl("")).toBeNull();
  });

  it("returns null for a plain string (not a data URL)", () => {
    expect(parseDataUrl("hello world")).toBeNull();
  });

  it("returns null for an HTTPS URL", () => {
    expect(parseDataUrl("https://example.com/photo.jpg")).toBeNull();
  });

  it("returns null for a data URL missing the base64 keyword", () => {
    expect(parseDataUrl("data:image/jpeg,/9j/4AAQSkZJRg==")).toBeNull();
  });

  it("returns null for a data URL with wrong separator", () => {
    expect(parseDataUrl("data:image/jpeg;base64|/9j/4AAQ")).toBeNull();
  });

  it("returns null for a data URL missing the mime type", () => {
    expect(parseDataUrl("data:;base64,abc")).toBeNull();
  });

  it("returns null for a number input", () => {
    expect(parseDataUrl(42)).toBeNull();
  });

  it("returns null for an object input", () => {
    expect(parseDataUrl({})).toBeNull();
  });
});
