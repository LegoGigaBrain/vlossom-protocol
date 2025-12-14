"use client";

import { useState } from "react";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/hooks/use-wallet";
import { useUpdateBookingStatus } from "@/hooks/use-bookings";

type PaymentState =
  | "idle"
  | "checking"
  | "insufficient"
  | "confirming"
  | "processing"
  | "success"
  | "error";

interface PaymentStepProps {
  bookingId: string;
  amount: number; // Total amount in cents
  stylistAddress: string;
  onSuccess: () => void;
}

export function PaymentStep({
  bookingId,
  amount,
  stylistAddress: _stylistAddress, // Reserved for escrow contract integration
  onSuccess,
}: PaymentStepProps) {
  const { data: wallet, isLoading: walletLoading } = useWallet();
  const updateStatus = useUpdateBookingStatus();

  const [state, setState] = useState<PaymentState>("idle");
  const [error, setError] = useState<string | null>(null);

  // Convert cents to USDC amount (USDC has 6 decimals, but we display as dollars)
  const amountUSD = amount / 100;
  const walletBalance = wallet?.balance?.usdcFormatted || 0;
  const hasBalance = walletBalance >= amountUSD;

  const handleConfirmPayment = async () => {
    if (!hasBalance) {
      setState("insufficient");
      return;
    }

    try {
      setState("confirming");

      // Simulate a brief delay for the confirmation step
      await new Promise((resolve) => setTimeout(resolve, 500));

      setState("processing");

      // For MVP: Mock the escrow transaction
      // In production, this would interact with the smart contract
      // const txHash = await lockFundsInEscrow(bookingId, amount);

      // Update booking status to CONFIRMED
      await updateStatus.mutateAsync({
        id: bookingId,
        status: "CONFIRMED",
        escrowTxHash: "0x" + "0".repeat(64), // Mock tx hash for MVP
      });

      setState("success");

      // Brief delay before calling onSuccess to show success state
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err) {
      setState("error");
      setError(err instanceof Error ? err.message : "Payment failed");
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
        <div className="bg-accent/10 border border-accent rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg
              className="w-6 h-6 text-accent flex-shrink-0"
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
              <p className="font-medium text-accent">Insufficient Balance</p>
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
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent/10 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-accent"
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

  // Processing states
  if (state === "confirming" || state === "processing") {
    return (
      <div className="space-y-4 py-8">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-primary animate-spin"
              fill="none"
              viewBox="0 0 24 24"
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
            {state === "confirming" ? "Confirming Payment" : "Processing Payment"}
          </h3>
          <p className="text-text-secondary">
            {state === "confirming"
              ? "Please wait while we confirm your payment..."
              : "Securing funds in escrow..."}
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

      <Button onClick={handleConfirmPayment} className="w-full" size="lg">
        Confirm Payment
      </Button>
    </div>
  );
}
