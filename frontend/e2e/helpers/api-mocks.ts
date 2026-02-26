import { type Page } from '@playwright/test'
import {
  mockGeocodingSearch,
  mockGeocodingReverse,
  mockRideReport,
  mockMultiDayRideReport,
  mockSavedRoutesAPI,
  mockSavedRouteAPI,
  mockShareResponse,
  mockCreateRouteResponse,
  mockLoginResponse,
  mockAuthMe,
} from '../fixtures/api-responses'

/**
 * Set up route intercepts for geocoding endpoints.
 */
export async function mockGeocodingAPIs(page: Page) {
  await page.route('**/api/geocoding/search*', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockGeocodingSearch()) }),
  )
  await page.route('**/api/geocoding/reverse*', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockGeocodingReverse()) }),
  )
}

/**
 * Set up route intercept for POST /api/rides/report.
 */
export async function mockRideReportAPI(page: Page, fixture?: object) {
  await page.route('**/api/rides/report', (route) => {
    if (route.request().method() === 'POST') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(fixture ?? mockRideReport()),
      })
    }
    return route.continue()
  })
}

/**
 * Set up route intercept for POST /api/rides/report that returns multi-day.
 */
export async function mockMultiDayRideReportAPI(page: Page) {
  await page.route('**/api/rides/report', (route) => {
    if (route.request().method() === 'POST') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockMultiDayRideReport()),
      })
    }
    return route.continue()
  })
}

/**
 * Set up route intercept for POST /api/rides/report that returns an error.
 */
export async function mockRideReportAPIError(page: Page) {
  await page.route('**/api/rides/report', (route) => {
    if (route.request().method() === 'POST') {
      return route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ detail: 'Internal server error' }) })
    }
    return route.continue()
  })
}

/**
 * Set up route intercepts for all /api/routes/** endpoints.
 */
export async function mockRoutesAPIs(page: Page, routesList?: object[]) {
  const routes = routesList ?? mockSavedRoutesAPI()

  // GET /api/routes — list
  await page.route('**/api/routes', (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(routes) })
    }
    // POST /api/routes — create
    if (route.request().method() === 'POST') {
      return route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(mockCreateRouteResponse()) })
    }
    return route.continue()
  })

  // GET/PUT/DELETE /api/routes/:id
  await page.route(/\/api\/routes\/[^/]+$/, (route) => {
    const method = route.request().method()
    const url = route.request().url()
    const idMatch = url.match(/\/api\/routes\/([^/?]+)/)
    const routeId = idMatch?.[1] ?? 'route-1'

    if (method === 'GET') {
      const found = mockSavedRouteAPI(routeId)
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(found) })
    }
    if (method === 'PUT') {
      const found = mockSavedRouteAPI(routeId)
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(found) })
    }
    if (method === 'DELETE') {
      return route.fulfill({ status: 204 })
    }
    return route.continue()
  })
}

/**
 * Set up route intercepts for share/unshare endpoints.
 */
export async function mockShareAPIs(page: Page) {
  await page.route(/\/api\/routes\/[^/]+\/share$/, (route) => {
    if (route.request().method() === 'POST') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockShareResponse()) })
    }
    if (route.request().method() === 'DELETE') {
      return route.fulfill({ status: 204 })
    }
    return route.continue()
  })
}

/**
 * Set up route intercepts for shared report endpoint.
 */
export async function mockSharedReportAPI(page: Page, fixture?: object) {
  await page.route(/\/api\/shared\//, (route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(fixture ?? mockRideReport()),
    })
  })
}

export async function mockSharedReportAPINotFound(page: Page) {
  await page.route(/\/api\/shared\//, (route) => {
    return route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ detail: 'Not found' }) })
  })
}

/**
 * Set up route intercepts for auth endpoints.
 */
export async function mockAuthAPIs(page: Page, overrides?: { loginError?: boolean; isAdmin?: boolean }) {
  await page.route('**/api/auth/login', (route) => {
    if (overrides?.loginError) {
      return route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ detail: 'Invalid credentials' }) })
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockLoginResponse({ isAdmin: overrides?.isAdmin })) })
  })

  await page.route('**/api/auth/register', (route) => {
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockLoginResponse({ isAdmin: overrides?.isAdmin })) })
  })

  await page.route('**/api/auth/me', (route) => {
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockAuthMe({ isAdmin: overrides?.isAdmin })) })
  })
}

/**
 * Set up all standard API mocks at once (geocoding + routes + report + share + auth).
 */
export async function mockAllAPIs(page: Page) {
  await mockGeocodingAPIs(page)
  await mockRideReportAPI(page)
  await mockRoutesAPIs(page)
  await mockShareAPIs(page)
  await mockAuthAPIs(page)
}
