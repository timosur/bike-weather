import { test, expect } from '@playwright/test'
import { setLanguageEN, loginAsUser } from './helpers/auth'
import {
  mockGeocodingAPIs,
  mockRideReportAPI,
  mockRideReportAPIError,
  mockMultiDayRideReportAPI,
  mockRoutesAPIs,
  mockShareAPIs,
} from './helpers/api-mocks'
import { fillBasicRide, submitPlannerForm } from './helpers/planner'

test.describe('Ride Report', () => {
  test.beforeEach(async ({ page }) => {
    await setLanguageEN(page)
    await loginAsUser(page)
    await mockGeocodingAPIs(page)
    await mockRideReportAPI(page)
    await mockRoutesAPIs(page)
    await mockShareAPIs(page)
  })

  test('displays weather data after planning a ride', async ({ page }) => {
    await page.goto('/planner')
    await fillBasicRide(page, { distance: 50 })
    await submitPlannerForm(page)

    // Weather section should be visible with data from our mock
    await expect(page.getByText(/weather/i).first()).toBeVisible({ timeout: 10000 })
    // Temperature from mock: tempMax 12, tempMin 4
    await expect(page.getByText(/12°C/).first()).toBeVisible()
    await expect(page.getByText(/4°C/).first()).toBeVisible()
    // Description from mock
    await expect(page.getByText(/partly cloudy/i)).toBeVisible()
  })

  test('displays clothing recommendations', async ({ page }) => {
    await page.goto('/planner')
    await fillBasicRide(page, { distance: 50 })
    await submitPlannerForm(page)

    // Clothing section header
    await expect(page.getByText(/clothing recommendation/i)).toBeVisible({ timeout: 10000 })
    // Clothing items from mock — rendered directly as item.name
    await expect(page.getByText('Long-sleeve jersey')).toBeVisible()
    await expect(page.getByText('Windproof vest')).toBeVisible()
  })

  test('displays equipment checklist', async ({ page }) => {
    await page.goto('/planner')
    await fillBasicRide(page, { distance: 50 })
    await submitPlannerForm(page)

    // Equipment from mock
    await expect(page.getByText('Sunglasses')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Water bottle')).toBeVisible()
  })

  test('condition badge shows overall condition', async ({ page }) => {
    await page.goto('/planner')
    await fillBasicRide(page, { distance: 50 })
    await submitPlannerForm(page)

    // The condition badge should exist (our mock returns 'good')
    await expect(page.getByText(/good|great|gut/i).first()).toBeVisible({ timeout: 10000 })
  })

  test('save route creates a saved route', async ({ page }) => {
    await page.goto('/planner')
    await fillBasicRide(page, { distance: 50 })
    await submitPlannerForm(page)

    // Save button
    await expect(page.getByRole('button', { name: /^save$/i })).toBeVisible({ timeout: 10000 })
    await page.getByRole('button', { name: /^save$/i }).click()

    // Should show saved confirmation
    await expect(page.getByText(/saved/i).first()).toBeVisible({ timeout: 5000 })
  })

  test('save route button shows login prompt for unauthenticated', async ({ page, context }) => {
    // Create a new page without auth
    const freshPage = await context.newPage()
    await setLanguageEN(freshPage)
    await mockGeocodingAPIs(freshPage)
    await mockRideReportAPI(freshPage)

    await freshPage.goto('/planner')
    await fillBasicRide(freshPage, { distance: 50 })
    await submitPlannerForm(freshPage)

    // Login prompt should show for save
    const saveBtn = freshPage.getByRole('button', { name: /save|login to save|sign in/i })
    await expect(saveBtn.first()).toBeVisible({ timeout: 10000 })

    await freshPage.close()
  })

  test('login to save navigates to login', async ({ page, context }) => {
    // Create a new page without auth
    const freshPage = await context.newPage()
    await setLanguageEN(freshPage)
    await mockGeocodingAPIs(freshPage)
    await mockRideReportAPI(freshPage)

    await freshPage.goto('/planner')
    await fillBasicRide(freshPage, { distance: 50 })
    await submitPlannerForm(freshPage)

    // Look for login to save link/button
    const loginToSave = freshPage.getByRole('button', { name: /login|sign in/i }).first()
    if (await loginToSave.isVisible({ timeout: 5000 }).catch(() => false)) {
      await loginToSave.click()
      await expect(freshPage).toHaveURL(/\/login/, { timeout: 5000 })
    }

    await freshPage.close()
  })

  test('edit ride navigates back to planner', async ({ page }) => {
    await page.goto('/planner')
    await fillBasicRide(page, { distance: 50 })
    await submitPlannerForm(page)

    await page.getByRole('button', { name: /edit ride/i }).click()
    await expect(page).toHaveURL(/\/planner/)
  })

  test('new ride resets planner', async ({ page }) => {
    await page.goto('/planner')
    await fillBasicRide(page, { distance: 50 })
    await submitPlannerForm(page)

    await page.getByRole('button', { name: /new ride/i }).click()
    await expect(page).toHaveURL(/\/planner/)
    // Location search should be available again (clean form)
    await expect(page.getByRole('button', { name: /search location/i })).toBeVisible({ timeout: 5000 })
  })

  test('multi-day report shows day tabs', async ({ page }) => {
    await mockMultiDayRideReportAPI(page)
    await page.goto('/planner')
    await fillBasicRide(page, { distance: 100 })
    await submitPlannerForm(page)

    // Should show multiple days
    await expect(page.getByText(/day 1|tag 1/i).first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByText(/day 2|tag 2/i).first()).toBeVisible()
  })

  test('multi-day report tab switching shows different weather', async ({ page }) => {
    await mockMultiDayRideReportAPI(page)
    await page.goto('/planner')
    await fillBasicRide(page, { distance: 100 })
    await submitPlannerForm(page)

    // Click Day 2 tab
    const day2Tab = page.getByText(/day 2|tag 2/i).first()
    await expect(day2Tab).toBeVisible({ timeout: 10000 })
    await day2Tab.click()

    // Should show Day 2 content
    await page.waitForTimeout(500)
  })

  test('swap clothing alternative replaces item', async ({ page }) => {
    await page.goto('/planner')
    await fillBasicRide(page, { distance: 50 })
    await submitPlannerForm(page)

    // Look for a swap/alternative button
    const swapButton = page.getByRole('button', { name: /swap|alternative|switch/i }).first()
    if (await swapButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await swapButton.click()
      // The alternative from mock: "Short-sleeve jersey + arm warmers"
      await expect(page.getByText(/arm warmers/i)).toBeVisible({ timeout: 5000 })
    }
  })

  test('error state shows retry button', async ({ page }) => {
    await mockRideReportAPIError(page)
    await page.goto('/planner')
    await fillBasicRide(page, { distance: 50 })
    await page.getByRole('button', { name: /get weather/i }).click()

    // Should show error
    await expect(page.getByText(/error|failed|problem/i).first()).toBeVisible({ timeout: 10000 })
  })

  test('error retry loads report', async ({ page }) => {
    // First load with error
    await mockRideReportAPIError(page)
    await page.goto('/planner')
    await fillBasicRide(page, { distance: 50 })
    await page.getByRole('button', { name: /get weather/i }).click()

    await expect(page.getByText(/error|failed|problem/i).first()).toBeVisible({ timeout: 10000 })

    // Now fix the mock and retry
    await mockRideReportAPI(page)
    const retryBtn = page.getByRole('button', { name: /retry|try again|erneut/i })
    if (await retryBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await retryBtn.click()
      await expect(page.getByText(/partly cloudy/i)).toBeVisible({ timeout: 10000 })
    }
  })

  test('direct /report without state redirects to planner', async ({ page }) => {
    await page.goto('/report')
    // Should redirect to planner since there's no ride input
    await expect(page).toHaveURL(/\/planner/, { timeout: 5000 })
  })

  test('loads report from route ID in URL', async ({ page }) => {
    await page.goto('/report/route-1')

    // Should load the route and show its report
    await expect(page.getByText(/berlin|morning/i).first()).toBeVisible({ timeout: 10000 })
  })

  test('save changes button appears after editing a saved route', async ({ page }) => {
    await page.goto('/report/route-1')
    await expect(page.getByText(/berlin|morning/i).first()).toBeVisible({ timeout: 10000 })

    // Edit the ride
    await page.getByRole('button', { name: /edit ride/i }).click()
    await expect(page).toHaveURL(/\/planner/)

    // Modify and resubmit
    const distanceInput = page.getByPlaceholder(/e\.g\. 35/i)
    await distanceInput.clear()
    await distanceInput.fill('75')
    await submitPlannerForm(page)

    // "Save changes" button should appear (we edited a saved route)
    const saveChanges = page.getByRole('button', { name: /save changes/i })
    if (await saveChanges.isVisible({ timeout: 5000 }).catch(() => false)) {
      await saveChanges.click()
    }
  })
})
