import { describe, it, expect, vi } from "vitest";
import { validateReport } from "../middleware/validateReport.js";

function makeReq(body) {
  return { body: body ?? {} };
}

function makeRes() {
  const res = {
    _status: null,
    _json: null,
    status(code) {
      this._status = code;
      return this;
    },
    json(payload) {
      this._json = payload;
      return this;
    },
  };
  return res;
}

// ── Valid requests ─────────────────────────────────────────────────────────

describe("validateReport — valid inputs", () => {
  it("calls next() for a valid JPEG data URL with coordinates", () => {
    const req = makeReq({ photo: "data:image/jpeg;base64,/9j/abc", lat: 12.97, lng: 77.59 });
    const res = makeRes();
    const next = vi.fn();
    validateReport(req, res, next);
    expect(next).toHaveBeenCalledOnce();
    expect(res._status).toBeNull();
  });

  it("calls next() for a valid photo without coordinates (GPS unavailable)", () => {
    const req = makeReq({ photo: "data:image/png;base64,iVBOR" });
    const res = makeRes();
    const next = vi.fn();
    validateReport(req, res, next);
    expect(next).toHaveBeenCalledOnce();
  });

  it("calls next() when lat and lng are explicitly null", () => {
    const req = makeReq({ photo: "data:image/jpeg;base64,abc", lat: null, lng: null });
    const res = makeRes();
    const next = vi.fn();
    validateReport(req, res, next);
    expect(next).toHaveBeenCalledOnce();
  });

  it("calls next() for boundary latitude -90", () => {
    const req = makeReq({ photo: "data:image/jpeg;base64,abc", lat: -90, lng: 0 });
    const res = makeRes();
    const next = vi.fn();
    validateReport(req, res, next);
    expect(next).toHaveBeenCalledOnce();
  });

  it("calls next() for boundary latitude +90", () => {
    const req = makeReq({ photo: "data:image/jpeg;base64,abc", lat: 90, lng: 0 });
    const res = makeRes();
    const next = vi.fn();
    validateReport(req, res, next);
    expect(next).toHaveBeenCalledOnce();
  });

  it("calls next() for boundary longitude -180 and +180", () => {
    const next = vi.fn();
    for (const lng of [-180, 180]) {
      const req = makeReq({ photo: "data:image/jpeg;base64,abc", lat: 0, lng });
      const res = makeRes();
      validateReport(req, res, next);
    }
    expect(next).toHaveBeenCalledTimes(2);
  });
});

// ── Missing / invalid photo ────────────────────────────────────────────────

describe("validateReport — invalid photo", () => {
  it("returns 400 when photo is missing", () => {
    const req = makeReq({ lat: 12.97, lng: 77.59 });
    const res = makeRes();
    validateReport(req, res, vi.fn());
    expect(res._status).toBe(400);
    expect(res._json.error).toBe("invalid_input");
  });

  it("returns 400 when photo is an empty string", () => {
    const req = makeReq({ photo: "" });
    const res = makeRes();
    validateReport(req, res, vi.fn());
    expect(res._status).toBe(400);
  });

  it("returns 400 when photo is not a base64 data URL", () => {
    const req = makeReq({ photo: "https://example.com/photo.jpg" });
    const res = makeRes();
    validateReport(req, res, vi.fn());
    expect(res._status).toBe(400);
  });

  it("returns 400 when photo is a number", () => {
    const req = makeReq({ photo: 12345 });
    const res = makeRes();
    validateReport(req, res, vi.fn());
    expect(res._status).toBe(400);
  });

  it("returns 413 when photo exceeds 16M characters", () => {
    const req = makeReq({ photo: `data:image/jpeg;base64,${"A".repeat(16_000_001)}` });
    const res = makeRes();
    validateReport(req, res, vi.fn());
    expect(res._status).toBe(413);
    expect(res._json.error).toBe("image_too_large");
  });

  it("accepts a photo whose total length is exactly 16M characters", () => {
    const next = vi.fn();
    // The check is photo.length > 16_000_000. A string of exactly 16_000_000 chars
    // is NOT > 16_000_000 so it should pass validation.
    // Prefix "data:image/jpeg;base64," is 24 chars → data portion = 16_000_000 - 24.
    const prefix = "data:image/jpeg;base64,";
    const req = makeReq({ photo: prefix + "A".repeat(16_000_000 - prefix.length) });
    const res = makeRes();
    validateReport(req, res, next);
    expect(next).toHaveBeenCalledOnce();
  });
});

// ── Invalid coordinates ────────────────────────────────────────────────────

describe("validateReport — invalid coordinates", () => {
  it("returns 400 for lat > 90", () => {
    const req = makeReq({ photo: "data:image/jpeg;base64,abc", lat: 91, lng: 0 });
    const res = makeRes();
    validateReport(req, res, vi.fn());
    expect(res._status).toBe(400);
    expect(res._json.error).toBe("invalid_input");
  });

  it("returns 400 for lat < -90", () => {
    const req = makeReq({ photo: "data:image/jpeg;base64,abc", lat: -91, lng: 0 });
    const res = makeRes();
    validateReport(req, res, vi.fn());
    expect(res._status).toBe(400);
  });

  it("returns 400 for lng > 180", () => {
    const req = makeReq({ photo: "data:image/jpeg;base64,abc", lat: 0, lng: 181 });
    const res = makeRes();
    validateReport(req, res, vi.fn());
    expect(res._status).toBe(400);
  });

  it("returns 400 for lng < -180", () => {
    const req = makeReq({ photo: "data:image/jpeg;base64,abc", lat: 0, lng: -181 });
    const res = makeRes();
    validateReport(req, res, vi.fn());
    expect(res._status).toBe(400);
  });

  it("returns 400 for non-finite lat (Infinity)", () => {
    const req = makeReq({ photo: "data:image/jpeg;base64,abc", lat: Infinity, lng: 0 });
    const res = makeRes();
    validateReport(req, res, vi.fn());
    expect(res._status).toBe(400);
  });

  it("returns 400 for NaN lat", () => {
    const req = makeReq({ photo: "data:image/jpeg;base64,abc", lat: NaN, lng: 0 });
    const res = makeRes();
    validateReport(req, res, vi.fn());
    expect(res._status).toBe(400);
  });

  it("returns 400 for string lat that is not a valid number", () => {
    const req = makeReq({ photo: "data:image/jpeg;base64,abc", lat: "not_a_number", lng: 0 });
    const res = makeRes();
    validateReport(req, res, vi.fn());
    expect(res._status).toBe(400);
  });

  it("does not validate coordinates when body is missing (no crash)", () => {
    const req = { body: undefined };
    const res = makeRes();
    validateReport(req, res, vi.fn());
    // Body is undefined → photo check fails first with 400
    expect(res._status).toBe(400);
  });
});
