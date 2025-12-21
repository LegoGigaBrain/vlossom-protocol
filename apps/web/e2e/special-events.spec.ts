/**
 * Special Events E2E Tests (V6.6.0)
 * Tests: Landing → Category Selection → Request Form → Submit
 */

import { test, expect } from "@playwright/test";

test.describe("Special Events", () => {
  test.describe("Landing Page", () => {
    test("should display special events landing page", async ({ page }) => {
      await page.goto("/special-events");

      // Should show hero section
      await expect(page.getByRole("heading", { name: /special events/i })).toBeVisible();
      await expect(
        page.getByText(/custom styling for weddings/i)
      ).toBeVisible();

      // Should show CTA button
      await expect(
        page.getByRole("button", { name: /request a quote/i })
      ).toBeVisible();
    });

    test("should display popular categories", async ({ page }) => {
      await page.goto("/special-events");

      // Should show popular categories section
      await expect(page.getByText(/popular categories/i)).toBeVisible();

      // Should show at least bridal category
      await expect(page.getByText(/bridal/i).first()).toBeVisible();
    });

    test("should display all event types", async ({ page }) => {
      await page.goto("/special-events");

      // Should show all event types section
      await expect(page.getByText(/all event types/i)).toBeVisible();

      // Should show all categories
      await expect(page.getByText(/bridal/i).first()).toBeVisible();
      await expect(page.getByText(/photoshoot/i).first()).toBeVisible();
      await expect(page.getByText(/corporate event/i).first()).toBeVisible();
      await expect(page.getByText(/party/i).first()).toBeVisible();
      await expect(page.getByText(/matric dance/i).first()).toBeVisible();
    });

    test("should display featured stylists", async ({ page }) => {
      await page.goto("/special-events");

      // Should show featured stylists section
      await expect(page.getByText(/top event stylists/i)).toBeVisible();
    });

    test("should display how it works section", async ({ page }) => {
      await page.goto("/special-events");

      // Should show how it works
      await expect(page.getByText(/how it works/i)).toBeVisible();
      await expect(page.getByText(/describe your event/i)).toBeVisible();
      await expect(page.getByText(/get custom quotes/i)).toBeVisible();
      await expect(page.getByText(/book & pay deposit/i)).toBeVisible();
    });

    test("should navigate to request form on CTA click", async ({ page }) => {
      await page.goto("/special-events");

      // Click CTA button
      await page.getByRole("button", { name: /request a quote/i }).first().click();

      // Should navigate to request form
      await expect(page).toHaveURL(/\/special-events\/request/);
    });

    test("should navigate to request form with category pre-selected", async ({ page }) => {
      await page.goto("/special-events");

      // Click on bridal category
      await page.getByText(/bridal/i).first().click();

      // Should navigate to request form with category param
      await expect(page).toHaveURL(/\/special-events\/request\?category=bridal/);
    });
  });

  test.describe("Request Form", () => {
    test("should display request form with steps", async ({ page }) => {
      await page.goto("/special-events/request");

      // Should show form title
      await expect(page.getByRole("heading", { name: /request a quote/i })).toBeVisible();

      // Should show progress steps
      await expect(page.getByText(/event details/i)).toBeVisible();
    });

    test("should show step 1: event details", async ({ page }) => {
      await page.goto("/special-events/request");

      // Should show event type selection
      await expect(page.getByText(/event type/i)).toBeVisible();

      // Should show date input
      await expect(page.getByLabel(/event date/i)).toBeVisible();

      // Should show description
      await expect(page.getByLabel(/describe your event/i)).toBeVisible();
    });

    test("should pre-select category from URL param", async ({ page }) => {
      await page.goto("/special-events/request?category=bridal");

      // Bridal should be selected
      const bridalButton = page.getByRole("button", { name: /bridal/i });
      await expect(bridalButton).toHaveClass(/bg-accent-orange/);
    });

    test("should validate required fields before proceeding", async ({ page }) => {
      await page.goto("/special-events/request");

      // Continue button should be disabled initially
      const continueButton = page.getByRole("button", { name: /continue/i });
      await expect(continueButton).toBeDisabled();

      // Fill required fields
      await page.getByRole("button", { name: /bridal/i }).click();
      await page.getByLabel(/event date/i).fill("2025-12-25");
      await page.getByLabel(/describe your event/i).fill("My wedding day styling");

      // Continue button should be enabled
      await expect(continueButton).toBeEnabled();
    });

    test("should navigate through all steps", async ({ page }) => {
      await page.goto("/special-events/request");

      // Step 1: Fill event details
      await page.getByRole("button", { name: /bridal/i }).click();
      await page.getByLabel(/event date/i).fill("2025-12-25");
      await page.getByLabel(/describe your event/i).fill("Wedding day hair styling for bride and bridesmaids");
      await page.getByRole("button", { name: /continue/i }).click();

      // Step 2: Select location
      await expect(page.getByText(/where will the styling happen/i)).toBeVisible();
      await page.getByText(/my location/i).click();
      await page.getByRole("button", { name: /continue/i }).click();

      // Step 3: Select services
      await expect(page.getByText(/what services do you need/i)).toBeVisible();
      // Hair Styling should already be selected
      await page.getByRole("button", { name: /continue/i }).click();

      // Step 4: Review
      await expect(page.getByText(/review your request/i)).toBeVisible();
      await expect(page.getByText(/bridal/i)).toBeVisible();
      await expect(page.getByText(/wedding day hair styling/i)).toBeVisible();
    });

    test("should allow going back between steps", async ({ page }) => {
      await page.goto("/special-events/request");

      // Step 1: Fill and continue
      await page.getByRole("button", { name: /bridal/i }).click();
      await page.getByLabel(/event date/i).fill("2025-12-25");
      await page.getByLabel(/describe your event/i).fill("Test event");
      await page.getByRole("button", { name: /continue/i }).click();

      // Step 2: Should be on location
      await expect(page.getByText(/where will the styling happen/i)).toBeVisible();

      // Go back
      await page.getByRole("button", { name: /back/i }).click();

      // Should be back on step 1
      await expect(page.getByText(/event type/i)).toBeVisible();
    });

    test("should show address input for home location", async ({ page }) => {
      await page.goto("/special-events/request");

      // Fill step 1
      await page.getByRole("button", { name: /bridal/i }).click();
      await page.getByLabel(/event date/i).fill("2025-12-25");
      await page.getByLabel(/describe your event/i).fill("Test");
      await page.getByRole("button", { name: /continue/i }).click();

      // Select "My Location"
      await page.getByText(/my location/i).click();

      // Address input should appear
      await expect(page.getByLabel(/your address/i)).toBeVisible();
    });

    test("should show venue address input for venue location", async ({ page }) => {
      await page.goto("/special-events/request");

      // Fill step 1
      await page.getByRole("button", { name: /bridal/i }).click();
      await page.getByLabel(/event date/i).fill("2025-12-25");
      await page.getByLabel(/describe your event/i).fill("Test");
      await page.getByRole("button", { name: /continue/i }).click();

      // Select "Event Venue"
      await page.getByText(/event venue/i).click();

      // Venue address input should appear
      await expect(page.getByLabel(/venue address/i)).toBeVisible();
    });

    test("should allow selecting multiple services", async ({ page }) => {
      await page.goto("/special-events/request");

      // Fill steps 1-2
      await page.getByRole("button", { name: /bridal/i }).click();
      await page.getByLabel(/event date/i).fill("2025-12-25");
      await page.getByLabel(/describe your event/i).fill("Test");
      await page.getByRole("button", { name: /continue/i }).click();
      await page.getByText(/my location/i).click();
      await page.getByRole("button", { name: /continue/i }).click();

      // Should be on services step
      await expect(page.getByText(/what services do you need/i)).toBeVisible();

      // Select additional services
      await page.getByText(/braiding/i).click();
      await page.getByText(/extensions/i).click();

      // Continue to review
      await page.getByRole("button", { name: /continue/i }).click();

      // Review should show selected services
      await expect(page.getByText(/hair styling/i)).toBeVisible();
      await expect(page.getByText(/braiding/i)).toBeVisible();
      await expect(page.getByText(/extensions/i)).toBeVisible();
    });

    test("should show info banner on review step", async ({ page }) => {
      await page.goto("/special-events/request");

      // Fill all steps
      await page.getByRole("button", { name: /bridal/i }).click();
      await page.getByLabel(/event date/i).fill("2025-12-25");
      await page.getByLabel(/describe your event/i).fill("Test");
      await page.getByRole("button", { name: /continue/i }).click();
      await page.getByText(/my location/i).click();
      await page.getByRole("button", { name: /continue/i }).click();
      await page.getByRole("button", { name: /continue/i }).click();

      // Should show info banner
      await expect(page.getByText(/what happens next/i)).toBeVisible();
      await expect(page.getByText(/24-48 hours/i)).toBeVisible();
    });

    test("should show submit button on review step", async ({ page }) => {
      await page.goto("/special-events/request");

      // Fill all steps
      await page.getByRole("button", { name: /bridal/i }).click();
      await page.getByLabel(/event date/i).fill("2025-12-25");
      await page.getByLabel(/describe your event/i).fill("Test");
      await page.getByRole("button", { name: /continue/i }).click();
      await page.getByText(/my location/i).click();
      await page.getByRole("button", { name: /continue/i }).click();
      await page.getByRole("button", { name: /continue/i }).click();

      // Should show submit button
      await expect(page.getByRole("button", { name: /submit request/i })).toBeVisible();
    });
  });

  test.describe("Home Page Integration", () => {
    test("should show special events quick action on home page", async ({ page }) => {
      // Navigate to home - may need auth
      await page.goto("/home");

      // If user is logged in, should show quick actions
      const specialEventsButton = page.getByText(/special events/i);
      if (await specialEventsButton.isVisible()) {
        await specialEventsButton.click();
        await expect(page).toHaveURL(/\/special-events/);
      }
    });
  });
});
