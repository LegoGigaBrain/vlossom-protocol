# Verification Checklist: F1.9 - MoonPay Onramp

**Feature ID**: F1.9
**Sprint**: Week 2

---

## 1. Spec Alignment
- [ ] MoonPay widget opens on "Add Money" click
- [ ] Widget is embedded (not external redirect)
- [ ] Fiat amount selection works (ZAR/USD)
- [ ] Card payment works in sandbox mode
- [ ] Webhook updates balance
- [ ] Success message shown
- [ ] Error handling for failed purchases

## 2. UX Verification
- [ ] Fiat-first design (ZAR default)
- [ ] Widget feels integrated (not third-party)
- [ ] Loading states during purchase
- [ ] Success feedback clear
- [ ] No crypto jargon

## 3. Technical Verification
- [ ] MoonPay SDKs installed (backend + frontend)
- [ ] Webhook signature verified
- [ ] Environment variables set (.env.example updated)
- [ ] Sandbox mode works

## 4. Security
- [ ] Webhook signature verification prevents spoofing
- [ ] API keys stored in environment variables
- [ ] No API keys in client-side code

## 5. Testing Coverage
- [ ] Test card purchase (sandbox)
- [ ] Webhook received
- [ ] Balance updated
- [ ] Transaction recorded
- [ ] Failed purchase handling

---

**Checklist Author**: Claude Sonnet 4.5
