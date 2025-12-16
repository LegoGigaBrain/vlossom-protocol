/**
 * SIWE (Sign-In with Ethereum) Hook
 * V3.2: Provides wallet-based authentication using wagmi
 */

"use client";

import { useState, useCallback } from "react";
import { useAccount, useSignMessage, useChainId } from "wagmi";
import {
  requestSiweChallenge,
  authenticateWithSiwe,
  linkWallet,
  type SiweAuthResponse,
  type LinkedAccount,
} from "@/lib/auth-client";

export type SiweStatus = "idle" | "connecting" | "signing" | "verifying" | "success" | "error";

export interface UseSiweReturn {
  // State
  status: SiweStatus;
  error: string | null;
  isConnected: boolean;
  address: string | undefined;
  chainId: number;

  // Actions
  signIn: (role?: "CUSTOMER" | "STYLIST") => Promise<SiweAuthResponse | null>;
  linkCurrentWallet: () => Promise<LinkedAccount | null>;
  reset: () => void;
}

/**
 * Hook for SIWE authentication
 * Uses wagmi for wallet connection and message signing
 */
export function useSiwe(): UseSiweReturn {
  const [status, setStatus] = useState<SiweStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { signMessageAsync } = useSignMessage();

  /**
   * Sign in with connected wallet
   * Creates account if new user
   */
  const signIn = useCallback(
    async (role: "CUSTOMER" | "STYLIST" = "CUSTOMER"): Promise<SiweAuthResponse | null> => {
      if (!address || !isConnected) {
        setError("Please connect your wallet first");
        setStatus("error");
        return null;
      }

      try {
        setError(null);
        setStatus("connecting");

        // Step 1: Get SIWE challenge from backend
        const challenge = await requestSiweChallenge(address, chainId);

        setStatus("signing");

        // Step 2: Sign the message with wallet
        const signature = await signMessageAsync({
          message: challenge.message,
        });

        setStatus("verifying");

        // Step 3: Verify signature and authenticate
        const result = await authenticateWithSiwe({
          message: challenge.message,
          signature,
          role,
        });

        setStatus("success");
        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "SIWE authentication failed";
        setError(errorMessage);
        setStatus("error");
        return null;
      }
    },
    [address, isConnected, chainId, signMessageAsync]
  );

  /**
   * Link currently connected wallet to existing account
   * Requires user to already be logged in
   */
  const linkCurrentWallet = useCallback(async (): Promise<LinkedAccount | null> => {
    if (!address || !isConnected) {
      setError("Please connect your wallet first");
      setStatus("error");
      return null;
    }

    try {
      setError(null);
      setStatus("connecting");

      // Step 1: Get SIWE challenge
      const challenge = await requestSiweChallenge(address, chainId);

      setStatus("signing");

      // Step 2: Sign the message
      const signature = await signMessageAsync({
        message: challenge.message,
      });

      setStatus("verifying");

      // Step 3: Link wallet to account
      const linkedAccount = await linkWallet(challenge.message, signature);

      setStatus("success");
      return linkedAccount;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to link wallet";
      setError(errorMessage);
      setStatus("error");
      return null;
    }
  }, [address, isConnected, chainId, signMessageAsync]);

  /**
   * Reset the hook state
   */
  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
  }, []);

  return {
    status,
    error,
    isConnected,
    address,
    chainId,
    signIn,
    linkCurrentWallet,
    reset,
  };
}

/**
 * Get human-readable status message
 */
export function getSiweStatusMessage(status: SiweStatus): string {
  switch (status) {
    case "idle":
      return "";
    case "connecting":
      return "Connecting to wallet...";
    case "signing":
      return "Please sign the message in your wallet...";
    case "verifying":
      return "Verifying signature...";
    case "success":
      return "Successfully signed in!";
    case "error":
      return "Authentication failed";
    default:
      return "";
  }
}
