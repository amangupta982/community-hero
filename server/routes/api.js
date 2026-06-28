import { Router } from "express";
import { getReports, getReport, createReport } from "../controllers/reportController.js";
import { generateComplaint } from "../controllers/complaintController.js";
import { streamReport } from "../controllers/streamController.js";
import { getDashboardStats, getDashboardInsights } from "../controllers/dashboardController.js";
import { seedDemo, resetDemo } from "../controllers/demoController.js";
import { servePhoto } from "../controllers/photoController.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { pipelineLimiter } from "../middleware/rateLimiter.js";
import { validateReport } from "../middleware/validateReport.js";

const router = Router();

// Lightweight synchronous health check for Cloud Run probes.
router.get("/health", (_req, res) => {
  res.json({
    ok:     true,
    uptime: Math.floor(process.uptime()),
    memory: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
    checks: {
      gemini:    !!process.env.GEMINI_API_KEY,
      firestore: !!process.env.GOOGLE_CLOUD_PROJECT,
      storage:   !!process.env.GCS_BUCKET_NAME,
    },
  });
});

// GCS photo proxy — serves objects from Cloud Storage using server-side credentials.
// Registered before param routes so Express doesn't treat "photo" as an :id.
router.get("/photo/*", asyncHandler(servePhoto));

router.get("/reports",            asyncHandler(getReports));
router.get("/reports/:id",        asyncHandler(getReport));
router.get("/dashboard/stats",    asyncHandler(getDashboardStats));
router.get("/dashboard/insights", asyncHandler(getDashboardInsights));

// Multi-agent streaming endpoint (Server-Sent Events).
// Registered BEFORE /report so Express doesn't interpret "stream" as an ID.
router.post("/report/stream", pipelineLimiter, validateReport, asyncHandler(streamReport));

// Non-streaming fallback (same agent pipeline without SSE).
router.post("/report", pipelineLimiter, validateReport, asyncHandler(createReport));

// Re-draft complaint for an existing cluster (idempotent).
router.post("/report/:id/complaint", asyncHandler(generateComplaint));

// Demo mode — seed realistic data / wipe it for a clean slate.
// These routes are intentionally unprotected for hackathon demos.
router.post("/demo/seed",  asyncHandler(seedDemo));
router.post("/demo/reset", asyncHandler(resetDemo));

export default router;
