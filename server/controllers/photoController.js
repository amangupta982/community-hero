import { bucket } from "../config/index.js";

// Proxy GCS objects through the server so the client never needs signed URLs.
// The Cloud Run service account already has storage write access; read is included.
// Route: GET /api/photo/*  (objectName = everything after /api/photo/)
export async function servePhoto(req, res) {
  if (!bucket) return res.status(503).json({ error: "Storage not configured." });

  const objectName = req.params[0];
  if (!objectName) return res.status(400).json({ error: "Missing object name." });

  // Basic path traversal guard — objectName must stay inside the bucket root.
  if (objectName.includes("..")) return res.status(400).json({ error: "Invalid path." });

  const file = bucket.file(objectName);

  let metadata;
  try {
    [metadata] = await file.getMetadata();
  } catch (err) {
    if (err.code === 404) return res.status(404).json({ error: "Photo not found." });
    throw err;
  }

  res.setHeader("Content-Type", metadata.contentType || "image/jpeg");
  res.setHeader("Cache-Control", "public, max-age=31536000, immutable");

  file.createReadStream().on("error", (err) => {
    if (!res.headersSent) res.status(500).json({ error: "Failed to stream photo." });
    else res.destroy(err);
  }).pipe(res);
}
