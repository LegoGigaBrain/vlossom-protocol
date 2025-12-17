/**
 * Escrow Client - Smart contract integration for booking payments
 *
 * Wraps the Escrow contract for backend API usage, handling:
 * - Fund locking when customer pays for booking
 * - Fund release when service is completed
 * - Refunds when bookings are cancelled
 *
 * All operations are triggered by the relayer wallet (backend service account).
 *
 * SECURITY FIX (C-3): Relayer private key fetched from Secrets Manager
 * Reference: Security Review - Private keys should not be stored in plain env vars
 *
 * L-4: Includes blockchain error telemetry via Sentry integration
 */

import { createPublicClient, createWalletClient, http, keccak256, toBytes, type Address, type Hash, type Account, type Chain, type Transport } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { CHAIN, RPC_URL } from './wallet/chain-client';
import { escrowRateLimiter } from './escrow-rate-limiter';
import { getRelayerPrivateKey } from './secrets-manager';
import { logger } from './logger';
import * as Sentry from '@sentry/node';

// Contract addresses from environment
const ESCROW_ADDRESS = process.env.ESCROW_ADDRESS as Address;
const USDC_ADDRESS = process.env.USDC_ADDRESS as Address;

if (!ESCROW_ADDRESS) throw new Error('ESCROW_ADDRESS not configured');
if (!USDC_ADDRESS) throw new Error('USDC_ADDRESS not configured');

// Type for our wallet client with account and chain bound
type BoundWalletClient = ReturnType<typeof createWalletClient<Transport, Chain, Account>>;

// Lazy-initialized wallet client (fetches key from Secrets Manager on first use)
let walletClientInstance: BoundWalletClient | null = null;
let walletClientInitializing: Promise<BoundWalletClient> | null = null;

