import { BaseAgent } from "./base.js";
import { db } from "../config/index.js";
import { haversineMetres } from "../services/clustering.js";

const OVERPASS = "https://overpass-api.de/api/interpreter";
const OPEN_METEO = "https://api.open-meteo.com/v1/forecast";

// WMO weather interpretation codes → human label.
function weatherLabel(code) {
  if (code === 0) return "Clear sky";
  if (code <= 3) return "Partly cloudy";
  if (code <= 9) return "Fog";
  if (code <= 29) return "Drizzle";
  if (code <= 39) return "Rain";
  if (code <= 49) return "Snow showers";
  if (code <= 59) return "Sleet";
  if (code <= 69) return "Heavy rain";
  if (code <= 79) return "Snowfall";
  if (code <= 99) return "Thunderstorm";
  return "Unknown";
}

class ContextAgent extends BaseAgent {
  constructor() {
    super("context", { maxRetries: 1 });
  }

  startMessage() {
    return "Gathering local context — places, weather, area history…";
  }

  publicResult(r) {
    if (!r.available) return { available: false, reason: r.reason };
    return {
      available: true,
      placeCount: r.places?.length ?? 0,
      weather: r.weather
        ? { condition: r.weather.condition, temperature: r.weather.temperature }
        : null,
      historicalCount: r.historical?.count ?? 0,
      isRecurring: r.historical?.isRecurring ?? false,
    };
  }

  async execute({ lat, lng, issueType }) {
    if (lat === null || lat === undefined || lng === null || lng === undefined) {
      return {
        available: false,
        reason: "No GPS coordinates",
        places: [],
        weather: null,
        historical: { count: 0 },
      };
    }

    const [placesR, weatherR, histR] = await Promise.allSettled([
      this.fetchNearbyPlaces(lat, lng),
      this.fetchWeather(lat, lng),
      this.fetchHistorical(lat, lng, issueType),
    ]);

    return {
      available: true,
      places: placesR.status === "fulfilled" ? placesR.value : [],
      weather: weatherR.status === "fulfilled" ? weatherR.value : null,
      historical: histR.status === "fulfilled" ? histR.value : { count: 0 },
      _errors: [
        placesR.status === "rejected" ? `places:${placesR.reason?.message}` : null,
        weatherR.status === "rejected" ? `weather:${weatherR.reason?.message}` : null,
        histR.status === "rejected" ? `history:${histR.reason?.message}` : null,
      ].filter(Boolean),
    };
  }

  async fetchNearbyPlaces(lat, lng) {
    // Query sensitive amenities via Overpass API (OSM). No key required.
    const query =
      `[out:json][timeout:8];` +
      `(node[amenity~"^(hospital|clinic|school|college|university|fire_station|police|bus_station|kindergarten|pharmacy)$"]` +
      `(around:400,${lat},${lng});` +
      `node[amenity="bus_stop"](around:200,${lat},${lng}););` +
      `out body 12;`;

    const res = await fetch(OVERPASS, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `data=${encodeURIComponent(query)}`,
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) throw new Error(`Overpass HTTP ${res.status}`);
    const { elements = [] } = await res.json();

    return elements
      .map((el) => ({
        type: el.tags?.amenity || "place",
        name: el.tags?.name || el.tags?.["name:en"] || el.tags?.amenity || "Unnamed",
        distanceM: Math.round(haversineMetres({ lat, lng }, { lat: el.lat, lng: el.lon })),
      }))
      .sort((a, b) => a.distanceM - b.distanceM)
      .slice(0, 8);
  }

  async fetchWeather(lat, lng) {
    const url =
      `${OPEN_METEO}?latitude=${lat.toFixed(4)}&longitude=${lng.toFixed(4)}` +
      `&current=temperature_2m,precipitation,wind_speed_10m,weather_code&timezone=auto`;

    const res = await fetch(url, { signal: AbortSignal.timeout(7000) });
    if (!res.ok) throw new Error(`Open-Meteo HTTP ${res.status}`);
    const { current: c } = await res.json();

    return {
      temperature: c.temperature_2m,
      precipitation: c.precipitation,
      windSpeed: c.wind_speed_10m,
      condition: weatherLabel(c.weather_code),
      isRaining: c.weather_code >= 51 && c.weather_code <= 99,
      isStormy: c.weather_code >= 80,
      weatherCode: c.weather_code,
    };
  }

  async fetchHistorical(lat, lng, issueType) {
    if (!db) return { count: 0 };

    // Look for same issueType within 500 m in the last 60 days.
    // Uses composite index: issueType ASC, lat ASC (defined in firestore.indexes.json).
    const NEARBY_M = 500;
    const latDelta = NEARBY_M / 111320;
    const lngDelta = NEARBY_M / (111320 * Math.cos((lat * Math.PI) / 180));
    const since = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

    const snap = await db
      .collection("clusters")
      .where("issueType", "==", issueType)
      .where("lat", ">=", lat - latDelta)
      .where("lat", "<=", lat + latDelta)
      .orderBy("lat")
      .limit(20)
      .get();

    const nearby = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((d) => {
        if (Math.abs((d.lng ?? 0) - lng) > lngDelta) return false;
        if (!d.createdAt) return false;
        const t = d.createdAt.toDate ? d.createdAt.toDate() : new Date(d.createdAt);
        return t >= since;
      });

    if (nearby.length === 0) return { count: 0, isRecurring: false };

    const latestRaw = nearby.reduce((a, b) => {
      const aT = a.createdAt?.toDate?.() ?? new Date(a.createdAt);
      const bT = b.createdAt?.toDate?.() ?? new Date(b.createdAt);
      return aT > bT ? a : b;
    }).createdAt;
    const latest = latestRaw?.toDate?.() ?? new Date(latestRaw);

    return {
      count: nearby.length,
      totalCitizenReports: nearby.reduce((s, d) => s + (d.reportCount || 1), 0),
      lastSeenDaysAgo: Math.round((Date.now() - latest.getTime()) / (24 * 60 * 60 * 1000)),
      isRecurring: nearby.length >= 2,
    };
  }
}

export const contextAgent = new ContextAgent();
