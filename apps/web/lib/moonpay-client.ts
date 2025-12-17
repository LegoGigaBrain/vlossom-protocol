/**
 * MoonPay Client
 * Frontend API client for MoonPay onramp/offramp integration
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

function getAuthToken(): string | null {
  return localStorage.getItem("auth_token");
}

export interface DepositSessionResult {
  success: boolean;
  sessionId?: string;
  redirectUrl?: string;
  mode?: string;
  error?: string;
}

/**
 * Create a deposit session (onramp)
 * Converts fiat to USDC
 */
export async function createDepositSession(params: {
  amount: number; // USDC amount
  fiatCurrency: "ZAR" | "USD" | "EUR";
}): Promise<DepositSessionResult> {
  const token = getAuthToken();
  if (!token) return { success: false, error: "Not authenticated" };

  try {
    const response = await fetch(`${API_URL}/api/v1/wallet/moonpay/deposit`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error?.message || "Request failed" };
    }

    return { success: true, ...data };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Network error" };
  }
}

/**
 * Create a withdrawal session (offramp)
 * Converts USDC to fiat
 */
export async function createWithdrawalSession(params: {
  amount: number; // USDC amount
  fiatCurrency: "ZAR" | "USD" | "EUR";
}): Promise<DepositSessionResult> {
  const token = getAuthToken();
  if (!token) return { success: false, error: "Not authenticated" };

  try {
    const response = await fetch(`${API_URL}/api/v1/wallet/moonpay/withdraw`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error?.message || "Request failed" };
    }

    return { success: true, ...data };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Network error" };
  }
}

/**
 * Check MoonPay transaction status
 */
export async function checkDepositStatus(sessionId: string) {
  const token = getAuthToken();
  if (!token) throw new Error("Not authenticated");

  try {
    const response = await fetch(
      `${API_URL}/api/v1/wallet/moonpay/status/${sessionId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch status");
    }

    return await response.json();
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : "Network error");
  }
}

/**
 * Simulate mock completion (dev only)
 * Triggers the webhook to complete a mock transaction
 */
export async function simulateMockCompletion(
  sessionId: string,
  amount: number
) {
  try {
    const response = await fetch(`${API_URL}/api/v1/wallet/moonpay/webhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        status: "completed",
        fiatAmount: amount * 18.5, // Mock ZAR conversion
        fiatCurrency: "ZAR",
        cryptoAmount: amount,
        cryptoCurrency: "USDC",
        type: "deposit",
      }),
    });

    return await response.json();
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : "Network error");
  }
}

/**
 * Simulate mock withdrawal (dev only)
 * Triggers the webhook to complete a mock withdrawal
 */
export async function simulateMockWithdrawal(
  sessionId: string,
  amount: number
) {
  try {
    const response = await fetch(`${API_URL}/api/v1/wallet/moonpay/webhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        status: "completed",
        fiatAmount: amount * 18.5, // Mock ZAR conversion
        fiatCurrency: "ZAR",
        cryptoAmount: amount,
        cryptoCurrency: "USDC",
        type: "withdrawal",
      }),
    });

    return await response.json();
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : "Network error");
  }
}
