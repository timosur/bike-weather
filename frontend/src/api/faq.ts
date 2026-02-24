import { apiFetch } from "./client";
import type { FaqItem } from "../components/faq/types";

export async function fetchFaqItems(): Promise<FaqItem[]> {
  return apiFetch<FaqItem[]>("/faq");
}
