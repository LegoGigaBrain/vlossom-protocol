# Tasks Breakdown: F1.10 - MoonPay Offramp

**Feature ID**: F1.10
**Sprint**: Week 2
**Estimated Effort**: 5-6 hours

---

## Backend Tasks

### Task 1: Create MoonPay Offramp Service
**File**: `services/api/src/lib/moonpay/offramp-service.ts`
**Estimated Time:** 1-2 hours

**Functions:**
- `initiateWithdrawal()` - Start offramp process
- `getBankAccounts()` - Fetch saved bank accounts
- `addBankAccount()` - Save new bank account
- `verifyWithdrawalWebhook()` - Handle status updates

### Task 2: Create Withdraw Endpoint
**File**: `services/api/src/routes/wallet.ts`
**Endpoint:** `POST /api/wallet/withdraw`
**Estimated Time:** 1 hour

**Handler Logic:**
1. Validate balance
2. Call MoonPay offramp API
3. Create transaction record (type: WITHDRAW)
4. Return withdrawalId + fees

### Task 3: Create Bank Account Management Endpoints
**File**: `services/api/src/routes/wallet.ts`
**Endpoints:**
- `GET /api/wallet/bank-accounts`
- `POST /api/wallet/bank-accounts`
**Estimated Time:** 1 hour

---

## Frontend Tasks

### Task 4: Create Withdraw Dialog
**File**: `apps/web/components/wallet/withdraw-dialog.tsx`
**Estimated Time:** 2-3 hours

**Features:**
- Bank account selection/add
- Amount input (USDC → fiat)
- Fee preview
- Confirmation step

### Task 5: Add "Withdraw" Button
**File**: `apps/web/app/wallet/page.tsx`
**Estimated Time:** 10 minutes

---

## Testing Tasks

### Task 6: Manual Testing with Sandbox
**Estimated Time:** 1 hour

**Test Cases:**
- [ ] Add bank account
- [ ] Initiate withdrawal (sandbox)
- [ ] Webhook received
- [ ] Transaction tracked

---

## Task Summary
| Task | Time |
|------|------|
| 1. Create offramp service | 1-2 hrs |
| 2. Create withdraw endpoint | 1 hr |
| 3. Bank account endpoints | 1 hr |
| 4. Create withdraw dialog | 2-3 hrs |
| 5. Add button | 10 min |
| 6. Testing | 1 hr |
| **Total** | **6-8 hours** |

---

**Task Breakdown Author**: Claude Sonnet 4.5
