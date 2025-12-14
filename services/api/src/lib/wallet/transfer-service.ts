/**
 * TransferService - P2P transfer and payment request operations
 */

import { type Address, type Hash, type Hex, encodeFunctionData } from "viem";
import { prisma } from "../prisma";
import {
  getWallet,
  getWalletByAddress,
  recordTransaction,
  updateTransactionStatus,
  markWalletDeployed,
  checkWalletDeployed,
} from "./wallet-service";
import {
  buildExecuteCallData,
  executeUserOp,
} from "./user-operation";
import { USDC_ADDRESS, ERC20_ABI, fromUsdcUnits } from "./contracts";
import { isLocalhost, getRelayerWalletClient, publicClient } from "./chain-client";
import type { PaymentRequest, PaymentRequestStatus } from "@prisma/client";

/**
 * P2P transfer result
 */
export interface P2PTransferResult {
  success: boolean;
  userOpHash?: Hash;
  txHash?: Hash;
  transactionId: string;
  error?: string;
}

/**
 * Payment request data for QR code
 */
export interface PaymentRequestData {
  requestId: string;
  recipientAddress: string;
  amount: bigint;
  amountFormatted: number;
  memo?: string;
  expiresAt: Date;
  qrData: string; // JSON string for QR code
}

/**
 * Send P2P transfer using direct transaction (localhost only)
 * Bypasses UserOperations for testing without bundler
 */
async function sendP2PLocalhost(
  fromWalletId: string,
  toAddress: string,
  amount: bigint
): Promise<P2PTransferResult> {
  const walletClient = getRelayerWalletClient();

  try {
    // Direct USDC transfer from relayer (simulating the AA wallet for localhost testing)
    const txHash = await walletClient.writeContract({
      address: USDC_ADDRESS,
      abi: ERC20_ABI,
      functionName: "transfer",
      args: [toAddress as Address, amount],
    });

    // Wait for transaction confirmation
    await publicClient.waitForTransactionReceipt({ hash: txHash });

    return {
      success: true,
      txHash,
      userOpHash: txHash, // Use txHash as userOpHash for localhost
      transactionId: "", // Will be set by caller
    };
  } catch (error) {
    return {
      success: false,
      transactionId: "",
      error: error instanceof Error ? error.message : "Transfer failed",
    };
  }
}

/**
 * Send a P2P USDC transfer
 */
