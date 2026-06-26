import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// During local dev, proxy /api to the Express server on :8080 so the
// frontend and backend feel like one origin (mirrors the deployed setup).
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": "http://localhost:8081",
    },
  },
});
