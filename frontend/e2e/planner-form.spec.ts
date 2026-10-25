import { test, expect, type Page } from "@playwright/test";
import { setLanguageEN, loginAsUser } from "./helpers/auth";
import { mockGeocodingAPIs, mockRoutesAPIs } from "./helpers/api-mocks";
import { fillBasicRide } from "./helpers/planner";
import { mockSavedRoutesAPI } from "./fixtures/api-responses";

async function addWaypoint(page: Page) {
  await page.getByRole("button", { name: /add waypoint/i }).click();
}

// Berlin (52.52, 13.405) → Kreuzberg (52.499, 13.403) and back, straight line
const LEG: [number, number][] = Array.from({ length: 11 }, (_, i) => [52.52 - i * 0.0021, 13.405 - i * 0.0002]);
const OUT_AND_BACK = [...LEG, ...LEG.slice(0, -1).reverse()];

/** Berlin 09:00 → Kreuzberg (pause) → Berlin, 120 min riding (60 min each way). */
async function planReturnTrip(page: Page) {
  await page.route("**/api/rides/preview", (r) =>
    r.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ geometry: OUT_AND_BACK, distanceKm: 4.7, durationMinutes: 20 }),
    }),
  );
  await page.goto("/planner");
  await fillBasicRide(page, { distance: 5 });
  await page.locator('input[type="time"]').first().fill("09:00");
  await page.locator('input[type="number"]').last().fill("120");

  await addWaypoint(page);
  await page.getByRole("button", { name: /search location/i }).first().click();
  await page.getByPlaceholder(/city or address/i).fill("Kreuzberg");
  await page.locator("button").filter({ hasText: /^Berlin Kreuzberg/ }).first().click();
  await page.getByRole("button", { name: /pause/i }).click();
}

async function topOf(page: Page, selector: ReturnType<Page["locator"]>) {
  const box = await selector.boundingBox();
  expect(box).not.toBeNull();
  return box!.y;
}

