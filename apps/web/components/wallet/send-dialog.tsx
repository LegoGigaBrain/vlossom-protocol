"use client";

import { useState } from "react";
import { useWallet } from "../../hooks/use-wallet";
import {
  sendP2P,
  toUsdcUnits,
  isValidAddress,
  truncateAddress,
  formatCurrency,
  fromUsdcUnits,
} from "../../lib/wallet-client";
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

interface SendDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = "input" | "preview" | "success";

export function SendDialog({ open, onOpenChange }: SendDialogProps) {
  const { data: wallet, refetch } = useWallet();
  const [step, setStep] = useState<Step>("input");
  const [toAddress, setToAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<"ZAR" | "USD" | "USDC">("ZAR");
  const [memo, setMemo] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const handleReset = () => {
    setStep("input");
    setToAddress("");
    setAmount("");
    setMemo("");
    setError(null);
    setTxHash(null);
    setCurrency("ZAR");
  };

  const handleClose = () => {
    handleReset();
    onOpenChange(false);
  };

  const validateInputs = (): string | null => {
    if (!toAddress) return "Please enter a recipient address";
    if (!isValidAddress(toAddress)) return "Please enter a valid Ethereum address";
    if (!amount || parseFloat(amount) <= 0) return "Please enter a valid amount";

    const usdcAmount = toUsdcUnits(parseFloat(amount), currency);
    const balanceUsdc = BigInt(wallet?.balance.usdc || "0");

    if (usdcAmount > balanceUsdc) {
      const availableFormatted = formatCurrency(fromUsdcUnits(balanceUsdc), currency);
      return `Insufficient balance. Available: ${availableFormatted}`;
    }

    return null;
  };

  const handlePreview = () => {
    const validationError = validateInputs();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setStep("preview");
  };

  const handleSend = async () => {
    setSending(true);
    setError(null);

    try {
      const usdcAmount = toUsdcUnits(parseFloat(amount), currency);
      const result = await sendP2P(toAddress, usdcAmount.toString(), memo || undefined);

      if (result.success) {
        setTxHash(result.txHash || null);
        setStep("success");
        await refetch(); // Refresh balance
      } else {
        setError(result.error || "Transfer failed");
        setStep("input");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Transfer failed");
      setStep("input");
    } finally {
      setSending(false);
    }
  };

  if (!wallet) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        {/* Input Step */}
        {step === "input" && (
          <>
            <DialogHeader>
              <DialogTitle>Send USDC</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* Recipient Address */}
              <div>
                <Label htmlFor="recipient">Recipient Address</Label>
                <Input
                  id="recipient"
                  type="text"
                  placeholder="0x..."
                  value={toAddress}
                  onChange={(e) => setToAddress(e.target.value)}
                  className={error && !isValidAddress(toAddress) && toAddress ? "border-red-500" : ""}
                />
              </div>

              {/* Amount Input */}
              <div>
                <Label htmlFor="amount">Amount</Label>
                <div className="flex gap-2">
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    step="any"
                  />
                  <div className="flex gap-1">
                    {(["ZAR", "USD", "USDC"] as const).map((curr) => (
                      <Button
                        key={curr}
                        type="button"
                        variant={currency === curr ? "primary" : "outline"}
                        size="sm"
                        onClick={() => setCurrency(curr)}
                        className={currency === curr ? "bg-primary text-text-inverse" : ""}
                      >
                        {curr}
                      </Button>
                    ))}
                  </div>
                </div>
                <p className="text-caption text-text-tertiary mt-1">
                  Available: {formatCurrency(wallet.balance.usdcFormatted, currency)}
                </p>
              </div>

              {/* Memo (Optional) */}
              <div>
                <Label htmlFor="memo">Memo (Optional)</Label>
                <Input
                  id="memo"
                  type="text"
                  placeholder="Add a note..."
                  value={memo}
                  onChange={(e) => setMemo(e.target.value.slice(0, 100))}
                  maxLength={100}
                />
                <p className="text-caption text-text-tertiary mt-1">{memo.length}/100</p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-caption text-red-800">{error}</p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handlePreview} className="flex-1 bg-brand-rose text-background-primary">
                Preview
              </Button>
            </DialogFooter>
          </>
        )}

        {/* Preview Step */}
        {step === "preview" && (
          <>
            <DialogHeader>
              <DialogTitle>Confirm Transfer</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="bg-background-secondary rounded-lg p-4 space-y-3">
                <div>
                  <p className="text-caption text-text-secondary">To</p>
                  <p className="text-body text-text-primary font-mono">{truncateAddress(toAddress)}</p>
                </div>

                <div>
                  <p className="text-caption text-text-secondary">Amount</p>
                  <div className="space-y-1">
                    <p className="text-h3 text-text-primary">{formatCurrency(parseFloat(amount), currency)}</p>
                    <p className="text-caption text-text-tertiary">
                      ≈ {formatCurrency(parseFloat(amount), "USD")} = {formatCurrency(parseFloat(amount), "USDC")}
                    </p>
                  </div>
                </div>

                {memo && (
                  <div>
                    <p className="text-caption text-text-secondary">Memo</p>
                    <p className="text-body text-text-primary">{memo}</p>
                  </div>
                )}

                <div>
                  <p className="text-caption text-text-secondary">Fee</p>
                  <p className="text-body text-green-600">Free (gasless)</p>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setStep("input")} disabled={sending} className="flex-1">
                Back
              </Button>
              <Button
                onClick={handleSend}
                disabled={sending}
                className="flex-1 bg-brand-rose text-background-primary"
              >
                {sending ? "Sending..." : "Confirm"}
              </Button>
            </DialogFooter>
          </>
        )}

        {/* Success Step */}
        {step === "success" && (
          <>
            <DialogHeader>
              <DialogTitle>Transfer Successful!</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="text-center py-6">
                <div className="text-6xl mb-4">✓</div>
                <p className="text-body text-text-primary mb-2">
                  Sent {formatCurrency(parseFloat(amount), currency)}
                </p>
                <p className="text-caption text-text-secondary">to {truncateAddress(toAddress)}</p>
              </div>

              {txHash && (
                <div className="bg-background-secondary rounded-lg p-3">
                  <p className="text-caption text-text-secondary mb-1">Transaction Hash</p>
                  <a
                    href={`https://sepolia.basescan.org/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-caption text-brand-rose hover:underline break-all"
                  >
                    {txHash}
                  </a>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button onClick={handleClose} className="w-full bg-brand-rose text-background-primary">
                Done
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
