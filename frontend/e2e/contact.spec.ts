import { test, expect } from "@playwright/test";
import { setLanguageEN } from "./helpers/auth";
import { mockContactAPI } from "./helpers/api-mocks";

test.describe("Contact Page", () => {
  test.beforeEach(async ({ page }) => {
    await setLanguageEN(page);
    await mockContactAPI(page);
  });

  test("renders contact form with all fields", async ({ page }) => {
    await page.goto("/contact");
    await expect(page.getByRole("heading", { name: "Contact & Feedback" })).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByPlaceholder("Your name")).toBeVisible();
    await expect(page.getByPlaceholder("your@email.com")).toBeVisible();
    await expect(page.getByPlaceholder("What would you like to share?")).toBeVisible();
    await expect(page.getByRole("button", { name: "Submit" })).toBeVisible();
  });

  test("shows category selection buttons", async ({ page }) => {
    await page.goto("/contact");
    await expect(page.getByRole("heading", { name: "Contact & Feedback" })).toBeVisible({
      timeout: 10000,
    });
    const form = page.locator("form");
    await expect(form.getByRole("button", { name: "Feedback" })).toBeVisible();
    await expect(form.getByRole("button", { name: "Report bug" })).toBeVisible();
    await expect(form.getByRole("button", { name: "Feature request" })).toBeVisible();
    await expect(form.getByRole("button", { name: "Other" })).toBeVisible();
  });

  test("validates required email", async ({ page }) => {
    await page.goto("/contact");
    await expect(page.getByRole("heading", { name: "Contact & Feedback" })).toBeVisible({
      timeout: 10000,
    });
    await page.getByPlaceholder("What would you like to share?").fill("Test message");
    await page.getByRole("button", { name: "Submit" }).click();
    await expect(page.getByText("Valid email required")).toBeVisible();
  });

  test("validates required message", async ({ page }) => {
    await page.goto("/contact");
    await expect(page.getByRole("heading", { name: "Contact & Feedback" })).toBeVisible({
      timeout: 10000,
    });
    await page.getByPlaceholder("your@email.com").fill("test@example.com");
    await page.getByRole("button", { name: "Submit" }).click();
    await expect(page.getByText("Please enter a message")).toBeVisible();
  });

  test("submits form successfully", async ({ page }) => {
    await page.goto("/contact");
    await expect(page.getByRole("heading", { name: "Contact & Feedback" })).toBeVisible({
      timeout: 10000,
    });
    await page.getByPlaceholder("your@email.com").fill("test@example.com");
    await page.getByPlaceholder("What would you like to share?").fill("Great app!");
    await page.getByRole("button", { name: "Submit" }).click();
    await expect(page.getByText("Message sent")).toBeVisible({ timeout: 5000 });
  });
});