export async function sendP2P(
  fromWalletId: string,
  toAddress: string,
  amount: bigint,
  memo?: string
): Promise<P2PTransferResult> {
  // Get sender wallet
  const senderWallet = await prisma.wallet.findUnique({
    where: { id: fromWalletId },
    include: { user: true },
  });

  if (!senderWallet) {
    throw new Error("Sender wallet not found");
  }

  // Record pending transaction
  const outgoingTx = await recordTransaction(fromWalletId, "TRANSFER_OUT", amount, {
    counterparty: toAddress,
    memo,
  });

  // Record incoming transaction if recipient is a Vlossom wallet
  const recipientWallet = await getWalletByAddress(toAddress);
  let incomingTxId: string | undefined;

  if (recipientWallet) {
    const incomingTx = await recordTransaction(recipientWallet.id, "TRANSFER_IN", amount, {
      counterparty: senderWallet.address,
      memo,
    });
    incomingTxId = incomingTx.id;
  }

  try {
    let result;

    // Use direct transaction for localhost (no bundler)
    if (isLocalhost()) {
      result = await sendP2PLocalhost(fromWalletId, toAddress, amount);
      result.transactionId = outgoingTx.id;
    } else {
      // Build ERC-20 transfer callData
      const transferData = encodeFunctionData({
        abi: ERC20_ABI,
        functionName: "transfer",
        args: [toAddress as Address, amount],
      });

      // Build execute callData (wallet calls USDC.transfer)
      const callData = buildExecuteCallData(USDC_ADDRESS, 0n, transferData as Hex);

      // Check if wallet is deployed
      const isDeployed = senderWallet.isDeployed || (await checkWalletDeployed(senderWallet.address));

      // Execute UserOperation
      result = await executeUserOp({
        sender: senderWallet.address as Address,
        userId: senderWallet.userId,
        callData,
        isDeployed,
      });
    }

    if (result.success) {
      // Update outgoing transaction
      await updateTransactionStatus(outgoingTx.id, "CONFIRMED", result.txHash);

      // Update incoming transaction if exists (without txHash to avoid unique constraint)
      if (incomingTxId) {
        await updateTransactionStatus(incomingTxId, "CONFIRMED");
      }

      // Mark wallet as deployed if it wasn't
      if (!senderWallet.isDeployed && result.txHash) {
        await markWalletDeployed(senderWallet.id);
      }

      return {
        success: true,
        userOpHash: result.userOpHash,
        txHash: result.txHash,
        transactionId: outgoingTx.id,
      };
    } else {
      // Update transaction as failed
      await updateTransactionStatus(outgoingTx.id, "FAILED");
      if (incomingTxId) {
        await updateTransactionStatus(incomingTxId, "FAILED");
      }

      return {
        success: false,
        transactionId: outgoingTx.id,
        error: result.error,
      };
    }
  } catch (error) {
    // Update transaction as failed
    await updateTransactionStatus(outgoingTx.id, "FAILED");
    if (incomingTxId) {
      await updateTransactionStatus(incomingTxId, "FAILED");
    }

    return {
      success: false,
      transactionId: outgoingTx.id,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Create a payment request (for QR code payments)
 */
export async function createPaymentRequest(
  recipientUserId: string,
  amount: bigint,
  memo?: string,
  expiresInMinutes: number = 30
): Promise<PaymentRequestData> {
  // Get recipient wallet
  const recipientWallet = await getWallet(recipientUserId);

  if (!recipientWallet) {
    throw new Error("Recipient wallet not found");
  }

  // Calculate expiration
  const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

  // Create payment request
  const request = await prisma.paymentRequest.create({
    data: {
      recipientId: recipientUserId,
      amount,
      memo,
      expiresAt,
      status: "PENDING",
    },
  });

  // Build QR data
  const qrData = JSON.stringify({
    type: "vlossom_payment",
    version: 1,
    requestId: request.id,
    recipient: recipientWallet.address,
    amount: amount.toString(),
    memo: memo || null,
    expiresAt: expiresAt.toISOString(),
  });

  return {
    requestId: request.id,
    recipientAddress: recipientWallet.address,
    amount,
    amountFormatted: fromUsdcUnits(amount),
    memo,
    expiresAt,
    qrData,
  };
}

/**
 * Get a payment request by ID
 */
export async function getPaymentRequest(requestId: string): Promise<PaymentRequest | null> {
  const request = await prisma.paymentRequest.findUnique({
    where: { id: requestId },
  });

  // Check if expired
  if (request && request.status === "PENDING" && new Date() > request.expiresAt) {
    await prisma.paymentRequest.update({
      where: { id: requestId },
      data: { status: "EXPIRED" },
    });
    return { ...request, status: "EXPIRED" as PaymentRequestStatus };
  }

  return request;
}

/**
 * Fulfill a payment request
 */
export async function fulfillPaymentRequest(
  requestId: string,
  payerUserId: string
): Promise<P2PTransferResult> {
  // Get payment request
  const request = await getPaymentRequest(requestId);

  if (!request) {
    throw new Error("Payment request not found");
  }

  if (request.status !== "PENDING") {
    throw new Error(`Payment request is ${request.status.toLowerCase()}`);
  }

  // Get payer wallet
  const payerWallet = await getWallet(payerUserId);

  if (!payerWallet) {
    throw new Error("Payer wallet not found");
  }

  // Get recipient wallet
  const recipientWallet = await getWallet(request.recipientId);

  if (!recipientWallet) {
    throw new Error("Recipient wallet not found");
  }

  // Execute the transfer
  const result = await sendP2P(
    payerWallet.id,
    recipientWallet.address,
    request.amount,
    request.memo ?? undefined
  );

  if (result.success) {
    // Update payment request
    await prisma.paymentRequest.update({
      where: { id: requestId },
      data: {
        status: "COMPLETED",
        payerId: payerUserId,
        txHash: result.txHash,
      },
    });
  }

  return result;
}

/**
 * Cancel a payment request
 */
export async function cancelPaymentRequest(requestId: string, userId: string): Promise<void> {
  const request = await prisma.paymentRequest.findUnique({
    where: { id: requestId },
  });

  if (!request) {
    throw new Error("Payment request not found");
  }

  if (request.recipientId !== userId) {
    throw new Error("Only the recipient can cancel a payment request");
  }

  if (request.status !== "PENDING") {
    throw new Error(`Payment request is already ${request.status.toLowerCase()}`);
  }

  await prisma.paymentRequest.update({
    where: { id: requestId },
    data: { status: "CANCELLED" },
  });
}

/**
 * Get pending payment requests for a user (as recipient)
 */
export async function getPendingPaymentRequests(userId: string): Promise<PaymentRequest[]> {
  // First, expire any old requests
  await prisma.paymentRequest.updateMany({
    where: {
      recipientId: userId,
      status: "PENDING",
      expiresAt: { lt: new Date() },
    },
    data: { status: "EXPIRED" },
  });

  return prisma.paymentRequest.findMany({
    where: {
      recipientId: userId,
      status: "PENDING",
    },
    orderBy: { createdAt: "desc" },
  });
}
