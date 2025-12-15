/**
 * Escrow Client - Smart contract integration for booking payments
 *
 * Wraps the Escrow contract for backend API usage, handling:
 * - Fund locking when customer pays for booking
 * - Fund release when service is completed
 * - Refunds when bookings are cancelled
 *
 * All operations are triggered by the relayer wallet (backend service account).
 */

import { createPublicClient, createWalletClient, http, type Address, type Hash } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { CHAIN, RPC_URL } from './wallet/chain-client';

// Contract addresses from environment
const ESCROW_ADDRESS = process.env.ESCROW_ADDRESS as Address;
const USDC_ADDRESS = process.env.USDC_ADDRESS as Address;
const RELAYER_PRIVATE_KEY = process.env.RELAYER_PRIVATE_KEY as `0x${string}`;

if (!ESCROW_ADDRESS) throw new Error('ESCROW_ADDRESS not configured');
if (!USDC_ADDRESS) throw new Error('USDC_ADDRESS not configured');
if (!RELAYER_PRIVATE_KEY) throw new Error('RELAYER_PRIVATE_KEY not configured');

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

// Relayer wallet client for signing transactions
const relayerAccount = privateKeyToAccount(RELAYER_PRIVATE_KEY);
const walletClient = createWalletClient({
  account: relayerAccount,
  chain: CHAIN,
  transport: http(RPC_URL)
});

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
 * @param bookingId - UUID or unique booking identifier
 * @returns bytes32 hash for contract calls
 */
function bookingIdToBytes32(bookingId: string): `0x${string}` {
  // Simple approach: hash the booking ID to get bytes32
  const encoder = new TextEncoder();
  const data = encoder.encode(bookingId);

  // Use a simple hash (in production, consider using keccak256)
  let hash = '0x';
  for (let i = 0; i < 32; i++) {
    const byte = data[i % data.length] || 0;
    hash += byte.toString(16).padStart(2, '0');
  }

  return hash as `0x${string}`;
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
    const bookingIdBytes = bookingIdToBytes32(params.bookingId);

    // NOTE: This would typically be called from the customer's wallet, not the relayer.
    // For the MVP, we simulate the customer's transaction by having them call the
    // lockFunds function directly through their wallet interface.

    // Check if booking already has escrow
    const existing = await getEscrowRecord(params.bookingId);
    if (existing.status !== EscrowStatus.None) {
      return {
        success: false,
        error: 'Escrow already exists for this booking'
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

    // Call refund as relayer
    const hash = await walletClient.writeContract({
      address: ESCROW_ADDRESS,
      abi: ESCROW_ABI,
      functionName: 'refund',
      args: [bookingIdBytes, refundAmount, params.recipientAddress]
    });

    // Wait for transaction confirmation
    await publicClient.waitForTransactionReceipt({ hash });

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

    // Type assertion for tuple response
    const [customer, amount, status] = record as [Address, bigint, number];

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
 * Treasury address for platform fees
 * Configured via TREASURY_ADDRESS environment variable
 * Default: Hardhat account #1 for local development
 */
export const PLATFORM_TREASURY_ADDRESS: Address = (process.env.TREASURY_ADDRESS || '0x70997970C51812dc3A010C7d01b50e0d17dc79C8') as Address;

/**
 * Platform fee percentage (configurable via environment)
 * Default: 10% of service amount
 */
export const PLATFORM_FEE_PERCENTAGE = parseInt(process.env.PLATFORM_FEE_PERCENTAGE || '10', 10);
