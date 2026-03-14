import { apiFetch, getAccessTokenProvider } from "../client";
import type { BulkProductResponse } from "@/components/admin/types";
import type {
  AgentShop,
  AgentCategory,
  AgentJob,
  AgentBulkProduct,
  ApproveUrlImportResponse,
} from "@/components/admin/types";

// --- Agent service proxy endpoints ---

export function fetchAgentShops(): Promise<AgentShop[]> {
  return apiFetch("/admin/agent/shops");
}

export function fetchAgentCategories(): Promise<AgentCategory[]> {
  return apiFetch("/admin/agent/categories");
}

export function fetchJobList(): Promise<AgentJob[]> {
  return apiFetch("/admin/agent/jobs");
}

export function startImportJob(params: {
  shop: string;
  category: string;
  maxProducts: number;
}): Promise<{ jobId: string; status: string }> {
  return apiFetch("/admin/agent/jobs", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export function startUrlImportJob(params: {
  shop: string;
  category: string;
  urls: string[];
}): Promise<{ jobId: string; status: string }> {
  return apiFetch("/admin/agent/jobs/urls", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export function fetchJobStatus(jobId: string): Promise<AgentJob> {
  return apiFetch(`/admin/agent/jobs/${jobId}`);
}

export async function createJobEventSource(jobId: string): Promise<EventSource> {
  const provider = getAccessTokenProvider();
  const token = provider ? await provider() : null;
  const params = token ? `?token=${encodeURIComponent(token)}` : "";
  return new EventSource(`/api/admin/agent/jobs/${jobId}/stream${params}`);
}

export function approveImport(
  jobId: string,
  products: AgentBulkProduct[],
  categoryId: string,
  shopId: string,
  replaceCategory = true,
): Promise<BulkProductResponse> {
  return apiFetch(`/admin/agent/jobs/${jobId}/approve`, {
    method: "POST",
    body: JSON.stringify({ products, categoryId, shopId, replaceCategory }),
  });
}

// --- URL Import (BIKE-20) ---

export function startExtractUrlJob(url: string): Promise<{ jobId: string; status: string }> {
  return apiFetch("/admin/agent/jobs/extract-url", {
    method: "POST",
    body: JSON.stringify({ url }),
  });
}

export function approveUrlImport(
  jobId: string,
  data: {
    product: {
      name: string;
      description?: string;
      imageUrl?: string;
      affiliateUrl?: string;
      matchesLabel?: string;
      weatherTempMin?: number | null;
      weatherTempMax?: number | null;
      weatherPrecipitation?: string;
      weatherWind?: string;
      weatherSummary?: string;
    };
    categoryId: string;
    shopId?: string | null;
    newShop?: { name: string } | null;
  },
): Promise<ApproveUrlImportResponse> {
  return apiFetch(`/admin/agent/jobs/${jobId}/approve-url`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}
