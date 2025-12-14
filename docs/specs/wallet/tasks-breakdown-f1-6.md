# Tasks Breakdown: F1.6 - P2P Send

**Feature ID**: F1.6
**Sprint**: Week 2
**Estimated Effort**: 4-6 hours

---

## Backend Tasks

### ✅ Task 1: Verify POST /api/wallet/transfer Endpoint
**Status**: Already implemented
**Location**: `services/api/src/routes/wallet.ts:255-325`
**Validation**:
- Endpoint exists and handles transfers
- Validates sufficient balance
- Calls `sendP2P()` service function
- Returns transactionId, userOpHash, txHash on success

**No backend work required** - endpoint fully implemented in previous sprint.

---

## Frontend Tasks

### Task 2: Create sendP2P() API Client Function
**File**: `apps/web/lib/wallet-client.ts`
**Estimated Time**: 30 minutes

**Implementation:**
```typescript
/**
 * Send USDC to another wallet address (P2P transfer)
 */
export async function sendP2P(
  toAddress: string,
  amount: string,  // Raw USDC units (6 decimals)
  memo?: string
): Promise<{
  success: boolean;
  transactionId?: string;
  userOpHash?: string;
  txHash?: string;
  error?: string;
}> {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Not authenticated");
  }

  const response = await fetch(`${API_URL}/api/wallet/transfer`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ toAddress, amount, memo }),
  });

  const data = await response.json();

  if (!response.ok) {
    return {
      success: false,
      error: data.error?.message || "Failed to send transfer",
    };
  }

  return {
    success: true,
    transactionId: data.transactionId,
    userOpHash: data.userOpHash,
    txHash: data.txHash,
  };
}
```

**Acceptance Criteria:**
- [ ] Function added to wallet-client.ts
- [ ] Handles authentication
- [ ] Returns success/error response
- [ ] Includes error messages from API

---

### Task 3: Create Send Dialog Component
**File**: `apps/web/components/wallet/send-dialog.tsx`
**Estimated Time**: 3-4 hours

**Component Structure:**
```tsx
interface SendDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SendDialog({ open, onOpenChange }: SendDialogProps) {
  const [step, setStep] = useState<"input" | "preview">("input");
  const [toAddress, setToAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<"ZAR" | "USD" | "USDC">("ZAR");
  const [memo, setMemo] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{
    txHash: string;
    amount: string;
  } | null>(null);

  const { data: wallet, refetch } = useWallet();

  const handleSend = async () => {
    setSending(true);
    setError(null);

    // Convert amount to USDC units
    const usdcAmount = toUsdcUnits(parseFloat(amount), currency);

    const result = await sendP2P(toAddress, usdcAmount.toString(), memo);

    if (result.success) {
      setSuccess({ txHash: result.txHash!, amount });
      await refetch(); // Refresh balance
    } else {
      setError(result.error || "Transfer failed");
    }

    setSending(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Input Step */}
      {step === "input" && <InputStep />}

      {/* Preview Step */}
      {step === "preview" && <PreviewStep />}

      {/* Success Step */}
      {success && <SuccessStep />}
    </Dialog>
  );
}
```

**Substeps:**

**3.1: Input Step UI**
- Recipient address input (validates Ethereum address)
- Amount input with currency toggle (ZAR / USD / USDC)
- Balance display with validation
- Optional memo input (max 100 chars)
- "Preview" button (disabled if invalid)

**3.2: Preview Step UI**
- Recipient address (truncated: 0x1234...5678)
- Amount display (all three currencies)
- Memo display (if provided)
- Fee display: "Free (gasless)" in green
- "Confirm" and "Back" buttons

**3.3: Success Step UI**
- Success icon (checkmark)
- Message: "Sent [amount] to [address]"
- Transaction hash link to block explorer
- "Done" button (closes dialog)

**3.4: Error Handling**
- Insufficient balance error
- Invalid address error
- Transaction failure error
- Network error

**Acceptance Criteria:**
- [ ] Dialog opens on "Send" button click
- [ ] Address validation prevents invalid addresses
- [ ] Amount input supports ZAR/USD/USDC toggle
- [ ] Balance validation prevents overdraft
- [ ] Preview shows all transaction details
- [ ] Success shows transaction hash link
- [ ] Error messages are user-friendly
- [ ] Loading states prevent double-submission

---

