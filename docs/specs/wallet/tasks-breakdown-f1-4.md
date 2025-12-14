# Tasks Breakdown – F1.4: Wallet Balance Display

## 1. Backend

### API Endpoints
- [ ] Implement `GET /v1/wallet/balance` endpoint
  - Query MockUSDC contract for user's balance
  - Fetch exchange rates from CoinGecko API
  - Convert USDC to ZAR and USD
  - Return balance object with all currencies + rates
  - Cache exchange rates for 5 minutes to reduce API calls

- [ ] Implement `GET /v1/wallet/transactions` endpoint
  - Query WalletTransaction table (or index blockchain events)
  - Filter by user's walletAddress
  - Support pagination (page, limit)
  - Support filtering by type (sent, received, bookings)
  - Return transaction list with pagination metadata

### Database Schema (if using indexed transactions)
- [ ] Create `WalletTransaction` model in Prisma schema
  ```prisma
  model WalletTransaction {
    id            String   @id @default(cuid())
    walletAddress String   // Owner's wallet
    type          TxType   // SENT, RECEIVED, BOOKING_PAYMENT, ESCROW_SETTLEMENT
    counterparty  String?  // Other wallet address
    amount        Decimal  // USDC amount
    status        TxStatus // PENDING, COMPLETED, FAILED
    txHash        String   @unique
    blockNumber   Int
    timestamp     DateTime
    createdAt     DateTime @default(now())

    @@index([walletAddress, timestamp])
    @@index([txHash])
  }

  enum TxType {
    SENT
    RECEIVED
    BOOKING_PAYMENT
    ESCROW_SETTLEMENT
  }

  enum TxStatus {
    PENDING
    COMPLETED
    FAILED
  }
  ```
- [ ] Run Prisma migration to create `WalletTransaction` table

### Event Indexer (optional for V1.0, can defer)
- [ ] Create blockchain event indexer to populate WalletTransaction table
  - Listen for USDC Transfer events
  - Parse event logs and insert into database
  - Update transaction status (pending → completed)
  - For V1.0: Can manually insert transactions after each send/receive (simpler)

### Exchange Rate Service
- [ ] Create `services/api/src/lib/exchange-rates.ts`
  - `getExchangeRates(): Promise<{ usdcToZar: number, usdcToUsd: number }>`
  - Fetch from CoinGecko API: `GET https://api.coingecko.com/api/v3/simple/price?ids=usd-coin&vs_currencies=zar,usd`
  - Cache results in memory for 5 minutes
  - Fallback to hardcoded rates if API fails (1 USDC = 18.40 ZAR)

## 2. Frontend

### Pages
- [ ] Create `apps/web/app/wallet/page.tsx`
  - Main wallet page with balance card + transaction history
  - Use `useWalletBalance()` hook to fetch balance
  - Use `useTransactions()` hook to fetch transaction history
  - Show empty state if balance is 0 and no transactions

### Components
- [ ] Create `apps/web/components/wallet/balance-card.tsx`
  - Display balance in selected currency (ZAR/USD/USDC)
  - Show secondary balance in USDC
  - Currency toggle buttons
  - Loading state (skeleton)
  - Error state with retry button

- [ ] Create `apps/web/components/wallet/currency-toggle.tsx`
  - Three-way toggle: [ZAR] [USD] [USDC]
  - Active state styling (brand-rose background)
  - Persist selection in localStorage

- [ ] Create `apps/web/components/wallet/transaction-list.tsx`
  - List of transactions (TransactionItem components)
  - "Load More" button for pagination
  - Empty state if no transactions
  - Loading state (skeletons)
  - Error state with retry button

- [ ] Create `apps/web/components/wallet/transaction-item.tsx`
  - Transaction type icon (sent: arrow-up, received: arrow-down, booking: calendar)
  - Counterparty name or truncated address
  - Amount with +/- indicator (sent: "-50.00", received: "+100.00")
  - Status badge (completed: green, pending: yellow, failed: red)
  - Relative timestamp ("2 hours ago", "Yesterday")
  - On click, expand to show full details (txHash, block explorer link)

