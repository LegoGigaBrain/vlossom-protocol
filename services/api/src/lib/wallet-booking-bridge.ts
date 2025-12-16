/**
 * Wallet-Booking Bridge - Connects wallet operations with booking payments
 *
 * Handles the flow of customer paying for a booking:
 * 1. Customer approves USDC spend to escrow contract
 * 2. Customer calls lockFunds on escrow contract
 * 3. Backend updates booking status to CONFIRMED
 *
 * This module provides the integration layer between wallet operations
 * and booking state management.
 */

import { type Address, type Hash, createPublicClient, http, keccak256, toBytes } from 'viem';
import { CHAIN, RPC_URL } from './wallet/chain-client';
import { getWallet } from './wallet/wallet-service';
import prisma from './prisma';
import { BookingStatus } from '@prisma/client';

// Contract addresses from environment
const ESCROW_ADDRESS = process.env.ESCROW_ADDRESS as Address;
const USDC_ADDRESS = process.env.USDC_ADDRESS as Address;

if (!ESCROW_ADDRESS) throw new Error('ESCROW_ADDRESS not configured');
if (!USDC_ADDRESS) throw new Error('USDC_ADDRESS not configured');

// USDC token ABI - minimal interface for balance and allowance checks
const USDC_ABI = [
  {
    type: 'function',
    name: 'allowance',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' }
    ],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'balanceOf',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view'
  }
] as const;

// Escrow contract ABI - minimal interface for escrow verification
const ESCROW_ABI = [
  {
    type: 'function',
    name: 'getEscrowRecord',
    inputs: [{ name: 'bookingId', type: 'bytes32' }],
    outputs: [
      { name: 'customer', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'status', type: 'uint8' },
      { name: 'createdAt', type: 'uint256' }
    ],
    stateMutability: 'view'
  }
] as const;

// Escrow status enum matching the contract
export enum EscrowStatus {
  None = 0,
  Locked = 1,
  Released = 2,
  Refunded = 3
}

/**
 * Convert booking ID string to bytes32 for contract calls
 * Uses keccak256 hash of the booking ID
 */
function bookingIdToBytes32(bookingId: string): `0x${string}` {
  return keccak256(toBytes(bookingId));
}

// Public client for reading blockchain state
const publicClient = createPublicClient({
  chain: CHAIN,
  transport: http(RPC_URL)
});

/**
 * Payment operation result
 */
export interface PaymentResult {
  success: boolean;
  txHash?: Hash;
  error?: string;
  approvalTxHash?: Hash;
}

/**
 * Escrow record from on-chain contract
 */
export interface EscrowRecord {
  customer: Address;
  amount: bigint;
  status: EscrowStatus;
  createdAt: bigint;
}

/**
 * Verify escrow state on-chain for a booking
 *
 * @param bookingId - Booking ID to verify
 * @returns Escrow record if found, or error
 */
