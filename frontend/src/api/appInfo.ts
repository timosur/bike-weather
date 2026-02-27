import { apiFetch } from "./client";

export interface AppInfoSection {
  section_key: string;
  title: string;
  body: string;
  image_url: string | null;
}

export async function fetchAppInfoSections(): Promise<AppInfoSection[]> {
  return apiFetch<AppInfoSection[]>("/app-info");
}

export async function fetchAppInfoSection(key: string): Promise<AppInfoSection> {
  return apiFetch<AppInfoSection>(`/app-info/${key}`);
}
