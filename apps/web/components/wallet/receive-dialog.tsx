"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
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

interface ReceiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  walletAddress: string;
}

export function ReceiveDialog({ open, onOpenChange, walletAddress }: ReceiveDialogProps) {
  const [amount, setAmount] = useState("");
  const [copied, setCopied] = useState(false);

  // Generate payment request data for QR code
  const qrData = amount
    ? JSON.stringify({
        type: "vlossom_payment",
        version: 1,
        address: walletAddress,
        amount: amount,
        timestamp: Date.now(),
      })
    : walletAddress;

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy address:", error);
    }
  };

  const handleDownloadQR = () => {
    const svg = document.getElementById("qr-code-svg");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");

      const downloadLink = document.createElement("a");
      downloadLink.download = "vlossom-wallet-qr.png";
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Vlossom Wallet",
          text: `Send USDC to my Vlossom wallet: ${walletAddress}`,
        });
      } catch (error) {
        // User cancelled share or share failed
        console.log("Share cancelled or failed:", error);
      }
    } else {
      // Fallback to copy
      handleCopyAddress();
    }
  };

  const handleClose = () => {
    setAmount("");
    setCopied(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Receive USDC</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* QR Code */}
          <div className="flex justify-center py-6">
            <div className="bg-white p-4 rounded-lg">
              <QRCodeSVG
                id="qr-code-svg"
                value={qrData}
                size={200}
                level="M"
                includeMargin={true}
              />
            </div>
          </div>

          {/* Optional Amount */}
          <div>
            <Label htmlFor="receive-amount">Request Amount (Optional)</Label>
            <Input
              id="receive-amount"
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              step="any"
            />
            <p className="text-caption text-text-tertiary mt-1">
              {amount
                ? "QR code includes requested amount"
                : "QR code shows wallet address only"}
            </p>
          </div>

          {/* Wallet Address */}
          <div>
            <Label>Wallet Address</Label>
            <div className="flex gap-2 mt-1">
              <Input
                value={walletAddress}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleCopyAddress}
                className="shrink-0"
              >
                {copied ? "Copied!" : "Copy"}
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleDownloadQR} className="flex-1">
            Download QR
          </Button>
          <Button
            onClick={handleShare}
            className="flex-1 bg-brand-rose text-background-primary"
          >
            Share
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
