import "dotenv/config";
import { GoogleGenAI } from "@google/genai";
import { Firestore } from "@google-cloud/firestore";
import { Storage } from "@google-cloud/storage";

// ── Gemini ────────────────────────────────────────────────────────────────────
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.warn("[warn] GEMINI_API_KEY not set — /api/report will fail until it is.");
}
export const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// ── Firestore ─────────────────────────────────────────────────────────────────
const GOOGLE_CLOUD_PROJECT = process.env.GOOGLE_CLOUD_PROJECT;
if (!GOOGLE_CLOUD_PROJECT) {
  console.warn("[warn] GOOGLE_CLOUD_PROJECT not set — Firestore writes will fail.");
}
export const db = new Firestore({ projectId: GOOGLE_CLOUD_PROJECT });

// ── Cloud Storage ─────────────────────────────────────────────────────────────
const GCS_BUCKET_NAME = process.env.GCS_BUCKET_NAME;
if (!GCS_BUCKET_NAME) {
  console.warn("[warn] GCS_BUCKET_NAME not set — image uploads will fail.");
}
const storage = new Storage({ projectId: GOOGLE_CLOUD_PROJECT });
export const bucket = GCS_BUCKET_NAME ? storage.bucket(GCS_BUCKET_NAME) : null;

// Needed for V4 signed URL generation under Cloud Run workload identity.
// Omit when using a service account key file (GOOGLE_APPLICATION_CREDENTIALS) locally.
export const SERVICE_ACCOUNT_EMAIL = process.env.SERVICE_ACCOUNT_EMAIL || null;

// ── Server ────────────────────────────────────────────────────────────────────
export const PORT = process.env.PORT || 8080;
