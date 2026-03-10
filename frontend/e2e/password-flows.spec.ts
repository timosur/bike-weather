import { test, expect } from "@playwright/test";
import { setLanguageEN, loginAsUser } from "./helpers/auth";
import {
  mockForgotPasswordAPI,
  mockResetPasswordAPI,
  mockChangePasswordAPI,
} from "./helpers/api-mocks";

test.describe("Password Flows", () => {
  test.beforeEach(async ({ page }) => {
    await setLanguageEN(page);
  });

  // --- Forgot Password ---

  test.describe("Forgot Password", () => {
    test.beforeEach(async ({ page }) => {
      await mockForgotPasswordAPI(page);
    });

    test("shows forgot password form", async ({ page }) => {
      await page.goto("/forgot-password");
      await expect(page.getByRole("heading", { name: "Reset your password" })).toBeVisible({
        timeout: 10000,
      });
      await expect(page.getByPlaceholder("your@email.com")).toBeVisible();
      await expect(page.getByRole("button", { name: "Send reset link" })).toBeVisible();
    });

    test("validates empty email", async ({ page }) => {
      await page.goto("/forgot-password");
      await expect(page.getByRole("heading", { name: "Reset your password" })).toBeVisible({
        timeout: 10000,
      });
      // Clear any autofocused field and submit empty
      await page.getByPlaceholder("your@email.com").fill("");
      await page.getByRole("button", { name: "Send reset link" }).click();
      await expect(page.getByText("Valid email required")).toBeVisible();
    });

    test("validates invalid email format", async ({ page }) => {
      await page.goto("/forgot-password");
      await expect(page.getByRole("heading", { name: "Reset your password" })).toBeVisible({
        timeout: 10000,
      });
      await page.getByPlaceholder("your@email.com").fill("notanemail");
      await page.getByRole("button", { name: "Send reset link" }).click();
      // Browser HTML5 email validation prevents submission — form stays visible
      await expect(page.getByRole("heading", { name: "Reset your password" })).toBeVisible();
      await expect(page.getByText("Check your email")).not.toBeVisible();
    });

    test("shows success state after submission", async ({ page }) => {
      await page.goto("/forgot-password");
      await expect(page.getByRole("heading", { name: "Reset your password" })).toBeVisible({
        timeout: 10000,
      });
      await page.getByPlaceholder("your@email.com").fill("user@example.com");
      await page.getByRole("button", { name: "Send reset link" }).click();
      await expect(page.getByText("Check your email")).toBeVisible({ timeout: 5000 });
      await expect(page.getByText("Back to sign in")).toBeVisible();
    });

    test("back to login link navigates correctly", async ({ page }) => {
      await page.goto("/forgot-password");
      await expect(page.getByRole("heading", { name: "Reset your password" })).toBeVisible({
        timeout: 10000,
      });
      await page.getByText("Back to sign in").click();
      await expect(page).toHaveURL(/\/login/);
    });

    test("shows error on API failure", async ({ page }) => {
      await mockForgotPasswordAPI(page, { error: true });
      await page.goto("/forgot-password");
      await expect(page.getByRole("heading", { name: "Reset your password" })).toBeVisible({
        timeout: 10000,
      });
      await page.getByPlaceholder("your@email.com").fill("user@example.com");
      await page.getByRole("button", { name: "Send reset link" }).click();
      await expect(page.getByText(/something went wrong|error/i)).toBeVisible({ timeout: 5000 });
    });
  });

  // --- Reset Password ---

  test.describe("Reset Password", () => {
    test.beforeEach(async ({ page }) => {
      await mockResetPasswordAPI(page);
    });

    test("shows invalid token message when no token", async ({ page }) => {
      await page.goto("/reset-password");
      await expect(page.getByText("Invalid or expired link")).toBeVisible({ timeout: 10000 });
      await expect(page.getByText("Request new reset link")).toBeVisible();
    });

    test("request new link navigates to forgot-password", async ({ page }) => {
      await page.goto("/reset-password");
      await expect(page.getByText("Invalid or expired link")).toBeVisible({ timeout: 10000 });
      await page.getByText("Request new reset link").click();
      await expect(page).toHaveURL(/\/forgot-password/);
    });

    test("shows reset form with valid token", async ({ page }) => {
      await page.goto("/reset-password?token=valid-token-123");
      await expect(page.getByRole("heading", { name: "Set new password" })).toBeVisible({
        timeout: 10000,
      });
      await expect(page.getByRole("button", { name: "Reset password" })).toBeVisible();
    });

    test("validates short password", async ({ page }) => {
      await page.goto("/reset-password?token=valid-token-123");
      await expect(page.getByRole("heading", { name: "Set new password" })).toBeVisible({
        timeout: 10000,
      });
      await page.getByPlaceholder("Password (min. 8 characters)").fill("short");
      await page.getByPlaceholder("Confirm password").fill("short");
      await page.getByRole("button", { name: "Reset password" }).click();
      await expect(page.getByText("At least 8 characters")).toBeVisible();
    });

    test("validates password mismatch", async ({ page }) => {
      await page.goto("/reset-password?token=valid-token-123");
      await expect(page.getByRole("heading", { name: "Set new password" })).toBeVisible({
        timeout: 10000,
      });
      await page.getByPlaceholder("Password (min. 8 characters)").fill("password123");
      await page.getByPlaceholder("Confirm password").fill("different456");
      await page.getByRole("button", { name: "Reset password" }).click();
      await expect(page.getByText("Passwords do not match")).toBeVisible();
    });

    test("shows success after valid reset", async ({ page }) => {
      await page.goto("/reset-password?token=valid-token-123");
      await expect(page.getByRole("heading", { name: "Set new password" })).toBeVisible({
        timeout: 10000,
      });
      await page.getByPlaceholder("Password (min. 8 characters)").fill("newpassword123");
      await page.getByPlaceholder("Confirm password").fill("newpassword123");
      await page.getByRole("button", { name: "Reset password" }).click();
      await expect(page.getByText("Password reset")).toBeVisible({ timeout: 5000 });
      await expect(page.getByText("Back to sign in")).toBeVisible();
    });
  });

  // --- Change Password (requires auth) ---

  test.describe("Change Password", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsUser(page);
      await mockChangePasswordAPI(page);
    });

    test("shows change password form", async ({ page }) => {
      await page.goto("/change-password");
      await expect(page.getByRole("heading", { name: "Change password" })).toBeVisible({
        timeout: 10000,
      });
      await expect(page.getByPlaceholder("Current password")).toBeVisible();
      await expect(page.getByRole("button", { name: "Change password" })).toBeVisible();
    });

    test("validates short new password", async ({ page }) => {
      await page.goto("/change-password");
      await expect(page.getByRole("heading", { name: "Change password" })).toBeVisible({
        timeout: 10000,
      });
      await page.getByPlaceholder("Current password").fill("oldpass123");
      await page.getByPlaceholder("Password (min. 8 characters)").fill("short");
      await page.getByPlaceholder("Confirm password").fill("short");
      await page.getByRole("button", { name: "Change password" }).click();
      await expect(page.getByText("At least 8 characters")).toBeVisible();
    });

    test("validates password mismatch", async ({ page }) => {
      await page.goto("/change-password");
      await expect(page.getByRole("heading", { name: "Change password" })).toBeVisible({
        timeout: 10000,
      });
      await page.getByPlaceholder("Current password").fill("oldpass123");
      await page.getByPlaceholder("Password (min. 8 characters)").fill("newpassword123");
      await page.getByPlaceholder("Confirm password").fill("different456");
      await page.getByRole("button", { name: "Change password" }).click();
      await expect(page.getByText("Passwords do not match")).toBeVisible();
    });

    test("shows success after password change", async ({ page }) => {
      await page.goto("/change-password");
      await expect(page.getByRole("heading", { name: "Change password" })).toBeVisible({
        timeout: 10000,
      });
      await page.getByPlaceholder("Current password").fill("oldpass123");
      await page.getByPlaceholder("Password (min. 8 characters)").fill("newpassword123");
      await page.getByPlaceholder("Confirm password").fill("newpassword123");
      await page.getByRole("button", { name: "Change password" }).click();
      await expect(page.getByText("Password changed")).toBeVisible({ timeout: 5000 });
      await expect(page.getByText("Back to app")).toBeVisible();
    });

    test("back to app navigates to planner", async ({ page }) => {
      await page.goto("/change-password");
      await expect(page.getByRole("heading", { name: "Change password" })).toBeVisible({
        timeout: 10000,
      });
      await page.getByPlaceholder("Current password").fill("oldpass123");
      await page.getByPlaceholder("Password (min. 8 characters)").fill("newpassword123");
      await page.getByPlaceholder("Confirm password").fill("newpassword123");
      await page.getByRole("button", { name: "Change password" }).click();
      await expect(page.getByText("Back to app")).toBeVisible({ timeout: 5000 });
      await page.getByText("Back to app").click();
      await expect(page).toHaveURL(/\/planner/);
    });
  });
});
