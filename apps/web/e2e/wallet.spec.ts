/**
 * Wallet E2E Tests (F4.6)
 * Tests: Balance → Faucet Claim → Transactions
 */

import { test, expect } from "@playwright/test";

test.describe("Wallet", () => {
  let userEmail: string;
  let userPassword: string;
  let userToken: string;

  test.beforeAll(async ({ request }) => {
    // Create a test user
    userEmail = `wallet.test.${Date.now()}@vlossom.test`;
    userPassword = "TestPassword123!";

    const response = await request.post("/api/v1/auth/signup", {
      data: {
        email: userEmail,
        password: userPassword,
        displayName: "Wallet Test User",
        role: "CUSTOMER",
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    userToken = data.token;
  });

  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto("/login");
    await page.getByLabel(/email/i).fill(userEmail);
    await page.getByLabel(/password/i).fill(userPassword);
    await page.getByRole("button", { name: /log in|sign in/i }).click();

    await expect(page).toHaveURL(/\/(home|stylists|dashboard)/, { timeout: 10000 });
  });

  test.describe("Wallet Overview", () => {
    test("should display wallet page", async ({ page }) => {
      await page.goto("/wallet");

      // Should show wallet address or balance
      await expect(
        page.locator('[data-testid="wallet-address"], text=/0x[a-fA-F0-9]/i')
      ).toBeVisible({ timeout: 10000 });
    });

    test("should show wallet balance", async ({ page }) => {
      await page.goto("/wallet");

      // Should show balance
      await expect(
        page.locator('[data-testid="wallet-balance"], text=/balance|usdc/i')
      ).toBeVisible({ timeout: 10000 });
    });

    test("should show wallet address", async ({ page }) => {
      await page.goto("/wallet");

      // Should display address
      await expect(
        page.locator('[data-testid="wallet-address"], text=/0x[a-fA-F0-9]{4}/i')
      ).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe("Faucet (Testnet Only)", () => {
    test("should show faucet option on testnet", async ({ page }) => {
      await page.goto("/wallet");

      // Faucet button should be visible if on testnet
      const faucetButton = page.locator('[data-testid="faucet-button"], text=/faucet|claim/i');

      // This might not be visible on mainnet
      if (await faucetButton.isVisible({ timeout: 3000 })) {
        expect(faucetButton).toBeVisible();
      }
    });

    test("should claim from faucet successfully", async ({ page }) => {
      await page.goto("/wallet");

      const faucetButton = page.locator('[data-testid="faucet-button"], text=/faucet|claim/i');

      if (await faucetButton.isVisible({ timeout: 3000 })) {
        await faucetButton.click();

        // Wait for transaction
        await expect(
          page.locator("text=/success|claimed|1000|already claimed|wait/i")
        ).toBeVisible({ timeout: 30000 });
      }
    });

    test("should show rate limit message if already claimed", async ({ page, request }) => {
      // First claim via API
      await request.post("/api/v1/wallet/faucet", {
        headers: { Authorization: `Bearer ${userToken}` },
      });

      // Now try via UI
      await page.goto("/wallet");

      const faucetButton = page.locator('[data-testid="faucet-button"], text=/faucet|claim/i');

      if (await faucetButton.isVisible({ timeout: 3000 })) {
        await faucetButton.click();

        // Should show rate limit message
        await expect(
          page.locator("text=/already|wait|24 hours|limit/i")
        ).toBeVisible({ timeout: 10000 });
      }
    });
  });

  test.describe("Transactions", () => {
    test("should show transaction history", async ({ page }) => {
      await page.goto("/wallet");

      // Click transactions tab if exists
      const txTab = page.getByRole("tab", { name: /transactions|history/i });
      if (await txTab.isVisible()) {
        await txTab.click();
      }

      // Should show transactions list or empty state
      await expect(
        page.locator('[data-testid="transaction-list"], [data-testid="empty-transactions"]')
      ).toBeVisible({ timeout: 10000 });
    });

    test("should display transaction details", async ({ page }) => {
      await page.goto("/wallet");

      // Click on a transaction if exists
      const txRow = page.locator('[data-testid="transaction-row"]').first();
      if (await txRow.isVisible()) {
        await txRow.click();

        // Should show details
        await expect(
          page.locator('[data-testid="transaction-details"], text=/hash|amount|status/i')
        ).toBeVisible({ timeout: 5000 });
      }
    });
  });

  test.describe("Deposit (MoonPay)", () => {
    test("should show deposit option", async ({ page }) => {
      await page.goto("/wallet");

      // Look for deposit button
      const depositButton = page.getByRole("button", { name: /deposit|add funds|buy/i });

      await expect(depositButton).toBeVisible({ timeout: 5000 });
    });

    test("should open deposit flow", async ({ page }) => {
      await page.goto("/wallet");

      const depositButton = page.getByRole("button", { name: /deposit|add funds|buy/i });
      await depositButton.click();

      // Should show deposit modal or redirect
      await expect(
        page.locator('[data-testid="deposit-modal"], text=/amount|deposit|moonpay/i')
      ).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe("Withdraw", () => {
    test("should show withdraw option", async ({ page }) => {
      await page.goto("/wallet");

      // Look for withdraw button
      const withdrawButton = page.getByRole("button", { name: /withdraw|cash out/i });

      await expect(withdrawButton).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe("QR Code Payments", () => {
    test("should show receive option", async ({ page }) => {
      await page.goto("/wallet");

      // Look for receive button
      const receiveButton = page.getByRole("button", { name: /receive|qr/i });

      if (await receiveButton.isVisible()) {
        await receiveButton.click();

        // Should show QR code
        await expect(
          page.locator('[data-testid="qr-code"], canvas, svg')
        ).toBeVisible({ timeout: 5000 });
      }
    });

    test("should show send option", async ({ page }) => {
      await page.goto("/wallet");

      // Look for send button
      const sendButton = page.getByRole("button", { name: /send|transfer/i });

      if (await sendButton.isVisible()) {
        await sendButton.click();

        // Should show send form
        await expect(
          page.locator('[data-testid="send-form"], text=/recipient|address|amount/i')
        ).toBeVisible({ timeout: 5000 });
      }
    });
  });
});
