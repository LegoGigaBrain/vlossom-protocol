"use client";

import { useState, useEffect } from "react";
import { useWallet } from "../../hooks/use-wallet";
import {
  createWithdrawalSession,
  simulateMockWithdrawal,
} from "../../lib/moonpay-client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { CheckCircleIcon } from "../ui/icons";

interface WithdrawDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = "amount" | "processing" | "success";

export function WithdrawDialog({ open, onOpenChange }: WithdrawDialogProps) {
  const { data: wallet, refetch } = useWallet();
  const [step, setStep] = useState<Step>("amount");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<"ZAR" | "USD">("ZAR");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [_sessionId, setSessionId] = useState<string | null>(null);
  const [_mode, setMode] = useState<string | null>(null);

  const maxUSDC = wallet ? wallet.balance.usdcFormatted : 0;

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    // Convert to USDC amount
    const usdcAmount =
      currency === "ZAR" ? parseFloat(amount) / 18.5 : parseFloat(amount);

    // Validate balance
    if (usdcAmount > maxUSDC) {
      setError(`Insufficient balance. You have ${maxUSDC.toFixed(2)} USDC`);
      setLoading(false);
      return;
    }

    const result = await createWithdrawalSession({
      amount: usdcAmount,
      fiatCurrency: currency,
    });

    if (!result.success) {
      setError(result.error || "Failed to create session");
      setLoading(false);
      return;
    }

    setSessionId(result.sessionId!);
    setMode(result.mode!);

    if (result.mode === "mock") {
      // Mock mode: simulate processing
      setStep("processing");

      // Simulate delay, then auto-complete
      setTimeout(async () => {
        await simulateMockWithdrawal(result.sessionId!, usdcAmount);
        await refetch();
        setStep("success");
        setLoading(false);
      }, 3000);
    } else {
      // Real mode: redirect to MoonPay
      window.location.href = result.redirectUrl!;
    }
  };

  const handleClose = () => {
    setStep("amount");
    setAmount("");
    setError(null);
    setSessionId(null);
    setMode(null);
    onOpenChange(false);
  };

  // Auto-close after 3 seconds on success
  useEffect(() => {
    if (step === "success") {
      const timer = setTimeout(() => {
        handleClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [step]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Withdraw</DialogTitle>
        </DialogHeader>

        {step === "amount" && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                placeholder="100"
                value={amount}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === "" || parseFloat(value) >= 0) {
                    setAmount(value);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "-" || e.key === "e") {
                    e.preventDefault();
                  }
                }}
                min="0"
                step="any"
                inputMode="decimal"
                aria-describedby="withdraw-available"
              />
              <div className="flex items-center justify-between mt-1">
                <p id="withdraw-available" className="text-caption text-text-tertiary">
                  Available: {maxUSDC.toFixed(2)} USDC
                </p>
                <button
                  type="button"
                  onClick={() => setAmount(currency === "ZAR" ? (maxUSDC * 18.5).toFixed(2) : maxUSDC.toFixed(2))}
                  className="text-caption text-brand-rose hover:underline focus:outline-none focus:ring-2 focus:ring-brand-rose focus:ring-offset-1 rounded"
                >
                  Use max
                </button>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant={currency === "ZAR" ? "primary" : "outline"}
                onClick={() => setCurrency("ZAR")}
                className="flex-1"
              >
                ZAR
              </Button>
              <Button
                variant={currency === "USD" ? "primary" : "outline"}
                onClick={() => setCurrency("USD")}
                className="flex-1"
              >
                USD
              </Button>
            </div>

            <p className="text-caption text-text-tertiary">
              You'll receive approximately{" "}
              {currency === "ZAR"
                ? ((parseFloat(amount || "0") / 18.5) * 18.5).toFixed(2)
                : parseFloat(amount || "0").toFixed(2)}{" "}
              {currency}
            </p>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-caption text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}
          </div>
        )}

        {step === "processing" && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-rose mx-auto mb-4"></div>
            <p className="text-body text-text-primary">
              Processing withdrawal...
            </p>
            <p className="text-caption text-text-tertiary mt-2">
              {_mode === "mock" ? "(Mock mode - simulating 3s delay)" : ""}
            </p>
          </div>
        )}

        {step === "success" && (
          <div className="text-center py-8" role="status" aria-live="polite">
            <CheckCircleIcon className="h-16 w-16 mx-auto mb-4 text-status-success animate-success" />
            <p className="text-h2 text-text-primary mb-2">Success!</p>
            <p className="text-body text-text-secondary">
              Withdrawal initiated
            </p>
          </div>
        )}

        <DialogFooter>
          {step === "amount" && (
            <Button
              onClick={handleSubmit}
              disabled={!amount || parseFloat(amount) <= 0 || loading}
              className="w-full bg-brand-rose text-background-primary"
            >
              {loading ? "Processing..." : "Continue"}
            </Button>
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
