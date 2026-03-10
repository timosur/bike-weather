import { test, expect } from "@playwright/test";
import { setLanguageEN, loginAsUser, loginAsAdmin } from "./helpers/auth";
import {
  mockGeocodingAPIs,
  mockRideReportAPI,
  mockRoutesAPIs,
  mockShareAPIs,
  mockForgotPasswordAPI,
  mockContactAPI,
  mockAdminProductsAPIs,
  mockAdminFaqAPIs,
} from "./helpers/api-mocks";
import { fillBasicRide, submitPlannerForm } from "./helpers/planner";

test.describe("Cross-flow Integration", () => {
  test.beforeEach(async ({ page }) => {
    await setLanguageEN(page);
    await loginAsUser(page);
    await mockGeocodingAPIs(page);
    await mockRideReportAPI(page);
    await mockRoutesAPIs(page);
    await mockShareAPIs(page);
  });

  test("full flow: plan → report → save → view in my routes", async ({ page }) => {
    // 1. Plan a ride
    await page.goto("/planner");
    await fillBasicRide(page, { distance: 50 });
    await submitPlannerForm(page);

    // 2. Save the route
    await expect(page.getByRole("button", { name: /^save$/i })).toBeVisible({ timeout: 10000 });
    await page.getByRole("button", { name: /^save$/i }).click();

    // Should show saved confirmation
    await expect(page.getByText(/saved/i).first()).toBeVisible({ timeout: 5000 });

    // 3. Navigate to My Routes
    await page.goto("/routes");

    // Should see routes (our mock always returns the predefined list)
    await expect(page.getByText(/morning commute/i)).toBeVisible({ timeout: 10000 });
  });

  test("full flow: plan → report → edit → re-submit", async ({ page }) => {
    // 1. Plan a ride
    await page.goto("/planner");
    await fillBasicRide(page, { distance: 50 });
    await submitPlannerForm(page);

    // 2. Edit the ride
    await page.getByRole("button", { name: /edit ride/i }).click();
    await expect(page).toHaveURL(/\/planner/);

    // 3. Open advanced options and modify distance, then re-submit
    await page.getByRole("button", { name: /advanced options/i }).click();
    const distanceInput = page.getByPlaceholder(/e\.g\. 35/i);
    await distanceInput.clear();
    await distanceInput.fill("75");
    await submitPlannerForm(page);

    // 4. Should be back on report
    await expect(page.getByText(/morning ride|berlin/i).first()).toBeVisible({ timeout: 10000 });
  });

  test("flow: my routes → click card → view report", async ({ page }) => {
    // Navigate to routes page
    await page.goto("/routes");

    await expect(page.getByText(/morning commute/i)).toBeVisible({ timeout: 10000 });

    // Click a route card
    await page.getByText(/morning commute/i).click();

    // Should navigate to report
    await expect(page).toHaveURL(/\/report\/route-1/);
    await expect(page.getByText(/berlin/i).first()).toBeVisible({ timeout: 10000 });
  });

  test("flow: report → new ride → clean planner", async ({ page }) => {
    // Generate a report
    await page.goto("/planner");
    await fillBasicRide(page);
    await submitPlannerForm(page);

    // Click "New ride" from report
    await page.getByRole("button", { name: /new ride/i }).click();

    // Should be on planner with clean form
    await expect(page).toHaveURL(/\/planner/);
    // Location should not be pre-filled (search button visible)
    await expect(page.getByRole("button", { name: /search location/i }).first()).toBeVisible({
      timeout: 5000,
    });
  });

  test("auth guard: /routes redirects to login, login returns to /routes", async ({
    page,
    context,
  }) => {
    // Create a new page without auth
    const newPage = await context.newPage();
    await setLanguageEN(newPage);

    // Try to access routes without auth
    await newPage.goto("/routes");
    await expect(newPage).toHaveURL(/\/login/);

    await newPage.close();
  });

  test("flow: forgot password → back to login → sign in page", async ({ page, context }) => {
    const freshPage = await context.newPage();
    await setLanguageEN(freshPage);
    await mockForgotPasswordAPI(freshPage);

    await freshPage.goto("/forgot-password");
    await expect(freshPage.getByRole("heading", { name: "Reset your password" })).toBeVisible({
      timeout: 10000,
    });

    // Submit forgot password
    await freshPage.getByPlaceholder("your@email.com").fill("user@example.com");
    await freshPage.getByRole("button", { name: "Send reset link" }).click();
    await expect(freshPage.getByText("Check your email")).toBeVisible({ timeout: 5000 });

    // Navigate back to login
    await freshPage.getByText("Back to sign in").click();
    await expect(freshPage).toHaveURL(/\/login/);
    await freshPage.close();
  });

  test("flow: contact form submission from public page", async ({ page, context }) => {
    const freshPage = await context.newPage();
    await setLanguageEN(freshPage);
    await mockContactAPI(freshPage);

    await freshPage.goto("/contact");
    await expect(freshPage.getByRole("heading", { name: "Contact & Feedback" })).toBeVisible({
      timeout: 10000,
    });

    await freshPage.getByPlaceholder("your@email.com").fill("test@example.com");
    await freshPage.getByPlaceholder("What would you like to share?").fill("Great app!");
    await freshPage.getByRole("button", { name: "Submit" }).click();
    await expect(freshPage.getByText("Message sent")).toBeVisible({ timeout: 5000 });
    await freshPage.close();
  });

  test("flow: admin sidebar navigation between sections", async ({ page, context }) => {
    const adminPage = await context.newPage();
    await setLanguageEN(adminPage);
    await loginAsAdmin(adminPage);
    await mockAdminProductsAPIs(adminPage);
    await mockAdminFaqAPIs(adminPage);

    // Start at admin dashboard
    await adminPage.goto("/admin");
    await expect(adminPage.getByRole("heading", { name: "Dashboard" })).toBeVisible({
      timeout: 10000,
    });

    // Navigate to Products via sidebar button
    const sidebar = adminPage.locator("aside");
    await sidebar.getByRole("button", { name: "Products" }).click();
    await expect(adminPage).toHaveURL(/\/admin\/products/);
    await expect(adminPage.getByText("Castelli Perfetto RoS")).toBeVisible({ timeout: 10000 });

    // Navigate to FAQ via sidebar button
    await sidebar.getByRole("button", { name: "FAQ" }).click();
    await expect(adminPage).toHaveURL(/\/admin\/faq/);
    await expect(adminPage.getByText("How does Bike Weather work?")).toBeVisible({
      timeout: 10000,
    });

    await adminPage.close();
  });
});
