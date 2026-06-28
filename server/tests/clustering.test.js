import { describe, it, expect } from "vitest";
import {
  haversineMetres,
  isWithinClusterRadius,
  worstSeverity,
} from "../services/clustering.js";

// ── haversineMetres ────────────────────────────────────────────────────────

describe("haversineMetres", () => {
  it("returns 0 for identical coordinates", () => {
    const p = { lat: 12.9716, lng: 77.5946 };
    expect(haversineMetres(p, p)).toBeCloseTo(0, 5);
  });

  it("calculates ~111 km for 1 degree of latitude", () => {
    const a = { lat: 0, lng: 0 };
    const b = { lat: 1, lng: 0 };
    // 1° latitude ≈ 111,195 m
    expect(haversineMetres(a, b)).toBeCloseTo(111_195, -2);
  });

  it("calculates ~111 km for 1 degree of longitude at the equator", () => {
    const a = { lat: 0, lng: 0 };
    const b = { lat: 0, lng: 1 };
    expect(haversineMetres(a, b)).toBeCloseTo(111_195, -2);
  });

  it("calculates shorter distance for 1 degree of longitude at higher latitude", () => {
    // At lat 60°, cos(60°) ≈ 0.5 → lng distance ≈ 55.6 km
    const a = { lat: 60, lng: 0 };
    const b = { lat: 60, lng: 1 };
    expect(haversineMetres(a, b)).toBeCloseTo(55_600, -2);
  });

  it("is symmetric (distance A→B equals B→A)", () => {
    const a = { lat: 12.9716, lng: 77.5946 };
    const b = { lat: 12.9720, lng: 77.5950 };
    expect(haversineMetres(a, b)).toBeCloseTo(haversineMetres(b, a), 5);
  });

  it("calculates ~56 m for two Bengaluru coordinates 50 m apart", () => {
    // Two points separated by ~0.0005° lat in Bengaluru (≈ 55m)
    const a = { lat: 12.9716, lng: 77.5946 };
    const b = { lat: 12.97205, lng: 77.5946 };
    const dist = haversineMetres(a, b);
    expect(dist).toBeGreaterThan(40);
    expect(dist).toBeLessThan(60);
  });

  it("handles antipodal points (~20,015 km)", () => {
    const a = { lat: 0, lng: 0 };
    const b = { lat: 0, lng: 180 };
    // Half of Earth's circumference ≈ 20,015 km
    expect(haversineMetres(a, b)).toBeCloseTo(20_015_000, -4);
  });

  it("handles negative coordinates (southern hemisphere)", () => {
    const a = { lat: -33.8688, lng: 151.2093 }; // Sydney
    const b = { lat: -37.8136, lng: 144.9631 }; // Melbourne
    const dist = haversineMetres(a, b);
    // Sydney → Melbourne ≈ 714 km
    expect(dist).toBeGreaterThan(700_000);
    expect(dist).toBeLessThan(730_000);
  });
});

// ── isWithinClusterRadius ──────────────────────────────────────────────────

describe("isWithinClusterRadius", () => {
  it("returns true for identical coordinates", () => {
    const p = { lat: 12.9716, lng: 77.5946 };
    expect(isWithinClusterRadius(p, p)).toBe(true);
  });

  it("returns true for points well within 50 m", () => {
    const a = { lat: 12.9716, lng: 77.5946 };
    // ~10 m north
    const b = { lat: 12.97169, lng: 77.5946 };
    expect(isWithinClusterRadius(a, b)).toBe(true);
  });

  it("returns false for points clearly beyond 50 m", () => {
    const a = { lat: 12.9716, lng: 77.5946 };
    // ~111 m north (0.001° lat)
    const b = { lat: 12.9726, lng: 77.5946 };
    expect(isWithinClusterRadius(a, b)).toBe(false);
  });

  it("returns true for two reports at the boundary (~49 m)", () => {
    // 0.00044° lat ≈ 49 m
    const a = { lat: 12.97160, lng: 77.5946 };
    const b = { lat: 12.97204, lng: 77.5946 };
    expect(isWithinClusterRadius(a, b)).toBe(true);
  });

  it("returns false for two reports just outside the boundary (~51 m)", () => {
    // 0.00046° lat ≈ 51 m
    const a = { lat: 12.97160, lng: 77.5946 };
    const b = { lat: 12.97206, lng: 77.5946 };
    expect(isWithinClusterRadius(a, b)).toBe(false);
  });
});

// ── worstSeverity ──────────────────────────────────────────────────────────

describe("worstSeverity", () => {
  it("returns Critical when either input is Critical", () => {
    expect(worstSeverity("Critical", "Low")).toBe("Critical");
    expect(worstSeverity("Low", "Critical")).toBe("Critical");
    expect(worstSeverity("Critical", "Critical")).toBe("Critical");
  });

  it("returns High when highest is High", () => {
    expect(worstSeverity("High", "Medium")).toBe("High");
    expect(worstSeverity("Low", "High")).toBe("High");
    expect(worstSeverity("High", "High")).toBe("High");
  });

  it("returns Medium when highest is Medium", () => {
    expect(worstSeverity("Medium", "Low")).toBe("Medium");
    expect(worstSeverity("Low", "Medium")).toBe("Medium");
    expect(worstSeverity("Medium", "Medium")).toBe("Medium");
  });

  it("returns Low when both are Low", () => {
    expect(worstSeverity("Low", "Low")).toBe("Low");
  });

  it("is commutative", () => {
    const pairs = [
      ["Critical", "High"],
      ["Critical", "Low"],
      ["High", "Medium"],
      ["Medium", "Low"],
    ];
    for (const [a, b] of pairs) {
      expect(worstSeverity(a, b)).toBe(worstSeverity(b, a));
    }
  });

  it("handles undefined/null by treating as rank 1 (Low)", () => {
    // SEVERITY_RANK fallback: || 1
    expect(worstSeverity(undefined, "High")).toBe("High");
    expect(worstSeverity("Medium", null)).toBe("Medium");
  });

  it("handles unknown severity strings by treating as rank 1", () => {
    expect(worstSeverity("Unknown", "High")).toBe("High");
    expect(worstSeverity("foo", "bar")).toBe("Low");
  });
});
