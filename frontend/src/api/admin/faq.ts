import { apiFetch } from "../client";
import type { AdminFaqItem } from "@/components/admin/types";

export function fetchAdminFaq(): Promise<AdminFaqItem[]> {
  return apiFetch("/admin/faq");
}

export function createFaqItem(data: Partial<AdminFaqItem>): Promise<AdminFaqItem> {
  return apiFetch("/admin/faq", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateFaqItem(id: string, data: Partial<AdminFaqItem>): Promise<AdminFaqItem> {
  return apiFetch(`/admin/faq/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteFaqItem(id: string): Promise<void> {
  return apiFetch(`/admin/faq/${id}`, { method: "DELETE" });
}

export function reorderFaq(items: { id: string; displayOrder: number }[]): Promise<AdminFaqItem[]> {
  return apiFetch("/admin/faq/reorder", {
    method: "PUT",
    body: JSON.stringify(items),
  });
}
