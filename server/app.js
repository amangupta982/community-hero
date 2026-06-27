import express from "express";
import cors from "cors";
import helmet from "helmet";
import path from "node:path";
import { fileURLToPath } from "node:url";
import apiRouter from "./routes/api.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { apiLimiter } from "./middleware/rateLimiter.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IS_PROD   = process.env.NODE_ENV === "production";

const app = express();

// ── Security headers ──────────────────────────────────────────────────────────
// CSP and COEP disabled: Google Maps loads cross-origin scripts and workers
// that would require an elaborate allowlist. Add in a future pass once Maps
// keys are domain-locked and a Maps-compatible policy is tested end-to-end.
app.use(helmet({
  contentSecurityPolicy:    false,
  crossOriginEmbedderPolicy: false,
}));

// In production Cloud Run serves both origins from the same host, so CORS is
// unnecessary. Keep permissive in dev for the Vite dev server proxy.
app.use(cors(IS_PROD ? { origin: false } : {}));

// 12MB cap accommodates a full-resolution JPEG as base64.
// Client-side compression targets ~200KB so this is a safety ceiling.
app.use(express.json({ limit: "12mb" }));

// General API rate limit (120 req/min). Pipeline routes add a stricter overlay.
app.use("/api", apiLimiter);

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api", apiRouter);

// ── Static frontend (production) ──────────────────────────────────────────────
const clientDist = path.join(__dirname, "..", "client", "dist");
app.use(express.static(clientDist));
app.get(/^\/(?!api).*/, (_req, res) => {
  res.sendFile(path.join(clientDist, "index.html"));
});

app.use(errorHandler);

export default app;
