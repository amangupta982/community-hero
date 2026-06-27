export function errorHandler(err, req, res, _next) {
  console.error(`[error] ${req.method} ${req.path}`, err);
  res.status(500).json({ error: err.message || "Internal server error" });
}