// Escrow contract ABI - minimal interface for backend operations
const ESCROW_ABI = [
  {
    type: 'function',
    name: 'lockFunds',
    inputs: [
      { name: 'bookingId', type: 'bytes32' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'releaseFunds',
    inputs: [
      { name: 'bookingId', type: 'bytes32' },
      { name: 'stylist', type: 'address' },
      { name: 'stylistAmount', type: 'uint256' },
      { name: 'treasury', type: 'address' },
      { name: 'platformFeeAmount', type: 'uint256' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'refund',
    inputs: [
      { name: 'bookingId', type: 'bytes32' },
      { name: 'amount', type: 'uint256' },
      { name: 'recipient', type: 'address' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'getEscrowBalance',
    inputs: [{ name: 'bookingId', type: 'bytes32' }],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'getEscrowRecord',
    inputs: [{ name: 'bookingId', type: 'bytes32' }],
    outputs: [
      {
        type: 'tuple',
        components: [
          { name: 'customer', type: 'address' },
          { name: 'amount', type: 'uint256' },
          { name: 'status', type: 'uint8' }
        ]
      }
    ],
    stateMutability: 'view'
  },
  {
    type: 'event',
    name: 'FundsLocked',
    inputs: [
      { name: 'bookingId', type: 'bytes32', indexed: true },
      { name: 'customer', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false }
    ]
  },
  {
    type: 'event',
    name: 'FundsReleased',
    inputs: [
      { name: 'bookingId', type: 'bytes32', indexed: true },
      { name: 'stylist', type: 'address', indexed: true },
      { name: 'stylistAmount', type: 'uint256', indexed: false },
      { name: 'platformFeeAmount', type: 'uint256', indexed: false }
    ]
  },
  {
    type: 'event',
    name: 'FundsRefunded',
    inputs: [
      { name: 'bookingId', type: 'bytes32', indexed: true },
      { name: 'recipient', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false }
    ]
  }
] as const;

// Public client for reading contract state
const publicClient = createPublicClient({
  chain: CHAIN,
  transport: http(RPC_URL)
});

/**
 * Get the wallet client for signing transactions
 * SECURITY FIX (C-3): Lazy initialization to fetch key from Secrets Manager
 *
 * Uses singleton pattern with async initialization to ensure:
 * - Key is fetched only when needed (not at module load)
 * - Multiple concurrent calls share the same initialization
 * - Key can be fetched from AWS Secrets Manager in production
 */
async function getWalletClient(): Promise<BoundWalletClient> {
  // Return cached instance if available
  if (walletClientInstance) {
    return walletClientInstance;
  }

  // If initialization is in progress, wait for it
  if (walletClientInitializing) {
    return walletClientInitializing;
  }

  // Start initialization
  walletClientInitializing = (async () => {
    try {
      logger.info('Initializing relayer wallet client', {
        event: 'relayer_init_start',
      });

      // Fetch private key from Secrets Manager (or env var fallback)
      const relayerPrivateKey = await getRelayerPrivateKey();

      const relayerAccount = privateKeyToAccount(relayerPrivateKey);

      walletClientInstance = createWalletClient({
        account: relayerAccount,
        chain: CHAIN,
        transport: http(RPC_URL)
      });

      logger.info('Relayer wallet client initialized', {
        event: 'relayer_init_success',
        address: relayerAccount.address,
      });

      return walletClientInstance;
    } catch (error) {
      walletClientInitializing = null; // Allow retry on failure
      logger.error('Failed to initialize relayer wallet', {
        event: 'relayer_init_error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  })();

  return walletClientInitializing;
}

/**
 * Escrow status enum (matches Solidity contract)
 */
export enum EscrowStatus {
  None = 0,
  Locked = 1,
  Released = 2,
  Refunded = 3
}

/**
 * Escrow record structure
 */
export interface EscrowRecord {
  customer: Address;
  amount: bigint;
  status: EscrowStatus;
}

/**
 * Result of escrow operations
 */
export interface EscrowOperationResult {
  success: boolean;
  txHash?: Hash;
  error?: string;
}

/**
 * Convert booking ID string to bytes32 hash
 * Uses keccak256 for cryptographically secure, collision-resistant hashing.
 *
 * @param bookingId - UUID or unique booking identifier
 * @returns bytes32 hash for contract calls
 */
function bookingIdToBytes32(bookingId: string): `0x${string}` {
  // Use keccak256 for cryptographically secure hashing
  // This ensures collision resistance for all booking ID formats (UUIDs, etc.)
  return keccak256(toBytes(bookingId));
}

/**
 * Lock USDC funds from customer's wallet into escrow
 *
 * NOTE: Customer must have approved USDC spend to escrow contract before calling this.
 * This function is typically called by the customer's wallet directly, not the relayer.
 *
 * @param params - Lock parameters
 * @returns Operation result with transaction hash
 */
export async function lockFundsInEscrow(params: {
  bookingId: string;
  customerAddress: Address;
  amount: bigint;
}): Promise<EscrowOperationResult> {
  try {
    // NOTE: This would typically be called from the customer's wallet, not the relayer.
    // For the MVP, we simulate the customer's transaction by having them call the
    // lockFunds function directly through their wallet interface.

    // L-3: Collision detection - prevent double-locking funds
    // This is critical for preventing duplicate charges
    const existing = await getEscrowRecord(params.bookingId);
    if (existing.status !== EscrowStatus.None) {
      console.warn(`⚠️ Escrow collision detected for booking ${params.bookingId}`, {
        existingStatus: EscrowStatus[existing.status],
        existingAmount: existing.amount.toString(),
      });
      return {
        success: false,
        error: `Escrow already exists for this booking (status: ${EscrowStatus[existing.status]})`
      };
    }

    // For now, return success - actual implementation would involve
    // customer's wallet signing the lockFunds transaction
    return {
      success: true,
      txHash: undefined, // Will be populated when customer submits transaction
      error: 'Customer must approve USDC and call lockFunds from their wallet'
    };
  } catch (error) {
    console.error('Failed to lock funds in escrow:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Release escrowed funds to stylist and platform treasury
 *
 * Called by relayer when booking is confirmed complete by customer.
 * Splits payment: 90% to stylist, 10% to platform.
 *
 * @param params - Release parameters
 * @returns Operation result with transaction hash
 */
export async function releaseFundsFromEscrow(params: {
  bookingId: string;
  stylistAddress: Address;
  totalAmount: bigint;
  platformFeePercentage: number; // e.g., 10 for 10%
  treasuryAddress: Address;
}): Promise<EscrowOperationResult> {
  try {
    // SECURITY: Check rate limit before proceeding
    const rateLimitCheck = escrowRateLimiter.canProceed(params.totalAmount, params.bookingId);
    if (!rateLimitCheck.canProceed) {
      return {
        success: false,
        error: rateLimitCheck.reason || 'Rate limit exceeded'
      };
    }

    const bookingIdBytes = bookingIdToBytes32(params.bookingId);

    // Calculate amounts (avoiding floating point)
    const platformFeeAmount = (params.totalAmount * BigInt(params.platformFeePercentage)) / 100n;
    const stylistAmount = params.totalAmount - platformFeeAmount;

    // Verify escrow exists and is locked
    const record = await getEscrowRecord(params.bookingId);
    if (record.status !== EscrowStatus.Locked) {
      return {
        success: false,
        error: `Escrow not in Locked status (current: ${EscrowStatus[record.status]})`
      };
    }

    if (record.amount !== params.totalAmount) {
      return {
        success: false,
        error: `Amount mismatch: escrow has ${record.amount}, requested ${params.totalAmount}`
      };
    }

    // Call releaseFunds as relayer
    const walletClient = await getWalletClient();
    const hash = await walletClient.writeContract({
      address: ESCROW_ADDRESS,
      abi: ESCROW_ABI,
      functionName: 'releaseFunds',
      args: [
        bookingIdBytes,
        params.stylistAddress,
        stylistAmount,
        params.treasuryAddress,
        platformFeeAmount
      ]
    });

    // Wait for transaction confirmation
    await publicClient.waitForTransactionReceipt({ hash });

    // Record successful operation for rate limiting
    escrowRateLimiter.recordOperation(params.bookingId, params.totalAmount, 'release');

    console.log(`✓ Released funds for booking ${params.bookingId}:`, {
      stylist: params.stylistAddress,
      stylistAmount: stylistAmount.toString(),
      platformFee: platformFeeAmount.toString(),
      txHash: hash
    });

    return {
      success: true,
      txHash: hash
    };
  } catch (error) {
    console.error('Failed to release funds from escrow:', error);

    // L-4: Blockchain error telemetry - capture detailed error context
    Sentry.captureException(error, {
      tags: {
        service: 'escrow',
        operation: 'release',
        critical: 'true',
      },
      extra: {
        bookingId: params.bookingId,
        stylistAddress: params.stylistAddress,
        totalAmount: params.totalAmount.toString(),
        platformFeePercentage: params.platformFeePercentage,
        treasuryAddress: params.treasuryAddress,
        chainId: CHAIN.id,
        escrowContract: ESCROW_ADDRESS,
      },
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Refund escrowed funds to customer or specified recipient
 *
 * Called by relayer when booking is cancelled.
 * Full amount is refunded (no partial refunds in v1).
 *
 * @param params - Refund parameters
 * @returns Operation result with transaction hash
 */
export async function refundFromEscrow(params: {
  bookingId: string;
  recipientAddress: Address;
}): Promise<EscrowOperationResult> {
  try {
    const bookingIdBytes = bookingIdToBytes32(params.bookingId);

    // Get escrow record to determine refund amount
    const record = await getEscrowRecord(params.bookingId);
    if (record.status !== EscrowStatus.Locked) {
      return {
        success: false,
        error: `Escrow not in Locked status (current: ${EscrowStatus[record.status]})`
      };
    }

    const refundAmount = record.amount;

    // SECURITY: Check rate limit before proceeding
    const rateLimitCheck = escrowRateLimiter.canProceed(refundAmount, params.bookingId);
    if (!rateLimitCheck.canProceed) {
      return {
        success: false,
        error: rateLimitCheck.reason || 'Rate limit exceeded'
      };
    }

    // Call refund as relayer
    const walletClient = await getWalletClient();
    const hash = await walletClient.writeContract({
      address: ESCROW_ADDRESS,
      abi: ESCROW_ABI,
      functionName: 'refund',
      args: [bookingIdBytes, refundAmount, params.recipientAddress]
    });

    // Wait for transaction confirmation
    await publicClient.waitForTransactionReceipt({ hash });

    // Record successful operation for rate limiting
    escrowRateLimiter.recordOperation(params.bookingId, refundAmount, 'refund');

    console.log(`✓ Refunded ${refundAmount} for booking ${params.bookingId}`, {
      recipient: params.recipientAddress,
      txHash: hash
    });

    return {
      success: true,
      txHash: hash
    };
  } catch (error) {
    console.error('Failed to refund from escrow:', error);

    // L-4: Blockchain error telemetry - capture detailed error context
    Sentry.captureException(error, {
      tags: {
        service: 'escrow',
        operation: 'refund',
        critical: 'true',
      },
      extra: {
        bookingId: params.bookingId,
        recipientAddress: params.recipientAddress,
        chainId: CHAIN.id,
        escrowContract: ESCROW_ADDRESS,
      },
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get escrow balance for a booking
 *
 * @param bookingId - Unique booking identifier
 * @returns Locked balance (0 if not locked or already settled)
 */
export async function getEscrowBalance(bookingId: string): Promise<bigint> {
  try {
    const bookingIdBytes = bookingIdToBytes32(bookingId);

    const balance = await publicClient.readContract({
      address: ESCROW_ADDRESS,
      abi: ESCROW_ABI,
      functionName: 'getEscrowBalance',
      args: [bookingIdBytes]
    });

    return balance as bigint;
  } catch (error) {
    console.error('Failed to get escrow balance:', error);
    return 0n;
  }
}

/**
 * Get complete escrow record for a booking
 *
 * @param bookingId - Unique booking identifier
 * @returns Escrow record with customer, amount, and status
 */
export async function getEscrowRecord(bookingId: string): Promise<EscrowRecord> {
  try {
    const bookingIdBytes = bookingIdToBytes32(bookingId);

    const record = await publicClient.readContract({
      address: ESCROW_ADDRESS,
      abi: ESCROW_ABI,
      functionName: 'getEscrowRecord',
      args: [bookingIdBytes]
    });

    // Type assertion for tuple response from contract
    const [customer, amount, status] = record as unknown as [Address, bigint, number];

    return {
      customer,
      amount,
      status: status as EscrowStatus
    };
  } catch (error) {
    console.error('Failed to get escrow record:', error);
    // Return empty record if not found
    return {
      customer: '0x0000000000000000000000000000000000000000',
      amount: 0n,
      status: EscrowStatus.None
    };
  }
}

/**
 * M-1: Treasury address validation
 * Requires explicit configuration in production to prevent funds being sent to wrong address
 */
function getTreasuryAddress(): Address {
  const address = process.env.TREASURY_ADDRESS;

  if (!address) {
    // In production, treasury address is required
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'FATAL: TREASURY_ADDRESS is required in production. ' +
        'Set the platform treasury wallet address in your environment.'
      );
    }
    // Development fallback: Hardhat account #1
    console.warn('⚠️ Using development treasury address (Hardhat account #1)');
    return '0x70997970C51812dc3A010C7d01b50e0d17dc79C8' as Address;
  }

  return address as Address;
}

/**
 * Treasury address for platform fees
 * SECURITY: Validated at startup - requires explicit config in production
 */
export const PLATFORM_TREASURY_ADDRESS: Address = getTreasuryAddress();

/**
 * Platform fee percentage (configurable via environment)
 * Default: 10% of service amount
 */
export const PLATFORM_FEE_PERCENTAGE = parseInt(process.env.PLATFORM_FEE_PERCENTAGE || '10', 10);
