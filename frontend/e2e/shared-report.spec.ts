import { test, expect } from '@playwright/test'
import { setLanguageEN } from './helpers/auth'
import { mockSharedReportAPI, mockSharedReportAPINotFound } from './helpers/api-mocks'

test.describe('Shared Report', () => {
  test.beforeEach(async ({ page }) => {
    await setLanguageEN(page)
  })

  test('displays shared report with badge', async ({ page }) => {
    await mockSharedReportAPI(page)
    await page.goto('/shared/abc123')

    // Should show "Shared Ride Report" badge
    await expect(page.getByText(/shared ride report/i)).toBeVisible({ timeout: 10000 })

    // Should show report content
    await expect(page.getByText(/morning ride in berlin/i)).toBeVisible()

    // Should NOT show save/edit buttons
    await expect(page.getByRole('button', { name: /^save$/i })).toBeHidden()
    await expect(page.getByRole('button', { name: /edit ride/i })).toBeHidden()
  })

  test('shared report not found shows error', async ({ page }) => {
    await mockSharedReportAPINotFound(page)
    await page.goto('/shared/invalid-token')

    // Error state
    await expect(page.getByText(/report not found|not found/i).first()).toBeVisible({ timeout: 10000 })
  })

  test('shared report not found has plan your own ride CTA', async ({ page }) => {
    await mockSharedReportAPINotFound(page)
    await page.goto('/shared/invalid-token')

    const ctaButton = page.getByRole('button', { name: /plan your own ride/i }).first()
    await expect(ctaButton).toBeVisible({ timeout: 10000 })

    await ctaButton.click()
    await expect(page).toHaveURL(/\/planner/)
  })

  test('shared report shows plan your own ride CTA at bottom', async ({ page }) => {
    await mockSharedReportAPI(page)
    await page.goto('/shared/abc123')

    // CTA at the bottom of a valid shared report
    const ctaButton = page.getByRole('button', { name: /plan your own ride/i }).first()
    await expect(ctaButton).toBeVisible()
  })
})
