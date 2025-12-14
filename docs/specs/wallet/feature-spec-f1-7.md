# Feature Specification: P2P Receive (QR Code Generation)

**Feature ID**: F1.7
**Status**: 📝 PLANNED
**Estimated Start**: December 17, 2025 (Week 2)
**Priority**: HIGH (Critical for Week 2 milestone)

---

## 1. Summary

Enable users to receive USDC payments by generating QR codes containing their wallet address. Supports optional requested amount, share/download functionality, and copy-to-clipboard for addresses. No backend changes required (frontend only).

**Key Requirements:**
- Generate QR code with wallet address
- Optional: Include requested amount in QR data
- Share QR code (download PNG, native share)
- Copy wallet address to clipboard
- Works offline (no API calls needed)

---

## 2. User Stories

### As a User (Customer or Stylist):

**Primary Flow:**
- **US1:** I want to generate a QR code for my wallet address so others can send me USDC easily.
- **US2:** I want to optionally specify an amount so the sender knows how much to send.
- **US3:** I want to download the QR code as PNG so I can share it via messaging apps.
- **US4:** I want to copy my wallet address so I can paste it in messages.

**Alternate Flows:**
- **US5:** I want to share the QR code via native share (mobile) so I can send it quickly.

---

## 3. Scope

### In Scope:
- ✅ Generate QR code with wallet address
- ✅ Optional amount input (adds to QR data)
- ✅ Download QR as PNG
- ✅ Native share API (mobile browsers)
- ✅ Copy address to clipboard button
- ✅ Fiat-first amount input (ZAR/USD/USDC toggle)
- ✅ QR code preview (large, centered)

### Out of Scope (Deferred to V1.5+):
- ❌ Payment requests with expiry (use backend payment request endpoint instead)
- ❌ NFC payments (tap-to-pay)
- ❌ Dynamic QR codes (regenerate on scan)
- ❌ QR code analytics (track scans)

---

## 4. UX Overview

### Primary Flow: Receive via QR Code
1. User clicks "Receive" button on wallet page
2. Receive dialog opens showing QR code with wallet address
3. User optionally enters amount (defaults to ZAR)
4. QR code updates to include amount
5. User can:
   - Download QR as PNG
   - Share via native share (mobile)
   - Copy address to clipboard

### QR Data Format
**Without Amount:**
```
0x3f1b4c6c07E9CcBe84cdd81E576A341A2af77Cf8
```

**With Amount:**
```
ethereum:0x3f1b4c6c07E9CcBe84cdd81E576A341A2af77Cf8?amount=1000
```

---

## 5. Data & APIs

### Backend
- **No backend changes required**
- Uses existing wallet address from `useWallet()` hook

### Frontend (To Be Implemented)

**Files to Create:**
- `apps/web/components/wallet/receive-dialog.tsx` - QR generation and share UI

**Dependencies:**
- `qrcode.react` - QR code generation library
- `html-to-image` - Download QR as PNG

**Installation:**
```bash
pnpm add qrcode.react html-to-image
```

---

## 6. Acceptance Criteria

### Functional Requirements:
- [ ] User can click "Receive" button on wallet page
- [ ] Receive dialog opens with QR code
- [ ] QR code displays wallet address by default
- [ ] Optional amount input adds amount to QR data
- [ ] Amount input supports ZAR/USD/USDC toggle
- [ ] "Download QR" button saves PNG to device
- [ ] "Share" button triggers native share (mobile)
- [ ] "Copy Address" button copies address to clipboard
- [ ] Copy shows success feedback ("Copied!")
- [ ] QR code is large enough to scan easily (300x300px min)

### UX Requirements:
- [ ] Fiat-first amount input (ZAR default)
- [ ] Dialog is mobile-responsive
- [ ] QR code has padding/margin for scanning
- [ ] Address displayed below QR (truncated on mobile)
- [ ] Success feedback for copy action (green checkmark or "Copied!")

---

## 7. Technical Notes

### QR Code Generation
```tsx
import QRCode from "qrcode.react";

<QRCode
  value={qrData}
  size={300}
  level="H"  // High error correction
  includeMargin={true}
/>
```

### Download QR as PNG
```tsx
import { toPng } from "html-to-image";

const handleDownload = async () => {
  const qrElement = document.getElementById("qr-code");
  if (!qrElement) return;

  const dataUrl = await toPng(qrElement);
  const link = document.createElement("a");
  link.download = "vlossom-wallet-qr.png";
  link.href = dataUrl;
  link.click();
};
```

### Native Share API
```tsx
const handleShare = async () => {
  if (navigator.share) {
    await navigator.share({
      title: "My Vlossom Wallet",
      text: `Send USDC to: ${wallet.address}`,
      url: `ethereum:${wallet.address}`,
    });
  } else {
    // Fallback: copy to clipboard
    navigator.clipboard.writeText(wallet.address);
  }
};
```

---

## 8. Dependencies

### Frontend:
- ✅ useWallet hook (F1.4) for wallet address
- ⏳ Receive dialog component (to be created)
- ⏳ QR code library (to be installed)

---

## 9. Related Features

- **F1.6 (P2P Send):** Sender scans QR to get recipient address
- **F1.4 (Balance Display):** Receive updates balance

---

**Spec Author**: Claude Sonnet 4.5
**Review Status**: Pending user review
