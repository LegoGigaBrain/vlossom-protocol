// @vlossom/indexer - Chain Event Indexer
// Reference: docs/vlossom/05-system-architecture-blueprint.md (Section 5 - Indexing)

/**
 * Vlossom Indexer Service
 *
 * Subscribes to on-chain events and indexes them into PostgreSQL.
 * Responsibilities:
 * - BookingRegistry events
 * - Escrow events
 * - VLP (liquidity pool) events
 * - Reputation events
 * - Referral registry events
 *
 * Features:
 * - Block re-org detection
 * - Automatic gap-fill
 * - Poison queue for malformed events
 */

console.log("Vlossom Indexer starting...");

// Placeholder - will be implemented with viem client
// const client = createPublicClient({ ... });
// client.watchContractEvent({ ... });
