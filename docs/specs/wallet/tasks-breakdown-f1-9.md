# Tasks Breakdown: F1.9 - MoonPay Onramp

**Feature ID**: F1.9
**Sprint**: Week 2
**Estimated Effort**: 4-6 hours

---

## Backend Tasks

### Task 1: Install MoonPay SDK
**Estimated Time:** 5 minutes
```bash
cd services/api
pnpm add @moonpay/moonpay-node
```

### Task 2: Create MoonPay Onramp Service
**File**: `services/api/src/lib/moonpay/onramp-service.ts`
**Estimated Time:** 1 hour

**Functions:**
- `generateOnrampUrl()` - Generate signed URL for widget
- `verifyWebhookSignature()` - Verify webhook authenticity

### Task 3: Create Webhook Endpoint
**File**: `services/api/src/routes/wallet.ts`
**Endpoint:** `POST /api/wallet/moonpay/webhook`
**Estimated Time:** 1 hour

**Handler Logic:**
1. Verify signature
2. Parse payload
3. If status === "completed":
   - Create transaction record (type: ONRAMP)
   - Update balance (via blockchain read, not db update)
4. Return 200 OK

### Task 4: Add Environment Variables
**File**: `services/api/.env`
**Estimated Time:** 5 minutes
```
MOONPAY_API_KEY=pk_test_...
MOONPAY_SECRET_KEY=sk_test_...
MOONPAY_WEBHOOK_SECRET=whsec_...
```

---

## Frontend Tasks

### Task 5: Install MoonPay React SDK
**Estimated Time:** 5 minutes
```bash
cd apps/web
pnpm add @moonpay/moonpay-react
```

### Task 6: Create Add Money Dialog
**File**: `apps/web/components/wallet/add-money-dialog.tsx`
**Estimated Time:** 2-3 hours

**Features:**
- Embed MoonPay widget
- Handle success/failure callbacks
- Show loading state
- Refetch balance on success

### Task 7: Add "Add Money" Button
**File**: `apps/web/app/wallet/page.tsx`
**Estimated Time:** 10 minutes

---

## Testing Tasks

### Task 8: Manual Testing with Sandbox
**Estimated Time:** 1 hour

**Test Cases:**
- [ ] Widget opens
- [ ] Test card purchase (use MoonPay test cards)
- [ ] Webhook received
- [ ] Balance updated
- [ ] Transaction recorded

---

## Task Summary
| Task | Time |
|------|------|
| 1. Install backend SDK | 5 min |
| 2. Create onramp service | 1 hr |
| 3. Create webhook endpoint | 1 hr |
| 4. Add env variables | 5 min |
| 5. Install frontend SDK | 5 min |
| 6. Create add money dialog | 2-3 hrs |
| 7. Add button | 10 min |
| 8. Testing | 1 hr |
| **Total** | **5-7 hours** |

---

**Task Breakdown Author**: Claude Sonnet 4.5
