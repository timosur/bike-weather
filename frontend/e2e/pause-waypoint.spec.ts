import { test, expect, type Page } from "@playwright/test";
import { setLanguageEN, loginAsUser } from "./helpers/auth";
import { mockGeocodingAPIs, mockRoutesAPIs } from "./helpers/api-mocks";
import { fillBasicRide, submitPlannerForm } from "./helpers/planner";
import { mockMultiDayRideReport } from "./fixtures/api-responses";

type Payload = { waypoints: { type: string; startTime?: string }[]; hour12?: boolean };

/** Mock the report API with two same-day legs and capture the request body. */
async function mockLegReport(page: Page) {
  const captured: Payload[] = [];
  const report = mockMultiDayRideReport();
  report.days[0] = { ...report.days[0], date: "2026-02-27", dayLabel: "Leg 1 · 09:00" };
  report.days[1] = { ...report.days[1], date: "2026-02-27", dayLabel: "Leg 2 · 17:00" };
  await page.route("**/api/rides/report", (route) => {
    if (route.request().method() !== "POST") return route.continue();
    captured.push(route.request().postDataJSON());
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(report),
    });
  });
  return captured;
}

async function addWaypoint(page: Page) {
  await page.getByRole("button", { name: /add waypoint/i }).click();
}

test.describe("Pause waypoint", () => {
  test.beforeEach(async ({ page }) => {
    await setLanguageEN(page);
    await loginAsUser(page);
    await mockGeocodingAPIs(page);
    await mockRoutesAPIs(page);
  });

  test("pause sends type and same-day departure time", async ({ page }) => {
    const captured = await mockLegReport(page);
    await page.goto("/planner");
    await fillBasicRide(page);

    await addWaypoint(page);
    await page.getByRole("button", { name: /pause/i }).click();
    const departure = page.getByLabel(/departure at/i);
    await expect(departure).toHaveValue("17:00");

    await submitPlannerForm(page);
    await expect.poll(() => captured.length).toBeGreaterThan(0);
    expect(captured[0].waypoints).toEqual([
      expect.objectContaining({ type: "pause", startTime: "17:00" }),
    ]);
    // Chromium runs en-US → generated report text should use 12-hour times
    expect(captured[0].hour12).toBe(true);

    // Report shows both legs as tabs
    await expect(page.getByText("Leg 1 · 09:00").first()).toBeVisible();
    await expect(page.getByText("Leg 2 · 17:00").first()).toBeVisible();
  });

  test("switching pause back to stop drops the departure time", async ({ page }) => {
    const captured = await mockLegReport(page);
    await page.goto("/planner");
    await fillBasicRide(page);

    await addWaypoint(page);
    await page.getByRole("button", { name: /pause/i }).click();
    await page.getByRole("button", { name: /stop/i }).click();
    await expect(page.getByLabel(/departure at/i)).toHaveCount(0);

    await submitPlannerForm(page);
    await expect.poll(() => captured.length).toBeGreaterThan(0);
    expect(captured[0].waypoints[0].type).toBe("stop");
    expect(captured[0].waypoints[0].startTime).toBeUndefined();
  });

  test("report map labels a pause waypoint", async ({ page }) => {
    await page.route("**/api/rides/report", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ...mockMultiDayRideReport(),
          routeGeometry: [
            [52.52, 13.405],
            [52.4, 13.06],
            [52.52, 13.405],
          ],
          destinationLocation: "Berlin",
          userWaypoints: [{ lat: 52.4, lon: 13.06, type: "pause", name: null }],
        }),
      }),
    );
    await page.goto("/planner");
    await fillBasicRide(page);
    await submitPlannerForm(page);

    // Markers: start, pause waypoint, destination
    const markers = page.locator(".leaflet-marker-icon");
    await expect(markers).toHaveCount(3);
    await markers.nth(1).click();
    await expect(page.locator(".leaflet-popup").getByText("☕ Pause").first()).toBeVisible();
  });

  test("swap keeps the pause on its waypoint", async ({ page }) => {
    const captured = await mockLegReport(page);
    await page.goto("/planner");
    await fillBasicRide(page);

    // [stop, pause 17:00] → swap → [pause 17:00, stop]
    await addWaypoint(page);
    await addWaypoint(page);
    await page.getByRole("button", { name: /pause/i }).nth(1).click();
    await page.getByRole("button", { name: /swap start and destination/i }).click();

    await submitPlannerForm(page);
    await expect.poll(() => captured.length).toBeGreaterThan(0);
    expect(captured[0].waypoints.map((w) => [w.type, w.startTime])).toEqual([
      ["pause", "17:00"],
      ["stop", undefined],
    ]);
  });
});
