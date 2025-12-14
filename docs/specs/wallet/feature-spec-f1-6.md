# Feature Specification: P2P Send (Wallet to Wallet Transfer)

**Feature ID**: F1.6
**Status**: 📝 PLANNED
**Estimated Start**: December 17, 2025 (Week 2)
**Priority**: HIGH (Critical for Week 2 milestone)

---

## 1. Summary

Enable users to send USDC to other wallet addresses with gasless AA transactions. Supports address-based transfers with fiat-first amount input (ZAR/USD/USDC toggle). Includes balance validation, transaction preview, and success confirmation with transaction hash link.

**Key Requirements:**
- Send USDC to any Ethereum address
- Fiat-first amount input (default: ZAR)
- Balance check prevents overdraft
- Gasless transactions (Paymaster sponsors)
- Transaction preview before confirmation
- Success confirmation with block explorer link

---

## 2. User Stories

### As a User (Customer or Stylist):

**Primary Flow:**
- **US1:** I want to send USDC to another wallet address so I can pay someone or transfer funds.
- **US2:** I want to enter the amount in my local currency (ZAR) so I understand how much I'm sending without mental conversion.
- **US3:** I want to preview the transaction before confirming so I can verify the recipient and amount.
- **US4:** I want to see a success confirmation with transaction hash so I know the transfer completed.

**Edge Cases:**
- **US5:** I want to be prevented from sending more than my balance so I don't encounter errors.
- **US6:** I want clear error messages if the transaction fails so I know what went wrong.
- **US7:** I want to see my updated balance immediately after sending so I know the funds left my wallet.

---

## 3. Scope

### In Scope:
- ✅ Send to any valid Ethereum address (0x...)
- ✅ Amount input with currency toggle (ZAR / USD / USDC)
- ✅ Real-time balance validation
- ✅ Transaction preview dialog (recipient, amount, fees)
- ✅ Gasless transfer via AA wallet (Paymaster sponsors)
- ✅ Success confirmation with transaction hash
- ✅ Block explorer link (Basescan for testnet)
- ✅ Loading states ("Sending..." with spinner)
- ✅ Error handling (insufficient balance, invalid address, tx failure)
- ✅ Optional memo field (max 100 characters)

### Out of Scope (Deferred to V1.5+):
- ❌ Address book / saved recipients
- ❌ Username lookup (@username)
- ❌ Phone number lookup
- ❌ Batch transfers (multiple recipients)
- ❌ Scheduled transfers
- ❌ QR code scanning for recipient address
- ❌ Contact import from phone

---

## 4. UX Overview

### Primary Flow: Send USDC
1. User clicks "Send" button on wallet page
2. Send dialog opens
3. User enters recipient address (validates on blur)
4. User enters amount (defaults to ZAR, can toggle to USD/USDC)
5. Balance validation shows available balance vs requested amount
6. User optionally adds memo
7. User clicks "Preview"
8. Preview shows: recipient (truncated), amount (all currencies), memo, fees (none/gasless)
9. User clicks "Confirm"
10. Loading state: "Sending..." with spinner
11. Success: "Sent 1,000 USDC to 0x1234...5678" + transaction hash link
12. Balance auto-refreshes to show new amount

### Alternate Flow: Insufficient Balance
1-5. Same as primary
6. Balance validation shows error: "Insufficient balance. Available: R18,500.00"
7. "Preview" button disabled
8. User must reduce amount or add funds

### Error Flow: Transaction Failure
1-9. Same as primary
10. Transaction fails (network error, contract error)
11. Error message: "Transaction failed. Please try again."
12. User can retry or cancel

---

## 5. Data & APIs

### Backend (Already Implemented)

**Endpoint:** `POST /api/wallet/transfer`
**Location:** `services/api/src/routes/wallet.ts:255`

**Request:**
```typescript
{
  toAddress: string;      // Recipient Ethereum address
  amount: string;         // Raw USDC units (e.g., "1000000000" for 1000 USDC)
  memo?: string;          // Optional memo (max 100 chars)
}
```

**Response (Success):**
```typescript
{
  success: true;
  transactionId: string;  // Database transaction ID
  userOpHash: string;     // UserOperation hash
  txHash: string;         // Blockchain transaction hash
}
```

**Response (Error):**
```typescript
{
  error: {
    code: "INSUFFICIENT_BALANCE" | "TRANSFER_FAILED" | "VALIDATION_ERROR";
    message: string;
    details?: {
      available: string;
      required: string;
    }
  }
}
```

