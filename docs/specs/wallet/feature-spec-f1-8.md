# Feature Specification: Wallet Transaction History

**Feature ID**: F1.8
**Status**: 📝 PLANNED
**Estimated Start**: December 18, 2025 (Week 2)
**Priority**: MEDIUM (Enhances Week 2 milestone)

---

## 1. Summary

Display paginated list of all wallet transactions with type filters. Shows transaction details (amount, date, status, counterparty) with drill-down modal for full transaction info including blockchain transaction hash links.

**Key Requirements:**
- Paginated transaction list (20 per page)
- Filter by type (All, Sent, Received, Faucet, Bookings)
- Transaction detail modal with txHash link
- Real-time status updates (pending → confirmed)
- Empty state for new wallets

---

## 2. User Stories

**US1:** I want to see all my transactions in reverse chronological order.
**US2:** I want to filter by transaction type (sent, received, faucet, bookings).
**US3:** I want to click a transaction to see full details.
**US4:** I want to see transaction status (pending, confirmed, failed).
**US5:** I want to see block explorer link for confirmed transactions.

---

## 3. Scope

### In Scope:
- ✅ Transaction list with pagination (20 per page)
- ✅ Type filter buttons (All, Sent, Received, Faucet, Bookings)
- ✅ Transaction detail modal
- ✅ Block explorer links (Basescan)
- ✅ Empty state for new wallets
- ✅ Loading states
- ✅ Fiat-first amount display (ZAR/USD/USDC)

### Out of Scope:
- ❌ Export to CSV
- ❌ Search by amount/date range
- ❌ Transaction notes/tags
- ❌ Real-time updates via WebSocket

---

## 4. UX Overview

### Primary Flow:
1. User scrolls down on wallet page
2. Transaction list appears below balance card
3. User sees latest 20 transactions
4. User clicks filter button (e.g., "Sent")
5. List updates to show only sent transactions
6. User clicks transaction → detail modal opens
7. Modal shows: type, amount, date, status, counterparty, txHash link

---

## 5. Data & APIs

### Backend (Already Implemented)
**Endpoint:** `GET /api/wallet/transactions?page=1&limit=20`
**Location:** `services/api/src/routes/wallet.ts:191`

**Response:**
```typescript
{
  transactions: [
    {
      id: string;
      type: "SEND" | "RECEIVE" | "FAUCET_CLAIM" | "BOOKING_PAYMENT" | "BOOKING_REFUND" | "BOOKING_PAYOUT";
      amount: string;
      amountFormatted: string;
      counterparty: string | null;
      txHash: string | null;
      status: "PENDING" | "CONFIRMED" | "FAILED";
      memo: string | null;
      createdAt: string;
      confirmedAt: string | null;
    }
  ],
  pagination: {
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  }
}
```

### Frontend (To Be Implemented)
**Files to Create:**
- `apps/web/components/wallet/transaction-list.tsx`
- `apps/web/components/wallet/transaction-item.tsx`
- `apps/web/components/wallet/transaction-detail-modal.tsx`
- `apps/web/hooks/use-transactions.ts`

---

## 6. Acceptance Criteria

- [ ] Transactions display in reverse chronological order
- [ ] Each shows: type icon, amount (+/-), date, status badge
- [ ] Pagination with "Load More" button
- [ ] Filter buttons: All, Sent, Received, Faucet, Bookings
- [ ] Click transaction opens detail modal with txHash link
- [ ] Empty state: "No transactions yet. Get started by claiming test USDC!"
- [ ] Fiat-first amount display (ZAR default)

---

**Spec Author**: Claude Sonnet 4.5
