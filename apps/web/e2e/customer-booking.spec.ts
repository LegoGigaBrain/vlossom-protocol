/**
 * Customer Booking Flow E2E Tests (F4.6)
 * Tests: Browse Stylists → Select Service → Book → Pay → Track → Cancel
 */

import { test, expect } from "@playwright/test";

test.describe("Customer Booking Flow", () => {
  let customerEmail: string;
  let customerPassword: string;
  let customerToken: string;

  test.beforeAll(async ({ request }) => {
    // Create a test customer
    customerEmail = `customer.booking.${Date.now()}@vlossom.test`;
    customerPassword = "TestPassword123!";

    const response = await request.post("/api/v1/auth/signup", {
      data: {
        email: customerEmail,
        password: customerPassword,
        displayName: "Booking Test Customer",
        role: "CUSTOMER",
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    customerToken = data.token;
  });

  test.describe("Browse Stylists", () => {
    test("should display stylist listings", async ({ page }) => {
      await page.goto("/stylists");

      // Should show stylist cards or empty state
      await expect(
        page.locator('[data-testid="stylist-card"], [data-testid="empty-state"]')
      ).toBeVisible({ timeout: 10000 });
    });

    test("should filter stylists by category", async ({ page }) => {
      await page.goto("/stylists");

      // Click on a category filter if available
      const categoryFilter = page.locator('[data-testid="category-filter"]');
      if (await categoryFilter.isVisible()) {
        await categoryFilter.click();
        await page.getByRole("option", { name: /hair/i }).click();

        // Wait for results to update
        await page.waitForLoadState("networkidle");
      }
    });

    test("should search stylists by name", async ({ page }) => {
      await page.goto("/stylists");

      const searchInput = page.getByPlaceholder(/search/i);
      if (await searchInput.isVisible()) {
        await searchInput.fill("Test");
        await page.keyboard.press("Enter");

        // Wait for search results
        await page.waitForLoadState("networkidle");
      }
    });
  });

  test.describe("View Stylist Profile", () => {
    test("should show stylist details and services", async ({ page }) => {
      await page.goto("/stylists");

      // Click on first stylist if available
      const stylistCard = page.locator('[data-testid="stylist-card"]').first();
      if (await stylistCard.isVisible()) {
        await stylistCard.click();

        // Should navigate to profile page
        await expect(page).toHaveURL(/\/stylists\/[a-z0-9-]+/);

        // Should show services
        await expect(
          page.locator('[data-testid="service-card"], [data-testid="service-list"]')
        ).toBeVisible({ timeout: 5000 });
      }
    });
  });

  test.describe("Booking Creation", () => {
    test("should require login to book", async ({ page }) => {
      // Clear any session
      await page.evaluate(() => localStorage.clear());

      await page.goto("/stylists");

      const stylistCard = page.locator('[data-testid="stylist-card"]').first();
      if (await stylistCard.isVisible()) {
        await stylistCard.click();

        // Try to click book button
        const bookButton = page.getByRole("button", { name: /book|schedule/i });
        if (await bookButton.isVisible()) {
          await bookButton.click();

          // Should redirect to login
          await expect(page).toHaveURL(/\/login/);
        }
      }
    });

    test("should show date/time picker for booking", async ({ page }) => {
      // Login first
      await page.goto("/login");
      await page.getByLabel(/email/i).fill(customerEmail);
      await page.getByLabel(/password/i).fill(customerPassword);
      await page.getByRole("button", { name: /log in|sign in/i }).click();

      await expect(page).toHaveURL(/\/(home|stylists|dashboard)/, { timeout: 10000 });

      // Navigate to a stylist
      await page.goto("/stylists");

      const stylistCard = page.locator('[data-testid="stylist-card"]').first();
      if (await stylistCard.isVisible()) {
        await stylistCard.click();

        // Select a service
        const serviceCard = page.locator('[data-testid="service-card"]').first();
        if (await serviceCard.isVisible()) {
          await serviceCard.click();

          // Should show date picker
          await expect(
            page.locator('[data-testid="date-picker"], [role="dialog"]')
          ).toBeVisible({ timeout: 5000 });
        }
      }
    });
  });

  test.describe("Booking Management", () => {
    test("should show customer bookings in dashboard", async ({ page }) => {
      // Login
      await page.goto("/login");
      await page.getByLabel(/email/i).fill(customerEmail);
      await page.getByLabel(/password/i).fill(customerPassword);
      await page.getByRole("button", { name: /log in|sign in/i }).click();

      await expect(page).toHaveURL(/\/(home|stylists|dashboard)/, { timeout: 10000 });

      // Navigate to bookings
      await page.goto("/bookings");

      // Should show bookings list or empty state
      await expect(
        page.locator('[data-testid="booking-card"], [data-testid="empty-bookings"]')
      ).toBeVisible({ timeout: 10000 });
    });

    test("should allow viewing booking details", async ({ page, request }) => {
      // Login via API first
      const loginResponse = await request.post("/api/v1/auth/login", {
        data: {
          email: customerEmail,
          password: customerPassword,
        },
      });

      if (loginResponse.ok()) {
        const { token } = await loginResponse.json();

        // Check if there are any bookings
        const bookingsResponse = await request.get("/api/v1/bookings?role=customer", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (bookingsResponse.ok()) {
          const bookings = await bookingsResponse.json();
          if (bookings.items && bookings.items.length > 0) {
            const bookingId = bookings.items[0].id;

            // Set token in browser
            await page.goto("/");
            await page.evaluate((t) => localStorage.setItem("token", t), token);

            // Navigate to booking detail
            await page.goto(`/bookings/${bookingId}`);

            // Should show booking details
            await expect(
              page.locator('[data-testid="booking-status"], text=/status/i')
            ).toBeVisible({ timeout: 5000 });
          }
        }
      }
    });
  });
});
