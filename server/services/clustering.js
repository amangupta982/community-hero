// Pure math utilities — no I/O, no store imports. Safe to unit-test in isolation.
import { CLUSTER_RADIUS_M, SEVERITY_RANK, RANK_SEVERITY } from "../constants/index.js";

export function haversineMetres(a, b) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function isWithinClusterRadius(a, b) {
  return haversineMetres(a, b) <= CLUSTER_RADIUS_M;
}

export function worstSeverity(severityA, severityB) {
  const rank = Math.max(SEVERITY_RANK[severityA] || 1, SEVERITY_RANK[severityB] || 1);
  return RANK_SEVERITY[rank];
}