### Frontend (To Be Implemented)

**Files to Create:**
- `apps/web/components/wallet/send-dialog.tsx` - Send flow UI
- `apps/web/lib/wallet-client.ts` - Add `sendP2P()` function

**sendP2P() Function Signature:**
```typescript
export async function sendP2P(
  toAddress: string,
  amount: string,
  memo?: string
): Promise<{
  success: boolean;
  transactionId?: string;
  userOpHash?: string;
  txHash?: string;
  error?: string;
}>
```

---

## 6. Acceptance Criteria

### Functional Requirements:
- [ ] User can click "Send" button on wallet page
- [ ] Send dialog opens with recipient address input
- [ ] Address input validates Ethereum address format (0x + 40 hex chars)
- [ ] Invalid address shows error: "Please enter a valid address"
- [ ] Amount input supports ZAR/USD/USDC toggle
- [ ] Amount input validates numeric input only
- [ ] Balance validation prevents overdraft
- [ ] "Preview" button disabled if balance insufficient
- [ ] Preview dialog shows: recipient (truncated), amount (all currencies), memo, fees (none)
- [ ] "Confirm" button triggers gasless transfer
- [ ] Loading state shows "Sending..." with spinner
- [ ] Success confirmation shows transaction hash link
- [ ] Transaction hash links to Basescan block explorer
- [ ] Balance auto-refreshes after success (via refetch())
- [ ] Error messages are user-friendly (no technical jargon)

### Non-Functional Requirements:
- [ ] Transaction completes in < 5 seconds (p95)
- [ ] Dialog is mobile-responsive
- [ ] Loading states prevent double-submission
- [ ] All error states tested (insufficient balance, invalid address, tx failure)
- [ ] No crypto jargon visible (use "Send" not "Transfer USDC")

### UX Requirements (Brand Alignment):
- [ ] Amount input defaults to ZAR (fiat-first)
- [ ] Preview dialog shows all three currency formats
- [ ] Success message is celebratory but calm ("Sent successfully!")
- [ ] Error messages are helpful ("Try reducing the amount")
- [ ] Loading states are calm (spinner only, no "Please wait...")
- [ ] Dialog can be cancelled at any time (ESC key or X button)

---

## 7. Technical Notes

### Gasless Transactions
- Backend uses `sendP2P()` from `services/api/src/lib/wallet/index.ts:88`
- Relayer signs UserOperation on behalf of user
- Paymaster sponsors gas fees
- User never sees gas fees or approvals

### Address Validation
```typescript
const isValidAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};
```

### Amount Conversion
```typescript
// Convert fiat to USDC units (6 decimals)
function toUsdcUnits(amount: number, currency: "ZAR" | "USD" | "USDC"): bigint {
  let usdAmount = amount;
  if (currency === "ZAR") usdAmount = amount / 18.5;
  if (currency === "USDC") usdAmount = amount;
  return parseUnits(usdAmount.toString(), 6);
}
```

### Transaction State Management
- Use React Query mutation for send operation
- On success: invalidate "wallet" query to trigger balance refetch
- On error: show error message, allow retry

---

## 8. Dependencies

### Backend:
- ✅ `POST /api/wallet/transfer` (already implemented)
- ✅ `sendP2P()` function in wallet service
- ✅ Paymaster contract deployed

### Frontend:
- ✅ useWallet hook (F1.4) for balance
- ✅ useAuth hook (F1.2) for authentication
- ⏳ Send dialog component (to be created)
- ⏳ sendP2P() API client function (to be created)

---

## 9. Related Features

- **F1.4 (Balance Display):** Balance updates after send
- **F1.7 (P2P Receive):** Recipient can receive via QR code
- **F1.8 (Transaction History):** Send appears in transaction list
- **F2.7 (Escrow Payment):** Uses similar transfer flow for bookings

---

## 10. Open Questions

1. **Address Book:** Should we add "Recent Recipients" dropdown? → **Decision: Defer to V1.5+**
2. **Username Lookup:** Should we support @username instead of 0x addresses? → **Decision: Defer to V1.5+**
3. **Confirmation Dialog:** Should we require explicit "I confirm" checkbox? → **Decision: No, preview is sufficient**
4. **Transaction Speed:** What if tx takes > 5 seconds? → **Decision: Show "Still sending..." after 5s**

---

**Spec Author**: Claude Sonnet 4.5
**Review Status**: Pending user review
**Next Steps**: Create tasks-breakdown.md and verification-checklist.md
