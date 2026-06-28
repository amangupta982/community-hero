import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.js"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "html"],
      include: ["services/**", "utils/**", "middleware/**"],
      exclude: ["tests/**"],
    },
    // Run tests sequentially to avoid port conflicts in smoke tests
    pool: "forks",
  },
});
