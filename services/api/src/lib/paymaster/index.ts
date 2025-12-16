/**
 * Paymaster Monitoring Module (M-6)
 *
 * Provides balance monitoring, auto-replenishment alerts, and usage tracking
 * for the Vlossom Paymaster contract.
 *
 * Features:
 * - Real-time balance monitoring
 * - Configurable alert thresholds
 * - Usage statistics and history
 * - Auto-replenishment notifications
 */

export { PaymasterMonitor } from './monitor';
export { BalanceAlertService, type AlertConfig, type AlertTrigger } from './alerts';
