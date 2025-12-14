# Tasks Breakdown: F1.8 - Transaction History

**Feature ID**: F1.8
**Sprint**: Week 2
**Estimated Effort**: 3-4 hours

---

## Backend Tasks
- ✅ **Task 1:** GET /api/wallet/transactions endpoint (already implemented)

---

## Frontend Tasks

### Task 2: Create useTransactions Hook
**File**: `apps/web/hooks/use-transactions.ts`
**Estimated Time**: 30 minutes

```tsx
export function useTransactions(page: number = 1, type?: TransactionType) {
  return useQuery({
    queryKey: ["transactions", page, type],
    queryFn: () => getTransactions(page, 20, type),
  });
}
```

### Task 3: Create Transaction List Component
**File**: `apps/web/components/wallet/transaction-list.tsx`
**Estimated Time**: 2 hours

**Features:**
- Display 20 transactions per page
- Filter buttons (All, Sent, Received, Faucet, Bookings)
- "Load More" pagination
- Empty state
- Loading state

### Task 4: Create Transaction Item Component
**File**: `apps/web/components/wallet/transaction-item.tsx`
**Estimated Time**: 1 hour

**Display:**
- Type icon (arrow up/down, faucet icon, etc.)
- Amount (+/- with color coding)
- Date (formatted: "Dec 14, 2:30 PM")
- Status badge (pending/confirmed/failed)

### Task 5: Create Transaction Detail Modal
**File**: `apps/web/components/wallet/transaction-detail-modal.tsx`
**Estimated Time**: 1 hour

**Shows:**
- Full transaction details
- Block explorer link (if confirmed)
- Copy txHash button

### Task 6: Add to Wallet Page
**File**: `apps/web/app/wallet/page.tsx`
**Estimated Time**: 15 minutes

---

## Task Summary
| Task | Time |
|------|------|
| 2. useTransactions hook | 30 min |
| 3. Transaction list | 2 hrs |
| 4. Transaction item | 1 hr |
| 5. Detail modal | 1 hr |
| 6. Add to wallet page | 15 min |
| **Total** | **4-5 hours** |
