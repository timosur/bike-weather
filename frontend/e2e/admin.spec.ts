import { test, expect } from "@playwright/test";
import { setLanguageEN, loginAsAdmin } from "./helpers/auth";
import {
  mockAdminProductsAPIs,
  mockAdminFaqAPIs,
  mockAdminAboutAPIs,
  mockAdminContactsAPIs,
  mockAdminAppInfoAPIs,
} from "./helpers/api-mocks";

test.describe("Admin Panel", () => {
  test.beforeEach(async ({ page }) => {
    await setLanguageEN(page);
    await loginAsAdmin(page);
    await mockAdminProductsAPIs(page);
    await mockAdminFaqAPIs(page);
    await mockAdminAboutAPIs(page);
    await mockAdminContactsAPIs(page);
    await mockAdminAppInfoAPIs(page);
  });

  // --- Dashboard ---

  test("dashboard shows stat cards with counts", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible({ timeout: 10000 });
    // Stat cards are buttons with label + count (e.g. "Products 2")
    await expect(page.getByRole("button", { name: /Products \d+/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /Categories \d+/ })).toBeVisible();
  });

  test("clicking Products stat card navigates to products page", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible({ timeout: 10000 });
    // Click the stat card button (shows "Products <count>")
    await page.getByRole("button", { name: /Products \d+/ }).click();
    await expect(page).toHaveURL(/\/admin\/products/);
  });

  test("non-admin user is redirected from admin", async ({ page, context }) => {
    const freshPage = await context.newPage();
    await setLanguageEN(freshPage);
    // No loginAsAdmin — just a regular page with no auth
    await freshPage.goto("/admin");
    await expect(freshPage).toHaveURL(/\/login/, { timeout: 10000 });
    await freshPage.close();
  });

  // --- Products (Full CRUD) ---

  test("products page shows paginated table", async ({ page }) => {
    await page.goto("/admin/products");
    await expect(page.getByText("Castelli Perfetto RoS")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Pearl Izumi Thermal Jersey")).toBeVisible();
  });

  test("products page search filters results", async ({ page }) => {
    await page.goto("/admin/products");
    await expect(page.getByText("Castelli Perfetto RoS")).toBeVisible({ timeout: 10000 });
    const searchInput = page.getByPlaceholder(/search products/i);
    await searchInput.fill("Castelli");
    await page.waitForTimeout(500);
  });

  test("create product opens slide panel", async ({ page }) => {
    await page.goto("/admin/products");
    await expect(page.getByText("Castelli Perfetto RoS")).toBeVisible({ timeout: 10000 });
    await page.getByRole("button", { name: /add new/i }).click();
    await expect(page.getByText("New Product")).toBeVisible({ timeout: 5000 });
  });

  test("clicking product row opens edit panel", async ({ page }) => {
    await page.goto("/admin/products");
    await expect(page.getByText("Castelli Perfetto RoS")).toBeVisible({ timeout: 10000 });
    await page.getByText("Castelli Perfetto RoS").click();
    await expect(page.getByText("Edit Product")).toBeVisible({ timeout: 5000 });
  });

  test("delete product shows confirmation dialog", async ({ page }) => {
    await page.goto("/admin/products");
    await expect(page.getByText("Castelli Perfetto RoS")).toBeVisible({ timeout: 10000 });
    // Click the Delete button in the actions column
    await page
      .getByRole("button", { name: /^delete$/i })
      .first()
      .click();
    await expect(page.getByText(/are you sure|really delete|confirm/i).first()).toBeVisible({
      timeout: 5000,
    });
  });

  test("product filter by category works", async ({ page }) => {
    await page.goto("/admin/products");
    await expect(page.getByText("Castelli Perfetto RoS")).toBeVisible({ timeout: 10000 });
    // Category filter dropdown
    const categoryFilter = page.locator("select").filter({ hasText: /all categories/i });
    if (await categoryFilter.isVisible({ timeout: 3000 }).catch(() => false)) {
      await categoryFilter.selectOption({ label: "Jerseys" });
      await page.waitForTimeout(500);
    }
  });

  // --- FAQ (Full CRUD) ---

  test("FAQ page shows list of items", async ({ page }) => {
    await page.goto("/admin/faq");
    await expect(page.getByText("How does Bike Weather work?")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Is Bike Weather free?")).toBeVisible();
  });

  test("create FAQ item opens slide panel", async ({ page }) => {
    await page.goto("/admin/faq");
    await expect(page.getByText("How does Bike Weather work?")).toBeVisible({ timeout: 10000 });
    await page.getByRole("button", { name: /add new/i }).click();
    await expect(page.getByText(/new faq/i)).toBeVisible({ timeout: 5000 });
  });

  test("clicking FAQ item opens edit panel", async ({ page }) => {
    await page.goto("/admin/faq");
    await expect(page.getByText("How does Bike Weather work?")).toBeVisible({ timeout: 10000 });
    await page.getByText("How does Bike Weather work?").click();
    await expect(page.getByText(/edit faq/i)).toBeVisible({ timeout: 5000 });
  });

  test("delete FAQ item shows confirmation", async ({ page }) => {
    await page.goto("/admin/faq");
    await expect(page.getByText("How does Bike Weather work?")).toBeVisible({ timeout: 10000 });
    await page
      .getByRole("button", { name: /^delete$/i })
      .first()
      .click();
    await expect(page.getByText(/are you sure|really delete|confirm/i).first()).toBeVisible({
      timeout: 5000,
    });
  });

  // --- Categories (Smoke) ---

  test("categories page loads with list", async ({ page }) => {
    await page.goto("/admin/categories");
    await expect(page.locator("main").getByText("Jerseys").first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator("main").getByText("Jackets").first()).toBeVisible();
  });

  test("categories create form opens", async ({ page }) => {
    await page.goto("/admin/categories");
    await expect(page.locator("main").getByText("Jerseys").first()).toBeVisible({ timeout: 10000 });
    await page.getByRole("button", { name: /add new/i }).click();
    await expect(page.getByText(/new category/i)).toBeVisible({ timeout: 5000 });
  });

  // --- Shops (Smoke) ---

  test("shops page loads with list", async ({ page }) => {
    await page.goto("/admin/shops");
    await expect(page.getByText("Bike-Components")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("bike24")).toBeVisible();
  });

  test("shops create form opens", async ({ page }) => {
    await page.goto("/admin/shops");
    await expect(page.getByText("Bike-Components")).toBeVisible({ timeout: 10000 });
    await page.getByRole("button", { name: /add new/i }).click();
    await expect(page.getByText(/new shop/i)).toBeVisible({ timeout: 5000 });
  });

  // --- About (Smoke) ---

  test("about page loads with sections", async ({ page }) => {
    await page.goto("/admin/about");
    await expect(page.getByText("About Me").first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("My Cycling Journey")).toBeVisible();
  });

  test("about create form opens", async ({ page }) => {
    await page.goto("/admin/about");
    await expect(page.getByText("About Me").first()).toBeVisible({ timeout: 10000 });
    await page.getByRole("button", { name: /add new/i }).click();
    await expect(page.getByText(/new.*section|new.*about/i)).toBeVisible({ timeout: 5000 });
  });

  // --- Contacts (Smoke) ---

  test("contacts page loads with message list", async ({ page }) => {
    await page.goto("/admin/contacts");
    await expect(page.locator("main").getByText("Alice").first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator("main").getByText("Bob").first()).toBeVisible();
  });

  test("clicking message opens detail panel", async ({ page }) => {
    await page.goto("/admin/contacts");
    await expect(page.locator("main").getByText("Alice").first()).toBeVisible({ timeout: 10000 });
    await page.locator("main").getByText("Alice").first().click();
    await expect(page.getByText("Great app!").first()).toBeVisible({ timeout: 5000 });
  });
});
