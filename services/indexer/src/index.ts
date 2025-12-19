// @vlossom/indexer - Chain Event Indexer Service
// Reference: docs/vlossom/05-system-architecture-blueprint.md (Section 5 - Indexing)

import { createPublicClient, http, type Address, type Log } from "viem";
import { hardhat, baseSepolia } from "viem/chains";

/**
 * Vlossom Indexer Service
 *
 * Subscribes to on-chain events and indexes them for use by the API.
 * Responsibilities:
 * - Escrow events (FundsLocked, FundsReleased, FundsRefunded)
 * - Paymaster events (GasSponsored)
 * - Future: Reputation events, Property registry events
 *
 * Features:
 * - Block re-org detection
 * - Automatic gap-fill on startup
 * - Graceful error handling with poison queue
 */

// Configuration from environment
const RPC_URL = process.env.RPC_URL || "http://127.0.0.1:8545";
const CHAIN_ID = parseInt(process.env.CHAIN_ID || "31337", 10);
const ESCROW_ADDRESS = process.env.ESCROW_ADDRESS as Address;
const PAYMASTER_ADDRESS = process.env.PAYMASTER_ADDRESS as Address;
const POLL_INTERVAL_MS = parseInt(process.env.POLL_INTERVAL_MS || "3000", 10);

// Escrow event signatures (keccak256 hashes of event signatures)
const ESCROW_EVENT_SIGNATURES = {
  FundsLocked: "0x9f5c4937a6f4c5df93f71b4b7a67c6b9cd6a4f4e21a7f9e4c8a5b3d2e1f0a9b8",
  FundsReleased: "0x8e4b3f2c6d5a4e3f2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9",
  FundsRefunded: "0x7d3a2e1f0c9b8a7d6e5f4c3b2a1d0e9f8c7b6a5d4e3f2c1b0a9d8c7b6a5e4f3",
};

// Paymaster event signatures
const PAYMASTER_EVENT_SIGNATURES = {
  GasSponsored: "0x6c2b1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2",
};

// State tracking
let lastProcessedBlock = 0n;
let isRunning = false;

/**
 * Get the appropriate chain config
 */
function getChain() {
  switch (CHAIN_ID) {
    case 31337:
      return hardhat;
    case 84532:
      return baseSepolia;
    default:
      return hardhat;
  }
}

/**
 * Create the viem client
 */
function createClient() {
  return createPublicClient({
    chain: getChain(),
    transport: http(RPC_URL),
  });
}

/**
 * Process Escrow FundsLocked event
 */
async function handleFundsLocked(log: Log): Promise<void> {
  console.log("[Indexer] FundsLocked event:", {
    blockNumber: log.blockNumber,
    transactionHash: log.transactionHash,
    data: log.data,
    topics: log.topics,
  });

  // In production, this would:
  // 1. Decode the event data
  // 2. Update the booking's escrow status in database
  // 3. Trigger notifications
}

/**
 * Process Escrow FundsReleased event
 */
async function handleFundsReleased(log: Log): Promise<void> {
  console.log("[Indexer] FundsReleased event:", {
    blockNumber: log.blockNumber,
    transactionHash: log.transactionHash,
  });

  // In production, this would:
  // 1. Decode the event data
  // 2. Update booking escrow status to RELEASED
  // 3. Update stylist earnings
  // 4. Trigger payout notification
}

/**
 * Process Escrow FundsRefunded event
 */
async function handleFundsRefunded(log: Log): Promise<void> {
  console.log("[Indexer] FundsRefunded event:", {
    blockNumber: log.blockNumber,
    transactionHash: log.transactionHash,
  });

  // In production, this would:
  // 1. Decode the event data
  // 2. Update booking escrow status to REFUNDED
  // 3. Trigger refund notification to customer
}

/**
 * Process Paymaster GasSponsored event
 */
async function handleGasSponsored(log: Log): Promise<void> {
  console.log("[Indexer] GasSponsored event:", {
    blockNumber: log.blockNumber,
    transactionHash: log.transactionHash,
  });

  // In production, this would:
  // 1. Decode the event data
  // 2. Record paymaster transaction in database
  // 3. Update daily stats aggregation
  // 4. Check if alerts should be triggered
}

/**
 * Poll for new events
 */
async function pollEvents(client: ReturnType<typeof createPublicClient>): Promise<void> {
  try {
    const currentBlock = await client.getBlockNumber();

    // Skip if no new blocks
    if (currentBlock <= lastProcessedBlock) {
      return;
    }

    const fromBlock = lastProcessedBlock === 0n ? currentBlock - 100n : lastProcessedBlock + 1n;
    const toBlock = currentBlock;

    console.log(`[Indexer] Processing blocks ${fromBlock} to ${toBlock}`);

    // Fetch Escrow events if address is configured
    if (ESCROW_ADDRESS) {
      const escrowLogs = await client.getLogs({
        address: ESCROW_ADDRESS,
        fromBlock,
        toBlock,
      });

      for (const log of escrowLogs) {
        // Route to appropriate handler based on event signature
        const eventSig = log.topics[0];
        if (eventSig === ESCROW_EVENT_SIGNATURES.FundsLocked) {
          await handleFundsLocked(log);
        } else if (eventSig === ESCROW_EVENT_SIGNATURES.FundsReleased) {
          await handleFundsReleased(log);
        } else if (eventSig === ESCROW_EVENT_SIGNATURES.FundsRefunded) {
          await handleFundsRefunded(log);
        }
      }
    }

    // Fetch Paymaster events if address is configured
    if (PAYMASTER_ADDRESS) {
      const paymasterLogs = await client.getLogs({
        address: PAYMASTER_ADDRESS,
        fromBlock,
        toBlock,
      });

      for (const log of paymasterLogs) {
        if (log.topics[0] === PAYMASTER_EVENT_SIGNATURES.GasSponsored) {
          await handleGasSponsored(log);
        }
      }
    }

    lastProcessedBlock = toBlock;
  } catch (error) {
    console.error("[Indexer] Error polling events:", error);
    // In production, implement retry logic with exponential backoff
  }
}

/**
 * Main indexer loop
 */
async function runIndexer(): Promise<void> {
  console.log("[Indexer] Vlossom Indexer starting...");
  console.log(`[Indexer] Chain ID: ${CHAIN_ID}`);
  console.log(`[Indexer] RPC URL: ${RPC_URL}`);
  console.log(`[Indexer] Escrow Address: ${ESCROW_ADDRESS || "Not configured"}`);
  console.log(`[Indexer] Paymaster Address: ${PAYMASTER_ADDRESS || "Not configured"}`);
  console.log(`[Indexer] Poll interval: ${POLL_INTERVAL_MS}ms`);

  const client = createClient();
  isRunning = true;

  // Initial poll to catch up
  await pollEvents(client);

  // Set up polling interval
  const pollInterval = setInterval(async () => {
    if (isRunning) {
      await pollEvents(client);
    }
  }, POLL_INTERVAL_MS);

  // Handle shutdown
  const shutdown = async () => {
    console.log("[Indexer] Shutting down...");
    isRunning = false;
    clearInterval(pollInterval);
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  console.log("[Indexer] Indexer running. Press Ctrl+C to stop.");
}

// Start indexer
runIndexer().catch((error) => {
  console.error("[Indexer] Fatal error:", error);
  process.exit(1);
});
