/**
 * Notification Templates (F4.3)
 * Message templates for all notification types
 */

import type { NotificationType, NotificationMetadata, EmailContent, SMSContent, InAppContent } from "./types";

// Format price from cents to ZAR
function formatPrice(cents: number): string {
  return `R${(cents / 100).toFixed(2)}`;
}

// Format date for display
function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString("en-ZA", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Get notification title and body for in-app display
 */
export function getInAppContent(
  type: NotificationType,
  metadata: NotificationMetadata
): { title: string; body: string } {
  switch (type) {
    case "BOOKING_CREATED":
      return {
        title: "New Booking Request",
        body: `${metadata.customerName || "A customer"} has requested a ${metadata.serviceType || "service"} on ${
          metadata.scheduledTime ? formatDateTime(metadata.scheduledTime) : "a scheduled date"
        }.`,
      };

    case "BOOKING_APPROVED":
      return {
        title: "Booking Approved!",
        body: `${metadata.stylistName || "Your stylist"} has approved your booking for ${
          metadata.serviceType || "your service"
        }. Please complete payment to confirm.`,
      };

    case "BOOKING_DECLINED":
      return {
        title: "Booking Declined",
        body: `${metadata.stylistName || "The stylist"} was unable to accommodate your booking request${
          metadata.cancellationReason ? `: ${metadata.cancellationReason}` : "."
        }`,
      };

    case "PAYMENT_CONFIRMED":
      return {
        title: "Payment Confirmed",
        body: `Your payment of ${metadata.amount ? formatPrice(metadata.amount) : "the amount"} has been received. Your booking is confirmed!`,
      };

    case "SERVICE_STARTED":
      return {
        title: "Service Started",
        body: `${metadata.stylistName || "Your stylist"} has started your ${metadata.serviceType || "service"}.`,
      };

    case "SERVICE_COMPLETED":
      return {
        title: "Service Completed",
        body: `Your ${metadata.serviceType || "service"} has been marked complete. Please confirm to release payment.`,
      };

    case "BOOKING_CANCELLED":
      return {
        title: "Booking Cancelled",
        body: metadata.refundAmount
          ? `Your booking has been cancelled. A refund of ${formatPrice(metadata.refundAmount)} will be processed.`
          : "Your booking has been cancelled.",
      };

    case "BOOKING_REMINDER":
      return {
        title: "Upcoming Appointment",
        body: `Reminder: Your ${metadata.serviceType || "appointment"} with ${
          metadata.stylistName || "your stylist"
        } is ${metadata.scheduledTime ? formatDateTime(metadata.scheduledTime) : "coming up soon"}.`,
      };

    default:
      return {
        title: "Notification",
        body: "You have a new notification.",
      };
  }
}

/**
 * Get email content for notification
 */
export function getEmailContent(
  type: NotificationType,
  metadata: NotificationMetadata,
  recipientEmail: string
): EmailContent {
  const { title, body } = getInAppContent(type, metadata);

  // Create HTML email body
  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #311E6B; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9f9f9; }
    .button { display: inline-block; background: #311E6B; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 16px; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Vlossom</h1>
    </div>
    <div class="content">
      <h2>${title}</h2>
      <p>${body}</p>
      ${metadata.deepLink ? `<a href="${metadata.deepLink}" class="button">View Details</a>` : ""}
    </div>
    <div class="footer">
      <p>You're receiving this email because you're a Vlossom user.</p>
      <p>&copy; ${new Date().getFullYear()} Vlossom Protocol</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  return {
    to: recipientEmail,
    subject: `Vlossom: ${title}`,
    text: body,
    html: htmlBody,
  };
}

/**
 * Get SMS content for notification
 */
export function getSMSContent(
  type: NotificationType,
  metadata: NotificationMetadata,
  phoneNumber: string
): SMSContent {
  // SMS messages should be concise
  let message: string;

  switch (type) {
    case "BOOKING_CREATED":
      message = `Vlossom: New booking request from ${metadata.customerName || "a customer"} for ${
        metadata.scheduledTime ? formatDateTime(metadata.scheduledTime) : "a scheduled date"
      }. Open app to respond.`;
      break;

    case "BOOKING_APPROVED":
      message = `Vlossom: Your booking has been approved! Complete payment to confirm. ${
        metadata.deepLink || ""
      }`;
      break;

    case "BOOKING_DECLINED":
      message = `Vlossom: Unfortunately, ${metadata.stylistName || "the stylist"} couldn't accommodate your booking. Try another time slot.`;
      break;

    case "PAYMENT_CONFIRMED":
      message = `Vlossom: Payment confirmed! Your booking for ${
        metadata.scheduledTime ? formatDateTime(metadata.scheduledTime) : "your appointment"
      } is confirmed.`;
      break;

    case "SERVICE_STARTED":
      message = `Vlossom: Your ${metadata.serviceType || "service"} has started.`;
      break;

    case "SERVICE_COMPLETED":
      message = `Vlossom: Your ${metadata.serviceType || "service"} is complete. Please confirm in the app to release payment.`;
      break;

    case "BOOKING_CANCELLED":
      message = metadata.refundAmount
        ? `Vlossom: Booking cancelled. Refund of ${formatPrice(metadata.refundAmount)} will be processed.`
        : `Vlossom: Your booking has been cancelled.`;
      break;

    case "BOOKING_REMINDER":
      message = `Vlossom: Reminder - Your appointment is ${
        metadata.scheduledTime ? formatDateTime(metadata.scheduledTime) : "coming up soon"
      }. See you soon!`;
      break;

    default:
      message = "Vlossom: You have a new notification. Open the app to view.";
  }

  return {
    to: phoneNumber,
    message,
  };
}
