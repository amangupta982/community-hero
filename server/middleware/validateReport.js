// Input validation middleware for POST /api/report and /api/report/stream.
// Rejects requests early so the agent pipeline never starts on garbage input.

export function validateReport(req, res, next) {
  const { photo, lat, lng } = req.body ?? {};

  // photo is required and must be a base64 data URL.
  if (!photo || typeof photo !== "string" || !photo.includes("base64,")) {
    return res.status(400).json({
      error: "invalid_input",
      message: "photo must be a base64 data URL (e.g. data:image/jpeg;base64,...)",
    });
  }

  // Sanity-check size: 16M chars ≈ 12MB binary. express.json's 12MB limit catches
  // bodies first, but this is a second layer in case Content-Length is spoofed.
  if (photo.length > 16_000_000) {
    return res.status(413).json({
      error: "image_too_large",
      message: "Image exceeds 12MB. Please compress the image before sending.",
    });
  }

  // Latitude: must be a finite number in [-90, 90] if provided.
  if (lat !== undefined && lat !== null) {
    const n = Number(lat);
    if (!Number.isFinite(n) || n < -90 || n > 90) {
      return res.status(400).json({
        error: "invalid_input",
        message: `lat must be a number between -90 and 90 (got ${lat})`,
      });
    }
  }

  // Longitude: must be a finite number in [-180, 180] if provided.
  if (lng !== undefined && lng !== null) {
    const n = Number(lng);
    if (!Number.isFinite(n) || n < -180 || n > 180) {
      return res.status(400).json({
        error: "invalid_input",
        message: `lng must be a number between -180 and 180 (got ${lng})`,
      });
    }
  }

  next();
}
