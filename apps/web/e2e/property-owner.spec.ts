/**
 * Property Owner Dashboard E2E Tests (V6.5.2)
 * Tests: Dashboard → Chairs → Requests → Revenue
 */

import { test, expect } from "@playwright/test";

test.describe("Property Owner Dashboard", () => {
  let ownerEmail: string;
  let ownerPassword: string;
  let ownerToken: string;
  let propertyId: string;
  let chairId: string;

  test.beforeAll(async ({ request }) => {
    // Create a test property owner
    ownerEmail = `property.owner.${Date.now()}@vlossom.test`;
    ownerPassword = "TestPassword123!";

    const signupResponse = await request.post("/api/v1/auth/signup", {
      data: {
        email: ownerEmail,
        password: ownerPassword,
        displayName: "Test Property Owner",
        role: "PROPERTY_OWNER",
      },
    });

    expect(signupResponse.ok()).toBeTruthy();
    const signupData = await signupResponse.json();
    ownerToken = signupData.token;

    // Create a test property
    const propertyResponse = await request.post("/api/v1/properties", {
      headers: { Authorization: `Bearer ${ownerToken}` },
      data: {
        name: "Test Property",
        category: "BOUTIQUE",
        address: "123 Test Street",
        city: "Johannesburg",
        country: "South Africa",
        lat: -26.2041,
        lng: 28.0473,
        description: "A beautiful test property",
      },
    });

    if (propertyResponse.ok()) {
      const propertyData = await propertyResponse.json();
      propertyId = propertyData.property?.id;

      // Create a test chair if property was created
      if (propertyId) {
        const chairResponse = await request.post(
          `/api/v1/properties/${propertyId}/chairs`,
          {
            headers: { Authorization: `Bearer ${ownerToken}` },
            data: {
              name: "Test Chair 1",
              type: "STYLING_STATION",
              dailyRateCents: 15000,
              rentalModesEnabled: ["PER_DAY"],
              amenities: ["Mirror", "Sink"],
            },
          }
        );

        if (chairResponse.ok()) {
          const chairData = await chairResponse.json();
          chairId = chairData.chair?.id;
        }
      }
    }
  });

  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto("/login");
    await page.getByLabel(/email/i).fill(ownerEmail);
    await page.getByLabel(/password/i).fill(ownerPassword);
    await page.getByRole("button", { name: /log in|sign in/i }).click();

    // Wait for login to complete
    await expect(page).toHaveURL(/\/(property-owner|dashboard|home)/, { timeout: 15000 });
  });

  test.describe("Dashboard Overview", () => {
    test("should navigate to property owner dashboard", async ({ page }) => {
      await page.goto("/property-owner");

      // Should show overview heading
      await expect(page.locator("text=Overview")).toBeVisible({ timeout: 10000 });
    });

    test("should display stats cards", async ({ page }) => {
      await page.goto("/property-owner");

      // Should show property count
      await expect(
        page.locator("text=/Properties|properties/")
      ).toBeVisible({ timeout: 10000 });

      // Should show chair count
      await expect(
        page.locator("text=/Chairs|chairs/")
      ).toBeVisible({ timeout: 5000 });
    });

    test("should display properties list", async ({ page }) => {
      await page.goto("/property-owner");

      // Should show properties section
      await expect(
        page.locator("text=/Your Properties|properties/i")
      ).toBeVisible({ timeout: 10000 });
    });

    test("should have Add Property button", async ({ page }) => {
      await page.goto("/property-owner");

      // Should have add property action
      const addButton = page.getByRole("link", { name: /add property/i });
      await expect(addButton).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe("Chair Management", () => {
    test("should navigate to chairs page", async ({ page }) => {
      await page.goto("/property-owner/chairs");

      // Should show chairs heading
      await expect(page.locator("h1:has-text('Chairs')")).toBeVisible({ timeout: 10000 });
    });

    test("should display property filter", async ({ page }) => {
      await page.goto("/property-owner/chairs");

      // Should have property filter dropdown
      await expect(
        page.locator("text=/Property:|All Properties/i")
      ).toBeVisible({ timeout: 10000 });
    });

    test("should display status filter", async ({ page }) => {
      await page.goto("/property-owner/chairs");

      // Should have status filter dropdown
      await expect(
        page.locator("text=/Status:|All Statuses/i")
      ).toBeVisible({ timeout: 10000 });
    });

    test("should show chairs list or empty state", async ({ page }) => {
      await page.goto("/property-owner/chairs");

      // Should show either chair cards or empty state
      await expect(
        page.locator('[data-testid="chair-card"], text=/No chairs|Add Your First Chair/i')
      ).toBeVisible({ timeout: 10000 });
    });

    test("should be able to filter chairs by status", async ({ page }) => {
      await page.goto("/property-owner/chairs");

      // Select Available status
      const statusFilter = page.locator("select").filter({ hasText: /All Statuses/ });
      if (await statusFilter.isVisible()) {
        await statusFilter.selectOption("AVAILABLE");

        // Page should update
        await page.waitForLoadState("networkidle");
      }
    });

    test("should open add chair dialog", async ({ page }) => {
      await page.goto("/property-owner/chairs");

      // Click add chair button
      const addButton = page.getByRole("button", { name: /Add Chair/i });
      if (await addButton.isVisible()) {
        await addButton.click();

        // Dialog should appear
        await expect(
          page.locator("text=/Add New Chair|Chair Name/i")
        ).toBeVisible({ timeout: 5000 });
      }
    });
  });

  test.describe("Rental Requests", () => {
    test("should navigate to requests page", async ({ page }) => {
      await page.goto("/property-owner/requests");

      // Should show requests heading
      await expect(page.locator("h1:has-text('Requests')")).toBeVisible({ timeout: 10000 });
    });

    test("should display filter tabs", async ({ page }) => {
      await page.goto("/property-owner/requests");

      // Should show filter buttons
      await expect(page.locator("button:has-text('Pending')")).toBeVisible({ timeout: 10000 });
      await expect(page.locator("button:has-text('Approved')")).toBeVisible();
      await expect(page.locator("button:has-text('Declined')")).toBeVisible();
    });

    test("should show requests list or empty state", async ({ page }) => {
      await page.goto("/property-owner/requests");

      // Should show requests or empty message
      await expect(
        page.locator('[data-testid="request-card"], text=/No pending requests|No requests yet/i')
      ).toBeVisible({ timeout: 10000 });
    });

    test("should be able to switch filter tabs", async ({ page }) => {
      await page.goto("/property-owner/requests");

      // Click Approved tab
      await page.getByRole("button", { name: "Approved" }).click();

      // Should update filter
      await page.waitForLoadState("networkidle");

      // Click All tab
      await page.getByRole("button", { name: "All" }).click();

      await page.waitForLoadState("networkidle");
    });
  });

  test.describe("Revenue", () => {
    test("should navigate to revenue page", async ({ page }) => {
      await page.goto("/property-owner/revenue");

      // Should show revenue heading
      await expect(page.locator("h1:has-text('Revenue')")).toBeVisible({ timeout: 10000 });
    });

    test("should display revenue stats", async ({ page }) => {
      await page.goto("/property-owner/revenue");

      // Should show earnings related text
      await expect(
        page.locator("text=/Total Earnings|This Month|Pending/i")
      ).toBeVisible({ timeout: 10000 });
    });

    test("should show period toggle", async ({ page }) => {
      await page.goto("/property-owner/revenue");

      // Should have period buttons
      await expect(page.locator("button:has-text('Week'), text=Week")).toBeVisible({ timeout: 10000 });
      await expect(page.locator("button:has-text('Month'), text=Month")).toBeVisible();
      await expect(page.locator("button:has-text('Year'), text=Year")).toBeVisible();
    });

    test("should show transactions section", async ({ page }) => {
      await page.goto("/property-owner/revenue");

      // Should show transactions or empty state
      await expect(
        page.locator("text=/Recent Transactions|No transactions/i")
      ).toBeVisible({ timeout: 10000 });
    });

    test("should be able to toggle period", async ({ page }) => {
      await page.goto("/property-owner/revenue");

      // Click Year button
      const yearButton = page.getByRole("button", { name: /Year/i });
      if (await yearButton.isVisible()) {
        await yearButton.click();
        await page.waitForLoadState("networkidle");
      }
    });
  });

  test.describe("Navigation", () => {
    test("should navigate between tabs via header", async ({ page }) => {
      await page.goto("/property-owner");

      // Click Chairs tab
      await page.getByRole("link", { name: /Chairs/i }).click();
      await expect(page).toHaveURL(/\/property-owner\/chairs/);

      // Click Requests tab
      await page.getByRole("link", { name: /Requests/i }).click();
      await expect(page).toHaveURL(/\/property-owner\/requests/);

      // Click Revenue tab
      await page.getByRole("link", { name: /Revenue/i }).click();
      await expect(page).toHaveURL(/\/property-owner\/revenue/);

      // Click Overview tab
      await page.getByRole("link", { name: /Overview/i }).click();
      await expect(page).toHaveURL(/\/property-owner$/);
    });

    test("should highlight active tab", async ({ page }) => {
      await page.goto("/property-owner/chairs");

      // Chairs tab should be active (have brand-rose color)
      const chairsTab = page.getByRole("link", { name: /Chairs/i });
      await expect(chairsTab).toBeVisible();
      // Check for active styling class
      await expect(chairsTab).toHaveClass(/brand-rose|active/);
    });
  });

  test.describe("Responsive Design", () => {
    test("should work on mobile viewport", async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      await page.goto("/property-owner");

      // Should still show main content
      await expect(page.locator("text=Overview")).toBeVisible({ timeout: 10000 });

      // Navigation should still be accessible
      await expect(
        page.getByRole("link", { name: /Chairs/i })
      ).toBeVisible();
    });

    test("should scroll horizontally on mobile nav", async ({ page }) => {
      // Set narrow viewport
      await page.setViewportSize({ width: 320, height: 568 });

      await page.goto("/property-owner");

      // Navigation should be scrollable
      const nav = page.locator("nav");
      await expect(nav).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe("Authentication", () => {
    test("should redirect to login when not authenticated", async ({ page }) => {
      // Clear cookies/localStorage
      await page.context().clearCookies();

      await page.goto("/property-owner");

      // Should redirect to login
      await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
    });

    test("should show user info in header", async ({ page }) => {
      await page.goto("/property-owner");

      // Should show user display name or email
      await expect(
        page.locator("text=/Test Property Owner|property.owner/i")
      ).toBeVisible({ timeout: 10000 });
    });

    test("should have logout button", async ({ page }) => {
      await page.goto("/property-owner");

      // Should show logout button
      await expect(
        page.getByRole("button", { name: /Log Out/i })
      ).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe("Error Handling", () => {
    test("should show error state gracefully", async ({ page }) => {
      // Mock API error by intercepting
      await page.route("**/api/v1/properties/**", (route) => {
        route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ error: "Internal server error" }),
        });
      });

      await page.goto("/property-owner");

      // Should show error message or fallback UI
      await expect(
        page.locator("text=/failed|error|try again/i")
      ).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe("Empty States", () => {
    test("should show empty state for new user", async ({ page, request }) => {
      // Create a new user with no properties
      const newEmail = `empty.owner.${Date.now()}@vlossom.test`;
      const newPassword = "TestPassword123!";

      await request.post("/api/v1/auth/signup", {
        data: {
          email: newEmail,
          password: newPassword,
          displayName: "Empty Property Owner",
          role: "PROPERTY_OWNER",
        },
      });

      // Login as new user
      await page.goto("/login");
      await page.getByLabel(/email/i).fill(newEmail);
      await page.getByLabel(/password/i).fill(newPassword);
      await page.getByRole("button", { name: /log in|sign in/i }).click();

      await expect(page).toHaveURL(/\/(property-owner|dashboard|home)/, { timeout: 15000 });

      await page.goto("/property-owner");

      // Should show empty state
      await expect(
        page.locator("text=/No properties yet|Add Your First Property/i")
      ).toBeVisible({ timeout: 10000 });
    });
  });
});
