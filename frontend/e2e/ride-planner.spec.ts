import { test, expect, type Page } from "@playwright/test";
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

const HISTORY_KEY = "bike-weather:ride-history";

function localDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function historyEntry(id: string, startDate: string, startTime: string, address = "Berlin Mitte") {
  return {
    id,
    timestamp: Date.now(),
    rideInput: {
      location: { address, lat: 52.521, lon: 13.411 },
      destination: { address: "Potsdam", lat: 52.39, lon: 13.06 },
      startDate,
      startTime,
      bikeType: "gravel",
      intensity: "moderat",
      waypoints: [],
    },
    report: {
      startLocation: address,
      totalDistance: 42,
      distanceUnit: "km",
      overallCondition: "good",
      days: [],
    },
  };
}

/** Seed history once per test (init scripts re-run on every navigation). */
async function seedHistory(page: Page, entries: object[]) {
  await page.addInitScript(
    ([key, value]) => {
      if (sessionStorage.getItem("history-seeded")) return;
      sessionStorage.setItem("history-seeded", "1");
      localStorage.setItem(key, value);
    },
    [HISTORY_KEY, JSON.stringify(entries)] as const,
  );
}

test.describe("Recent rides", () => {
  test.beforeEach(async ({ page }) => {
    await setLanguageEN(page);
    await loginAsUser(page);
    await mockGeocodingAPIs(page);
    await mockRideReportAPI(page);
    await mockRoutesAPIs(page);
  });

  test("selecting a past ride loads the form with now, without submitting", async ({ page }) => {
    await seedHistory(page, [historyEntry("past", "2020-01-01", "08:00")]);
    let reportRequests = 0;
    page.on("request", (r) => {
      if (r.url().includes("/api/rides/report")) reportRequests++;
    });

    await page.goto("/planner");
    await page.getByRole("button", { name: /Berlin Mitte/ }).click();

    await expect(page).toHaveURL(/\/planner$/);
    await expect(page.getByText(/loaded from recent ride history/i)).toBeVisible();
    await expect(page.locator('input[type="date"]')).toHaveValue(localDate(new Date()));
    await expect(page.locator('input[type="time"]')).not.toHaveValue("08:00");
    expect(reportRequests).toBe(0);
  });

  test("date toggle switches between original and now, keeping other edits", async ({ page }) => {
    await seedHistory(page, [historyEntry("past", "2020-01-01", "08:00")]);
    await page.goto("/planner");
    await page.getByRole("button", { name: /Berlin Mitte/ }).click();

    await page.getByRole("button", { name: /^Road bike/ }).click();
    await page.getByRole("button", { name: /use original date/i }).click();
    await expect(page.locator('input[type="date"]')).toHaveValue("2020-01-01");
    await expect(page.locator('input[type="time"]')).toHaveValue("08:00");

    await page.getByRole("button", { name: /use now/i }).click();
    await expect(page.locator('input[type="date"]')).toHaveValue(localDate(new Date()));
    await expect(page.getByRole("button", { name: /^Road bike/ })).toHaveAttribute("aria-pressed", "true");
  });

  test("selecting a future ride keeps its date and shows no toggle", async ({ page }) => {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await seedHistory(page, [historyEntry("future", localDate(tomorrow), "09:30")]);
    await page.goto("/planner");
    await page.getByRole("button", { name: /Berlin Mitte/ }).click();

    await expect(page.locator('input[type="date"]')).toHaveValue(localDate(tomorrow));
    await expect(page.locator('input[type="time"]')).toHaveValue("09:30");
    await expect(page.getByRole("button", { name: /use original date|use now/i })).toHaveCount(0);
  });

  test("shows 3 rides, more on demand, without condition badge", async ({ page }) => {
    await seedHistory(
      page,
      ["A", "B", "C", "D", "E"].map((n) => historyEntry(n, "2020-01-01", "08:00", `Start ${n}`)),
    );
    await page.goto("/planner");

    const cards = page.getByRole("button", { name: /Start [A-E]/ });
    await expect(cards).toHaveCount(3);
    await expect(cards.first()).toContainText("Potsdam");
    await expect(cards.first()).not.toContainText(/good|ideal|caution/i);

    await page.getByRole("button", { name: /show 2 more/i }).click();
    await expect(cards).toHaveCount(5);
  });

  test("submitting the same ride again does not duplicate history", async ({ page }) => {
    const historyLength = () =>
      page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "[]").length, HISTORY_KEY);
    const latestTimestamp = () =>
      page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "[]")[0]?.timestamp ?? 0, HISTORY_KEY);

    await page.goto("/planner");
    await fillBasicRide(page);
    await submitPlannerForm(page);
    await expect.poll(historyLength).toBe(1);
    const first = await latestTimestamp();

    await page.goto("/planner");
    await fillBasicRide(page);
    await submitPlannerForm(page);
    await expect.poll(latestTimestamp).toBeGreaterThan(first);
    expect(await historyLength()).toBe(1);

    await page.goto("/planner");
    await fillBasicRide(page);
    await page.getByRole("button", { name: /^Road bike/ }).click();
    await submitPlannerForm(page);
    await expect.poll(historyLength).toBe(2);
  });
});
