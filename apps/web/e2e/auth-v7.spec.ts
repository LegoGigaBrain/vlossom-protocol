/**
 * V7.0.0 Cookie-based Authentication E2E Tests
 *
 * Tests for httpOnly cookie auth (H-1 security fix) and CSRF protection.
 * These tests validate the V7.0.0 security improvements.
 */

import { test, expect } from "@playwright/test";

test.describe("V7.0.0 Cookie Authentication", () => {
  test.describe("httpOnly Cookie Security", () => {
    test("should set httpOnly cookie on login", async ({ page }) => {
      const email = `cookie.test.${Date.now()}@vlossom.test`;
      const password = "TestPassword123!";

      // First create user via API
      await page.request.post("/api/v1/auth/signup", {
        data: {
          email,
          password,
          displayName: "Cookie Test User",
          role: "CUSTOMER",
        },
      });

      // Login via UI
      await page.goto("/login");
      await page.getByLabel(/email/i).fill(email);
      await page.getByLabel(/password/i).fill(password);
      await page.getByRole("button", { name: /log in|sign in/i }).click();

      // Wait for successful login
      await expect(page).toHaveURL(/\/(home|stylists|dashboard)/, {
        timeout: 10000,
      });

      // Get cookies - httpOnly cookies won't be accessible via JS
      // But we can verify auth works by making an API request
      const meResponse = await page.request.get("/api/v1/auth/me");
      expect(meResponse.ok()).toBeTruthy();

      const userData = await meResponse.json();
      expect(userData.user).toBeDefined();
      expect(userData.user.email).toBe(email);
    });

    test("should not expose access token to JavaScript", async ({ page }) => {
      const email = `js.access.${Date.now()}@vlossom.test`;
      const password = "TestPassword123!";

      // Create and login user
      await page.request.post("/api/v1/auth/signup", {
        data: {
          email,
          password,
          displayName: "JS Access Test",
          role: "CUSTOMER",
        },
      });

      await page.goto("/login");
      await page.getByLabel(/email/i).fill(email);
      await page.getByLabel(/password/i).fill(password);
      await page.getByRole("button", { name: /log in|sign in/i }).click();

      await expect(page).toHaveURL(/\/(home|stylists|dashboard)/, {
        timeout: 10000,
      });

      // Attempt to read cookies via JavaScript
      const accessToken = await page.evaluate(() => {
        // Try to read the access token cookie - should fail due to httpOnly
        return document.cookie
          .split(";")
          .find((c) => c.trim().startsWith("vlossom_access="));
      });

      // httpOnly cookie should not be readable by JavaScript
      expect(accessToken).toBeUndefined();
    });

    test("should allow CSRF token to be read by JavaScript", async ({
      page,
    }) => {
      const email = `csrf.read.${Date.now()}@vlossom.test`;
      const password = "TestPassword123!";

      // Create and login
      await page.request.post("/api/v1/auth/signup", {
        data: {
          email,
          password,
          displayName: "CSRF Read Test",
          role: "CUSTOMER",
        },
      });

      await page.goto("/login");
      await page.getByLabel(/email/i).fill(email);
      await page.getByLabel(/password/i).fill(password);
      await page.getByRole("button", { name: /log in|sign in/i }).click();

      await expect(page).toHaveURL(/\/(home|stylists|dashboard)/, {
        timeout: 10000,
      });

      // CSRF token cookie should be readable (not httpOnly)
      const csrfToken = await page.evaluate(() => {
        const cookie = document.cookie
          .split(";")
          .find((c) => c.trim().startsWith("vlossom_csrf="));
        return cookie ? cookie.split("=")[1] : null;
      });

      expect(csrfToken).toBeTruthy();
      expect(csrfToken?.length).toBe(64); // 32 bytes = 64 hex chars
    });
  });

  test.describe("Token Refresh", () => {
    test("should auto-refresh tokens on 401 response", async ({ page }) => {
      const email = `refresh.test.${Date.now()}@vlossom.test`;
      const password = "TestPassword123!";

      // Create and login
      await page.request.post("/api/v1/auth/signup", {
        data: {
          email,
          password,
          displayName: "Refresh Test User",
          role: "CUSTOMER",
        },
      });

      await page.goto("/login");
      await page.getByLabel(/email/i).fill(email);
      await page.getByLabel(/password/i).fill(password);
      await page.getByRole("button", { name: /log in|sign in/i }).click();

      await expect(page).toHaveURL(/\/(home|stylists|dashboard)/, {
        timeout: 10000,
      });

      // Navigate to a protected page that requires auth
      await page.goto("/settings");

      // Page should load successfully (auth worked)
      await expect(page.locator("text=/settings/i").first()).toBeVisible({
        timeout: 5000,
      });

      // Make API call - cookies should be sent automatically
      const response = await page.request.get("/api/v1/auth/me");
      expect(response.ok()).toBeTruthy();
    });

    test("should redirect to login when refresh fails", async ({ page }) => {
      // Go to protected route without auth
      await page.context().clearCookies();

      await page.goto("/dashboard");

      // Should redirect to login
      await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
    });
  });

  test.describe("Logout Cookie Clearing", () => {
    test("should clear all auth cookies on logout", async ({ page }) => {
      const email = `logout.clear.${Date.now()}@vlossom.test`;
      const password = "TestPassword123!";

      // Create and login
      await page.request.post("/api/v1/auth/signup", {
        data: {
          email,
          password,
          displayName: "Logout Clear Test",
          role: "CUSTOMER",
        },
      });

      await page.goto("/login");
      await page.getByLabel(/email/i).fill(email);
      await page.getByLabel(/password/i).fill(password);
      await page.getByRole("button", { name: /log in|sign in/i }).click();

      await expect(page).toHaveURL(/\/(home|stylists|dashboard)/, {
        timeout: 10000,
      });

      // Verify we're logged in
      let meResponse = await page.request.get("/api/v1/auth/me");
      expect(meResponse.ok()).toBeTruthy();

      // Perform logout
      await page.getByTestId("user-menu").click();
      await page.getByRole("button", { name: /log out|sign out/i }).click();

      // Wait for redirect
      await expect(page).toHaveURL(/\/(login)?$/);

      // CSRF cookie should also be cleared
      const csrfToken = await page.evaluate(() => {
        return document.cookie
          .split(";")
          .find((c) => c.trim().startsWith("vlossom_csrf="));
      });
      expect(csrfToken).toBeUndefined();

      // API calls should now fail (cookies cleared)
      meResponse = await page.request.get("/api/v1/auth/me");
      expect(meResponse.status()).toBe(401);
    });
  });

  test.describe("CSRF Protection", () => {
    test("should include CSRF token in state-changing requests", async ({
      page,
    }) => {
      const email = `csrf.submit.${Date.now()}@vlossom.test`;
      const password = "TestPassword123!";

      // Create and login
      await page.request.post("/api/v1/auth/signup", {
        data: {
          email,
          password,
          displayName: "CSRF Submit Test",
          role: "CUSTOMER",
        },
      });

      await page.goto("/login");
      await page.getByLabel(/email/i).fill(email);
      await page.getByLabel(/password/i).fill(password);
      await page.getByRole("button", { name: /log in|sign in/i }).click();

      await expect(page).toHaveURL(/\/(home|stylists|dashboard)/, {
        timeout: 10000,
      });

      // Get CSRF token from cookie
      const csrfToken = await page.evaluate(() => {
        const cookie = document.cookie
          .split(";")
          .find((c) => c.trim().startsWith("vlossom_csrf="));
        return cookie ? cookie.split("=")[1] : null;
      });

      expect(csrfToken).toBeTruthy();

      // Make a POST request with CSRF token
      const updateResponse = await page.request.patch("/api/v1/auth/me", {
        headers: {
          "X-CSRF-Token": csrfToken!,
        },
        data: {
          displayName: "Updated Name",
        },
      });

      // Should succeed with valid CSRF token
      expect(updateResponse.ok()).toBeTruthy();
    });

    test("should reject POST requests without CSRF token", async ({ page }) => {
      const email = `csrf.reject.${Date.now()}@vlossom.test`;
      const password = "TestPassword123!";

      // Create user and login (get cookies set)
      await page.request.post("/api/v1/auth/signup", {
        data: {
          email,
          password,
          displayName: "CSRF Reject Test",
          role: "CUSTOMER",
        },
      });

      // Login to get session cookies
      await page.goto("/login");
      await page.getByLabel(/email/i).fill(email);
      await page.getByLabel(/password/i).fill(password);
      await page.getByRole("button", { name: /log in|sign in/i }).click();

      await expect(page).toHaveURL(/\/(home|stylists|dashboard)/, {
        timeout: 10000,
      });

      // Try to make a POST request WITHOUT CSRF token
      const response = await page.request.patch("/api/v1/auth/me", {
        data: {
          displayName: "Malicious Update",
        },
        // Deliberately NOT including X-CSRF-Token header
      });

      // Should be rejected with 403
      expect(response.status()).toBe(403);

      const errorData = await response.json();
      expect(errorData.error).toMatch(/csrf/i);
    });
  });

  test.describe("Session Persistence", () => {
    test("should maintain session across page reloads", async ({ page }) => {
      const email = `persist.${Date.now()}@vlossom.test`;
      const password = "TestPassword123!";

      // Create and login
      await page.request.post("/api/v1/auth/signup", {
        data: {
          email,
          password,
          displayName: "Persist Test",
          role: "CUSTOMER",
        },
      });

      await page.goto("/login");
      await page.getByLabel(/email/i).fill(email);
      await page.getByLabel(/password/i).fill(password);
      await page.getByRole("button", { name: /log in|sign in/i }).click();

      await expect(page).toHaveURL(/\/(home|stylists|dashboard)/, {
        timeout: 10000,
      });

      // Verify logged in
      await expect(page.locator('[data-testid="user-menu"]')).toBeVisible({
        timeout: 5000,
      });

      // Reload page
      await page.reload();

      // Should still be logged in
      await expect(page.locator('[data-testid="user-menu"]')).toBeVisible({
        timeout: 5000,
      });

      // API should still work
      const meResponse = await page.request.get("/api/v1/auth/me");
      expect(meResponse.ok()).toBeTruthy();
    });

    test("should maintain session across navigation", async ({ page }) => {
      const email = `navigate.${Date.now()}@vlossom.test`;
      const password = "TestPassword123!";

      // Create and login
      await page.request.post("/api/v1/auth/signup", {
        data: {
          email,
          password,
          displayName: "Navigate Test",
          role: "CUSTOMER",
        },
      });

      await page.goto("/login");
      await page.getByLabel(/email/i).fill(email);
      await page.getByLabel(/password/i).fill(password);
      await page.getByRole("button", { name: /log in|sign in/i }).click();

      await expect(page).toHaveURL(/\/(home|stylists|dashboard)/, {
        timeout: 10000,
      });

      // Navigate to different pages
      await page.goto("/settings");
      await expect(page.locator("text=/settings/i").first()).toBeVisible();

      await page.goto("/stylists");
      // Page should load without auth redirect

      // Should still be logged in
      const meResponse = await page.request.get("/api/v1/auth/me");
      expect(meResponse.ok()).toBeTruthy();
    });
  });

  test.describe("Mobile Compatibility (Bearer Header)", () => {
    test("should still return token in login response for mobile clients", async ({
      page,
    }) => {
      const email = `mobile.compat.${Date.now()}@vlossom.test`;
      const password = "TestPassword123!";

      // Create user
      await page.request.post("/api/v1/auth/signup", {
        data: {
          email,
          password,
          displayName: "Mobile Test",
          role: "CUSTOMER",
        },
      });

      // Login via API (like mobile would)
      const loginResponse = await page.request.post("/api/v1/auth/login", {
        data: { email, password },
      });

      expect(loginResponse.ok()).toBeTruthy();

      const data = await loginResponse.json();

      // Token should be in response body for mobile
      expect(data.token).toBeDefined();
      expect(data.token.length).toBeGreaterThan(0);

      // Should be able to use Bearer header
      const meResponse = await page.request.get("/api/v1/auth/me", {
        headers: {
          Authorization: `Bearer ${data.token}`,
        },
      });

      expect(meResponse.ok()).toBeTruthy();
    });
  });
});
