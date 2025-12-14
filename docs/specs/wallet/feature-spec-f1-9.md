# Feature Specification: Wallet Fund (MoonPay Onramp)

**Feature ID**: F1.9
**Status**: 📝 PLANNED
**Estimated Start**: December 18, 2025 (Week 2)
**Priority**: HIGH (Critical for V1.0 milestone)

---

## 1. Summary

Enable users to add money to their wallet by converting fiat (ZAR/USD) to USDC via MoonPay's onramp service. Supports credit/debit cards, saved payment methods, and webhook integration for balance updates.

**Key Requirements:**
- MoonPay widget integration (embedded, not redirect)
- Fiat to USDC conversion (ZAR/USD → USDC)
- Saved payment methods
- Webhook for balance updates
- Sandbox mode for testnet

---

## 2. User Stories

**US1:** I want to add money to my wallet using my credit/debit card.
**US2:** I want to select amount in my local currency (ZAR).
**US3:** I want to save my payment method for future use.
**US4:** I want to see my balance update after successful purchase.
**US5:** I want clear error messages if purchase fails.

---

## 3. Scope

### In Scope:
- ✅ MoonPay SDK integration
- ✅ Embedded widget (not external redirect)
- ✅ Fiat amount selection (ZAR/USD)
- ✅ Card payment support
- ✅ Saved payment methods
- ✅ Webhook for balance update
- ✅ Sandbox mode for testnet

### Out of Scope:
- ❌ Bank transfers (ACH/wire)
- ❌ Crypto purchases (BTC/ETH)
- ❌ Apple Pay / Google Pay (future)

---

## 4. UX Overview

### Primary Flow:
1. User clicks "Add Money" button
2. MoonPay widget opens (embedded)
3. User selects amount in fiat (ZAR/USD)
4. User enters card details or selects saved method
5. User confirms purchase
6. Widget shows "Processing..."
7. Webhook updates balance
8. Success: "R1,000.00 added to your wallet"

---

## 5. Data & APIs

### MoonPay Integration

**MoonPay SDK:** `@moonpay/moonpay-react`
**API Docs:** https://docs.moonpay.com

**Widget Configuration:**
```tsx
<MoonPayWidget
  variant="embedded"
  baseCurrencyCode="usd"
  baseCurrencyAmount="100"
  defaultCurrencyCode="usdc"
  walletAddress={wallet.address}
  onSuccess={handleSuccess}
  onFailure={handleFailure}
/>
```

### Backend (To Be Implemented)

**Webhook Endpoint:** `POST /api/wallet/moonpay/webhook`

**Webhook Payload:**
```typescript
{
  type: "transaction_created" | "transaction_updated",
  data: {
    id: string;
    status: "pending" | "completed" | "failed";
    baseCurrencyAmount: number;
    quoteCurrencyAmount: number;
    walletAddress: string;
  }
}
```

**Webhook Handler:**
1. Verify signature (MOONPAY_WEBHOOK_SECRET)
2. If status === "completed":
   - Update wallet balance in database
   - Create transaction record (type: ONRAMP)
3. Return 200 OK

---

## 6. Acceptance Criteria

- [ ] "Add Money" button opens MoonPay widget
- [ ] Widget is embedded (not external redirect)
- [ ] User can select fiat amount (ZAR/USD)
- [ ] Widget accepts card payments
- [ ] Webhook updates balance after successful purchase
- [ ] Success message shows amount added
- [ ] Error handling for failed purchases
- [ ] Sandbox mode works on testnet

---

## 7. Technical Notes

### Environment Variables
```bash
MOONPAY_API_KEY=pk_test_...
MOONPAY_SECRET_KEY=sk_test_...
MOONPAY_WEBHOOK_SECRET=whsec_...
```

### Testnet Configuration
- Use MoonPay Sandbox environment
- Test cards provided by MoonPay docs
- No real money charged

---

**Spec Author**: Claude Sonnet 4.5
