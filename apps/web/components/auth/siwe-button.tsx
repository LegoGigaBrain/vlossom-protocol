/**
 * Sign In With Ethereum (SIWE) Button Component
 * V3.2: Provides wallet-based authentication UI
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { useAccount, useDisconnect } from "wagmi";
import { Button } from "@/components/ui/button";
import { useSiwe, getSiweStatusMessage } from "@/hooks/use-siwe";
import { ConnectWalletDialog } from "@/components/wallet/connect-wallet-dialog";

interface SiweButtonProps {
  /** Role to assign to new users */
  role?: "CUSTOMER" | "STYLIST";
  /** Callback when authentication succeeds */
  onSuccess?: (isNewUser: boolean) => void;
  /** Callback when authentication fails */
  onError?: (error: string) => void;
  /** Button variant */
  variant?: "primary" | "secondary" | "outline";
  /** Button size */
  size?: "default" | "sm" | "lg";
  /** Custom class name */
  className?: string;
  /** Disabled state */
  disabled?: boolean;
}

/**
 * SIWE Button - Sign in with Ethereum wallet
 * Shows wallet connection dialog if not connected
 */
export function SiweButton({
  role = "CUSTOMER",
  onSuccess,
  onError,
  variant = "outline",
  size = "default",
  className,
  disabled,
}: SiweButtonProps) {
  const [showConnectDialog, setShowConnectDialog] = useState(false);
  const [pendingSignIn, setPendingSignIn] = useState(false);
  const { isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { status, error, signIn, reset } = useSiwe();
  const prevConnectedRef = useRef(isConnected);

  const isLoading = status === "connecting" || status === "signing" || status === "verifying";
  const statusMessage = getSiweStatusMessage(status);

  // Watch for wallet connection and trigger sign-in
  useEffect(() => {
    const wasConnected = prevConnectedRef.current;
    prevConnectedRef.current = isConnected;

    // If wallet just connected and we have a pending sign-in request
    if (!wasConnected && isConnected && pendingSignIn) {
      setPendingSignIn(false);
      setShowConnectDialog(false);

      // Small delay to ensure wallet state is fully updated
      const timer = setTimeout(async () => {
        const result = await signIn(role);
        if (result) {
          onSuccess?.(result.isNewUser);
        } else if (error) {
          onError?.(error);
        }
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [isConnected, pendingSignIn, role, signIn, onSuccess, onError, error]);

  const handleClick = async () => {
    if (!isConnected) {
      setPendingSignIn(true);
      setShowConnectDialog(true);
      return;
    }

    // Already connected, proceed with SIWE
    const result = await signIn(role);
    if (result) {
      onSuccess?.(result.isNewUser);
    } else if (error) {
      onError?.(error);
    }
  };

  // If authentication failed, allow retry
  if (status === "error") {
    return (
      <div className="flex flex-col gap-2">
        <Button
          variant="outline"
          size={size}
          className={className}
          onClick={() => {
            reset();
            disconnect();
          }}
        >
          Try Again
        </Button>
        {error && (
          <p className="text-sm text-status-error">{error}</p>
        )}
      </div>
    );
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={handleClick}
        loading={isLoading}
        disabled={disabled || isLoading}
        aria-label="Sign in with Ethereum wallet"
      >
        <WalletIcon className="h-5 w-5" />
        {isLoading ? statusMessage : "Sign in with Ethereum"}
      </Button>

      <ConnectWalletDialog
        open={showConnectDialog}
        onOpenChange={(open) => {
          setShowConnectDialog(open);
          // If dialog is closed without connecting, cancel the pending sign-in
          if (!open && !isConnected) {
            setPendingSignIn(false);
          }
        }}
      />
    </>
  );
}

/**
 * Compact SIWE button for inline use
 */
export function SiweButtonCompact({
  onSuccess,
  onError,
  className,
}: Pick<SiweButtonProps, "onSuccess" | "onError" | "className">) {
  return (
    <SiweButton
      onSuccess={onSuccess}
      onError={onError}
      variant="secondary"
      size="sm"
      className={className}
    />
  );
}

/**
 * SIWE divider - "or sign in with"
 */
export function SiweDivider() {
  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-border-default" />
      </div>
      <div className="relative flex justify-center text-sm">
        <span className="bg-background-primary px-4 text-text-muted">
          or continue with
        </span>
      </div>
    </div>
  );
}

/**
 * Wallet icon SVG
 */
function WalletIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M19 7H18V6C18 4.34 16.66 3 15 3H5C3.34 3 2 4.34 2 6V18C2 19.66 3.34 21 5 21H19C20.66 21 22 19.66 22 18V10C22 8.34 20.66 7 19 7ZM5 5H15C15.55 5 16 5.45 16 6V7H5C4.45 7 4 6.55 4 6C4 5.45 4.45 5 5 5ZM20 15H19C18.45 15 18 14.55 18 14C18 13.45 18.45 13 19 13H20V15ZM20 11H19C17.34 11 16 12.34 16 14C16 15.66 17.34 17 19 17H20V18C20 18.55 19.55 19 19 19H5C4.45 19 4 18.55 4 18V8.83C4.32 8.94 4.65 9 5 9H19C19.55 9 20 9.45 20 10V11Z"
        fill="currentColor"
      />
    </svg>
  );
}
