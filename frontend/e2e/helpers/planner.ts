import { type Page, expect } from "@playwright/test";
import { mockGeocodingAPIs, mockRideReportAPI } from "./api-mocks";

/**
 * Fill in the ride planner form with basic data (start location + destination + distance).
 * Assumes geocoding and ride report APIs are already mocked.
 */
export async function fillBasicRide(
  page: Page,
  options?: { distance?: number; skipLocationSearch?: boolean },
) {
  const distance = options?.distance ?? 35;

  if (!options?.skipLocationSearch) {
    // Click "Search location" idle button for the start location (first of two)
    const searchBtn = page.getByRole("button", { name: /search location/i }).first();
    await expect(searchBtn).toBeVisible({ timeout: 10000 });
    await searchBtn.click();

    // Type into the location input (placeholder: "Enter city or address…")
    const locationInput = page.getByPlaceholder(/city or address|ort oder adresse/i);
    await expect(locationInput).toBeVisible({ timeout: 5000 });
    await locationInput.fill("Berlin");
    await page.waitForTimeout(400);

    // Click first suggestion — suggestion buttons contain shortText as primary text
    const suggestion = page
      .locator("button")
      .filter({ hasText: /Berlin/ })
      .first();
    await expect(suggestion).toBeVisible({ timeout: 5000 });
    await suggestion.click();

    // Fill destination (second "Search location" button — now the only one left)
    const destSearchBtn = page.getByRole("button", { name: /search location/i });
    await expect(destSearchBtn).toBeVisible({ timeout: 5000 });
    await destSearchBtn.click();

    const destInput = page.getByPlaceholder(/destination|ziel/i);
    await expect(destInput).toBeVisible({ timeout: 5000 });
    await destInput.fill("Potsdam");
    await page.waitForTimeout(400);

    const destSuggestion = page
      .locator("button")
      .filter({ hasText: /Berlin|Potsdam/ })
      .first();
    await expect(destSuggestion).toBeVisible({ timeout: 5000 });
    await destSuggestion.click();
  }

  // Open advanced options to reveal the distance input
  const advancedBtn = page.getByRole("button", { name: /advanced options/i });
  await expect(advancedBtn).toBeVisible({ timeout: 5000 });
  await advancedBtn.click();

  // Fill distance
  const distanceInput = page.getByPlaceholder(/e\.g\. 35|z\.b\. 35/i);
  await distanceInput.clear();
  await distanceInput.fill(String(distance));
}

/**
 * Click the "Get weather" submit button and wait for navigation to /report.
 */
export async function submitPlannerForm(page: Page) {
  await page
    .locator("form")
    .getByRole("button", { name: /get weather/i })
    .click();
  await expect(page).toHaveURL(/\/report/, { timeout: 10000 });
}