- [ ] Create `apps/web/components/wallet/empty-wallet.tsx`
  - Wallet illustration (use lucide-react icon or custom SVG)
  - Message: "Your wallet is ready. Add funds to get started."
  - "Add Money" CTA button (links to /wallet/add-funds or triggers onramp modal)
  - "Get Test USDC" CTA button (testnet only, links to /wallet/faucet)

### Hooks
- [ ] Create `apps/web/hooks/use-wallet-balance.ts`
  - `useWalletBalance()` returns: `{ balance, balanceInZar, balanceInUsd, selectedCurrency, setCurrency, isLoading, error, refetch }`
  - Fetches balance from `GET /v1/wallet/balance` using React Query
  - Polls every 10 seconds (or manual refetch)
  - Reads selectedCurrency from localStorage
  - Updates localStorage when setCurrency called

- [ ] Create `apps/web/hooks/use-transactions.ts`
  - `useTransactions(type?: TxType)` returns: `{ transactions, hasMore, loadMore, isLoading, error }`
  - Fetches transactions from `GET /v1/wallet/transactions` using React Query
  - Supports pagination (increments page on loadMore)
  - Supports filtering by type

### API Client
- [ ] Create `apps/web/lib/wallet-client.ts`
  - `getBalance(): Promise<BalanceResponse>`
  - `getTransactions(page: number, limit: number, type?: TxType): Promise<TransactionsResponse>`

### Utilities
- [ ] Create `apps/web/lib/format-currency.ts`
  - `formatCurrency(amount: number, currency: "ZAR" | "USD" | "USDC"): string`
  - ZAR: "R128.40" (with tabular-nums class)
  - USD: "$128.40"
  - USDC: "128.40 USDC"

- [ ] Create `apps/web/lib/format-timestamp.ts`
  - `formatRelativeTime(timestamp: string): string`
  - Returns: "Just now", "5 minutes ago", "2 hours ago", "Yesterday", "Jan 15"

## 3. Smart contracts (if any)
- [ ] Verify MockUSDC contract is deployed and accessible
  - Contract address: `0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0` (from wagmi-config.ts)
  - Test `balanceOf(walletAddress)` function via wagmi

## 4. Testing

### Unit tests
- [ ] Backend: Test `GET /v1/wallet/balance` returns correct balance
- [ ] Backend: Test `GET /v1/wallet/balance` handles exchange rate API failure
- [ ] Backend: Test `GET /v1/wallet/transactions` with pagination
- [ ] Backend: Test `GET /v1/wallet/transactions` with type filter
- [ ] Backend: Test exchange rate caching (should not call CoinGecko on every request)

- [ ] Frontend: Test `useWalletBalance()` hook fetches balance
- [ ] Frontend: Test `useWalletBalance()` hook updates balance on refetch
- [ ] Frontend: Test `useTransactions()` hook fetches transactions
- [ ] Frontend: Test `useTransactions()` hook loads more transactions

### Integration tests
- [ ] Test full wallet page load: fetch balance + transactions
- [ ] Test currency toggle: switch between ZAR/USD/USDC
- [ ] Test transaction pagination: load more transactions
- [ ] Test balance update after transaction (send USDC → balance decreases)

### E2E tests / Playwright
- [ ] E2E: User navigates to `/wallet` → sees balance in ZAR
- [ ] E2E: User toggles to USD → balance updates
- [ ] E2E: User scrolls down → sees transaction history
- [ ] E2E: User clicks "Load More" → sees older transactions
- [ ] E2E: New user with 0 balance → sees empty state with "Add Money" CTA

## 5. Verification
- [ ] All acceptance criteria from `balance-display-spec.md` have passing tests or manual checks
- [ ] Balance updates within 10 seconds after transaction
- [ ] Currency toggle persists across page refreshes
- [ ] Transaction history shows correct amounts and counterparties
- [ ] Empty state is encouraging and brand-aligned
- [ ] Error states have clear retry buttons
- [ ] Loading states are calm (skeleton loaders, not spinners)