export async function verifyEscrowOnChain(bookingId: string): Promise<{
  success: boolean;
  record?: EscrowRecord;
  error?: string;
}> {
  try {
    const bookingIdBytes32 = bookingIdToBytes32(bookingId);

    const result = await publicClient.readContract({
      address: ESCROW_ADDRESS,
      abi: ESCROW_ABI,
      functionName: 'getEscrowRecord',
      args: [bookingIdBytes32]
    }) as [Address, bigint, number, bigint];

    const [customer, amount, status, createdAt] = result;

    // Check if escrow exists (status != None)
    if (status === EscrowStatus.None) {
      return {
        success: false,
        error: 'No escrow found for this booking'
      };
    }

    return {
      success: true,
      record: {
        customer,
        amount,
        status: status as EscrowStatus,
        createdAt
      }
    };
  } catch (error) {
    console.error('Failed to verify escrow on-chain:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}


/**
 * Check if customer has sufficient USDC balance for payment
 *
 * @param customerAddress - Customer's wallet address
 * @param amountCents - Payment amount in cents (6 decimals for USDC)
 * @returns true if customer has sufficient balance
 */
export async function checkCustomerBalance(
  customerAddress: Address,
  amountCents: bigint
): Promise<{ sufficient: boolean; currentBalance: bigint }> {
  try {
    const balance = await publicClient.readContract({
      address: USDC_ADDRESS,
      abi: USDC_ABI,
      functionName: 'balanceOf',
      args: [customerAddress]
    });

    return {
      sufficient: balance >= amountCents,
      currentBalance: balance as bigint
    };
  } catch (error) {
    console.error('Failed to check customer balance:', error);
    return {
      sufficient: false,
      currentBalance: 0n
    };
  }
}

/**
 * Check if customer has approved sufficient USDC to escrow contract
 *
 * @param customerAddress - Customer's wallet address
 * @param amountCents - Payment amount in cents
 * @returns true if allowance is sufficient
 */
export async function checkEscrowAllowance(
  customerAddress: Address,
  amountCents: bigint
): Promise<{ sufficient: boolean; currentAllowance: bigint }> {
  try {
    const allowance = await publicClient.readContract({
      address: USDC_ADDRESS,
      abi: USDC_ABI,
      functionName: 'allowance',
      args: [customerAddress, ESCROW_ADDRESS]
    });

    return {
      sufficient: (allowance as bigint) >= amountCents,
      currentAllowance: allowance as bigint
    };
  } catch (error) {
    console.error('Failed to check escrow allowance:', error);
    return {
      sufficient: false,
      currentAllowance: 0n
    };
  }
}

/**
 * Initiate booking payment by locking funds in escrow
 *
 * This is a simplified version for MVP. In production, this would be called
 * by the customer's wallet directly. For now, we provide helper functions
 * to guide the payment flow.
 *
 * @param params - Payment parameters
 * @returns Payment result with transaction hashes
 */
export async function initiateBookingPayment(params: {
  userId: string;
  bookingId: string;
  amountCents: bigint;
}): Promise<PaymentResult> {
  try {
    // Get customer's wallet
    const wallet = await getWallet(params.userId);
    if (!wallet) {
      return {
        success: false,
        error: 'Customer wallet not found'
      };
    }

    const customerAddress = wallet.address as Address;

    // Check balance
    const balanceCheck = await checkCustomerBalance(customerAddress, params.amountCents);
    if (!balanceCheck.sufficient) {
      return {
        success: false,
        error: `Insufficient USDC balance. Required: ${params.amountCents}, Available: ${balanceCheck.currentBalance}`
      };
    }

    // Check allowance
    const allowanceCheck = await checkEscrowAllowance(customerAddress, params.amountCents);
    if (!allowanceCheck.sufficient) {
      return {
        success: false,
        error: `Insufficient USDC allowance. Customer must approve ${params.amountCents} USDC to escrow contract: ${ESCROW_ADDRESS}`
      };
    }

    // For MVP, we return instructions for customer to call lockFunds
    // In production, this would be handled by customer's wallet signing the transaction
    return {
      success: false,
      error: 'Customer must call escrow.lockFunds() from their wallet. This will be automated in the wallet UI.'
    };
  } catch (error) {
    console.error('Failed to initiate booking payment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Verify that payment was successfully locked in escrow and update booking status
 *
 * This should be called after customer has locked funds in escrow contract.
 * It verifies the escrow state and updates the booking to CONFIRMED.
 *
 * @param bookingId - Booking ID
 * @param txHash - Optional transaction hash to store
 * @param skipOnChainVerification - Skip on-chain verification (for testing/fallback)
 * @returns true if payment verified and booking updated
 */
export async function verifyAndConfirmPayment(
  bookingId: string,
  txHash?: Hash,
  skipOnChainVerification = false
): Promise<{
  success: boolean;
  error?: string;
  escrowRecord?: EscrowRecord;
}> {
  try {
    // Get booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        customer: true
      }
    });

    if (!booking) {
      return { success: false, error: 'Booking not found' };
    }

    // Check if booking is in correct status
    if (booking.status !== BookingStatus.PENDING_CUSTOMER_PAYMENT) {
      return {
        success: false,
        error: `Booking must be in PENDING_CUSTOMER_PAYMENT status, current: ${booking.status}`
      };
    }

    let escrowRecord: EscrowRecord | undefined;

    // Verify escrow state on-chain
    if (!skipOnChainVerification) {
      const escrowVerification = await verifyEscrowOnChain(bookingId);

      if (!escrowVerification.success || !escrowVerification.record) {
        return {
          success: false,
          error: escrowVerification.error || 'Escrow verification failed'
        };
      }

      escrowRecord = escrowVerification.record;

      // Verify escrow is in Locked status
      if (escrowRecord.status !== EscrowStatus.Locked) {
        return {
          success: false,
          error: `Escrow is not locked. Status: ${EscrowStatus[escrowRecord.status]}`
        };
      }

      // Verify amount matches
      const expectedAmount = BigInt(booking.quoteAmountCents) * BigInt(10_000); // Convert cents to USDC units
      if (escrowRecord.amount < expectedAmount) {
        return {
          success: false,
          error: `Escrow amount insufficient. Expected: ${expectedAmount}, Got: ${escrowRecord.amount}`
        };
      }

      console.log(`✓ On-chain escrow verified for booking ${bookingId}:`, {
        customer: escrowRecord.customer,
        amount: escrowRecord.amount.toString(),
        status: EscrowStatus[escrowRecord.status]
      });
    }

    // Update booking to CONFIRMED
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.CONFIRMED,
        ...(txHash && { escrowTxHash: txHash })
      }
    });

    // Log status change
    await prisma.bookingStatusHistory.create({
      data: {
        bookingId,
        fromStatus: BookingStatus.PENDING_CUSTOMER_PAYMENT,
        toStatus: BookingStatus.CONFIRMED,
        changedBy: booking.customerId,
        reason: txHash
          ? `Payment locked in escrow (tx: ${txHash})`
          : 'Payment locked in escrow'
      }
    });

    console.log(`✓ Payment verified and booking ${bookingId} confirmed`);

    return { success: true, escrowRecord };
  } catch (error) {
    console.error('Failed to verify and confirm payment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get payment instructions for customer
 *
 * Returns the information needed for customer to pay for a booking:
 * - Amount to pay
 * - Escrow contract address
 * - USDC contract address
 * - Current approval status
 *
 * @param userId - Customer user ID
 * @param bookingId - Booking ID
 * @returns Payment instructions
 */
export async function getPaymentInstructions(userId: string, bookingId: string): Promise<{
  success: boolean;
  instructions?: {
    amount: bigint;
    escrowAddress: Address;
    usdcAddress: Address;
    customerAddress: Address;
    needsApproval: boolean;
    currentAllowance: bigint;
    hasBalance: boolean;
    currentBalance: bigint;
  };
  error?: string;
}> {
  try {
    // Get wallet
    const wallet = await getWallet(userId);
    if (!wallet) {
      return { success: false, error: 'Wallet not found' };
    }

    // Get booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId }
    });

    if (!booking) {
      return { success: false, error: 'Booking not found' };
    }

    const customerAddress = wallet.address as Address;
    const amount = BigInt(booking.quoteAmountCents);

    // Check balance and allowance
    const balanceCheck = await checkCustomerBalance(customerAddress, amount);
    const allowanceCheck = await checkEscrowAllowance(customerAddress, amount);

    return {
      success: true,
      instructions: {
        amount,
        escrowAddress: ESCROW_ADDRESS,
        usdcAddress: USDC_ADDRESS,
        customerAddress,
        needsApproval: !allowanceCheck.sufficient,
        currentAllowance: allowanceCheck.currentAllowance,
        hasBalance: balanceCheck.sufficient,
        currentBalance: balanceCheck.currentBalance
      }
    };
  } catch (error) {
    console.error('Failed to get payment instructions:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
