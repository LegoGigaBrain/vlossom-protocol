/**
 * Paymaster Alert Service (M-6)
 *
 * Manages alert configurations and sends notifications when
 * paymaster balance or usage thresholds are breached.
 *
 * Uses existing PaymasterAlert model which stores both configuration
 * and trigger history in a single table.
 */

import { PrismaClient, AlertType } from '@prisma/client';
import logger from '../logger';

// Alert configuration (maps to PaymasterAlert model)
export interface AlertConfig {
  type: 'LOW_BALANCE' | 'HIGH_USAGE' | 'ERROR_RATE';
  threshold: number;
  isActive: boolean;
  notifySlack: boolean;
  notifyEmail: boolean;
  emailRecipients?: string;
  lastTriggered?: Date;
  lastValue?: number;
}

// Alert trigger (from monitor)
export interface AlertTrigger {
  type: 'LOW_BALANCE' | 'HIGH_USAGE' | 'ERROR_RATE';
  message: string;
  currentValue: number | string;
  threshold: number | string;
  severity: 'WARNING' | 'CRITICAL';
}

// Alert service options
interface AlertServiceOptions {
  slackWebhookUrl?: string;
}

// Map string type to AlertType enum
function toAlertType(type: string): AlertType {
  switch (type) {
    case 'LOW_BALANCE':
      return AlertType.LOW_BALANCE;
    case 'HIGH_USAGE':
      return AlertType.HIGH_USAGE;
    case 'ERROR_RATE':
      return AlertType.ERROR_RATE;
    default:
      return AlertType.LOW_BALANCE;
  }
}

/**
 * BalanceAlertService manages alert configurations and notifications
 */
export class BalanceAlertService {
  private prisma: PrismaClient;
  private slackWebhookUrl?: string;

  constructor(prisma: PrismaClient, options: AlertServiceOptions = {}) {
    this.prisma = prisma;
    this.slackWebhookUrl = options.slackWebhookUrl || process.env.SLACK_WEBHOOK_URL;
  }

  /**
   * Initialize default alert configurations
   */
  async initializeDefaultAlerts(): Promise<void> {
    const defaults: { type: AlertType; threshold: number; notifySlack: boolean; notifyEmail: boolean }[] = [
      {
        type: AlertType.LOW_BALANCE,
        threshold: 0.1, // 0.1 ETH
        notifySlack: true,
        notifyEmail: true,
      },
      {
        type: AlertType.HIGH_USAGE,
        threshold: 80, // 80% of daily budget
        notifySlack: true,
        notifyEmail: false,
      },
      {
        type: AlertType.ERROR_RATE,
        threshold: 10, // 10% error rate
        notifySlack: true,
        notifyEmail: true,
      },
    ];

    for (const config of defaults) {
      await this.prisma.paymasterAlert.upsert({
        where: { type: config.type },
        create: {
          type: config.type,
          threshold: config.threshold,
          isActive: true,
          notifySlack: config.notifySlack,
          notifyEmail: config.notifyEmail,
        },
        update: {}, // Don't overwrite existing configs
      });
    }

    logger.info('Paymaster default alerts initialized');
  }

  /**
   * Get all alert configurations
   */
  async getAlertConfigs(): Promise<AlertConfig[]> {
    const configs = await this.prisma.paymasterAlert.findMany();
    return configs.map(c => ({
      type: c.type as AlertConfig['type'],
      threshold: c.threshold,
      isActive: c.isActive,
      notifySlack: c.notifySlack,
      notifyEmail: c.notifyEmail,
      emailRecipients: c.emailRecipients || undefined,
      lastTriggered: c.lastTriggered || undefined,
      lastValue: c.lastValue || undefined,
    }));
  }

