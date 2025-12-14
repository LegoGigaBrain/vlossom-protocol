# Verification Checklist: F1.7 - P2P Receive (QR Code)

**Feature ID**: F1.7
**Sprint**: Week 2

---

## 1. Spec Alignment
- [ ] All user stories implemented
- [ ] QR code displays wallet address
- [ ] Optional amount input works
- [ ] Download QR as PNG works
- [ ] Copy address to clipboard works
- [ ] Native share works (mobile)

## 2. UX Verification
- [ ] Fiat-first amount input (ZAR default)
- [ ] No crypto jargon ("Receive" not "Get Address")
- [ ] QR code is large enough to scan (300x300px)
- [ ] Copy shows success feedback ("Copied!")
- [ ] Dialog is mobile-responsive

## 3. Technical Verification
- [ ] QR code library installed (qrcode.react)
- [ ] Download library installed (html-to-image)
- [ ] QR code has high error correction (level H)
- [ ] QR data format correct (ethereum:address?amount=X)
- [ ] No console errors

## 4. Testing Coverage
- [ ] QR displays address correctly
- [ ] Adding amount updates QR data
- [ ] Currency toggle works
- [ ] Copy address shows feedback
- [ ] Download saves PNG file
- [ ] Share triggers native share (mobile)
- [ ] QR code is scannable with phone camera

## 5. Known Limitations
- Native share API not available on all browsers (fallback to copy)
- Exchange rate hardcoded (ZAR = 18.5 per USD)

---

**Checklist Author**: Claude Sonnet 4.5
