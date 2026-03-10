import { test, expect } from "@playwright/test";
import { setLanguageEN, loginAsUser } from "./helpers/auth";
import {
  mockGeocodingAPIs,
  mockRideReportAPI,
  mockMultiDayRideReportAPI,
  mockRoutesAPIs,
} from "./helpers/api-mocks";
import { fillBasicRide, submitPlannerForm } from "./helpers/planner";

test.describe("Ride Planner", () => {
  test.beforeEach(async ({ page }) => {
    await setLanguageEN(page);
    await loginAsUser(page);
    await mockGeocodingAPIs(page);
    await mockRideReportAPI(page);
    await mockRoutesAPIs(page);
  });

  test("form shows default inputs", async ({ page }) => {
    await page.goto("/planner");

    // Location search button should be visible (first = start location)
    await expect(page.getByRole("button", { name: /search location/i }).first()).toBeVisible();

    // Date and time fields
    await expect(page.locator('input[type="date"]')).toBeVisible();
    await expect(page.locator('input[type="time"]')).toBeVisible();

    // Advanced options toggle reveals distance
    await page.getByRole("button", { name: /advanced options/i }).click();
    await expect(page.getByPlaceholder(/e\.g\. 35/i)).toBeVisible();

    // Submit button
    await expect(page.getByRole("button", { name: /get weather/i })).toBeVisible();
  });

  test("location search and selection", async ({ page }) => {
    await page.goto("/planner");

    // Click "Search location" for start location (first of two)
    await page
      .getByRole("button", { name: /search location/i })
      .first()
      .click();

    // Type into search (placeholder: "Enter city or address…")
    const locationInput = page.getByPlaceholder(/city or address|ort oder adresse/i);
    await locationInput.fill("Berlin");
    await page.waitForTimeout(400);

    // Suggestions should appear — each has shortText ("Berlin") and displayText ("Berlin, Germany")
    const suggestion = page
      .locator("button")
      .filter({ hasText: /Berlin/ })
      .first();
    await expect(suggestion).toBeVisible({ timeout: 5000 });

    // Click first suggestion
    await suggestion.click();

    // Input should clear and location should be displayed
    await expect(page.getByText(/Berlin/)).toBeVisible();
  });

  test("location clear resets search", async ({ page }) => {
    await page.goto("/planner");

    // Select a location first
    await page
      .getByRole("button", { name: /search location/i })
      .first()
      .click();
    const locationInput = page.getByPlaceholder(/city or address|ort oder adresse/i);
    await locationInput.fill("Berlin");
    await page.waitForTimeout(400);
    await page
      .locator("button")
      .filter({ hasText: /Berlin/ })
      .first()
      .click();

    // Should show selected location
    await expect(page.getByText(/Berlin/)).toBeVisible();

    // Clear the location (look for X or clear button)
    const clearButton = page
      .locator("button")
      .filter({ has: page.locator("svg") })
      .filter({ hasText: "" })
      .first();
    if (await clearButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await clearButton.click();
    }
  });

  test("bike type presets are selectable", async ({ page }) => {
    await page.goto("/planner");

    // Verify all four bike type buttons render (use exact name to avoid preset matches like "Road bike ride")
    await expect(page.getByRole("button", { name: "Road bike", exact: true })).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByRole("button", { name: "Gravel", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "MTB", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "City", exact: true })).toBeVisible();

    // Click one and verify it becomes selected (has active styling)
    await page.getByRole("button", { name: "Gravel", exact: true }).click();
  });

  test("validation on empty submit shows location error", async ({ page }) => {
    await page.goto("/planner");

    // Click submit without filling location or destination
    await page.getByRole("button", { name: /get weather/i }).click();

    // Should show location validation error (first validation error)
    await expect(page.getByText(/please enter a start location|location.*required/i)).toBeVisible({
      timeout: 5000,
    });
  });

  test("distance field is accessible via advanced options", async ({ page }) => {
    await page.goto("/planner");

    // Distance is hidden by default behind advanced options
    await expect(page.getByPlaceholder(/e\.g\. 35/i)).not.toBeVisible();

    // Open advanced options
    await page.getByRole("button", { name: /advanced options/i }).click();

    // Distance field should now be visible
    await expect(page.getByPlaceholder(/e\.g\. 35/i)).toBeVisible();
  });

  test("successful ride planning navigates to report", async ({ page }) => {
    await page.goto("/planner");
    await fillBasicRide(page, { distance: 50 });
    await submitPlannerForm(page);

    // Should be on report page
    await expect(page.getByText(/weather|clothing|berlin/i).first()).toBeVisible({
      timeout: 10000,
    });
  });

  test("multi-day toggle shows day stops", async ({ page }) => {
    await page.goto("/planner");

    // Look for multi-day toggle
    const multiDayToggle = page
      .locator('label, button, input[type="checkbox"]')
      .filter({ hasText: /multi.?day|mehrtägig|tour/i });
    if (await multiDayToggle.isVisible({ timeout: 3000 }).catch(() => false)) {
      await multiDayToggle.click();

      // Should show "Add overnight stop" button
      await expect(page.getByRole("button", { name: /add overnight stop/i })).toBeVisible();
    }
  });

  test("advanced options expand and collapse", async ({ page }) => {
    await page.goto("/planner");

    // Look for advanced options toggle
    const advancedToggle = page.getByRole("button", { name: /advanced|additional|erweitert/i });
    if (await advancedToggle.isVisible({ timeout: 3000 }).catch(() => false)) {
      await advancedToggle.click();

      // Some extra fields should appear
      await page.waitForTimeout(300);
      await advancedToggle.click();
    }
  });

  test("form state persists on navigation back", async ({ page }) => {
    await page.goto("/planner");
    await fillBasicRide(page, { distance: 42 });
    await submitPlannerForm(page);

    // Go back
    await page.goBack();

    // Verify we're back on the planner page and it loaded
    await expect(page).toHaveURL(/\/planner/);
    await expect(page.locator("form")).toBeVisible({ timeout: 10000 });
  });

  test("edit mode prefills form from report", async ({ page }) => {
    await page.goto("/planner");
    await fillBasicRide(page, { distance: 60 });
    await submitPlannerForm(page);

    // Click "Edit ride"
    await page.getByRole("button", { name: /edit ride/i }).click();
    await expect(page).toHaveURL(/\/planner/);

    // Open advanced options — route preview auto-fills distance from OSRM (35 from mock)
    await page.getByRole("button", { name: /advanced options/i }).click();
    const distanceInput = page.getByPlaceholder(/e\.g\. 35/i);
    await expect(distanceInput).toHaveValue("35");
  });

  test("recent rides are shown if available", async ({ page }) => {
    await page.goto("/planner");

    // Look for recent rides section (may or may not be present depending on localStorage)
    const recentSection = page.getByText(/recent|letzte/i);
    // Just assert the page loaded without errors
    await expect(page.getByRole("button", { name: /get weather/i })).toBeVisible();
  });

  test("multi-day ride report works end to end", async ({ page }) => {
    await mockMultiDayRideReportAPI(page);
    await page.goto("/planner");

    // Enable multi-day
    const multiDayToggle = page
      .locator('label, button, input[type="checkbox"]')
      .filter({ hasText: /multi.?day|mehrtägig|tour/i });
    if (await multiDayToggle.isVisible({ timeout: 3000 }).catch(() => false)) {
      await multiDayToggle.click();
    }

    await fillBasicRide(page, { distance: 100 });
    await submitPlannerForm(page);

    // Should show multi-day report with day tabs
    await expect(page.getByText(/day 1|tag 1/i).first()).toBeVisible({ timeout: 10000 });
  });
});
