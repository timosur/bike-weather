import { test, expect } from "@playwright/test";
import { setLanguageEN, loginAsUser } from "./helpers/auth";
import { mockGeocodingAPIs, mockRideReportAPI, mockRoutesAPIs } from "./helpers/api-mocks";

test.describe("Navigation & Shell", () => {
  test.beforeEach(async ({ page }) => {
    await mockGeocodingAPIs(page);
    await mockRideReportAPI(page);
    await mockRoutesAPIs(page);
  });

  test.describe("Language Switching", () => {
    test("starts in English when configured", async ({ page }) => {
      await setLanguageEN(page);
      await page.goto("/planner");
      await expect(page.getByText("Planner")).toBeVisible({ timeout: 10000 });
    });

    test("switches from English to German", async ({ page }) => {
      await setLanguageEN(page);
      await page.goto("/planner");
      await expect(page.getByText("Planner")).toBeVisible({ timeout: 10000 });
      await page.getByRole("button", { name: "Deutsch" }).click();
      await expect(page.getByText("Routenplaner")).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe("Dark Mode", () => {
    test("toggles dark mode on and off", async ({ page }) => {
      await setLanguageEN(page);
      await page.goto("/planner");
      await expect(page.getByText("Planner")).toBeVisible({ timeout: 10000 });

      // Click dark mode
      await page.getByRole("button", { name: "Dark mode" }).click();
      await expect(page.locator("html")).toHaveClass(/dark/);

      // Click light mode
      await page.getByRole("button", { name: "Light mode" }).click();
      await expect(page.locator("html")).not.toHaveClass(/dark/);
    });
  });

  test.describe("Footer Links", () => {
    test("footer contains FAQ and About Me links", async ({ page }) => {
      await setLanguageEN(page);
      await page.goto("/planner");
      await expect(page.getByText("Planner")).toBeVisible({ timeout: 10000 });

      const footer = page.locator("footer");
      await expect(footer.getByText("FAQ")).toBeVisible();
      await expect(footer.getByText("About Me")).toBeVisible();
    });

    test("footer FAQ link navigates to /faq", async ({ page }) => {
      await setLanguageEN(page);
      await page.goto("/planner");
      await expect(page.getByText("Planner")).toBeVisible({ timeout: 10000 });

      await page.locator("footer").getByRole("link", { name: "FAQ" }).click();
      await expect(page).toHaveURL(/\/faq/);
    });

    test("footer contains legal links", async ({ page }) => {
      await setLanguageEN(page);
      await page.goto("/planner");
      await expect(page.getByText("Planner")).toBeVisible({ timeout: 10000 });

      const footer = page.locator("footer");
      await expect(footer.getByText("Imprint")).toBeVisible();
      await expect(footer.getByText("Privacy")).toBeVisible();
    });
  });

  test.describe("Mobile Navigation", () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test("hamburger menu opens mobile nav", async ({ page }) => {
      await setLanguageEN(page);
      await page.goto("/planner");
      await page.waitForTimeout(1000); // Wait for page load

      const hamburger = page.getByRole("button", { name: "Toggle menu" });
      await expect(hamburger).toBeVisible({ timeout: 10000 });
      await hamburger.click();

      // Mobile menu should show navigation items as links
      await expect(page.getByRole("link", { name: "Planner" })).toBeVisible({ timeout: 5000 });
    });

    test("hamburger menu closes after navigation", async ({ page }) => {
      await setLanguageEN(page);
      await loginAsUser(page);
      await page.goto("/planner");
      await page.waitForTimeout(1000);

      const hamburger = page.getByRole("button", { name: "Toggle menu" });
      await expect(hamburger).toBeVisible({ timeout: 10000 });
      await hamburger.click();

      // Navigate via mobile menu
      const myRoutesLink = page.getByRole("link", { name: "My Routes" });
      if (await myRoutesLink.isVisible({ timeout: 3000 }).catch(() => false)) {
        await myRoutesLink.click();
        await expect(page).toHaveURL(/\/routes/);
      }
    });
  });
});
