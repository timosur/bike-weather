import { apiFetch } from "./client";
import type { ContactFormData } from "../components/contact/types";

export async function submitContactForm(data: ContactFormData): Promise<void> {
  await apiFetch<{ detail: string }>("/contact", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
