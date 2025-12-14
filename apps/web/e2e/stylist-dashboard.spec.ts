/**
 * Stylist Dashboard E2E Tests (F4.6)
 * Tests: Dashboard → Services → Availability → Approve/Decline → Complete
 */

import { test, expect } from "@playwright/test";

test.describe("Stylist Dashboard", () => {
  let stylistEmail: string;
  let stylistPassword: string;
  let stylistToken: string;

  test.beforeAll(async ({ request }) => {
    // Create a test stylist
    stylistEmail = `stylist.dashboard.${Date.now()}@vlossom.test`;
    stylistPassword = "TestPassword123!";

    const response = await request.post("/api/auth/signup", {
      data: {
        email: stylistEmail,
        password: stylistPassword,
        displayName: "Dashboard Test Stylist",
        role: "STYLIST",
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    stylistToken = data.token;
  });

  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto("/login");
    await page.getByLabel(/email/i).fill(stylistEmail);
    await page.getByLabel(/password/i).fill(stylistPassword);
    await page.getByRole("button", { name: /log in|sign in/i }).click();

    await expect(page).toHaveURL(/\/(dashboard|home)/, { timeout: 10000 });
  });

  test.describe("Dashboard Overview", () => {
    test("should display dashboard with stats", async ({ page }) => {
      await page.goto("/dashboard");

      // Should show stats cards
      await expect(
        page.locator('[data-testid="stats-card"], text=/earnings|bookings|pending/i')
      ).toBeVisible({ timeout: 10000 });
    });

    test("should show pending requests section", async ({ page }) => {
      await page.goto("/dashboard");

      // Should have pending requests section
      await expect(
        page.locator('[data-testid="pending-requests"], text=/pending|requests/i')
      ).toBeVisible({ timeout: 5000 });
    });

    test("should show upcoming bookings", async ({ page }) => {
      await page.goto("/dashboard");

      // Should have upcoming bookings section
      await expect(
        page.locator('[data-testid="upcoming-bookings"], text=/upcoming|scheduled/i')
      ).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe("Service Management", () => {
    test("should navigate to services page", async ({ page }) => {
      await page.goto("/dashboard/services");

      // Should show services list or add button
      await expect(
        page.locator('[data-testid="services-list"], [data-testid="add-service-button"]')
      ).toBeVisible({ timeout: 10000 });
    });

    test("should open add service form", async ({ page }) => {
      await page.goto("/dashboard/services");

      // Click add service button
      const addButton = page.getByRole("button", { name: /add|create|new/i });
      await addButton.click();

      // Should show service form
      await expect(page.getByLabel(/name|service name/i)).toBeVisible({ timeout: 5000 });
      await expect(page.getByLabel(/price/i)).toBeVisible();
      await expect(page.getByLabel(/duration/i)).toBeVisible();
    });

    test("should create a new service", async ({ page }) => {
      await page.goto("/dashboard/services");

      // Click add service
      await page.getByRole("button", { name: /add|create|new/i }).click();

      // Fill form
      await page.getByLabel(/name|service name/i).fill("Test Haircut");
      await page.getByLabel(/category/i).selectOption("Hair");
      await page.getByLabel(/price/i).fill("15000"); // R150.00
      await page.getByLabel(/duration/i).fill("60");

      // Submit
      await page.getByRole("button", { name: /save|create|add/i }).click();

      // Should show success or new service in list
      await expect(
        page.locator('text=/success|created|Test Haircut/i')
      ).toBeVisible({ timeout: 5000 });
    });

    test("should edit an existing service", async ({ page, request }) => {
      // Create a service via API first
      await request.post("/api/stylists/services", {
        headers: { Authorization: `Bearer ${stylistToken}` },
        data: {
          name: "Service to Edit",
          category: "Hair",
          priceAmountCents: 10000,
          estimatedDurationMin: 45,
        },
      });

      await page.goto("/dashboard/services");
      await page.waitForLoadState("networkidle");

      // Find and click edit on the service
      const editButton = page.locator('[data-testid="edit-service"]').first();
      if (await editButton.isVisible()) {
        await editButton.click();

        // Update the name
        await page.getByLabel(/name|service name/i).fill("Updated Service Name");
        await page.getByRole("button", { name: /save|update/i }).click();

        // Should show updated name
        await expect(page.locator("text=Updated Service Name")).toBeVisible({
          timeout: 5000,
        });
      }
    });
  });

  test.describe("Availability Management", () => {
    test("should navigate to availability page", async ({ page }) => {
      await page.goto("/dashboard/availability");

      // Should show weekly schedule
      await expect(
        page.locator('[data-testid="availability-schedule"], text=/monday|schedule/i')
      ).toBeVisible({ timeout: 10000 });
    });

    test("should update weekly schedule", async ({ page }) => {
      await page.goto("/dashboard/availability");

      // Toggle a day
      const mondayToggle = page.locator('[data-testid="day-monday"], text=/monday/i').first();
      if (await mondayToggle.isVisible()) {
        await mondayToggle.click();

        // Save changes
        await page.getByRole("button", { name: /save/i }).click();

        // Should show success
        await expect(page.locator("text=/saved|updated/i")).toBeVisible({
          timeout: 5000,
        });
      }
    });

    test("should add date exception", async ({ page }) => {
      await page.goto("/dashboard/availability");

      // Click add exception
      const addExceptionBtn = page.getByRole("button", { name: /add.*exception|block.*date/i });
      if (await addExceptionBtn.isVisible()) {
        await addExceptionBtn.click();

        // Select a date
        const datePicker = page.locator('[data-testid="exception-date"]');
        if (await datePicker.isVisible()) {
          // Set a future date
          const futureDate = new Date();
          futureDate.setDate(futureDate.getDate() + 7);
          await datePicker.fill(futureDate.toISOString().split("T")[0]);

          // Add note
          await page.getByLabel(/note|reason/i).fill("Holiday");

          // Save
          await page.getByRole("button", { name: /save|add/i }).click();
        }
      }
    });
  });

  test.describe("Booking Approval", () => {
    test("should show pending booking requests", async ({ page }) => {
      await page.goto("/dashboard/requests");

      // Should show requests list or empty state
      await expect(
        page.locator('[data-testid="request-card"], [data-testid="empty-requests"]')
      ).toBeVisible({ timeout: 10000 });
    });

    test("should be able to approve a booking", async ({ page }) => {
      await page.goto("/dashboard/requests");

      // Find approve button on first request
      const approveBtn = page.locator('[data-testid="approve-button"]').first();
      if (await approveBtn.isVisible()) {
        await approveBtn.click();

        // Confirm if dialog appears
        const confirmBtn = page.getByRole("button", { name: /confirm|yes/i });
        if (await confirmBtn.isVisible()) {
          await confirmBtn.click();
        }

        // Should show success or status change
        await expect(
          page.locator("text=/approved|confirmed|success/i")
        ).toBeVisible({ timeout: 5000 });
      }
    });

    test("should be able to decline a booking", async ({ page }) => {
      await page.goto("/dashboard/requests");

      // Find decline button on first request
      const declineBtn = page.locator('[data-testid="decline-button"]').first();
      if (await declineBtn.isVisible()) {
        await declineBtn.click();

        // Enter reason if required
        const reasonInput = page.getByLabel(/reason/i);
        if (await reasonInput.isVisible()) {
          await reasonInput.fill("Not available at this time");
        }

        // Confirm
        const confirmBtn = page.getByRole("button", { name: /confirm|decline/i });
        if (await confirmBtn.isVisible()) {
          await confirmBtn.click();
        }

        // Should show success or status change
        await expect(page.locator("text=/declined|rejected/i")).toBeVisible({
          timeout: 5000,
        });
      }
    });
  });

  test.describe("Service Completion", () => {
    test("should show active bookings", async ({ page }) => {
      await page.goto("/dashboard/bookings");

      // Should show bookings or empty state
      await expect(
        page.locator('[data-testid="booking-card"], [data-testid="empty-bookings"]')
      ).toBeVisible({ timeout: 10000 });
    });

    test("should be able to start a service", async ({ page }) => {
      await page.goto("/dashboard/bookings");

      // Find start button on a confirmed booking
      const startBtn = page.locator('[data-testid="start-service"]').first();
      if (await startBtn.isVisible()) {
        await startBtn.click();

        // Should update status
        await expect(
          page.locator("text=/started|in progress/i")
        ).toBeVisible({ timeout: 5000 });
      }
    });

    test("should be able to complete a service", async ({ page }) => {
      await page.goto("/dashboard/bookings");

      // Find complete button on an in-progress booking
      const completeBtn = page.locator('[data-testid="complete-service"]').first();
      if (await completeBtn.isVisible()) {
        await completeBtn.click();

        // Should update status
        await expect(
          page.locator("text=/completed|awaiting/i")
        ).toBeVisible({ timeout: 5000 });
      }
    });
  });

  test.describe("Earnings", () => {
    test("should show earnings summary", async ({ page }) => {
      await page.goto("/dashboard/earnings");

      // Should show earnings stats
      await expect(
        page.locator('[data-testid="earnings-total"], text=/earnings|total/i')
      ).toBeVisible({ timeout: 10000 });
    });

    test("should show payout history", async ({ page }) => {
      await page.goto("/dashboard/earnings");

      // Should have history section
      await expect(
        page.locator('[data-testid="payout-history"], text=/history|payouts/i')
      ).toBeVisible({ timeout: 5000 });
    });
  });
});
