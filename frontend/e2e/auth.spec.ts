import { test, expect } from '@playwright/test'
import { setLanguageEN } from './helpers/auth'
import { mockAuthAPIs } from './helpers/api-mocks'

test.describe('Auth', () => {
  test.beforeEach(async ({ page }) => {
    await setLanguageEN(page)
    await mockAuthAPIs(page)
  })

  test('shows login form with Sign in / Register tabs', async ({ page }) => {
    await page.goto('/login')
    // Tab buttons — use .first() because both tab and submit share the same text
    await expect(page.getByRole('button', { name: /sign in/i }).first()).toBeVisible()
    await expect(page.getByRole('button', { name: /register/i }).first()).toBeVisible()
    await expect(page.getByPlaceholder(/username or email/i)).toBeVisible()
  })

  test('login with valid credentials redirects to planner', async ({ page }) => {
    await page.goto('/login')
    await page.getByPlaceholder(/username or email/i).fill('testuser')
    await page.getByPlaceholder('Password').fill('password123')

    // Click the submit button inside the form
    await page.locator('form').getByRole('button', { name: /sign in/i }).click()

    await expect(page).toHaveURL(/\/planner/, { timeout: 10000 })
  })

  test('login shows error on invalid credentials', async ({ page }) => {
    // Re-mock auth with login error
    await mockAuthAPIs(page, { loginError: true })
    await page.goto('/login')
    await page.getByPlaceholder(/username or email/i).fill('wrong')
    await page.getByPlaceholder('Password').fill('bad')

    await page.locator('form').getByRole('button', { name: /sign in/i }).click()

    // Error message should appear
    await expect(page.getByText(/invalid credentials/i)).toBeVisible({ timeout: 5000 })
  })

  test('register tab shows registration form', async ({ page }) => {
    await page.goto('/login')

    // Click the Register tab button (first one = tab, not submit)
    await page.getByRole('button', { name: /register/i }).first().click()

    // Registration fields should be visible
    await expect(page.getByPlaceholder(/^username$/i)).toBeVisible()
    await expect(page.getByPlaceholder('Email')).toBeVisible()
    await expect(page.getByPlaceholder(/password \(min/i)).toBeVisible()
    await expect(page.getByPlaceholder(/confirm password/i)).toBeVisible()
  })

  test('register shows validation errors on empty submit', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('button', { name: /register/i }).first().click()

    // Submit empty form via form submit button
    await page.locator('form').getByRole('button', { name: /register/i }).click()

    // Should see validation errors
    await expect(page.getByText(/username.*required|required.*username/i).first()).toBeVisible({ timeout: 5000 })
  })

  test('register with valid data redirects to planner', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('button', { name: /register/i }).first().click()

    await page.getByPlaceholder(/^username$/i).fill('newuser')
    await page.getByPlaceholder('Email').fill('new@example.com')
    await page.getByPlaceholder(/password \(min/i).fill('password123')
    await page.getByPlaceholder(/confirm password/i).fill('password123')
    await page.locator('form').getByRole('button', { name: /register/i }).click()

    await expect(page).toHaveURL(/\/planner/, { timeout: 10000 })
  })

  test('unauthenticated user redirected from /routes to /login', async ({ page }) => {
    await page.goto('/routes')
    await expect(page).toHaveURL(/\/login/)
  })

  test('logout clears session', async ({ page }) => {
    // First log in via the form
    await page.goto('/login')
    await page.getByPlaceholder(/username or email/i).fill('testuser')
    await page.getByPlaceholder('Password').fill('password123')
    await page.locator('form').getByRole('button', { name: /sign in/i }).click()
    await expect(page).toHaveURL(/\/planner/, { timeout: 10000 })

    // Click the user menu (shows user name)
    const userMenuButton = page.getByRole('button', { name: /testuser|Test User/i })
    await userMenuButton.click()

    // Click Logout
    await page.getByRole('button', { name: /logout/i }).click()

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
  })
})
