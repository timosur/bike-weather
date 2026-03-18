import { apiFetch } from "../client";
import type { AdminRecommendationItem, AdminRecommendationItemUpdate } from "@/components/admin/types";

export function fetchAdminItems(
  type?: string,
  zone?: string,
): Promise<AdminRecommendationItem[]> {
  const params = new URLSearchParams();
  if (type) params.set("type", type);
  if (zone) params.set("zone", zone);
  const qs = params.toString();
  return apiFetch(`/admin/items${qs ? `?${qs}` : ""}`);
}

export function fetchAdminItem(id: string): Promise<AdminRecommendationItem> {
  return apiFetch(`/admin/items/${id}`);
}

export function updateAdminItem(
  id: string,
  data: AdminRecommendationItemUpdate,
): Promise<AdminRecommendationItem> {
  return apiFetch(`/admin/items/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}
