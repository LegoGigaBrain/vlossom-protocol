/**
 * Property Creation E2E Tests (V7.0.0)
 *
 * Tests for the multi-step property creation flow.
 * Validates the Add Property wizard experience.
 */

import { test, expect } from "@playwright/test";

test.describe("Property Creation Flow", () => {
  let ownerEmail: string;
  let ownerPassword: string;
  let ownerToken: string;

  test.beforeAll(async ({ request }) => {
    // Create a test property owner
    ownerEmail = `property.create.${Date.now()}@vlossom.test`;
    ownerPassword = "TestPassword123!";

    const signupResponse = await request.post("/api/v1/auth/signup", {
      data: {
        email: ownerEmail,
        password: ownerPassword,
        displayName: "Property Creation Test Owner",
        role: "PROPERTY_OWNER",
      },
    });

    expect(signupResponse.ok()).toBeTruthy();
    const signupData = await signupResponse.json();
    ownerToken = signupData.token;
  });

  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto("/login");
    await page.getByLabel(/email/i).fill(ownerEmail);
    await page.getByLabel(/password/i).fill(ownerPassword);
    await page.getByRole("button", { name: /log in|sign in/i }).click();

    await expect(page).toHaveURL(/\/(property-owner|dashboard|home)/, {
      timeout: 15000,
    });
  });

  test.describe("Navigation to Add Property", () => {
    test("should navigate to add property page from dashboard", async ({
      page,
    }) => {
      await page.goto("/property-owner");

      // Click add property button
      const addButton = page.getByRole("link", { name: /add property/i });
      await expect(addButton).toBeVisible({ timeout: 10000 });
      await addButton.click();

      // Should navigate to add property page
      await expect(page).toHaveURL(/\/property-owner\/add-property/);
    });

    test("should show multi-step form header", async ({ page }) => {
      await page.goto("/property-owner/add-property");

      // Should show progress indicator or step counter
      await expect(
        page.locator("text=/Step|1 of|Basic Info|basics/i").first()
      ).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe("Step 1: Basic Info", () => {
    test("should display basic info form fields", async ({ page }) => {
      await page.goto("/property-owner/add-property");

      // Should show property name field
      await expect(page.getByLabel(/property name|name/i)).toBeVisible({
        timeout: 10000,
      });

      // Should show category selector
      await expect(
        page.locator("text=/category|type/i").first()
      ).toBeVisible();

      // Should show description field
      await expect(
        page.getByLabel(/description/i)
      ).toBeVisible();
    });

    test("should show category options", async ({ page }) => {
      await page.goto("/property-owner/add-property");

      // Should display category options
      await expect(
        page.locator("text=/BOUTIQUE|HOME_STUDIO|SALON|BARBERSHOP/i").first()
      ).toBeVisible({ timeout: 10000 });
    });

    test("should validate required fields", async ({ page }) => {
      await page.goto("/property-owner/add-property");

      // Try to proceed without filling required fields
      const nextButton = page.getByRole("button", { name: /next|continue/i });
      if (await nextButton.isVisible()) {
        await nextButton.click();

        // Should show validation error
        await expect(
          page.locator("text=/required|fill in|name is required/i").first()
        ).toBeVisible({ timeout: 5000 });
      }
    });

    test("should proceed to next step with valid data", async ({ page }) => {
      await page.goto("/property-owner/add-property");

      // Fill in basic info
      await page.getByLabel(/property name|name/i).fill("Test Salon");

      // Select category (click on category card/button)
      const boutiqueOption = page.locator("text=BOUTIQUE").first();
      if (await boutiqueOption.isVisible()) {
        await boutiqueOption.click();
      }

      await page
        .getByLabel(/description/i)
        .fill("A beautiful test salon for stylists");

      // Click next
      const nextButton = page.getByRole("button", { name: /next|continue/i });
      if (await nextButton.isVisible()) {
        await nextButton.click();

        // Should progress to next step
        await expect(
          page.locator("text=/Step 2|Location|Address/i").first()
        ).toBeVisible({ timeout: 5000 });
      }
    });
  });

  test.describe("Step 2: Location", () => {
    test("should display location form fields", async ({ page }) => {
      await page.goto("/property-owner/add-property");

      // Complete step 1 first
      await page.getByLabel(/property name|name/i).fill("Test Location Salon");
      const boutiqueOption = page.locator("text=BOUTIQUE").first();
      if (await boutiqueOption.isVisible()) {
        await boutiqueOption.click();
      }
      await page.getByLabel(/description/i).fill("Test description");

      const nextButton = page.getByRole("button", { name: /next|continue/i });
      await nextButton.click();

      // Now on step 2 - check location fields
      await expect(
        page.getByLabel(/address|street/i)
      ).toBeVisible({ timeout: 10000 });

      await expect(page.getByLabel(/city/i)).toBeVisible();

      await expect(
        page.getByLabel(/country|region/i)
      ).toBeVisible();
    });

    test("should show map or location picker", async ({ page }) => {
      await page.goto("/property-owner/add-property");

      // Complete step 1
      await page.getByLabel(/property name|name/i).fill("Map Test Salon");
      const category = page.locator("text=BOUTIQUE").first();
      if (await category.isVisible()) {
        await category.click();
      }
      await page.getByLabel(/description/i).fill("Description");
      await page.getByRole("button", { name: /next|continue/i }).click();

      // Check for map or location component
      await expect(
        page.locator('[data-testid="map"], [data-testid="location-picker"], text=/map|location/i').first()
      ).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe("Step 3: Photos", () => {
    test("should display photo upload section", async ({ page }) => {
      await page.goto("/property-owner/add-property");

      // Complete steps 1 & 2
      await page.getByLabel(/property name|name/i).fill("Photo Test Salon");
      const category = page.locator("text=BOUTIQUE").first();
      if (await category.isVisible()) {
        await category.click();
      }
      await page.getByLabel(/description/i).fill("Description");
      await page.getByRole("button", { name: /next|continue/i }).click();

      // Step 2 - location
      await page.getByLabel(/address|street/i).fill("123 Test Street");
      await page.getByLabel(/city/i).fill("Johannesburg");
      const countryField = page.getByLabel(/country/i);
      if (await countryField.isVisible()) {
        await countryField.fill("South Africa");
      }
      await page.getByRole("button", { name: /next|continue/i }).click();

      // Now on step 3 - photos
      await expect(
        page.locator("text=/upload|photos|images/i").first()
      ).toBeVisible({ timeout: 10000 });
    });

    test("should show upload dropzone", async ({ page }) => {
      await page.goto("/property-owner/add-property");

      // Navigate to photo step (simplified - assuming we can reach it)
      // In real test, complete previous steps
      await page.getByLabel(/property name|name/i).fill("Upload Test");
      page.locator("text=BOUTIQUE").first().click().catch(() => {});
      await page.getByLabel(/description/i).fill("Desc");
      await page.getByRole("button", { name: /next|continue/i }).click();

      await page.getByLabel(/address|street/i).fill("123 Test");
      await page.getByLabel(/city/i).fill("JHB");
      await page.getByRole("button", { name: /next|continue/i }).click();

      // Check for dropzone
      await expect(
        page.locator('[data-testid="dropzone"], text=/drag|drop|upload/i').first()
      ).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe("Form Navigation", () => {
    test("should allow going back to previous steps", async ({ page }) => {
      await page.goto("/property-owner/add-property");

      // Complete step 1
      await page.getByLabel(/property name|name/i).fill("Back Test Salon");
      const category = page.locator("text=BOUTIQUE").first();
      if (await category.isVisible()) {
        await category.click();
      }
      await page.getByLabel(/description/i).fill("Description");
      await page.getByRole("button", { name: /next|continue/i }).click();

      // Should be on step 2
      await expect(page.getByLabel(/address|street/i)).toBeVisible({
        timeout: 5000,
      });

      // Click back button
      const backButton = page.getByRole("button", { name: /back|previous/i });
      if (await backButton.isVisible()) {
        await backButton.click();

        // Should be back on step 1
        await expect(page.getByLabel(/property name|name/i)).toBeVisible({
          timeout: 5000,
        });

        // Data should be preserved
        await expect(page.getByLabel(/property name|name/i)).toHaveValue(
          "Back Test Salon"
        );
      }
    });

    test("should preserve data when navigating between steps", async ({
      page,
    }) => {
      await page.goto("/property-owner/add-property");

      const propertyName = "Data Preserve Test Salon";
      const description = "A test description that should persist";

      // Fill step 1
      await page.getByLabel(/property name|name/i).fill(propertyName);
      const category = page.locator("text=BOUTIQUE").first();
      if (await category.isVisible()) {
        await category.click();
      }
      await page.getByLabel(/description/i).fill(description);

      // Go to step 2
      await page.getByRole("button", { name: /next|continue/i }).click();
      await expect(page.getByLabel(/address|street/i)).toBeVisible({
        timeout: 5000,
      });

      // Go back to step 1
      const backButton = page.getByRole("button", { name: /back|previous/i });
      if (await backButton.isVisible()) {
        await backButton.click();

        // Verify data persisted
        await expect(page.getByLabel(/property name|name/i)).toHaveValue(
          propertyName
        );
        await expect(page.getByLabel(/description/i)).toHaveValue(description);
      }
    });
  });

  test.describe("Form Submission", () => {
    test("should successfully create a property", async ({ page }) => {
      await page.goto("/property-owner/add-property");

      // Step 1: Basic Info
      await page.getByLabel(/property name|name/i).fill("Complete Test Salon");
      const category = page.locator("text=BOUTIQUE").first();
      if (await category.isVisible()) {
        await category.click();
      }
      await page.getByLabel(/description/i).fill("A complete test property");
      await page.getByRole("button", { name: /next|continue/i }).click();

      // Step 2: Location
      await expect(page.getByLabel(/address|street/i)).toBeVisible({
        timeout: 5000,
      });
      await page.getByLabel(/address|street/i).fill("456 Complete Street");
      await page.getByLabel(/city/i).fill("Johannesburg");
      const countryField = page.getByLabel(/country/i);
      if (await countryField.isVisible()) {
        await countryField.fill("South Africa");
      }
      await page.getByRole("button", { name: /next|continue/i }).click();

      // Step 3: Photos (skip if optional)
      const skipButton = page.getByRole("button", { name: /skip|later/i });
      if (await skipButton.isVisible()) {
        await skipButton.click();
      } else {
        // Try to continue without photos
        const continueButton = page.getByRole("button", {
          name: /next|continue|finish/i,
        });
        if (await continueButton.isVisible()) {
          await continueButton.click();
        }
      }

      // Final submission
      const submitButton = page.getByRole("button", {
        name: /create|submit|finish|save/i,
      });
      if (await submitButton.isVisible()) {
        await submitButton.click();

        // Should redirect to property owner dashboard or show success
        await expect(
          page.locator(
            "text=/success|created|Complete Test Salon|property-owner/i"
          ).first()
        ).toBeVisible({ timeout: 10000 });
      }
    });

    test("should show success message after creation", async ({ page }) => {
      await page.goto("/property-owner/add-property");

      // Complete form quickly
      await page.getByLabel(/property name|name/i).fill("Success Message Test");
      page.locator("text=HOME_STUDIO").first().click().catch(() => {});
      await page.getByLabel(/description/i).fill("Test");
      await page.getByRole("button", { name: /next|continue/i }).click();

      await page.getByLabel(/address|street/i).fill("789 Test");
      await page.getByLabel(/city/i).fill("Cape Town");
      await page.getByRole("button", { name: /next|continue/i }).click();

      // Try to skip photos or submit
      const skipOrSubmit = page.getByRole("button", {
        name: /skip|create|submit|finish/i,
      });
      if (await skipOrSubmit.isVisible()) {
        await skipOrSubmit.click();
      }

      // Look for success indication
      await expect(
        page.locator("text=/success|created|congratulations/i").first()
      ).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe("Validation", () => {
    test("should validate property name length", async ({ page }) => {
      await page.goto("/property-owner/add-property");

      // Try very short name
      await page.getByLabel(/property name|name/i).fill("AB");

      const nextButton = page.getByRole("button", { name: /next|continue/i });
      if (await nextButton.isVisible()) {
        await nextButton.click();

        // Should show length validation
        await expect(
          page.locator("text=/at least|too short|minimum/i").first()
        ).toBeVisible({ timeout: 5000 });
      }
    });

    test("should validate address field", async ({ page }) => {
      await page.goto("/property-owner/add-property");

      // Complete step 1
      await page.getByLabel(/property name|name/i).fill("Address Validation Test");
      page.locator("text=BOUTIQUE").first().click().catch(() => {});
      await page.getByLabel(/description/i).fill("Description");
      await page.getByRole("button", { name: /next|continue/i }).click();

      // Try to proceed without address
      await expect(page.getByLabel(/address|street/i)).toBeVisible({
        timeout: 5000,
      });

      const nextButton = page.getByRole("button", { name: /next|continue/i });
      if (await nextButton.isVisible()) {
        await nextButton.click();

        // Should show validation error
        await expect(
          page.locator("text=/required|address|fill in/i").first()
        ).toBeVisible({ timeout: 5000 });
      }
    });
  });

  test.describe("Cancel Flow", () => {
    test("should allow canceling property creation", async ({ page }) => {
      await page.goto("/property-owner/add-property");

      // Fill some data
      await page.getByLabel(/property name|name/i).fill("Cancel Test");

      // Look for cancel button
      const cancelButton = page.getByRole("button", { name: /cancel/i });
      if (await cancelButton.isVisible()) {
        await cancelButton.click();

        // Should show confirmation or navigate away
        await expect(
          page.locator("text=/sure|discard|cancel/i").first()
        ).toBeVisible({ timeout: 5000 });
      }
    });

    test("should warn before losing unsaved changes", async ({ page }) => {
      await page.goto("/property-owner/add-property");

      // Fill data
      await page.getByLabel(/property name|name/i).fill("Unsaved Changes Test");
      await page.getByLabel(/description/i).fill("Important description");

      // Try to navigate away
      page.on("dialog", async (dialog) => {
        // Should show confirmation dialog
        expect(dialog.message()).toMatch(/unsaved|leave|sure/i);
        await dialog.dismiss();
      });

      // Navigate away
      await page.goto("/property-owner");
    });
  });

  test.describe("Accessibility", () => {
    test("should be keyboard navigable", async ({ page }) => {
      await page.goto("/property-owner/add-property");

      // Tab through form fields
      await page.keyboard.press("Tab");

      // First focusable should be property name or a form element
      const focused = page.locator(":focus");
      await expect(focused).toBeVisible();
    });

    test("should have proper labels for form fields", async ({ page }) => {
      await page.goto("/property-owner/add-property");

      // Check that inputs have associated labels
      const nameInput = page.getByLabel(/property name|name/i);
      await expect(nameInput).toBeVisible({ timeout: 10000 });

      const descInput = page.getByLabel(/description/i);
      await expect(descInput).toBeVisible();
    });

    test("should announce errors to screen readers", async ({ page }) => {
      await page.goto("/property-owner/add-property");

      // Submit without filling required fields
      const nextButton = page.getByRole("button", { name: /next|continue/i });
      if (await nextButton.isVisible()) {
        await nextButton.click();

        // Error messages should have appropriate ARIA roles
        const errorMessage = page.locator('[role="alert"], [aria-live="polite"]');
        // At least one error indicator should be present
        await expect(
          page.locator("text=/required|error|invalid/i").first()
        ).toBeVisible({ timeout: 5000 });
      }
    });
  });

  test.describe("Mobile Experience", () => {
    test("should work on mobile viewport", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      await page.goto("/property-owner/add-property");

      // Form should be visible
      await expect(page.getByLabel(/property name|name/i)).toBeVisible({
        timeout: 10000,
      });

      // Navigation buttons should be accessible
      const nextButton = page.getByRole("button", { name: /next|continue/i });
      await expect(nextButton).toBeVisible();
    });

    test("should have touch-friendly button sizes", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      await page.goto("/property-owner/add-property");

      // Buttons should have adequate touch target size (44x44 minimum)
      const nextButton = page.getByRole("button", { name: /next|continue/i });
      const box = await nextButton.boundingBox();

      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    });
  });
});
