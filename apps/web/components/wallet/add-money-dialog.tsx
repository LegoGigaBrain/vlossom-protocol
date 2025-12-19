"use client";

import { useState, useEffect, useCallback } from "react";
import { useWallet } from "../../hooks/use-wallet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { CheckCircleIcon } from "../ui/icons";
import { fiatRampRegistry, type FiatRampProvider, type ProviderAvailability } from "@/lib/fiat-ramp";
import { isTestnet } from "@/lib/wagmi-config";
import { useAccount } from "wagmi";
import { formatPrice } from "@/lib/utils";

interface AddMoneyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = "amount" | "provider" | "processing" | "redirect" | "success";

// Preset amounts in cents
const PRESET_AMOUNTS = [2000, 5000, 10000, 20000]; // $20, $50, $100, $200

export function AddMoneyDialog({ open, onOpenChange }: AddMoneyDialogProps) {
  const { refetch } = useWallet();
  const { address } = useAccount();
  const [step, setStep] = useState<Step>("amount");
  const [amount, setAmount] = useState<number>(5000); // $50 default in cents
  const [customAmount, setCustomAmount] = useState("");
  const [currency, setCurrency] = useState<"USD" | "ZAR">("USD");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [providers, setProviders] = useState<ProviderAvailability[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<FiatRampProvider | null>(null);
  const [widgetUrl, setWidgetUrl] = useState<string | null>(null);

  const network = isTestnet() ? "base_sepolia" : "base";

  // Reset state when dialog closes
  const handleClose = useCallback(() => {
    setStep("amount");
    setAmount(5000);
    setCustomAmount("");
    setCurrency("USD");
    setError(null);
    setLoading(false);
    setProviders([]);
    setSelectedProvider(null);
    setWidgetUrl(null);
    onOpenChange(false);
  }, [onOpenChange]);

  // Auto-close after 3 seconds on success
  useEffect(() => {
    if (step === "success") {
      const timer = setTimeout(() => {
        handleClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [step, handleClose]);

  // Check available providers
  const checkProviders = useCallback(async () => {
    setStep("processing");
    setError(null);
    setLoading(true);

    try {
      const results = await fiatRampRegistry.checkAllProviders({
        fiatCurrency: currency,
        cryptoCurrency: "USDC",
        network,
      });

      const availableProviders = results.filter((p) => p.available);

      if (availableProviders.length === 0) {
        setError("No payment providers available. Please try again later.");
        setStep("amount");
        setLoading(false);
        return;
      }

      setProviders(results);
      setStep("provider");
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to check providers");
      setStep("amount");
      setLoading(false);
    }
  }, [currency, network]);

  // Initiate on-ramp
  const initiateOnRamp = useCallback(async (provider: FiatRampProvider) => {
    if (!address) {
      setError("Please connect your wallet first");
      return;
    }

    setSelectedProvider(provider);
    setStep("processing");
    setError(null);
    setLoading(true);

    try {
      const adapter = fiatRampRegistry.getAdapter(provider);
      if (!adapter) {
        throw new Error(`Provider ${provider} not available`);
      }

      const fiatAmount = currency === "USD" ? amount / 100 : amount / 100;

      const response = await adapter.initiateOnRamp({
        provider,
        fiatAmount,
        fiatCurrency: currency,
        cryptoCurrency: "USDC",
        network,
        walletAddress: address,
        redirectUrl: typeof window !== "undefined"
          ? `${window.location.origin}/wallet?status=success`
          : undefined,
      });

      setWidgetUrl(response.url);
      setStep("redirect");
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to initiate purchase");
      setStep("provider");
      setLoading(false);
    }
  }, [address, amount, currency, network]);

  // Open provider widget
  const openWidget = useCallback(() => {
    if (widgetUrl) {
      window.open(widgetUrl, "_blank", "noopener,noreferrer");
      // Show success state after opening widget
      setStep("success");
      refetch();
    }
  }, [widgetUrl, refetch]);

  // Handle custom amount input
  const handleCustomAmountChange = (value: string) => {
    const cleaned = value.replace(/[^0-9.]/g, "");
    setCustomAmount(cleaned);
    if (cleaned) {
      const parsed = parseFloat(cleaned);
      if (!isNaN(parsed)) {
        setAmount(Math.round(parsed * 100)); // Convert to cents
      }
    }
  };

  // Calculate approximate USDC received
  const getApproxUSDC = () => {
    const usdAmount = currency === "USD" ? amount : amount / 18.5; // Approximate ZAR->USD
    const afterFees = usdAmount * 0.985; // ~1.5% fee
    return afterFees;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Money</DialogTitle>
          <DialogDescription>
            {step === "amount" && "Select how much to add to your wallet"}
            {step === "provider" && "Choose a payment method"}
            {step === "processing" && "Please wait..."}
            {step === "redirect" && "Ready to purchase"}
            {step === "success" && "Purchase initiated"}
          </DialogDescription>
        </DialogHeader>

        {/* Testnet Warning */}
        {isTestnet() && step !== "success" && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-xs text-amber-700">
              <span className="font-medium">Testnet Mode</span> - Using staging environment
            </p>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Step 1: Amount Selection */}
        {step === "amount" && (
          <div className="space-y-4">
            <div className="flex gap-2 mb-4">
              <Button
                variant={currency === "USD" ? "primary" : "outline"}
                onClick={() => setCurrency("USD")}
                className="flex-1"
                size="sm"
              >
                USD
              </Button>
              <Button
                variant={currency === "ZAR" ? "primary" : "outline"}
                onClick={() => setCurrency("ZAR")}
                className="flex-1"
                size="sm"
              >
                ZAR
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {PRESET_AMOUNTS.map((preset) => (
                <button
                  key={preset}
                  onClick={() => {
                    setAmount(preset);
                    setCustomAmount("");
                  }}
                  className={`p-4 rounded-lg border-2 transition-colors ${
                    amount === preset && !customAmount
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <span className="text-lg font-semibold">
                    {currency === "USD" ? formatPrice(preset) : `R${(preset / 100).toFixed(0)}`}
                  </span>
                </button>
              ))}
            </div>

            <div>
              <Label htmlFor="customAmount">Custom amount</Label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">
                  {currency === "USD" ? "$" : "R"}
                </span>
                <Input
                  id="customAmount"
                  type="text"
                  placeholder="0.00"
                  value={customAmount}
                  onChange={(e) => handleCustomAmountChange(e.target.value)}
                  className="pl-7"
                />
              </div>
            </div>

            <p className="text-sm text-text-secondary text-center">
              You&apos;ll receive approximately{" "}
              <span className="font-medium text-text-primary">
                {formatPrice(Math.round(getApproxUSDC()))} USDC
              </span>
            </p>
          </div>
        )}

        {/* Step 2: Provider Selection */}
        {step === "provider" && (
          <div className="space-y-4">
            <div className="space-y-3">
              {providers.map((provider) => (
                <button
                  key={provider.provider}
                  onClick={() => provider.available && initiateOnRamp(provider.provider)}
                  disabled={!provider.available}
                  className={`w-full p-4 rounded-lg border-2 text-left transition-colors ${
                    provider.available
                      ? "border-border hover:border-primary"
                      : "border-border/50 opacity-50 cursor-not-allowed"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium capitalize">{provider.provider}</div>
                      <div className="text-sm text-text-secondary">
                        {provider.available
                          ? `Est. ${provider.estimatedTime}`
                          : provider.message || "Not available"}
                      </div>
                    </div>
                    {provider.available && (
                      <svg
                        className="w-5 h-5 text-text-secondary"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    )}
                  </div>
                </button>
              ))}
            </div>

            <Button
              variant="outline"
              onClick={() => setStep("amount")}
              className="w-full"
            >
              Back
            </Button>
          </div>
        )}

        {/* Step 3: Processing */}
        {step === "processing" && (
          <div className="text-center py-8">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-primary animate-spin"
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
            <p className="text-text-secondary">
              {selectedProvider
                ? `Connecting to ${selectedProvider}...`
                : "Checking providers..."}
            </p>
          </div>
        )}

        {/* Step 4: Redirect */}
        {step === "redirect" && (
          <div className="space-y-4">
            <div className="text-center py-4">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Ready to Purchase</h3>
              <p className="text-text-secondary text-sm">
                You&apos;ll be redirected to {selectedProvider} to complete your purchase.
              </p>
            </div>

            <div className="bg-surface rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-text-secondary">Amount</span>
                <span className="font-medium">
                  {currency === "USD" ? formatPrice(amount) : `R${(amount / 100).toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">You&apos;ll receive</span>
                <span className="font-medium">~{formatPrice(Math.round(getApproxUSDC()))} USDC</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Network</span>
                <span className="font-medium">
                  {isTestnet() ? "Base Sepolia" : "Base"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Success */}
        {step === "success" && (
          <div className="text-center py-8" role="status" aria-live="polite">
            <CheckCircleIcon className="h-16 w-16 mx-auto mb-4 text-tertiary animate-success" />
            <p className="text-lg font-semibold text-text-primary mb-2">Purchase Initiated!</p>
            <p className="text-text-secondary">
              Complete your purchase in the {selectedProvider} window.
              Your wallet will update once the transaction is confirmed.
            </p>
          </div>
        )}

        <DialogFooter>
          {step === "amount" && (
            <Button
              onClick={checkProviders}
              disabled={amount < 3000 || loading}
              className="w-full"
            >
              {loading ? "Processing..." : "Continue"}
            </Button>
          )}
          {step === "redirect" && (
            <div className="w-full space-y-2">
              <Button onClick={openWidget} className="w-full">
                Open {selectedProvider}
              </Button>
              <Button
                variant="outline"
                onClick={() => setStep("provider")}
                className="w-full"
              >
                Choose Different Provider
              </Button>
            </div>
          )}
          {step === "success" && (
            <Button onClick={handleClose} className="w-full">
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
