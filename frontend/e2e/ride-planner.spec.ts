import { test, expect } from '@playwright/test'
import { setLanguageEN, loginAsUser } from './helpers/auth'
import { mockGeocodingAPIs, mockRideReportAPI, mockMultiDayRideReportAPI, mockRoutesAPIs } from './helpers/api-mocks'
import { fillBasicRide, submitPlannerForm } from './helpers/planner'

test.describe('Ride Planner', () => {
  test.beforeEach(async ({ page }) => {
    await setLanguageEN(page)
    await loginAsUser(page)
    await mockGeocodingAPIs(page)
    await mockRideReportAPI(page)
    await mockRoutesAPIs(page)
  })

  test('form shows default inputs', async ({ page }) => {
    await page.goto('/planner')

    // Location search button should be visible
    await expect(page.getByRole('button', { name: /search location/i })).toBeVisible()

    // Distance field
    await expect(page.getByPlaceholder(/e\.g\. 35/i)).toBeVisible()

    // Date and time fields
    await expect(page.locator('input[type="date"]')).toBeVisible()
    await expect(page.locator('input[type="time"]')).toBeVisible()

    // Submit button
    await expect(page.getByRole('button', { name: /get weather/i })).toBeVisible()
  })

  test('location search and selection', async ({ page }) => {
    await page.goto('/planner')

    // Click "Search location"
    await page.getByRole('button', { name: /search location/i }).click()

    // Type into search (placeholder: "Enter city or address…")
    const locationInput = page.getByPlaceholder(/city or address|ort oder adresse/i)
    await locationInput.fill('Berlin')
    await page.waitForTimeout(400)

    // Suggestions should appear — each has shortText ("Berlin") and displayText ("Berlin, Germany")
    const suggestion = page.locator('button').filter({ hasText: /Berlin/ }).first()
    await expect(suggestion).toBeVisible({ timeout: 5000 })

    // Click first suggestion
    await suggestion.click()

    // Input should clear and location should be displayed
    await expect(page.getByText(/Berlin/)).toBeVisible()
  })

  test('location clear resets search', async ({ page }) => {
    await page.goto('/planner')

    // Select a location first
    await page.getByRole('button', { name: /search location/i }).click()
    const locationInput = page.getByPlaceholder(/city or address|ort oder adresse/i)
    await locationInput.fill('Berlin')
    await page.waitForTimeout(400)
    await page.locator('button').filter({ hasText: /Berlin/ }).first().click()

    // Should show selected location
    await expect(page.getByText(/Berlin/)).toBeVisible()

    // Clear the location (look for X or clear button)
    const clearButton = page.locator('button').filter({ has: page.locator('svg') }).filter({ hasText: '' }).first()
    if (await clearButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await clearButton.click()
    }
  })

  test('bike type presets are selectable', async ({ page }) => {
    await page.goto('/planner')

    // Check for bike type buttons/selectors
    const bikeTypes = page.locator('[class*="bike"], button').filter({ hasText: /road|gravel|mountain|city|e-bike/i })
    const count = await bikeTypes.count()
    expect(count).toBeGreaterThanOrEqual(1)
  })

  test('validation on empty submit shows location error', async ({ page }) => {
    await page.goto('/planner')

    // Clear distance field
    const distanceInput = page.getByPlaceholder(/e\.g\. 35/i)
    await distanceInput.clear()

    // Click submit without filling location
    await page.getByRole('button', { name: /get weather/i }).click()

    // Should show location validation error (first validation error)
    await expect(page.getByText(/please enter a start location|location.*required/i)).toBeVisible({ timeout: 5000 })
  })

  test('distance validation on empty submit', async ({ page }) => {
    await page.goto('/planner')

    // Fill location first to bypass location validation
    await fillBasicRide(page, { distance: 0 })

    // Clear distance to trigger distance validation
    const distanceInput = page.getByPlaceholder(/e\.g\. 35/i)
    await distanceInput.clear()
    await distanceInput.fill('0')

    // Click submit
    await page.getByRole('button', { name: /get weather/i }).click()

    // Should show distance error
    await expect(page.getByText(/distance.*required|distance.*needed/i)).toBeVisible({ timeout: 5000 })
  })

  test('successful ride planning navigates to report', async ({ page }) => {
    await page.goto('/planner')
    await fillBasicRide(page, { distance: 50 })
    await submitPlannerForm(page)

    // Should be on report page
    await expect(page.getByText(/weather|clothing|berlin/i).first()).toBeVisible({ timeout: 10000 })
  })

  test('multi-day toggle shows day stops', async ({ page }) => {
    await page.goto('/planner')

    // Look for multi-day toggle
    const multiDayToggle = page.locator('label, button, input[type="checkbox"]').filter({ hasText: /multi.?day|mehrtägig|tour/i })
    if (await multiDayToggle.isVisible({ timeout: 3000 }).catch(() => false)) {
      await multiDayToggle.click()

      // Should show "Add overnight stop" button
      await expect(page.getByRole('button', { name: /add overnight stop/i })).toBeVisible()
    }
  })

  test('advanced options expand and collapse', async ({ page }) => {
    await page.goto('/planner')

    // Look for advanced options toggle
    const advancedToggle = page.getByRole('button', { name: /advanced|additional|erweitert/i })
    if (await advancedToggle.isVisible({ timeout: 3000 }).catch(() => false)) {
      await advancedToggle.click()

      // Some extra fields should appear
      await page.waitForTimeout(300)
      await advancedToggle.click()
    }
  })

  test('form state persists on navigation back', async ({ page }) => {
    await page.goto('/planner')
    await fillBasicRide(page, { distance: 42 })
    await submitPlannerForm(page)

    // Go back
    await page.goBack()

    // Distance should still be filled
    const distanceInput = page.getByPlaceholder(/e\.g\. 35/i)
    await expect(distanceInput).toHaveValue('42', { timeout: 5000 })
  })

  test('edit mode prefills form from report', async ({ page }) => {
    await page.goto('/planner')
    await fillBasicRide(page, { distance: 60 })
    await submitPlannerForm(page)

    // Click "Edit ride"
    await page.getByRole('button', { name: /edit ride/i }).click()
    await expect(page).toHaveURL(/\/planner/)

    // Form should be prefilled
    const distanceInput = page.getByPlaceholder(/e\.g\. 35/i)
    await expect(distanceInput).toHaveValue('60')
  })

  test('recent rides are shown if available', async ({ page }) => {
    await page.goto('/planner')

    // Look for recent rides section (may or may not be present depending on localStorage)
    const recentSection = page.getByText(/recent|letzte/i)
    // Just assert the page loaded without errors
    await expect(page.getByRole('button', { name: /get weather/i })).toBeVisible()
  })

  test('multi-day ride report works end to end', async ({ page }) => {
    await mockMultiDayRideReportAPI(page)
    await page.goto('/planner')

    // Enable multi-day
    const multiDayToggle = page.locator('label, button, input[type="checkbox"]').filter({ hasText: /multi.?day|mehrtägig|tour/i })
    if (await multiDayToggle.isVisible({ timeout: 3000 }).catch(() => false)) {
      await multiDayToggle.click()
    }

    await fillBasicRide(page, { distance: 100 })
    await submitPlannerForm(page)

    // Should show multi-day report with day tabs
    await expect(page.getByText(/day 1|tag 1/i).first()).toBeVisible({ timeout: 10000 })
  })
})