  /**
   * Update an alert configuration
   */
  async updateAlertConfig(config: AlertConfig): Promise<void> {
    const alertType = toAlertType(config.type);

    await this.prisma.paymasterAlert.upsert({
      where: { type: alertType },
      create: {
        type: alertType,
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

    logger.info('Paymaster alert config updated', { type: config.type });
  }

  /**
   * Send alerts via configured channels
   */
  async sendAlerts(triggers: AlertTrigger[]): Promise<void> {
    const configs = await this.getAlertConfigs();

    for (const trigger of triggers) {
      const config = configs.find(c => c.type === trigger.type);
      if (!config || !config.isActive) continue;

      // Check cooldown period (30 minutes)
      if (await this.isInCooldown(trigger.type)) {
        logger.debug('Alert in cooldown, skipping', { type: trigger.type });
        continue;
      }

      // Record alert trigger in database
      await this.recordAlertTrigger(trigger);

      // Send to Slack
      if (config.notifySlack && this.slackWebhookUrl) {
        await this.sendSlackNotification(trigger);
      }

      // Send email (placeholder - integrate with SendGrid)
      if (config.notifyEmail && config.emailRecipients) {
        await this.sendEmailNotification(trigger, config.emailRecipients);
      }
    }
  }

  /**
   * Record alert trigger by updating lastTriggered and lastValue
   */
  private async recordAlertTrigger(trigger: AlertTrigger): Promise<void> {
    try {
      const alertType = toAlertType(trigger.type);
      const currentValue = typeof trigger.currentValue === 'string'
        ? parseFloat(trigger.currentValue)
        : trigger.currentValue;

      await this.prisma.paymasterAlert.update({
        where: { type: alertType },
        data: {
          lastTriggered: new Date(),
          lastValue: currentValue,
        },
      });

      logger.info('Alert triggered and recorded', {
        type: trigger.type,
        severity: trigger.severity,
        currentValue,
      });
    } catch (error) {
      logger.error('Failed to record alert trigger', { error, trigger });
    }
  }

  /**
   * Send Slack notification
   */
  private async sendSlackNotification(trigger: AlertTrigger): Promise<void> {
    if (!this.slackWebhookUrl) return;

    const emoji = trigger.severity === 'CRITICAL' ? ':rotating_light:' : ':warning:';
    const color = trigger.severity === 'CRITICAL' ? '#FF0000' : '#FFA500';

    const payload = {
      attachments: [
        {
          color,
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `${emoji} *Vlossom Paymaster Alert*\n\n${trigger.message}`,
              },
            },
            {
              type: 'section',
              fields: [
                {
                  type: 'mrkdwn',
                  text: `*Type:*\n${trigger.type}`,
                },
                {
                  type: 'mrkdwn',
                  text: `*Severity:*\n${trigger.severity}`,
                },
                {
                  type: 'mrkdwn',
                  text: `*Current Value:*\n${trigger.currentValue}`,
                },
                {
                  type: 'mrkdwn',
                  text: `*Threshold:*\n${trigger.threshold}`,
                },
              ],
            },
            {
              type: 'context',
              elements: [
                {
                  type: 'mrkdwn',
                  text: `Alert triggered at ${new Date().toISOString()}`,
                },
              ],
            },
          ],
        },
      ],
    };

    try {
      const response = await fetch(this.slackWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Slack API returned ${response.status}`);
      }

      logger.info('Slack alert sent', { type: trigger.type });
    } catch (error) {
      logger.error('Failed to send Slack alert', { error, trigger });
    }
  }

  /**
   * Send email notification (placeholder - integrate with SendGrid)
   */
  private async sendEmailNotification(
    trigger: AlertTrigger,
    recipients: string
  ): Promise<void> {
    // TODO: Integrate with SendGrid using sendGridCircuitBreaker
    logger.info('Email alert would be sent', {
      type: trigger.type,
      recipients,
      message: trigger.message,
    });

    // Placeholder for SendGrid integration:
    // import { sendGridCircuitBreaker } from '../circuit-breaker';
    // await sendGridCircuitBreaker.execute(async () => {
    //   const sgMail = require('@sendgrid/mail');
    //   await sgMail.send({
    //     to: recipients.split(','),
    //     from: this.emailFrom,
    //     subject: `[${trigger.severity}] Vlossom Paymaster Alert: ${trigger.type}`,
    //     text: trigger.message,
    //   });
    // });
  }

  /**
   * Get recent alert triggers
   */
  async getRecentAlerts(limit: number = 10): Promise<AlertConfig[]> {
    const alerts = await this.prisma.paymasterAlert.findMany({
      where: { lastTriggered: { not: null } },
      orderBy: { lastTriggered: 'desc' },
      take: limit,
    });

    return alerts.map(a => ({
      type: a.type as AlertConfig['type'],
      threshold: a.threshold,
      isActive: a.isActive,
      notifySlack: a.notifySlack,
      notifyEmail: a.notifyEmail,
      emailRecipients: a.emailRecipients || undefined,
      lastTriggered: a.lastTriggered || undefined,
      lastValue: a.lastValue || undefined,
    }));
  }

  /**
   * Check if an alert was recently sent (within cooldown period)
   */
  async isInCooldown(
    type: AlertConfig['type'],
    cooldownMinutes: number = 30
  ): Promise<boolean> {
    const cooldownStart = new Date(Date.now() - cooldownMinutes * 60 * 1000);
    const alertType = toAlertType(type);

    const alert = await this.prisma.paymasterAlert.findUnique({
      where: { type: alertType },
    });

    if (!alert || !alert.lastTriggered) {
      return false;
    }

    return alert.lastTriggered >= cooldownStart;
  }
}
