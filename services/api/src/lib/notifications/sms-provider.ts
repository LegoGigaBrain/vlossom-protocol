/**
 * SMS Provider (F4.3)
 * Clickatell integration for SMS notifications (optimized for SA market)
 */

import logger from "../logger";
import type { SMSContent } from "./types";

// Configuration
const config = {
  apiKey: process.env.CLICKATELL_API_KEY || "",
  enabled: !!process.env.CLICKATELL_API_KEY,
};

/**
 * Normalize phone number to international format
 * Assumes South African numbers if no country code
 */
function normalizePhoneNumber(phone: string): string {
  // Remove all non-digit characters except leading +
  let normalized = phone.replace(/[^\d+]/g, "");

  // If starts with 0, assume South African and convert to +27
  if (normalized.startsWith("0")) {
    normalized = "+27" + normalized.substring(1);
  }

  // If doesn't start with +, assume needs +
  if (!normalized.startsWith("+")) {
    normalized = "+" + normalized;
  }

  return normalized;
}

/**
 * Send SMS via Clickatell
 * Returns external message ID on success, null on failure
 */
export async function sendSMS(content: SMSContent): Promise<string | null> {
  if (!config.enabled) {
    logger.info("SMS sending disabled (no CLICKATELL_API_KEY)", {
      to: content.to,
      messageLength: content.message.length,
    });
    // Return mock ID for development
    return `mock-sms-${Date.now()}`;
  }

  const normalizedPhone = normalizePhoneNumber(content.to);

  try {
    const response = await fetch("https://platform.clickatell.com/messages", {
      method: "POST",
      headers: {
        "Authorization": config.apiKey,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        channel: "sms",
        to: [normalizedPhone],
        content: content.message,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      logger.error("Clickatell API error", {
        status: response.status,
        error: data,
      });
      return null;
    }

    // Extract message ID from response
    const messageId = data.messages?.[0]?.apiMessageId || `ct-${Date.now()}`;

    logger.info("SMS sent successfully", {
      to: normalizedPhone,
      messageId,
      messageLength: content.message.length,
    });

    return messageId;
  } catch (error) {
    logger.error("Failed to send SMS", {
      error: error instanceof Error ? error.message : String(error),
      to: normalizedPhone,
    });
    return null;
  }
}

/**
 * Check if SMS sending is enabled
 */
export function isSMSEnabled(): boolean {
  return config.enabled;
}

/**
 * Estimate SMS cost (for budgeting/display)
 * Clickatell charges per message segment (160 chars for GSM-7)
 */
export function estimateSMSCost(messageLength: number): {
  segments: number;
  estimatedCostZAR: number;
} {
  // GSM-7: 160 chars per segment, 153 for multi-part
  const segments = messageLength <= 160 ? 1 : Math.ceil(messageLength / 153);
  // Approximate Clickatell rate: R0.50 per segment
  const estimatedCostZAR = segments * 0.5;

  return { segments, estimatedCostZAR };
}
