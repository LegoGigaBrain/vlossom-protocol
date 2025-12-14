/**
 * Email Provider (F4.3)
 * SendGrid integration for email notifications
 */

import logger from "../logger";
import type { EmailContent } from "./types";

// Configuration
const config = {
  apiKey: process.env.SENDGRID_API_KEY || "",
  fromEmail: process.env.SENDGRID_FROM_EMAIL || "notifications@vlossom.com",
  fromName: process.env.SENDGRID_FROM_NAME || "Vlossom",
  enabled: !!process.env.SENDGRID_API_KEY,
};

/**
 * Send email via SendGrid
 * Returns external message ID on success, null on failure
 */
export async function sendEmail(content: EmailContent): Promise<string | null> {
  if (!config.enabled) {
    logger.info("Email sending disabled (no SENDGRID_API_KEY)", {
      to: content.to,
      subject: content.subject,
    });
    // Return mock ID for development
    return `mock-email-${Date.now()}`;
  }

  try {
    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: content.to }],
          },
        ],
        from: {
          email: config.fromEmail,
          name: config.fromName,
        },
        subject: content.subject,
        content: [
          {
            type: "text/plain",
            value: content.text,
          },
          ...(content.html
            ? [
                {
                  type: "text/html",
                  value: content.html,
                },
              ]
            : []),
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error("SendGrid API error", {
        status: response.status,
        error: errorText,
      });
      return null;
    }

    // SendGrid returns message ID in headers
    const messageId = response.headers.get("x-message-id") || `sg-${Date.now()}`;

    logger.info("Email sent successfully", {
      to: content.to,
      subject: content.subject,
      messageId,
    });

    return messageId;
  } catch (error) {
    logger.error("Failed to send email", {
      error: error instanceof Error ? error.message : String(error),
      to: content.to,
    });
    return null;
  }
}

/**
 * Check if email sending is enabled
 */
export function isEmailEnabled(): boolean {
  return config.enabled;
}
