import axios from "axios";
import type {
  SKU, Gallery, AnalysisResult, AgentsStatus, TenantConfig,
} from "./types";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const http = axios.create({ baseURL: BASE, timeout: 120_000 });

// ── SKU ───────────────────────────────────────────────────

export const getSKUs = (): Promise<SKU[]> =>
  http.get("/skus").then((r) => r.data);

export const getSKU = (id: string): Promise<SKU> =>
  http.get(`/skus/${id}`).then((r) => r.data);

// ── Onboarding ────────────────────────────────────────────

export const onboarding = (payload: {
  platform: string;
  category: string;
  region: string;
  language: string;
}): Promise<{ status: string; config: TenantConfig }> =>
  http.post("/onboarding", payload).then((r) => r.data);

// ── Listing ───────────────────────────────────────────────

export const generateListing = (payload: {
  image_url: string;
  product_hint: string;
  platform: string;
}): Promise<Gallery> =>
  http.post("/listing/generate", payload).then((r) => r.data);

// ── Analysis ──────────────────────────────────────────────

export const analyzeSKU = (id: string): Promise<AnalysisResult> =>
  http.post(`/analyze/${id}`).then((r) => r.data);

export const sweepCatalog = (): Promise<{ results: AnalysisResult[]; total: number }> =>
  http.post("/sweep").then((r) => r.data);

export const getAgentsStatus = (): Promise<AgentsStatus> =>
  http.get("/agents/status").then((r) => r.data);

// ── Upload ────────────────────────────────────────────────

export const uploadImage = (file: File): Promise<{ url: string }> => {
  const form = new FormData();
  form.append("file", file);
  return http.post("/upload", form, {
    headers: { "Content-Type": "multipart/form-data" },
  }).then((r) => r.data);
};

// ── Health ────────────────────────────────────────────────

export const health = (): Promise<{ status: string }> =>
  http.get("/health").then((r) => r.data);
