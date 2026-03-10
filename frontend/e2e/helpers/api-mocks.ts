import { type Page } from "@playwright/test";
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
  mockAdminProducts,
  mockAdminCategories,
  mockAdminShops,
  mockAdminFaqItems,
  mockAdminAboutSections,
  mockAdminContacts,
  mockFaqItems,
  mockAboutSections,
  mockAppInfoSections,
} from "../fixtures/api-responses";

/**
 * Set up route intercepts for geocoding endpoints.
 */
export async function mockGeocodingAPIs(page: Page) {
  await page.route("**/api/geocoding/search*", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(mockGeocodingSearch()),
    }),
  );
  await page.route("**/api/geocoding/reverse*", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(mockGeocodingReverse()),
    }),
  );
  await page.route("**/api/rides/preview", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        geometry: [
          [52.52, 13.405],
          [52.51, 13.39],
        ],
        distanceKm: 35,
        durationMinutes: 70,
      }),
    }),
  );
}

/**
 * Set up route intercept for POST /api/rides/report.
 */
export async function mockRideReportAPI(page: Page, fixture?: object) {
  await page.route("**/api/rides/report", (route) => {
    if (route.request().method() === "POST") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(fixture ?? mockRideReport()),
      });
    }
    return route.continue();
  });
}

/**
 * Set up route intercept for POST /api/rides/report that returns multi-day.
 */
export async function mockMultiDayRideReportAPI(page: Page) {
  await page.route("**/api/rides/report", (route) => {
    if (route.request().method() === "POST") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockMultiDayRideReport()),
      });
    }
    return route.continue();
  });
}

/**
 * Set up route intercept for POST /api/rides/report that returns an error.
 */
export async function mockRideReportAPIError(page: Page) {
  await page.route("**/api/rides/report", (route) => {
    if (route.request().method() === "POST") {
      return route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ detail: "Internal server error" }),
      });
    }
    return route.continue();
  });
}

/**
 * Set up route intercepts for all /api/routes/** endpoints.
 */
export async function mockRoutesAPIs(page: Page, routesList?: object[]) {
  const routes = routesList ?? mockSavedRoutesAPI();

  // GET /api/routes — list
  await page.route("**/api/routes", (route) => {
    if (route.request().method() === "GET") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(routes),
      });
    }
    // POST /api/routes — create
    if (route.request().method() === "POST") {
      return route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify(mockCreateRouteResponse()),
      });
    }
    return route.continue();
  });

  // GET/PUT/DELETE /api/routes/:id
  await page.route(/\/api\/routes\/[^/]+$/, (route) => {
    const method = route.request().method();
    const url = route.request().url();
    const idMatch = url.match(/\/api\/routes\/([^/?]+)/);
    const routeId = idMatch?.[1] ?? "route-1";

    if (method === "GET") {
      const found = mockSavedRouteAPI(routeId);
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(found),
      });
    }
    if (method === "PUT") {
      const found = mockSavedRouteAPI(routeId);
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(found),
      });
    }
    if (method === "DELETE") {
      return route.fulfill({ status: 204 });
    }
    return route.continue();
  });
}

/**
 * Set up route intercepts for share/unshare endpoints.
 */
export async function mockShareAPIs(page: Page) {
  await page.route(/\/api\/routes\/[^/]+\/share$/, (route) => {
    if (route.request().method() === "POST") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockShareResponse()),
      });
    }
    if (route.request().method() === "DELETE") {
      return route.fulfill({ status: 204 });
    }
    return route.continue();
  });
}

/**
 * Set up route intercepts for shared report endpoint.
 */
export async function mockSharedReportAPI(page: Page, fixture?: object) {
  await page.route(/\/api\/shared\//, (route) => {
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(fixture ?? mockRideReport()),
    });
  });
}

export async function mockSharedReportAPINotFound(page: Page) {
  await page.route(/\/api\/shared\//, (route) => {
    return route.fulfill({
      status: 404,
      contentType: "application/json",
      body: JSON.stringify({ detail: "Not found" }),
    });
  });
}

/**
 * Set up route intercepts for auth endpoints.
 */
export async function mockAuthAPIs(
  page: Page,
  overrides?: { loginError?: boolean; isAdmin?: boolean },
) {
  await page.route("**/api/auth/login", (route) => {
    if (overrides?.loginError) {
      return route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ detail: "Invalid credentials" }),
      });
    }
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(mockLoginResponse({ isAdmin: overrides?.isAdmin })),
    });
  });

  await page.route("**/api/auth/register", (route) => {
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(mockLoginResponse({ isAdmin: overrides?.isAdmin })),
    });
  });

  await page.route("**/api/auth/me", (route) => {
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(mockAuthMe({ isAdmin: overrides?.isAdmin })),
    });
  });
}

/**
 * Set up all standard API mocks at once (geocoding + routes + report + share + auth).
 */
