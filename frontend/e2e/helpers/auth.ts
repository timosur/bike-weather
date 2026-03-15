import { type Page } from '@playwright/test'
import { mockLoginResponse, mockAuthMe } from '../fixtures/api-responses'

/**
 * Inject authenticated user state into localStorage (bypasses login UI).
 * Also mocks /api/auth/me so the app's admin-refresh call works.
 */
export async function loginAsUser(page: Page) {
  const tokens = mockLoginResponse()
  const me = mockAuthMe()

  // Mock the /api/auth/me endpoint that fires on page load
  await page.route('**/api/auth/me', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(me) }),
  )

  // Inject auth state into localStorage before navigating
  await page.addInitScript(
    ({ tokens, me }) => {
      // Parse the id_token to extract profile
      const base64 = tokens.id_token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
      const claims = JSON.parse(atob(base64))

      const stored = {
        access_token: tokens.access_token,
        id_token: tokens.id_token,
        refresh_token: tokens.refresh_token ?? null,
        expires_at: Date.now() + tokens.expires_in * 1000,
        profile: {
          sub: claims.sub ?? '',
          email: claims.email ?? me.email,
          name: claims.name ?? me.name,
          isAdmin: me.is_admin,
        },
      }
      localStorage.setItem('bike-weather:auth', JSON.stringify(stored))
    },
    { tokens, me },
  )
}

/**
 * Inject admin user state into localStorage.
 */
export async function loginAsAdmin(page: Page) {
  const tokens = mockLoginResponse({ isAdmin: true })
  const me = mockAuthMe({ isAdmin: true })

  await page.route('**/api/auth/me', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(me) }),
  )

  await page.addInitScript(
    ({ tokens, me }) => {
      const base64 = tokens.id_token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
      const claims = JSON.parse(atob(base64))

      const stored = {
        access_token: tokens.access_token,
        id_token: tokens.id_token,
        refresh_token: tokens.refresh_token ?? null,
        expires_at: Date.now() + tokens.expires_in * 1000,
        profile: {
          sub: claims.sub ?? '',
          email: claims.email ?? me.email,
          name: claims.name ?? me.name,
          isAdmin: me.is_admin,
        },
      }
      localStorage.setItem('bike-weather:auth', JSON.stringify(stored))
    },
    { tokens, me },
  )
}

/**
 * Set the app language to English via localStorage.
 * Must be called before navigating to any page.
 */
export async function setLanguageEN(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('bike-weather:lang', 'en')
    localStorage.setItem('i18nextLng', 'en')
  })
}
