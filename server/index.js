import "./config/index.js"; // load env + warn on missing keys first
import app from "./app.js";
import { PORT } from "./config/index.js";

// Firestore/GCS gRPC auth failures can surface as unhandled rejections if
// credentials aren't available locally. Log and survive rather than crashing —
// on Cloud Run the service account is always present so this never fires.
process.on("unhandledRejection", (reason) => {
  console.error("[unhandledRejection]", reason?.message ?? reason);
});

const server = app.listen(PORT, () =>
  console.log(`Community Hero server on :${PORT} (${process.env.NODE_ENV ?? "development"})`)
);

// ── Graceful shutdown for Cloud Run ──────────────────────────────────────────
// Cloud Run sends SIGTERM when scaling down. We stop accepting new connections
// and wait for in-flight SSE streams to finish (up to 10 s).
process.on("SIGTERM", () => {
  console.log("[SIGTERM] Graceful shutdown — draining connections…");
  server.close(() => {
    console.log("[SIGTERM] All connections closed. Exiting.");
    process.exit(0);
  });
  // Force-exit if streams don't finish within the timeout.
  setTimeout(() => {
    console.error("[SIGTERM] Drain timeout — forcing exit.");
    process.exit(1);
  }, 10_000).unref(); // .unref() so the timer doesn't block normal shutdown
});
