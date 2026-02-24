import { apiFetch } from "../client";
import type { PaginatedResponse, AdminContactMessage } from "@/components/admin/types";

export function fetchAdminContacts(
  page = 1,
  pageSize = 50,
  search?: string,
  category?: string,
): Promise<PaginatedResponse<AdminContactMessage>> {
  const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
  if (search) params.set("search", search);
  if (category) params.set("category", category);
  return apiFetch(`/admin/contacts?${params}`);
}

export function fetchAdminContact(id: number): Promise<AdminContactMessage> {
  return apiFetch(`/admin/contacts/${id}`);
}
