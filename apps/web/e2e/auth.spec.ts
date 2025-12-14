/**
 * Authentication E2E Tests (F4.6)
 * Tests: Signup → Login → Logout → Invalid credentials
 */

import { test, expect } from "@playwright/test";
import { TEST_USERS, login, signUp, logout } from "./helpers/auth";

test.describe("Authentication", () => {
  test.describe("Signup", () => {
    test("should allow new customer signup", async ({ page }) => {
      // Generate unique email for this test run
      const uniqueEmail = `customer.${Date.now()}@vlossom.test`;

      await page.goto("/signup");

      // Fill signup form
      await page.getByLabel(/email/i).fill(uniqueEmail);
      await page.getByLabel(/password/i).fill("TestPassword123!");
      await page.getByLabel(/display name/i).fill("New Customer");

      // Select customer role
      await page.getByRole("radio", { name: /customer/i }).click();

      // Submit
      await page.getByRole("button", { name: /sign up|create account/i }).click();

      // Should redirect to appropriate page
      await expect(page).toHaveURL(/\/(home|stylists|dashboard)/, { timeout: 10000 });

      // Should show user is logged in
      await expect(page.locator('[data-testid="user-menu"]')).toBeVisible({ timeout: 5000 });
    });

    test("should allow new stylist signup", async ({ page }) => {
      const uniqueEmail = `stylist.${Date.now()}@vlossom.test`;

      await page.goto("/signup");

      await page.getByLabel(/email/i).fill(uniqueEmail);
      await page.getByLabel(/password/i).fill("TestPassword123!");
      await page.getByLabel(/display name/i).fill("New Stylist");
      await page.getByRole("radio", { name: /stylist|service provider/i }).click();

      await page.getByRole("button", { name: /sign up|create account/i }).click();

      await expect(page).toHaveURL(/\/(dashboard|home|profile)/, { timeout: 10000 });
    });

    test("should show error for duplicate email", async ({ page }) => {
      // First signup
      const email = `duplicate.${Date.now()}@vlossom.test`;

      await page.goto("/signup");
      await page.getByLabel(/email/i).fill(email);
      await page.getByLabel(/password/i).fill("TestPassword123!");
      await page.getByLabel(/display name/i).fill("First User");
      await page.getByRole("radio", { name: /customer/i }).click();
      await page.getByRole("button", { name: /sign up|create account/i }).click();

      // Wait for signup to complete
      await expect(page).toHaveURL(/\/(home|stylists|dashboard)/, { timeout: 10000 });

      // Try to signup with same email (in new browser context)
      const newPage = await page.context().newPage();
      await newPage.goto("/signup");
      await newPage.getByLabel(/email/i).fill(email);
      await newPage.getByLabel(/password/i).fill("TestPassword123!");
      await newPage.getByLabel(/display name/i).fill("Second User");
      await newPage.getByRole("radio", { name: /customer/i }).click();
      await newPage.getByRole("button", { name: /sign up|create account/i }).click();

      // Should show error
      await expect(newPage.locator("text=/already registered|already exists/i")).toBeVisible({
        timeout: 5000,
      });
    });

    test("should validate password requirements", async ({ page }) => {
      await page.goto("/signup");

      await page.getByLabel(/email/i).fill("test@example.com");
      await page.getByLabel(/password/i).fill("short");
      await page.getByLabel(/display name/i).fill("Test User");
      await page.getByRole("radio", { name: /customer/i }).click();
      await page.getByRole("button", { name: /sign up|create account/i }).click();

      // Should show validation error
      await expect(page.locator("text=/at least 8|too short|minimum/i")).toBeVisible({
        timeout: 5000,
      });
    });
  });

  test.describe("Login", () => {
    test("should login with valid credentials", async ({ page }) => {
      // First create a user
      const email = `login.test.${Date.now()}@vlossom.test`;
      const password = "TestPassword123!";

      // Signup via API
      const signupResponse = await page.request.post("/api/auth/signup", {
        data: {
          email,
          password,
          displayName: "Login Test User",
          role: "CUSTOMER",
        },
      });
      expect(signupResponse.ok()).toBeTruthy();

      // Clear any session state
      await page.evaluate(() => localStorage.clear());

      // Now test login
      await page.goto("/login");
      await page.getByLabel(/email/i).fill(email);
      await page.getByLabel(/password/i).fill(password);
      await page.getByRole("button", { name: /log in|sign in/i }).click();

      // Should redirect after login
      await expect(page).toHaveURL(/\/(home|stylists|dashboard)/, { timeout: 10000 });

      // Token should be stored
      const token = await page.evaluate(() => localStorage.getItem("token"));
      expect(token).toBeTruthy();
    });

    test("should show error for invalid credentials", async ({ page }) => {
      await page.goto("/login");

      await page.getByLabel(/email/i).fill("nonexistent@example.com");
      await page.getByLabel(/password/i).fill("wrongpassword");
      await page.getByRole("button", { name: /log in|sign in/i }).click();

      // Should show error message
      await expect(page.locator("text=/invalid|incorrect|wrong/i")).toBeVisible({
        timeout: 5000,
      });

      // Should still be on login page
      await expect(page).toHaveURL(/\/login/);
    });

    test("should show remaining attempts after failed login", async ({ page }) => {
      // Create a user first
      const email = `lockout.${Date.now()}@vlossom.test`;

      await page.request.post("/api/auth/signup", {
        data: {
          email,
          password: "CorrectPassword123!",
          displayName: "Lockout Test",
          role: "CUSTOMER",
        },
      });

      await page.goto("/login");

      // Try wrong password
      await page.getByLabel(/email/i).fill(email);
      await page.getByLabel(/password/i).fill("WrongPassword123!");
      await page.getByRole("button", { name: /log in|sign in/i }).click();

      // Should show remaining attempts or error
      await expect(
        page.locator("text=/invalid|remaining|attempt/i")
      ).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe("Logout", () => {
    test("should logout successfully", async ({ page }) => {
      // Create and login a user
      const email = `logout.test.${Date.now()}@vlossom.test`;
      const password = "TestPassword123!";

      await page.request.post("/api/auth/signup", {
        data: {
          email,
          password,
          displayName: "Logout Test",
          role: "CUSTOMER",
        },
      });

      await page.goto("/login");
      await page.getByLabel(/email/i).fill(email);
      await page.getByLabel(/password/i).fill(password);
      await page.getByRole("button", { name: /log in|sign in/i }).click();

      await expect(page).toHaveURL(/\/(home|stylists|dashboard)/, { timeout: 10000 });

      // Find and click logout
      await page.getByTestId("user-menu").click();
      await page.getByRole("button", { name: /log out|sign out/i }).click();

      // Should redirect to login or home
      await expect(page).toHaveURL(/\/(login)?$/);

      // Token should be removed
      const token = await page.evaluate(() => localStorage.getItem("token"));
      expect(token).toBeFalsy();
    });
  });

  test.describe("Protected Routes", () => {
    test("should redirect to login when accessing protected route", async ({ page }) => {
      // Clear any existing session
      await page.evaluate(() => localStorage.clear());

      // Try to access protected route
      await page.goto("/dashboard");

      // Should redirect to login
      await expect(page).toHaveURL(/\/login/);
    });
  });
});
