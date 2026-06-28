import { BaseAgent } from "./base.js";

// Geo Agent — calls Nominatim (OpenStreetMap) reverse geocoding.
// No API key required. Rate limit: 1 req/s for public API — fine for demo.
const NOMINATIM_URL = "https://nominatim.openstreetmap.org/reverse";
const USER_AGENT = "CommunityHero/3.0 (civic-reporting-platform; contact@communityhero.app)";

class GeoAgent extends BaseAgent {
  constructor() {
    super("geo", { maxRetries: 1 });
  }

  startMessage({ lat, lng }) {
    return lat !== null && lat !== undefined
      ? `Resolving location for GPS ${lat.toFixed(4)}, ${lng.toFixed(4)}...`
      : "No GPS coordinates — skipping geocoding.";
  }

  publicResult(r) {
    return r.available
      ? { formattedAddress: r.formattedAddress, city: r.city, jurisdiction: r.jurisdiction }
      : { available: false, reason: r.reason };
  }

  async execute({ lat, lng }) {
    if (lat === null || lat === undefined || lng === null || lng === undefined) {
      return {
        available: false,
        reason: "No GPS coordinates provided",
        formattedAddress: null,
        road: null,
        suburb: null,
        city: null,
        state: null,
        jurisdiction: null,
      };
    }

    const url = new URL(NOMINATIM_URL);
    url.searchParams.set("lat", lat);
    url.searchParams.set("lon", lng);
    url.searchParams.set("format", "json");
    url.searchParams.set("addressdetails", "1");

    const res = await fetch(url.toString(), {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) throw new Error(`Nominatim returned HTTP ${res.status}`);
    const data = await res.json();

    const addr = data.address || {};
    const city = addr.city || addr.town || addr.village || addr.county || "Unknown";
    const jurisdiction =
      city !== "Unknown" ? `${city} Municipal Corporation` : "General Grievance Cell";

    return {
      available: true,
      formattedAddress: data.display_name || null,
      road: addr.road || addr.pedestrian || addr.footway || null,
      suburb: addr.suburb || addr.neighbourhood || addr.quarter || null,
      city,
      state: addr.state || null,
      jurisdiction,
      rawAddress: addr,
    };
  }
}

export const geoAgent = new GeoAgent();
