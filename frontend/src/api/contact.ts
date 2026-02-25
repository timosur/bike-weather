import { apiFetch } from "./client";
import type { ContactFormData } from "../components/contact/types";

export async function submitContactForm(data: ContactFormData): Promise<void> {
  const { captchaToken, ...formFields } = data;
  await apiFetch<{ detail: string }>("/contact", {
    method: "POST",
    body: JSON.stringify({
      ...formFields,
      captcha_token: captchaToken,
    }),
  });
}
