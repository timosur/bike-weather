import { test, expect } from "@playwright/test";
import { setLanguageEN } from "./helpers/auth";
import { mockFaqAPIs, mockAboutAPIs, mockAppInfoAPIs } from "./helpers/api-mocks";

test.describe("Content Pages", () => {
  test.beforeEach(async ({ page }) => {
    await setLanguageEN(page);
  });

  test.describe("FAQ Page", () => {
    test.beforeEach(async ({ page }) => {
      await mockFaqAPIs(page);
    });

    test("loads FAQ page with questions", async ({ page }) => {
      await page.goto("/faq");
      await expect(page.getByRole("heading", { name: "Frequently Asked Questions" })).toBeVisible({
        timeout: 10000,
      });
      await expect(page.getByText("How does Bike Weather work?")).toBeVisible();
      await expect(page.getByText("Is Bike Weather free?")).toBeVisible();
      await expect(page.getByText("What weather data do you use?")).toBeVisible();
    });

    test("FAQ accordion expands to show answer", async ({ page }) => {
      await page.goto("/faq");
      await expect(page.getByText("How does Bike Weather work?")).toBeVisible({ timeout: 10000 });
      await page.getByText("How does Bike Weather work?").click();
      await expect(
        page.getByText(
          "Bike Weather uses weather forecasts to recommend cycling clothing and equipment.",
        ),
      ).toBeVisible();
    });
  });

  test.describe("About App Page", () => {
    test.beforeEach(async ({ page }) => {
      await mockAppInfoAPIs(page);
    });

    test("loads About App page with sections", async ({ page }) => {
      await page.goto("/about");
      const main = page.locator("main");
      await expect(main.getByText("Your cycling weather companion.")).toBeVisible({
        timeout: 10000,
      });
      await expect(main.getByText("Features")).toBeVisible();
    });
  });

  test.describe("About Me Page", () => {
    test.beforeEach(async ({ page }) => {
      await mockAboutAPIs(page);
    });

    test("loads About Me page with sections", async ({ page }) => {
      await page.goto("/about-me");
      await expect(page.getByText("About Me")).toBeVisible({ timeout: 10000 });
      await expect(page.getByText("Hello, I am Timo.")).toBeVisible();
      await expect(page.getByText("My Cycling Journey")).toBeVisible();
    });
  });
});
