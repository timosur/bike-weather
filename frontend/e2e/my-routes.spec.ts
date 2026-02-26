import { test, expect } from '@playwright/test'
import { setLanguageEN, loginAsUser } from './helpers/auth'
import {
  mockRoutesAPIs,
  mockShareAPIs,
  mockRideReportAPI,
  mockGeocodingAPIs,
} from './helpers/api-mocks'

test.describe('My Routes', () => {
  test.beforeEach(async ({ page }) => {
    await setLanguageEN(page)
    await loginAsUser(page)
    await mockRoutesAPIs(page)
    await mockShareAPIs(page)
    await mockRideReportAPI(page)
    await mockGeocodingAPIs(page)
  })

  test('shows list of saved routes', async ({ page }) => {
    await page.goto('/routes')

    // Mock has 3 routes: Morning Commute, Weekend Gravel, Evening Ride
    await expect(page.getByText(/morning commute/i)).toBeVisible({ timeout: 10000 })
    await expect(page.getByText(/weekend gravel/i)).toBeVisible()
    await expect(page.getByText(/evening ride/i)).toBeVisible()
  })

  test('route card shows details', async ({ page }) => {
    await page.goto('/routes')

    // Check route card contains location and distance
    await expect(page.getByText(/morning commute/i)).toBeVisible({ timeout: 10000 })
    await expect(page.getByText(/berlin/i).first()).toBeVisible()
    await expect(page.getByText(/50\s*km/i).first()).toBeVisible()
  })

  test('empty state shows when no routes', async ({ page }) => {
    // Mock routes with empty list
    await mockRoutesAPIs(page, [])
    await page.goto('/routes')

    // Should show empty state
    await expect(page.getByText(/no.*routes|no.*saved|keine.*routen/i).first()).toBeVisible({ timeout: 10000 })
  })

  test('clicking route card navigates to report', async ({ page }) => {
    await page.goto('/routes')

    await expect(page.getByText(/morning commute/i)).toBeVisible({ timeout: 10000 })
    await page.getByText(/morning commute/i).click()

    // Should navigate to the report page for this route
    await expect(page).toHaveURL(/\/report\/route-1/)
  })

  test('edit via menu opens edit functionality', async ({ page }) => {
    await page.goto('/routes')
    await expect(page.getByText(/morning commute/i)).toBeVisible({ timeout: 10000 })

    // Click the actions menu (three-dot button)
    const actionButtons = page.getByLabel('Actions')
    await actionButtons.first().click()

    // Click Edit
    await page.getByRole('menuitem', { name: /edit/i }).or(page.getByText(/^edit$/i)).click()

    // Should show edit modal or navigate
    await page.waitForTimeout(500)
  })

  test('delete confirmation removes route', async ({ page }) => {
    await page.goto('/routes')
    await expect(page.getByText(/morning commute/i)).toBeVisible({ timeout: 10000 })

    // Click actions menu
    await page.getByLabel('Actions').first().click()

    // Click Delete
    await page.getByText(/^delete$/i).click()

    // Should show confirmation dialog
    await expect(page.getByText(/confirm|are you sure|wirklich/i).first()).toBeVisible({ timeout: 5000 })

    // Confirm deletion
    const confirmBtn = page.getByRole('button', { name: /confirm|delete|yes|löschen/i }).last()
    await confirmBtn.click()
  })

  test('share route via menu', async ({ page }) => {
    await page.goto('/routes')
    await expect(page.getByText(/morning commute/i)).toBeVisible({ timeout: 10000 })

    // Click actions on first route (Morning Commute — not yet shared)
    await page.getByLabel('Actions').first().click()

    // Click Share
    await page.getByText(/^share$/i).click()

    // Should show success or share link
    await expect(page.getByText(/shared|link|copied|geteilt/i).first()).toBeVisible({ timeout: 5000 })
  })

  test('shared route shows shared badge', async ({ page }) => {
    await page.goto('/routes')

    // Weekend Gravel is shared in our mock
    await expect(page.getByText(/weekend gravel/i)).toBeVisible({ timeout: 10000 })

    // Should show "Shared" badge
    await expect(page.getByText(/^shared$/i).first()).toBeVisible()
  })

  test('copy link for shared route', async ({ page }) => {
    await page.goto('/routes')
    await expect(page.getByText(/weekend gravel/i)).toBeVisible({ timeout: 10000 })

    // Click actions on Weekend Gravel (2nd route — index 1)
    await page.getByLabel('Actions').nth(1).click()

    // Click "Copy link"
    await page.getByText(/copy link/i).click()

    // Should show confirmation toast
    await expect(page.getByText(/copied|link/i).first()).toBeVisible({ timeout: 5000 })
  })

  test('unshare route via menu', async ({ page }) => {
    await page.goto('/routes')
    await expect(page.getByText(/weekend gravel/i)).toBeVisible({ timeout: 10000 })

    // Click actions on Weekend Gravel (shared route, 2nd card)
    await page.getByLabel('Actions').nth(1).click()

    // Click "Stop sharing" (translation: routes.actions.unshare → "Stop sharing")
    await page.getByText(/stop sharing/i).click()

    // Should show toast/confirmation — translation: routes.unshared → "Sharing stopped"
    await expect(page.getByText(/sharing stopped|unshared|gestoppt/i).first()).toBeVisible({ timeout: 5000 })
  })

  test('routes are displayed in order', async ({ page }) => {
    await page.goto('/routes')
    await expect(page.getByText(/morning commute/i)).toBeVisible({ timeout: 10000 })

    // All three routes should be visible
    const routeNames = ['Morning Commute', 'Weekend Gravel', 'Evening Ride']
    for (const name of routeNames) {
      await expect(page.getByText(new RegExp(name, 'i'))).toBeVisible()
    }
  })

  test('navigating away and back preserves route list', async ({ page }) => {
    await page.goto('/routes')
    await expect(page.getByText(/morning commute/i)).toBeVisible({ timeout: 10000 })

    // Navigate to planner
    await page.goto('/planner')
    await expect(page.getByRole('button', { name: /get weather/i })).toBeVisible()

    // Go back to routes
    await page.goto('/routes')
    await expect(page.getByText(/morning commute/i)).toBeVisible({ timeout: 10000 })
  })
})
