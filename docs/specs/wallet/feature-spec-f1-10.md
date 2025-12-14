# Feature Specification: Wallet Withdraw (MoonPay Offramp)

**Feature ID**: F1.10
**Status**: 📝 PLANNED
**Estimated Start**: December 19, 2025 (Week 2)
**Priority**: HIGH (Critical for V1.0 milestone)

---

## 1. Summary

Enable users to withdraw USDC to their bank account by converting to fiat (ZAR/USD) via MoonPay's offramp service. Supports saved bank accounts, fee preview, and withdrawal tracking.

**Key Requirements:**
- USDC to fiat conversion (USDC → ZAR/USD)
- Bank account management (add/save)
- Withdrawal fee preview
- Transaction tracking
- Estimated arrival time (2-5 business days)

---

## 2. User Stories

**US1:** I want to withdraw USDC to my bank account.
**US2:** I want to see fees before confirming withdrawal.
**US3:** I want to save my bank account for future use.
**US4:** I want to see estimated arrival time.
**US5:** I want to track withdrawal status (pending, completed).

---

## 3. Scope

### In Scope:
- ✅ MoonPay offramp integration
- ✅ Bank account management
- ✅ USDC → fiat conversion (USDC → ZAR/USD)
- ✅ Fee preview
- ✅ Withdrawal tracking
- ✅ Email notification on completion

### Out of Scope:
- ❌ Instant withdrawals (future)
- ❌ Crypto withdrawals (send to external wallet - use F1.6)

---

## 4. UX Overview

### Primary Flow:
1. User clicks "Withdraw" button
2. Offramp dialog opens
3. User selects/adds bank account
4. User enters withdrawal amount (USDC → fiat)
5. Fee preview shows: amount, fees, estimated arrival
6. User confirms
7. Withdrawal initiated
8. Status tracked in transaction history

---

## 5. Data & APIs

### MoonPay Offramp

**API Endpoint:** `POST /api/wallet/withdraw`

**Request:**
```typescript
{
  amount: string;         // USDC amount
  currency: "ZAR" | "USD";
  bankAccountId: string;  // Saved bank account ID
}
```

**Response:**
```typescript
{
  success: boolean;
  withdrawalId: string;
  transactionId: string;
  estimatedArrival: string; // "2-5 business days"
  fees: {
    moonpayFee: string;
    networkFee: string;
    total: string;
  }
}
```

---

## 6. Acceptance Criteria

- [ ] "Withdraw" button opens offramp dialog
- [ ] User can add/select bank account
- [ ] Amount input converts USDC → fiat
- [ ] Fee preview shows all fees
- [ ] Estimated arrival time shown (2-5 business days)
- [ ] Withdrawal tracked in transaction history
- [ ] Email notification on completion

---

**Spec Author**: Claude Sonnet 4.5
