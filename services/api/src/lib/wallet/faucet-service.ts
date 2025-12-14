/**
 * Faucet Service
 * Testnet-only service to mint MockUSDC for testing
 */

import { type Address, parseUnits } from "viem";
import { prisma } from "../prisma";
import { publicClient, getRelayerWalletClient } from "./chain-client";
import { USDC_ADDRESS } from "./contracts";

const FAUCET_AMOUNT = parseUnits("1000", 6); // 1000 USDC (6 decimals)
const RATE_LIMIT_HOURS = 24;

// Simple ABI for MockUSDC mint function
const MOCK_USDC_ABI = [
  {
    type: "function",
    name: "mint",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
] as const;

/**
 * Check if user is rate-limited (has claimed in last 24 hours)
 */
export async function checkRateLimit(userId: string): Promise<{
  isRateLimited: boolean;
  lastClaim?: Date;
  nextClaimAt?: Date;
}> {
  const lastClaim = await prisma.walletTransaction.findFirst({
    where: {
      wallet: { userId },
      type: "FAUCET_CLAIM",
      status: "CONFIRMED",
    },
    orderBy: { createdAt: "desc" },
  });

  if (!lastClaim) {
    return { isRateLimited: false };
  }

  const nextClaimAt = new Date(lastClaim.createdAt.getTime() + RATE_LIMIT_HOURS * 60 * 60 * 1000);
  const isRateLimited = new Date() < nextClaimAt;

  return {
    isRateLimited,
    lastClaim: lastClaim.createdAt,
    nextClaimAt,
  };
}

/**
 * Claim faucet - mint 1000 MockUSDC to user's wallet
 */
export async function claimFaucet(userId: string): Promise<{
  success: boolean;
  txHash?: string;
  amount?: string;
  error?: string;
  nextClaimAt?: Date;
}> {
  // Check if on testnet (localhost or Base Sepolia)
  const chainId = publicClient.chain?.id;
  if (chainId !== 31337 && chainId !== 84532) {
    return {
      success: false,
      error: "Faucet is only available on testnet",
    };
  }

  // Check rate limit
  const rateLimit = await checkRateLimit(userId);
  if (rateLimit.isRateLimited) {
    return {
      success: false,
      error: "Rate limit exceeded. Please try again later.",
      nextClaimAt: rateLimit.nextClaimAt,
    };
  }

  // Get user's wallet
  const wallet = await prisma.wallet.findUnique({
    where: { userId },
  });

  if (!wallet) {
    return {
      success: false,
      error: "Wallet not found",
    };
  }

  try {
    // Mint MockUSDC using relayer
    const relayerClient = getRelayerWalletClient();

    const txHash = await relayerClient.writeContract({
      address: USDC_ADDRESS,
      abi: MOCK_USDC_ABI,
      functionName: "mint",
      args: [wallet.address as Address, FAUCET_AMOUNT],
    });

    // Wait for transaction confirmation
    await publicClient.waitForTransactionReceipt({ hash: txHash });

    // Record transaction
    await prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: "FAUCET_CLAIM",
        amount: FAUCET_AMOUNT,
        txHash,
        status: "CONFIRMED",
        confirmedAt: new Date(),
        memo: "Faucet claim: 1000 USDC",
      },
    });

    return {
      success: true,
      txHash,
      amount: FAUCET_AMOUNT.toString(),
    };
  } catch (error) {
    console.error("Faucet claim error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to claim faucet",
    };
  }
}
