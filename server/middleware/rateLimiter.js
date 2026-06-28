import rateLimit from "express-rate-limit";

const skip = () => process.env.NODE_ENV !== "production";

// Strict: protects the AI pipeline from Gemini quota exhaustion.
export const pipelineLimiter = rateLimit({
  windowMs: 60_000,
  max: 5,
  skip,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "rate_limited",
    message: "Max 5 reports per minute. Please wait before submitting another.",
  },
});

// Broad: covers dashboard polling, health checks, and all other API calls.
export const apiLimiter = rateLimit({
  windowMs: 60_000,
  max: 120,
  skip,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "rate_limited", message: "Too many requests. Please slow down." },
});
