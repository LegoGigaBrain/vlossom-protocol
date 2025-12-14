/**
 * Authentication helpers for E2E tests (F4.6)
 */

import { Page, expect } from "@playwright/test";

export interface TestUser {
  email: string;
  password: string;
  displayName: string;
  role: "CUSTOMER" | "STYLIST";
}

/**
 * Test user credentials
 */
export const TEST_USERS = {
  customer: {
    email: "test.customer@vlossom.test",
    password: "TestPassword123!",
    displayName: "Test Customer",
    role: "CUSTOMER" as const,
  },
  stylist: {
    email: "test.stylist@vlossom.test",
    password: "TestPassword123!",
    displayName: "Test Stylist",
    role: "STYLIST" as const,
  },
};

/**
 * Sign up a new user via the UI
 */
export async function signUp(page: Page, user: TestUser): Promise<void> {
  await page.goto("/signup");

  // Fill in signup form
  await page.getByLabel("Email").fill(user.email);
  await page.getByLabel("Password").fill(user.password);
  await page.getByLabel("Display Name").fill(user.displayName);

  // Select role
  await page.getByRole("radio", { name: user.role === "CUSTOMER" ? "Customer" : "Stylist" }).click();

  // Submit
  await page.getByRole("button", { name: /sign up/i }).click();

  // Wait for redirect to dashboard or home
  await expect(page).toHaveURL(/\/(dashboard|home|stylists)/);
}

/**
 * Log in an existing user via the UI
 */
export async function login(page: Page, email: string, password: string): Promise<void> {
  await page.goto("/login");

  // Fill in login form
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);

  // Submit
  await page.getByRole("button", { name: /log in|sign in/i }).click();

  // Wait for redirect
  await expect(page).toHaveURL(/\/(dashboard|home|stylists)/);
}

/**
 * Log in via API and set auth cookie/localStorage
 */
export async function loginViaAPI(page: Page, email: string, password: string): Promise<string> {
  const response = await page.request.post("/api/auth/login", {
    data: { email, password },
  });

  expect(response.ok()).toBeTruthy();

  const data = await response.json();
  const token = data.token;

  // Store token in localStorage
  await page.evaluate((t) => {
    localStorage.setItem("token", t);
  }, token);

  return token;
}

/**
 * Log out the current user
 */
export async function logout(page: Page): Promise<void> {
  // Click user menu
  await page.getByTestId("user-menu").click();

  // Click logout
  await page.getByRole("button", { name: /log out|sign out/i }).click();

  // Wait for redirect to login page
  await expect(page).toHaveURL(/\/(login)?$/);
}

/**
 * Check if user is logged in
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
  const token = await page.evaluate(() => localStorage.getItem("token"));
  return !!token;
}

/**
 * Get current user info from localStorage/API
 */
export async function getCurrentUser(page: Page): Promise<any | null> {
  const token = await page.evaluate(() => localStorage.getItem("token"));
  if (!token) return null;

  const response = await page.request.get("/api/auth/me", {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok()) return null;

  const data = await response.json();
  return data.user;
}

/**
 * Wait for auth state to be ready
 */
export async function waitForAuth(page: Page, expectLoggedIn: boolean): Promise<void> {
  if (expectLoggedIn) {
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible({ timeout: 10000 });
  } else {
    await expect(page.locator('[data-testid="login-button"]')).toBeVisible({ timeout: 10000 });
  }
}
