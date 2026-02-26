import { type Page, expect } from '@playwright/test'
import { mockGeocodingAPIs, mockRideReportAPI } from './api-mocks'

/**
 * Fill in the ride planner form with basic data (location + distance).
 * Assumes geocoding and ride report APIs are already mocked.
 */
export async function fillBasicRide(
  page: Page,
  options?: { distance?: number; skipLocationSearch?: boolean },
) {
  const distance = options?.distance ?? 35

  if (!options?.skipLocationSearch) {
    // Click "Search location" idle button
    const searchBtn = page.getByRole('button', { name: /search location/i })
    if (await searchBtn.isVisible().catch(() => false)) {
      await searchBtn.click()
    }

    // Type into the location input (placeholder: "Enter city or address…")
    const locationInput = page.getByPlaceholder(/city or address|ort oder adresse/i)
    await locationInput.fill('Berlin')
    await page.waitForTimeout(400)

    // Click first suggestion — suggestion buttons contain shortText as primary text
    const suggestion = page.locator('button').filter({ hasText: /Berlin/ }).first()
    await expect(suggestion).toBeVisible({ timeout: 5000 })
    await suggestion.click()
  }

  // Fill distance
  const distanceInput = page.getByPlaceholder(/e\.g\. 35|z\.b\. 35/i)
  await distanceInput.clear()
  await distanceInput.fill(String(distance))
}

/**
 * Click the "Get weather" submit button and wait for navigation to /report.
 */
export async function submitPlannerForm(page: Page) {
  await page.getByRole('button', { name: /get weather|wetter/i }).click()
  await expect(page).toHaveURL(/\/report/, { timeout: 10000 })
}
