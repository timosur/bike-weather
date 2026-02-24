import { apiFetch } from "../client";
import type { AdminAboutContent } from "@/components/admin/types";

export function fetchAdminAbout(): Promise<AdminAboutContent[]> {
  return apiFetch("/admin/about");
}

export function createAboutSection(data: Partial<AdminAboutContent>): Promise<AdminAboutContent> {
  return apiFetch("/admin/about", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateAboutSection(
  id: number,
  data: Partial<AdminAboutContent>,
): Promise<AdminAboutContent> {
  return apiFetch(`/admin/about/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteAboutSection(id: number): Promise<void> {
  return apiFetch(`/admin/about/${id}`, { method: "DELETE" });
}
