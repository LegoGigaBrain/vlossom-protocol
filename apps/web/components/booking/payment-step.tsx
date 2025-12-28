"use client";

import { useState, useEffect, useCallback } from "react";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/hooks/use-wallet";
import { useConfirmPayment } from "@/hooks/use-bookings";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/error-utils";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { CONTRACTS, getExplorerTxUrl, isTestnet } from "@/lib/wagmi-config";
import {
  ESCROW_ABI,
  USDC_ABI,
  centsToUsdcUnits,
  bookingIdToBytes32,
} from "@/lib/contracts";
import type { Address, Hash } from "viem";

type PaymentState =
  | "idle"
  | "checking"
  | "insufficient"
  | "checking-allowance"
  | "approving"
  | "waiting-approval"
  | "locking"
  | "waiting-lock"
  | "confirming"
  | "processing"
  | "success"
  | "error";

interface PaymentStepProps {
  bookingId: string;
  amount: number; // Total amount in cents
  stylistAddress: string;
  onSuccess: () => void;
  /**
   * Callback to notify parent when dialog should prevent closing.
   * Called with true when payment is processing, false otherwise.
   */
  onPreventCloseChange?: (preventClose: boolean) => void;
}

export function PaymentStep({
  bookingId,
  amount,
  stylistAddress: _stylistAddress, // Reserved for escrow contract integration
  onSuccess,
  onPreventCloseChange,
}: PaymentStepProps) {
  const { data: wallet, isLoading: walletLoading } = useWallet();
  const confirmPayment = useConfirmPayment();
  const { address: userAddress, isConnected } = useAccount();

  const [state, setState] = useState<PaymentState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<Hash | undefined>();
  const [approvalTxHash, setApprovalTxHash] = useState<Hash | undefined>();

  // Convert booking ID to bytes32 for contract calls
  const bookingIdBytes32 = bookingIdToBytes32(bookingId);
  // Convert cents to USDC units (6 decimals)
  const amountInUsdcUnits = centsToUsdcUnits(amount);

  // Read current USDC allowance for escrow contract
  const { data: currentAllowance, refetch: refetchAllowance } = useReadContract({
    address: CONTRACTS.USDC as Address,
    abi: USDC_ABI,
    functionName: "allowance",
    args: userAddress ? [userAddress, CONTRACTS.Escrow as Address] : undefined,
    query: {
      enabled: !!userAddress && isConnected,
    },
  });

  // Write contract hooks
  const {
    writeContract: writeApprove,
    data: approveData,
  } = useWriteContract();

  const {
    writeContract: writeLockFunds,
    data: lockFundsData,
  } = useWriteContract();

  // Wait for approval transaction
  const { isSuccess: isApprovalConfirmed } =
    useWaitForTransactionReceipt({
      hash: approvalTxHash,
    });

  // Wait for lock funds transaction
  const { isSuccess: isLockConfirmed } =
    useWaitForTransactionReceipt({
      hash: txHash,
    });

  // Update approval tx hash when available
  useEffect(() => {
    if (approveData) {
      setApprovalTxHash(approveData);
      setState("waiting-approval");
    }
  }, [approveData]);

  // Update lock tx hash when available
  useEffect(() => {
    if (lockFundsData) {
      setTxHash(lockFundsData);
      setState("waiting-lock");
    }
  }, [lockFundsData]);

  // Convert cents to USDC amount (USDC has 6 decimals, but we display as dollars)
  const amountUSD = amount / 100;
  const walletBalance = wallet?.balance?.usdcFormatted || 0;
  const hasBalance = walletBalance >= amountUSD;

  // Lock funds in escrow contract
  const lockFunds = useCallback(() => {
    setState("locking");
    try {
      writeLockFunds({
        address: CONTRACTS.Escrow as Address,
        abi: ESCROW_ABI,
        functionName: "lockFunds",
        args: [bookingIdBytes32, amountInUsdcUnits],
      });
    } catch (err) {
      setState("error");
      setError(getErrorMessage(err));
    }
  }, [writeLockFunds, bookingIdBytes32, amountInUsdcUnits]);

  // Submit confirmed transaction to backend with on-chain verification
  const submitToBackend = useCallback(async (confirmedTxHash: Hash) => {
    try {
      setState("processing");

      // Confirm payment with on-chain escrow verification
      await confirmPayment.mutateAsync({
        bookingId,
        escrowTxHash: confirmedTxHash,
      });

      setState("success");
      toast.success("Payment confirmed!", {
        description: isTestnet()
          ? "Funds locked in escrow on Base Sepolia testnet"
          : "Funds locked in escrow",
        action: {
          label: "View Transaction",
          onClick: () => window.open(getExplorerTxUrl(confirmedTxHash), "_blank"),
        },
      });
      onSuccess();
    } catch (err) {
      setState("error");
      setError(getErrorMessage(err));
    }
  }, [bookingId, confirmPayment, onSuccess]);

  // Handle approval confirmation - proceed to lock funds
  useEffect(() => {
    if (isApprovalConfirmed && state === "waiting-approval") {
      // Refetch allowance and proceed to lock funds
      refetchAllowance().then(() => {
        lockFunds();
      });
    }
  }, [isApprovalConfirmed, state, refetchAllowance, lockFunds]);

  // Handle lock confirmation - submit to backend
  useEffect(() => {
    if (isLockConfirmed && txHash && state === "waiting-lock") {
      submitToBackend(txHash);
    }
  }, [isLockConfirmed, txHash, state, submitToBackend]);

  // Determine if dialog should prevent closing (during critical states)
  const isProcessing = [
    "checking-allowance",
    "approving",
    "waiting-approval",
    "locking",
    "waiting-lock",
    "confirming",
    "processing",
  ].includes(state);

  // Notify parent when processing state changes
  useEffect(() => {
    onPreventCloseChange?.(isProcessing);
  }, [isProcessing, onPreventCloseChange]);

  const handleConfirmPayment = async () => {
    if (!hasBalance) {
      setState("insufficient");
      return;
    }

    if (!userAddress || !isConnected) {
      setState("error");
      setError("Wallet not connected. Please connect your wallet first.");
      return;
    }

    try {
      setState("checking-allowance");

      // Check if we have sufficient allowance
      const allowance = currentAllowance as bigint | undefined;
      const needsApproval = !allowance || allowance < amountInUsdcUnits;

      if (needsApproval) {
        // Request approval first
        setState("approving");
        toast.info("Approval required", {
          description: "Please approve USDC spending in your wallet",
        });

        writeApprove({
          address: CONTRACTS.USDC as Address,
          abi: USDC_ABI,
          functionName: "approve",
          args: [CONTRACTS.Escrow as Address, amountInUsdcUnits],
        });
      } else {
        // Already approved, proceed directly to lock funds
        lockFunds();
      }
    } catch (err) {
      setState("error");
      const message = getErrorMessage(err);
      setError(message);
      toast.error("Payment failed", { description: message });
    }
  };

  const handleRetry = () => {
    setState("idle");
    setError(null);
  };

  // Loading state
  if (walletLoading) {
    return (
      <div className="space-y-4 py-8">
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-full bg-surface animate-pulse" />
        </div>
        <p className="text-center text-text-secondary">Loading wallet...</p>
      </div>
    );
  }

  // Insufficient balance state
  if (state === "insufficient" || (!hasBalance && state === "idle")) {
    return (
      <div className="space-y-4">
        <div className="bg-status-warning/10 border border-status-warning rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg
              className="w-6 h-6 text-status-warning flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div>
              <p className="font-medium text-status-warning">Insufficient Balance</p>
              <p className="text-sm text-text-secondary mt-1">
                You need {formatPrice((amountUSD - walletBalance) * 100)} more to
                complete this booking.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="text-text-secondary">Wallet Balance</span>
            <span className="font-semibold text-text-primary">
              {formatPrice(walletBalance * 100)}
            </span>
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-text-secondary">Amount Due</span>
            <span className="font-semibold text-primary">
              {formatPrice(amount)}
            </span>
          </div>
        </div>

        <Button
          variant="outline"
          className="w-full"
          onClick={() => {
            // TODO: Open add money dialog
            window.location.href = "/wallet";
          }}
        >
          Add Money to Wallet
        </Button>
      </div>
    );
  }

  // Error state
  if (state === "error") {
    return (
      <div className="space-y-4 py-4">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-status-error/10 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-status-error"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">
            Payment Failed
          </h3>
          <p className="text-text-secondary">
            {error || "Something went wrong. Please try again."}
          </p>
        </div>
        <Button onClick={handleRetry} className="w-full">
          Try Again
        </Button>
      </div>
    );
  }

  // Get state display info
  const getStateDisplay = (): { title: string; description: string } => {
    switch (state) {
      case "checking-allowance":
        return {
          title: "Checking Allowance",
          description: "Verifying USDC spending permission...",
        };
      case "approving":
        return {
          title: "Approval Required",
          description: "Please confirm the approval in your wallet...",
        };
      case "waiting-approval":
        return {
          title: "Confirming Approval",
          description: "Waiting for approval transaction to confirm...",
        };
      case "locking":
        return {
          title: "Locking Funds",
          description: "Please confirm the escrow transaction in your wallet...",
        };
      case "waiting-lock":
        return {
          title: "Confirming Transaction",
          description: "Waiting for escrow transaction to confirm...",
        };
      case "processing":
        return {
          title: "Finalizing",
          description: "Updating your booking status...",
        };
      default:
        return {
          title: "Processing Payment",
          description: "Please wait...",
        };
    }
  };

  // Processing states
  if (isProcessing) {
    const { title, description } = getStateDisplay();
    return (
      <div className="space-y-4 py-8" aria-busy="true" aria-live="polite">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-primary animate-spin"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden={true}
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
        </div>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-text-primary mb-2">
            {title}
          </h3>
          <p className="text-text-secondary">{description}</p>
          {isTestnet() && (
            <p className="text-xs text-text-tertiary mt-2">
              Base Sepolia Testnet
            </p>
          )}
          <p className="sr-only">
            Please do not close this dialog. Your payment is being processed.
          </p>
        </div>
      </div>
    );
  }

  // Success state
  if (state === "success") {
    return (
      <div className="space-y-4 py-8">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-tertiary/20 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-tertiary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-text-primary mb-2">
            Payment Successful!
          </h3>
          <p className="text-text-secondary">
            Your funds are secured in escrow.
          </p>
          {txHash && (
            <button
              onClick={() => window.open(getExplorerTxUrl(txHash), "_blank")}
              className="text-sm text-primary hover:underline mt-2 inline-flex items-center gap-1"
            >
              View transaction
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </button>
          )}
        </div>
      </div>
    );
  }

  // Idle state - ready to pay
  return (
    <div className="space-y-4">
      <div className="text-center py-4">
        <p className="text-text-secondary mb-2">Total to Pay</p>
        <p className="text-3xl font-bold text-primary">{formatPrice(amount)}</p>
      </div>

      <div className="bg-surface rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <svg
              className="w-5 h-5 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <p className="font-medium text-text-primary">USDC Wallet</p>
            <p className="text-sm text-text-secondary">
              Balance: {formatPrice(walletBalance * 100)}
            </p>
          </div>
          <svg
            className="w-5 h-5 text-tertiary"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>

      <p className="text-sm text-text-secondary text-center">
        Funds will be held in escrow until service completion
      </p>

      {isTestnet() && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
          <p className="text-xs text-amber-700">
            <span className="font-medium">Testnet Mode</span> - Using Base Sepolia with test USDC
          </p>
        </div>
      )}

      <Button
        onClick={handleConfirmPayment}
        className="w-full"
        size="lg"
        disabled={isProcessing || !isConnected}
        aria-busy={isProcessing}
      >
        {!isConnected
          ? "Connect Wallet"
          : isProcessing
          ? "Processing..."
          : "Confirm Payment"}
      </Button>
    </div>
  );
}
