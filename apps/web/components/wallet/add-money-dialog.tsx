"use client";

import { useState } from "react";
import { useWallet } from "../../hooks/use-wallet";
import {
  createDepositSession,
  simulateMockCompletion,
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

interface AddMoneyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = "amount" | "processing" | "success";

export function AddMoneyDialog({ open, onOpenChange }: AddMoneyDialogProps) {
  const { refetch } = useWallet();
  const [step, setStep] = useState<Step>("amount");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<"ZAR" | "USD">("ZAR");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [_sessionId, setSessionId] = useState<string | null>(null);
  const [_mode, setMode] = useState<string | null>(null);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    // Convert to USDC amount
    const usdcAmount =
      currency === "ZAR" ? parseFloat(amount) / 18.5 : parseFloat(amount);

    const result = await createDepositSession({
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
        await simulateMockCompletion(result.sessionId!, usdcAmount);
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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Money</DialogTitle>
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
                onChange={(e) => setAmount(e.target.value)}
                step="any"
              />
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
                ? (parseFloat(amount || "0") / 18.5).toFixed(2)
                : parseFloat(amount || "0").toFixed(2)}{" "}
              USDC
            </p>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-caption text-red-800">{error}</p>
              </div>
            )}
          </div>
        )}

        {step === "processing" && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-rose mx-auto mb-4"></div>
            <p className="text-body text-text-primary">Processing payment...</p>
            <p className="text-caption text-text-tertiary mt-2">
              {_mode === "mock" ? "(Mock mode - simulating 3s delay)" : ""}
            </p>
          </div>
        )}

        {step === "success" && (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">✓</div>
            <p className="text-h2 text-text-primary mb-2">Success!</p>
            <p className="text-body text-text-secondary">
              Your wallet has been funded
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