### Task 4: Add "Send" Button to Wallet Page
**File**: `apps/web/app/wallet/page.tsx`
**Estimated Time**: 30 minutes

**Implementation:**
```tsx
const [sendDialogOpen, setSendDialogOpen] = useState(false);

// Add button after Balance Card
<div className="flex gap-3">
  <Button
    onClick={() => setSendDialogOpen(true)}
    className="flex-1 bg-brand-rose text-background-primary"
  >
    Send
  </Button>
  <Button variant="outline" className="flex-1">
    Receive
  </Button>
</div>

<SendDialog
  open={sendDialogOpen}
  onOpenChange={setSendDialogOpen}
/>
```

**Acceptance Criteria:**
- [ ] "Send" button visible on wallet page
- [ ] Button opens send dialog
- [ ] Button styled with brand colors

---

### Task 5: Add Helper Functions for Amount Conversion
**File**: `apps/web/lib/wallet-client.ts`
**Estimated Time**: 30 minutes

**Implementation:**
```typescript
/**
 * Convert fiat/USDC amount to raw USDC units (6 decimals)
 */
export function toUsdcUnits(
  amount: number,
  currency: "ZAR" | "USD" | "USDC"
): bigint {
  let usdAmount = amount;

  if (currency === "ZAR") {
    usdAmount = amount / 18.5; // 1 USD = 18.5 ZAR
  }
  // USD and USDC are 1:1

  return parseUnits(usdAmount.toString(), 6);
}

/**
 * Convert raw USDC units to human-readable amount
 */
export function fromUsdcUnits(units: bigint): number {
  return parseFloat(formatUnits(units, 6));
}

/**
 * Validate Ethereum address
 */
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Truncate address for display (0x1234...5678)
 */
export function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
```

**Acceptance Criteria:**
- [ ] toUsdcUnits() converts all three currencies correctly
- [ ] fromUsdcUnits() converts back to decimal
- [ ] isValidAddress() validates Ethereum addresses
- [ ] truncateAddress() displays addresses nicely

---

## Testing Tasks

### Task 6: Manual Testing
**Estimated Time**: 1 hour

**Test Cases:**

**TC1: Successful Send**
1. Open wallet page
2. Click "Send" button
3. Enter valid address
4. Enter amount (e.g., 100 ZAR)
5. Click "Preview"
6. Verify preview shows correct amounts
7. Click "Confirm"
8. Verify success message + txHash link
9. Verify balance updated

**TC2: Insufficient Balance**
1. Enter amount > balance
2. Verify error: "Insufficient balance"
3. Verify "Preview" button disabled

**TC3: Invalid Address**
1. Enter invalid address (e.g., "0x123")
2. Verify error: "Please enter a valid address"
3. Verify "Preview" button disabled

**TC4: Transaction Failure**
1. (Simulate network failure)
2. Verify error message shown
3. Verify user can retry

**TC5: Currency Toggle**
1. Enter 100 ZAR
2. Toggle to USD
3. Verify amount converts correctly (~5.41 USD)
4. Toggle to USDC
5. Verify amount converts correctly (~5.41 USDC)

**Acceptance Criteria:**
- [ ] All test cases pass
- [ ] No console errors
- [ ] Loading states work correctly
- [ ] Error messages are clear

---

## Dependencies

### Required Before Starting:
- ✅ F1.4 (Wallet Balance Display) - useWallet hook
- ✅ F1.2 (Authentication) - useAuth hook
- ✅ Backend transfer endpoint implemented

### UI Components Needed:
- ✅ Dialog component (from shadcn/ui or custom)
- ✅ Button component (F1.2)
- ✅ Input component (F1.2)
- ⏳ Textarea component (for memo, use Input for now)

---

## Task Summary

| Task | Estimated Time | Priority |
|------|----------------|----------|
| 1. Verify backend endpoint | 15 min | ✅ Complete |
| 2. Create sendP2P() client | 30 min | HIGH |
| 3. Create Send Dialog | 3-4 hrs | HIGH |
| 4. Add Send button | 30 min | HIGH |
| 5. Add helper functions | 30 min | MEDIUM |
| 6. Manual testing | 1 hr | HIGH |
| **Total** | **5-7 hours** | |

---

**Task Breakdown Author**: Claude Sonnet 4.5
**Review Status**: Pending user review
**Next Steps**: Create verification-checklist.md
