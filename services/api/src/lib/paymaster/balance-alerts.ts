/**
 * Balance Alert Service (F5.1)
 * Sends notifications when paymaster alerts are triggered
 */

import { PrismaClient } from "@prisma/client";
import type { AlertTriggerResult, AlertConfig } from "./types";

interface SlackWebhookPayload {
  text: string;
  blocks?: Array<{
    type: string;
    text?: { type: string; text: string };
    fields?: Array<{ type: string; text: string }>;
  }>;
}

export class BalanceAlertService {
  private prisma: PrismaClient;
  private slackWebhookUrl?: string;
  private emailSender?: (to: string, subject: string, body: string) => Promise<void>;

  constructor(
    prisma: PrismaClient,
    options?: {
      slackWebhookUrl?: string;
      emailSender?: (to: string, subject: string, body: string) => Promise<void>;
    }
  ) {
    this.prisma = prisma;
    this.slackWebhookUrl = options?.slackWebhookUrl;
    this.emailSender = options?.emailSender;
  }

  /**
   * Send alert notifications
   */
  async sendAlerts(triggers: AlertTriggerResult[]): Promise<void> {
    for (const trigger of triggers) {
      const alert = await this.prisma.paymasterAlert.findFirst({
        where: { type: trigger.alertType as "LOW_BALANCE" | "HIGH_USAGE" | "ERROR_RATE" },
      });

      if (!alert) continue;

      // Send Slack notification
      if (alert.notifySlack && this.slackWebhookUrl) {
        await this.sendSlackNotification(trigger);
      }

      // Send email notification
      if (alert.notifyEmail && alert.emailRecipients && this.emailSender) {
        const recipients = alert.emailRecipients.split(",").map((e) => e.trim());
        for (const recipient of recipients) {
          await this.sendEmailNotification(recipient, trigger);
        }
      }
    }
  }

  /**
   * Send Slack notification
   */
  private async sendSlackNotification(trigger: AlertTriggerResult): Promise<void> {
    if (!this.slackWebhookUrl) return;

    const emoji = this.getAlertEmoji(trigger.alertType);
    const severity = this.getAlertSeverity(trigger);

    const payload: SlackWebhookPayload = {
      text: `${emoji} Paymaster Alert: ${trigger.alertType}`,
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: `${emoji} Paymaster Alert`,
          },
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*Alert Type:*\n${trigger.alertType.replace(/_/g, " ")}`,
            },
            {
              type: "mrkdwn",
              text: `*Severity:*\n${severity}`,
            },
            {
              type: "mrkdwn",
              text: `*Current Value:*\n${trigger.currentValue.toFixed(4)}`,
            },
            {
              type: "mrkdwn",
              text: `*Threshold:*\n${trigger.threshold}`,
            },
          ],
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Message:*\n${trigger.message}`,
          },
        },
      ],
    };

    try {
      await fetch(this.slackWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.error("Failed to send Slack notification:", error);
    }
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(
    recipient: string,
    trigger: AlertTriggerResult
  ): Promise<void> {
    if (!this.emailSender) return;

    const subject = `[Vlossom] Paymaster Alert: ${trigger.alertType.replace(/_/g, " ")}`;
    const body = `
Paymaster Alert Triggered

Alert Type: ${trigger.alertType.replace(/_/g, " ")}
Current Value: ${trigger.currentValue.toFixed(4)}
Threshold: ${trigger.threshold}

Message: ${trigger.message}

---
This is an automated alert from Vlossom Protocol.
    `.trim();

    try {
      await this.emailSender(recipient, subject, body);
    } catch (error) {
      console.error("Failed to send email notification:", error);
    }
  }

  /**
   * Get emoji for alert type
   */
  private getAlertEmoji(alertType: string): string {
    switch (alertType) {
      case "LOW_BALANCE":
        return "💰";
      case "HIGH_USAGE":
        return "📈";
      case "ERROR_RATE":
        return "⚠️";
      default:
        return "🔔";
    }
  }

  /**
   * Get alert severity
   */
  private getAlertSeverity(trigger: AlertTriggerResult): string {
    const ratio = trigger.currentValue / trigger.threshold;

    if (trigger.alertType === "LOW_BALANCE") {
      if (ratio < 0.25) return "🔴 Critical";
      if (ratio < 0.5) return "🟠 Warning";
      return "🟡 Notice";
    }

    // For HIGH_USAGE and ERROR_RATE, higher is worse
    if (ratio > 2) return "🔴 Critical";
    if (ratio > 1.5) return "🟠 Warning";
    return "🟡 Notice";
  }

  /**
   * Get all alert configurations
   */
  async getAlertConfigs(): Promise<AlertConfig[]> {
    const alerts = await this.prisma.paymasterAlert.findMany();
    return alerts.map((alert) => ({
      type: alert.type,
      threshold: alert.threshold,
      isActive: alert.isActive,
      notifySlack: alert.notifySlack,
      notifyEmail: alert.notifyEmail,
      emailRecipients: alert.emailRecipients ?? undefined,
    }));
  }

  /**
   * Update alert configuration
   */
  async updateAlertConfig(config: AlertConfig): Promise<void> {
    await this.prisma.paymasterAlert.upsert({
      where: { type: config.type },
      create: {
        type: config.type,
        threshold: config.threshold,
        isActive: config.isActive,
        notifySlack: config.notifySlack,
        notifyEmail: config.notifyEmail,
        emailRecipients: config.emailRecipients,
      },
      update: {
        threshold: config.threshold,
        isActive: config.isActive,
        notifySlack: config.notifySlack,
        notifyEmail: config.notifyEmail,
        emailRecipients: config.emailRecipients,
      },
    });
  }

  /**
   * Initialize default alerts if none exist
   */
  async initializeDefaultAlerts(): Promise<void> {
    const existingAlerts = await this.prisma.paymasterAlert.count();
    if (existingAlerts > 0) return;

    const defaults: AlertConfig[] = [
      {
        type: "LOW_BALANCE",
        threshold: 0.1, // 0.1 ETH
        isActive: true,
        notifySlack: true,
        notifyEmail: true,
      },
      {
        type: "HIGH_USAGE",
        threshold: 0.5, // 0.5 ETH per day
        isActive: true,
        notifySlack: true,
        notifyEmail: false,
      },
      {
        type: "ERROR_RATE",
        threshold: 10, // 10% error rate
        isActive: true,
        notifySlack: true,
        notifyEmail: true,
      },
    ];

    for (const config of defaults) {
      await this.updateAlertConfig(config);
    }
  }
}