test.describe("Planner route form", () => {
  test.beforeEach(async ({ page }) => {
    await setLanguageEN(page);
    await loginAsUser(page);
    await mockGeocodingAPIs(page);
    await mockRoutesAPIs(page);
  });

  test("departure date and time come right after the start location", async ({ page }) => {
    await page.goto("/planner");
    await fillBasicRide(page);

    const dateTop = await topOf(page, page.locator('input[type="date"]'));
    const waypointsTop = await topOf(page, page.getByRole("button", { name: /add waypoint/i }));
    const destinationTop = await topOf(page, page.getByText(/^destination$/i).first());
    expect(dateTop).toBeLessThan(waypointsTop);
    expect(dateTop).toBeLessThan(destinationTop);
  });

  for (const width of [1280, 390]) {
    test(`pause departure time fits at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1600 });
      await page.goto("/planner");
      await fillBasicRide(page);
      await addWaypoint(page);
      await page.getByRole("button", { name: /pause/i }).click();

      const departure = page.getByLabel(/departure at/i);
      await expect(departure).toHaveValue("17:00");
      // "05:00 PM" + clock icon + picker indicator need ≥ 136px (120px still truncated)
      const box = await departure.boundingBox();
      expect(box!.width).toBeGreaterThanOrEqual(136);
    });
  }

  test("pause departure sits inline with the type toggle", async ({ page }) => {
    await page.goto("/planner");
    await fillBasicRide(page);
    await addWaypoint(page);
    const pauseBtn = page.getByRole("button", { name: /pause/i });
    await pauseBtn.click();

    const toggle = (await pauseBtn.boundingBox())!;
    const time = (await page.getByLabel(/departure at/i).boundingBox())!;
    expect(Math.abs(toggle.y + toggle.height / 2 - (time.y + time.height / 2))).toBeLessThan(8);
  });

  test("name input is hidden until 'Add name'", async ({ page }) => {
    await page.goto("/planner");
    await fillBasicRide(page);
    await addWaypoint(page);

    const nameInput = page.getByRole("textbox", { name: /waypoint name/i });
    await expect(nameInput).toHaveCount(0);
    await page.getByRole("button", { name: /add name/i }).click();
    await expect(nameInput).toBeVisible();
    await expect(nameInput).toBeFocused();
  });

  test("loaded waypoint with a name shows the name input", async ({ page }) => {
    const [route] = mockSavedRoutesAPI();
    const named = {
      ...route,
      ride_input: {
        ...route.ride_input,
        waypoints: [
          {
            location: { address: "Tempelhof", lat: 52.47, lon: 13.4 },
            type: "pause",
            name: "Café Mayer",
            startTime: "17:00",
          },
        ],
      },
    };
    // Registered after beforeEach's mockRoutesAPIs, so it takes precedence
    await page.route(`**/api/routes/${route.id}`, (r) =>
      r.request().method() === "GET"
        ? r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(named) })
        : r.fallback(),
    );
    await page.goto(`/planner/${route.id}`);

    await expect(page.getByRole("textbox", { name: /waypoint name/i })).toHaveValue("Café Mayer");
  });

  test("× removes the waypoint", async ({ page }) => {
    await page.goto("/planner");
    await fillBasicRide(page);
    await addWaypoint(page);
    await addWaypoint(page);

    const removeButtons = page.getByRole("button", { name: /remove waypoint/i });
    await expect(removeButtons).toHaveCount(2);
    await removeButtons.first().click();
    await expect(removeButtons).toHaveCount(1);
    // Icon-only button: no visible text
    await expect(removeButtons.first()).toHaveText("");
  });

  test("timeline shows a same-day return", async ({ page }) => {
    await planReturnTrip(page);

    const items = page.getByRole("list", { name: /ride timeline/i }).getByRole("listitem");
    // Chromium runs en-US → 12-hour display (Intl may use a narrow no-break space)
    await expect(items).toHaveCount(3);
    await expect(items.nth(0)).toContainText(/9:00\sAM/);
    await expect(items.nth(0)).toContainText("Berlin");
    await expect(items.nth(1)).toContainText(/~10:00\sAM/);
    await expect(items.nth(1)).toContainText("Berlin Kreuzberg");
    await expect(items.nth(1)).toContainText(/until 5:00\sPM/);
    await expect(items.nth(2)).toContainText(/~6:00\sPM/);
  });

  test("timeline uses 24-hour times in a German browser", async ({ browser }) => {
    const context = await browser.newContext({ locale: "de-DE" });
    const page = await context.newPage();
    await setLanguageEN(page);
    await loginAsUser(page);
    await mockGeocodingAPIs(page);
    await mockRoutesAPIs(page);
    await planReturnTrip(page);

    const items = page.getByRole("list", { name: /ride timeline/i }).getByRole("listitem");
    await expect(items.nth(0)).toContainText("09:00");
    await expect(items.nth(1)).toContainText("until 17:00");
    await context.close();
  });

  test("timeline shows an overnight departure", async ({ page }) => {
    await planReturnTrip(page);
    await page.getByRole("button", { name: /overnight/i }).click();

    const items = page.getByRole("list", { name: /ride timeline/i }).getByRole("listitem");
    await expect(items.nth(1)).toContainText(/next day 8:00\sAM/);
  });

  test("timeline warns when a pause departs before arrival", async ({ page }) => {
    await planReturnTrip(page);
    await page.getByLabel(/departure at/i).fill("09:30");

    const pauseItem = page.getByRole("list", { name: /ride timeline/i }).getByRole("listitem").nth(1);
    await expect(pauseItem).toContainText(/before the estimated arrival/i);
  });

  test("no timeline without a destination", async ({ page }) => {
    await planReturnTrip(page);
    await expect(page.getByRole("list", { name: /ride timeline/i })).toBeVisible();

    // Start, waypoint, destination: the destination's clear button is last
    await page.getByRole("button", { name: /clear location/i }).last().click();
    await expect(page.getByRole("list", { name: /ride timeline/i })).toHaveCount(0);
  });

  /** Berlin 09:00 → Kreuzberg, 60 min riding; preview optional. */
  async function planOneWay(page: Page, { preview = true } = {}) {
    // One way until a waypoint exists, then there and back (after "Back to start")
    await page.route("**/api/rides/preview", (r) => {
      if (!preview) return r.fulfill({ status: 503, contentType: "application/json", body: "{}" });
      const roundTrip = (r.request().postDataJSON().waypoints ?? []).length > 0;
      return r.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(
          roundTrip
            ? { geometry: OUT_AND_BACK, distanceKm: 4.7, durationMinutes: 20 }
            : { geometry: LEG, distanceKm: 2.4, durationMinutes: 10 },
        ),
      });
    });
    await page.goto("/planner");
    await fillBasicRide(page, { distance: 3 });
    await page.locator('input[type="time"]').first().fill("09:00");
    await page.locator('input[type="number"]').last().fill("60");

    // Replace destination Berlin with Kreuzberg
    await page.getByRole("button", { name: /clear location/i }).last().click();
    await page.getByRole("button", { name: /search location/i }).last().click();
    await page.getByPlaceholder(/destination/i).fill("Kreuzberg");
    await page.locator("button").filter({ hasText: /^Berlin Kreuzberg/ }).first().click();
  }

  test("back to start turns the destination into a pause", async ({ page }) => {
    await planOneWay(page);
    await expect(page.getByRole("list", { name: /ride timeline/i })).toBeVisible();
    await page.getByRole("button", { name: /back to start/i }).click();

    // Arrival ~10:00 + 1 h → 11:00, focused for editing
    const departure = page.getByLabel(/departure at/i);
    await expect(departure).toHaveValue("11:00");
    await expect(departure).toBeFocused();
    await expect(page.getByRole("button", { name: /pause/i })).toHaveAttribute("aria-pressed", "true");

    // Manual 60 min (one way) doubles to 120 for the round trip: arrive ~10:00, back ~12:00
    await expect(page.locator('input[type="number"]').last()).toHaveValue("120");
    const items = page.getByRole("list", { name: /ride timeline/i }).getByRole("listitem");
    await expect(items.nth(1)).toContainText("Berlin Kreuzberg");
    await expect(items.nth(1)).toContainText(/~10:00\sAM/);
    await expect(items.last()).toContainText("Berlin");
    await expect(page.getByRole("button", { name: /back to start/i })).toHaveCount(0);
  });

  test("back to start is not offered for a round trip", async ({ page }) => {
    await page.goto("/planner");
    await fillBasicRide(page); // start and destination are both Berlin
    await expect(page.getByRole("button", { name: /back to start/i })).toHaveCount(0);
  });

  test("back to start prefills 17:00 without a route preview", async ({ page }) => {
    await planOneWay(page, { preview: false });
    await page.getByRole("button", { name: /back to start/i }).click();
    await expect(page.getByLabel(/departure at/i)).toHaveValue("17:00");
  });
});
