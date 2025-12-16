"use client";

import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { fiatRampRegistry, type FiatRampProvider, type ProviderAvailability } from "@/lib/fiat-ramp";
import { isTestnet, CONTRACTS } from "@/lib/wagmi-config";
import { useAccount } from "wagmi";
import { formatPrice } from "@/lib/utils";

interface AddFundsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = "amount" | "provider" | "loading" | "redirect";

// Preset amounts in USD cents
const PRESET_AMOUNTS = [2000, 5000, 10000, 20000]; // $20, $50, $100, $200

export function AddFundsDialog({ open, onOpenChange }: AddFundsDialogProps) {
  const { address } = useAccount();
  const [step, setStep] = useState<Step>("amount");
  const [amount, setAmount] = useState<number>(5000); // $50 default
  const [customAmount, setCustomAmount] = useState<string>("");
  const [providers, setProviders] = useState<ProviderAvailability[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<FiatRampProvider | null>(null);
  const [widgetUrl, setWidgetUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const network = isTestnet() ? "base_sepolia" : "base";
  const fiatCurrency = "USD";
  const cryptoCurrency = "USDC";

  // Reset state when dialog opens
  const handleOpenChange = useCallback((newOpen: boolean) => {
    if (!newOpen) {
      setStep("amount");
      setAmount(5000);
      setCustomAmount("");
      setProviders([]);
      setSelectedProvider(null);
      setWidgetUrl(null);
      setError(null);
    }
    onOpenChange(newOpen);
  }, [onOpenChange]);

  // Check available providers
  const checkProviders = useCallback(async () => {
    setStep("loading");
    setError(null);

    try {
      const results = await fiatRampRegistry.checkAllProviders({
        fiatCurrency,
        cryptoCurrency,
        network,
      });

      const availableProviders = results.filter((p) => p.available);

      if (availableProviders.length === 0) {
        setError("No payment providers available for your region. Please try again later.");
        setStep("amount");
        return;
      }

      setProviders(results);
      setStep("provider");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to check providers");
      setStep("amount");
    }
  }, [fiatCurrency, cryptoCurrency, network]);

  // Initiate on-ramp
  const initiateOnRamp = useCallback(async (provider: FiatRampProvider) => {
    if (!address) {
      setError("Please connect your wallet first");
      return;
    }

    setSelectedProvider(provider);
    setStep("loading");
    setError(null);

    try {
      const adapter = fiatRampRegistry.getAdapter(provider);
      if (!adapter) {
        throw new Error(`Provider ${provider} not available`);
      }

      const response = await adapter.initiateOnRamp({
        provider,
        fiatAmount: amount / 100, // Convert cents to dollars
        fiatCurrency,
        cryptoCurrency,
        network,
        walletAddress: address,
        redirectUrl: typeof window !== "undefined" ? `${window.location.origin}/wallet?status=success` : undefined,
      });

      setWidgetUrl(response.url);
      setStep("redirect");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to initiate purchase");
      setStep("provider");
    }
  }, [address, amount, fiatCurrency, cryptoCurrency, network]);

  // Open provider widget in new window
  const openWidget = useCallback(() => {
    if (widgetUrl) {
      window.open(widgetUrl, "_blank", "noopener,noreferrer");
      handleOpenChange(false);
    }
  }, [widgetUrl, handleOpenChange]);

  const handleCustomAmountChange = (value: string) => {
    // Only allow numbers
    const cleaned = value.replace(/[^0-9]/g, "");
    setCustomAmount(cleaned);
    if (cleaned) {
      setAmount(parseInt(cleaned, 10) * 100); // Convert to cents
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Funds</DialogTitle>
          <DialogDescription>
            {step === "amount" && "Select how much USDC to add to your wallet"}
            {step === "provider" && "Choose a payment method"}
            {step === "loading" && "Please wait..."}
            {step === "redirect" && "Ready to purchase"}
          </DialogDescription>
        </DialogHeader>

        {/* Testnet Warning */}
        {isTestnet() && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
            <p className="text-xs text-amber-700">
              <span className="font-medium">Testnet Mode</span> - Using staging environment with test transactions
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Step 1: Amount Selection */}
        {step === "amount" && (
          <div className="space-y-4">
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
                  <span className="text-lg font-semibold">{formatPrice(preset)}</span>
                </button>
              ))}
            </div>

            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">$</span>
              <input
                type="text"
                placeholder="Custom amount"
                value={customAmount}
                onChange={(e) => handleCustomAmountChange(e.target.value)}
                className="w-full pl-7 pr-4 py-3 rounded-lg border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              />
            </div>

            <div className="text-center text-sm text-text-secondary">
              You&apos;ll receive approximately{" "}
              <span className="font-medium text-text-primary">
                {formatPrice(Math.round(amount * 0.985))} USDC
              </span>
            </div>

            <Button
              onClick={checkProviders}
              className="w-full"
              size="lg"
              disabled={amount < 3000}
            >
              Continue
            </Button>

            {amount < 3000 && (
              <p className="text-xs text-text-tertiary text-center">
                Minimum amount is $30
              </p>
            )}
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

        {/* Step 3: Loading */}
        {step === "loading" && (
          <div className="py-8 text-center">
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
              {selectedProvider ? `Connecting to ${selectedProvider}...` : "Checking providers..."}
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
                You&apos;ll be redirected to {selectedProvider} to complete your purchase of{" "}
                {formatPrice(amount)} USDC.
              </p>
            </div>

            <div className="bg-surface rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-text-secondary">Amount</span>
                <span className="font-medium">{formatPrice(amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Currency</span>
                <span className="font-medium">USDC</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Network</span>
                <span className="font-medium">
                  {isTestnet() ? "Base Sepolia (Testnet)" : "Base"}
                </span>
              </div>
            </div>

            <Button onClick={openWidget} className="w-full" size="lg">
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
      </DialogContent>
    </Dialog>
  );
}

export default AddFundsDialog;