export async function mockAllAPIs(page: Page) {
  await mockGeocodingAPIs(page);
  await mockRideReportAPI(page);
  await mockRoutesAPIs(page);
  await mockShareAPIs(page);
  await mockAuthAPIs(page);
}

// --- Admin API mocks ---

export async function mockAdminProductsAPIs(page: Page) {
  const products = mockAdminProducts();
  const categories = mockAdminCategories();
  const shops = mockAdminShops();

  await page.route("**/api/admin/products?*", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(products) }),
  );
  await page.route("**/api/admin/products", (route) => {
    if (route.request().method() === "POST") {
      return route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify(products.items[0]),
      });
    }
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(products),
    });
  });
  await page.route(/\/api\/admin\/products\/[^/]+$/, (route) => {
    const method = route.request().method();
    if (method === "GET" || method === "PUT") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(products.items[0]),
      });
    }
    if (method === "DELETE") return route.fulfill({ status: 204 });
    return route.continue();
  });
  await page.route("**/api/admin/categories", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(categories),
    }),
  );
  await page.route(/\/api\/admin\/categories\/[^/]+$/, (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(categories[0]),
    }),
  );
  await page.route("**/api/admin/shops", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(shops) }),
  );
  await page.route(/\/api\/admin\/shops\/[^/]+$/, (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(shops[0]) }),
  );
}

export async function mockAdminFaqAPIs(page: Page) {
  const items = mockAdminFaqItems();
  await page.route("**/api/admin/faq", (route) => {
    if (route.request().method() === "POST") {
      return route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({ ...items[0], id: "faq-new" }),
      });
    }
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(items),
    });
  });
  await page.route(/\/api\/admin\/faq\/[^/]+$/, (route) => {
    const method = route.request().method();
    if (method === "PUT")
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(items[0]),
      });
    if (method === "DELETE") return route.fulfill({ status: 204 });
    return route.continue();
  });
  await page.route("**/api/admin/faq/reorder", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(items) }),
  );
}

export async function mockAdminAboutAPIs(page: Page) {
  const sections = mockAdminAboutSections();
  await page.route("**/api/admin/about", (route) => {
    if (route.request().method() === "POST") {
      return route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({ ...sections[0], id: 99 }),
      });
    }
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(sections),
    });
  });
  await page.route(/\/api\/admin\/about\/[^/]+$/, (route) => {
    const method = route.request().method();
    if (method === "PUT")
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(sections[0]),
      });
    if (method === "DELETE") return route.fulfill({ status: 204 });
    return route.continue();
  });
}

export async function mockAdminContactsAPIs(page: Page) {
  const contacts = mockAdminContacts();
  await page.route("**/api/admin/contacts?*", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(contacts) }),
  );
  await page.route("**/api/admin/contacts", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(contacts) }),
  );
  await page.route(/\/api\/admin\/contacts\/[^/]+$/, (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(contacts.items[0]),
    }),
  );
}

export async function mockAdminAppInfoAPIs(page: Page) {
  const sections = mockAppInfoSections();
  await page.route("**/api/admin/app-info", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(sections) }),
  );
}

// --- Content page API mocks ---

export async function mockFaqAPIs(page: Page) {
  await page.route("**/api/faq", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(mockFaqItems()),
    }),
  );
}

export async function mockAboutAPIs(page: Page) {
  await page.route("**/api/about", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(mockAboutSections()),
    }),
  );
  await page.route(/\/api\/about\/[^/]+$/, (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(mockAboutSections()[0]),
    }),
  );
}

export async function mockAppInfoAPIs(page: Page) {
  await page.route("**/api/app-info", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(mockAppInfoSections()),
    }),
  );
  await page.route(/\/api\/app-info\/[^/]+$/, (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(mockAppInfoSections()[0]),
    }),
  );
}

export async function mockContactAPI(page: Page, opts?: { error?: boolean }) {
  await page.route("**/api/contact", (route) => {
    if (opts?.error) {
      return route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ detail: "Internal server error" }),
      });
    }
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true }),
    });
  });
}

// --- Password flow API mocks ---

export async function mockForgotPasswordAPI(page: Page, opts?: { error?: boolean }) {
  await page.route("**/api/auth/forgot-password", (route) => {
    if (opts?.error) {
      return route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ detail: "Something went wrong" }),
      });
    }
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true }),
    });
  });
}

export async function mockResetPasswordAPI(page: Page, opts?: { error?: boolean }) {
  await page.route("**/api/auth/reset-password", (route) => {
    if (opts?.error) {
      return route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({ detail: "Token expired" }),
      });
    }
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true }),
    });
  });
}

export async function mockChangePasswordAPI(page: Page, opts?: { error?: boolean }) {
  await page.route("**/api/auth/change-password", (route) => {
    if (opts?.error) {
      return route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({ detail: "Wrong password" }),
      });
    }
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true }),
    });
  });
}
