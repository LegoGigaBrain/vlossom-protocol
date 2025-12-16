/**
 * Disputes Module
 * Unified exports for dispute management
 * Reference: docs/vlossom/22-admin-control-panel.md
 */

export * from "./types";
export {
  createDispute,
  assignDispute,
  startReview,
  resolveDispute,
  escalateDispute,
  closeDispute,
  addDisputeMessage,
  getDisputeById,
  listDisputes,
  getDisputeStats,
} from "./dispute-service";
