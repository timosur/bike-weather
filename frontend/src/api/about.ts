import { apiFetch } from "./client";

export interface AboutSection {
  section_key: string;
  title: string;
  body: string;
  image_url: string | null;
}

export async function fetchAboutSections(): Promise<AboutSection[]> {
  return apiFetch<AboutSection[]>("/about");
}

export async function fetchAboutSection(key: string): Promise<AboutSection> {
  return apiFetch<AboutSection>(`/about/${key}`);
}
