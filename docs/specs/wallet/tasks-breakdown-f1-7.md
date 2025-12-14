# Tasks Breakdown: F1.7 - P2P Receive (QR Code)

**Feature ID**: F1.7
**Sprint**: Week 2
**Estimated Effort**: 2-3 hours

---

## Frontend Tasks

### Task 1: Install QR Code Dependencies
**Estimated Time**: 5 minutes

```bash
cd apps/web
pnpm add qrcode.react html-to-image
pnpm add -D @types/qrcode.react
```

---

### Task 2: Create Receive Dialog Component
**File**: `apps/web/components/wallet/receive-dialog.tsx`
**Estimated Time**: 2-3 hours

```tsx
import QRCode from "qrcode.react";
import { toPng } from "html-to-image";
import { useState } from "react";
import { useWallet } from "../../hooks/use-wallet";

interface ReceiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReceiveDialog({ open, onOpenChange }: ReceiveDialogProps) {
  const { data: wallet } = useWallet();
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<"ZAR" | "USD" | "USDC">("ZAR");
  const [copied, setCopied] = useState(false);

  if (!wallet) return null;

  // Generate QR data
  const qrData = amount
    ? `ethereum:${wallet.address}?amount=${toUsdcUnits(parseFloat(amount), currency)}`
    : wallet.address;

  const handleCopy = () => {
    navigator.clipboard.writeText(wallet.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async () => {
    const qrElement = document.getElementById("qr-code");
    if (!qrElement) return;

    const dataUrl = await toPng(qrElement, { pixelRatio: 2 });
    const link = document.createElement("a");
    link.download = "vlossom-wallet-qr.png";
    link.href = dataUrl;
    link.click();
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: "My Vlossom Wallet",
        text: `Send USDC to: ${wallet.address}`,
      });
    } else {
      handleCopy();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Receive USDC</DialogTitle>
        </DialogHeader>

        {/* QR Code */}
        <div className="flex justify-center p-6 bg-white rounded-lg" id="qr-code">
          <QRCode value={qrData} size={300} level="H" includeMargin={true} />
        </div>

        {/* Optional Amount Input */}
        <div>
          <Label>Requested Amount (Optional)</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
            />
            <CurrencyToggle currency={currency} onChange={setCurrency} />
          </div>
        </div>

        {/* Wallet Address */}
        <div>
          <Label>Wallet Address</Label>
          <div className="flex gap-2">
            <Input value={wallet.address} readOnly />
            <Button variant="outline" onClick={handleCopy}>
              {copied ? "Copied!" : "Copy"}
            </Button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button onClick={handleDownload} variant="outline" className="flex-1">
            Download QR
          </Button>
          <Button onClick={handleShare} className="flex-1">
            Share
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

**Acceptance Criteria:**
- [ ] Dialog displays QR code with wallet address
- [ ] Optional amount input updates QR data
- [ ] Currency toggle works (ZAR/USD/USDC)
- [ ] Copy button copies address to clipboard
- [ ] Download button saves QR as PNG
- [ ] Share button triggers native share (mobile)
- [ ] QR code is 300x300px with high error correction

---

### Task 3: Add "Receive" Button to Wallet Page
**File**: `apps/web/app/wallet/page.tsx`
**Estimated Time**: 10 minutes

```tsx
const [receiveDialogOpen, setReceiveDialogOpen] = useState(false);

// Update button group
<div className="flex gap-3">
  <Button onClick={() => setSendDialogOpen(true)} className="flex-1">
    Send
  </Button>
  <Button onClick={() => setReceiveDialogOpen(true)} variant="outline" className="flex-1">
    Receive
  </Button>
</div>

<ReceiveDialog open={receiveDialogOpen} onOpenChange={setReceiveDialogOpen} />
```

---

## Testing Tasks

### Task 4: Manual Testing
**Estimated Time**: 30 minutes

**Test Cases:**
- [ ] TC1: QR code displays wallet address
- [ ] TC2: Adding amount updates QR data
- [ ] TC3: Currency toggle works
- [ ] TC4: Copy address shows "Copied!" feedback
- [ ] TC5: Download QR saves PNG file
- [ ] TC6: Share triggers native share (mobile only)
- [ ] TC7: QR code is scannable with phone camera

---

## Task Summary

| Task | Estimated Time |
|------|----------------|
| 1. Install dependencies | 5 min |
| 2. Create Receive Dialog | 2-3 hrs |
| 3. Add Receive button | 10 min |
| 4. Manual testing | 30 min |
| **Total** | **3-4 hours** |

---

**Task Breakdown Author**: Claude Sonnet 4.5
