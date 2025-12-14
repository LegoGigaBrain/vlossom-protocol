# Feature Spec – F1.4: Wallet Balance Display

## 1. Summary
Fiat-first USDC balance display with currency toggle (ZAR/USD/USDC), real-time balance updates, and transaction history. The wallet is the primary financial hub for all users (customers, stylists, property owners), following Doc 23's principle that "the wallet is the canonical financial state."

## 2. User stories
- As a **user**, I want to see my USDC balance in my local currency (ZAR) so that I understand my purchasing power without doing mental math.
- As a **user**, I want to toggle between ZAR, USD, and USDC so that I can see my balance in different denominations.
- As a **user**, I want my balance to update in real-time after transactions so that I always see accurate information.
- As a **user**, I want to see my transaction history so that I can track my spending and earnings.
- As a **customer**, I want to see my available balance for booking payments so that I know if I need to add funds.
- As a **stylist**, I want to see my earnings from completed bookings so that I can track my income.

## 3. Scope
### In scope
- Display USDC balance in fiat-first format (default: ZAR, e.g., "R128.40")
- Currency toggle: ZAR / USD / USDC
- Real-time balance updates (poll every 10 seconds or use WebSocket in future)
- Transaction history list (sent, received, bookings, escrow)
- Pagination for transaction history (20 per page)
- Filter transactions by type (all, sent, received, bookings)
- Empty state for new wallets ("Your wallet is ready. Add funds to get started.")
- Loading states for balance and transactions
- Error states for failed balance fetches

### Out of scope
- Multi-currency balances (only USDC for V1.0)
- Fiat currency selection beyond ZAR/USD (deferred to V1.5+)
- Export transaction history (CSV/PDF) – deferred to V1.5+
- Advanced filtering (date range, amount range) – deferred to V1.5+
- Search transactions by counterparty – deferred to V1.5+
- Transaction details modal (clicking transaction just shows inline details for V1.0)

## 4. UX Overview

### Primary flow: View wallet balance
1. User navigates to `/wallet` page
2. System fetches USDC balance from smart contract (via wagmi/viem)
3. System fetches ZAR/USD exchange rates from API (CoinGecko or similar)
4. System displays balance in default currency (ZAR): "R128.40"
5. System shows secondary balance in USDC: "100 USDC"
6. User sees currency toggle buttons: [ZAR] [USD] [USDC]
7. User clicks currency toggle → balance updates to selected currency

### Primary flow: View transaction history
1. User scrolls down to "Recent Transactions" section on `/wallet` page
2. System fetches transaction history from backend API (`GET /v1/wallet/transactions`)
3. System displays list of transactions (most recent first)
4. Each transaction shows:
   - Type icon (sent, received, booking payment, escrow settlement)
   - Counterparty (name or truncated address)
   - Amount (in selected currency)
   - Date/time (relative: "2 hours ago", "Yesterday", "Jan 15")
   - Status badge (completed, pending, failed)
5. User clicks "Load More" to see older transactions

### Alternate flow: Empty wallet
1. New user navigates to `/wallet` page
2. System fetches balance: 0 USDC
3. System shows empty state:
   - Icon: Wallet illustration
   - Message: "Your wallet is ready. Add funds to get started."
   - CTA: "Add Money" button (links to F1.9: Onramp)
   - Secondary CTA: "Get Test USDC" button (testnet only, links to F1.5: Faucet)

### Edge flows
- **Balance fetch fails**: RPC error or network issue → show error state "Unable to load balance. Please try again." with retry button
- **Exchange rate fetch fails**: API error → fall back to last known rate and show warning "Exchange rates may be outdated"
- **Transaction history fetch fails**: API error → show error state "Unable to load transactions. Please try again." with retry button
- **Zero balance with pending transactions**: Show balance as "R0.00" but show pending transactions with "(Pending)" badge

## 5. Data & APIs

### Smart contract queries (via wagmi/viem)
- `balanceOf(walletAddress)` - Query USDC balance from MockUSDC contract
  - Returns: `bigint` (USDC amount in wei, 6 decimals)
  - Example: `100000000` = 100 USDC

### Backend API endpoints
- `GET /v1/wallet/balance` - Get USDC balance and fiat conversions
  - Response: `{ usdc: "100.00", zar: "1840.00", usd: "100.00", rates: { usdcToZar: 18.40, usdcToUsd: 1.00 } }`

- `GET /v1/wallet/transactions?page=1&limit=20&type=all` - Get transaction history
  - Query params:
    - `page` (default: 1)
    - `limit` (default: 20, max: 100)
    - `type` (default: "all", options: "all", "sent", "received", "bookings")
  - Response:
    ```json
    {
      "transactions": [
        {
          "id": "tx_123",
          "type": "sent",
          "counterparty": { "name": "John Doe", "address": "0x1234..." },
          "amount": "-50.00",
          "currency": "USDC",
          "status": "completed",
          "timestamp": "2025-12-14T10:30:00Z",
          "txHash": "0xabc..."
        }
      ],
      "pagination": {
        "page": 1,
        "limit": 20,
        "total": 45,
        "hasMore": true
      }
    }
    ```

### External APIs
- **Exchange rate API** (CoinGecko or CoinMarketCap)
  - Endpoint: `GET https://api.coingecko.com/api/v3/simple/price?ids=usd-coin&vs_currencies=zar,usd`
  - Response: `{ "usd-coin": { "zar": 18.40, "usd": 1.00 } }`
  - Fallback: If API fails, use hardcoded rates (1 USDC = 18.40 ZAR, 1 USDC = 1.00 USD)

### Frontend components
- `apps/web/components/wallet/balance-card.tsx` - Main balance display card
- `apps/web/components/wallet/currency-toggle.tsx` - ZAR/USD/USDC toggle buttons
- `apps/web/components/wallet/transaction-list.tsx` - Transaction history list
- `apps/web/components/wallet/transaction-item.tsx` - Single transaction row
- `apps/web/components/wallet/empty-wallet.tsx` - Empty state for new wallets

### Frontend utilities
- `apps/web/lib/wallet-client.ts` - API wrapper for wallet endpoints
- `apps/web/hooks/use-wallet-balance.ts` - React hook for balance + currency conversion
- `apps/web/hooks/use-transactions.ts` - React hook for transaction history with pagination

## 6. Risks & assumptions

### Risks
- **Exchange rate API downtime**: If CoinGecko/CoinMarketCap is down, users cannot see fiat balances. **Mitigation**: Cache last known rates in localStorage, show warning "Exchange rates may be outdated."
- **Balance update lag**: If user sends USDC and balance doesn't update immediately, user may think transaction failed. **Mitigation**: Optimistically update balance in UI before blockchain confirmation, show "(Pending)" badge.
- **RPC rate limiting**: If frontend exceeds wagmi/viem RPC rate limits, balance fetches will fail. **Mitigation**: Use dedicated RPC provider (Alchemy, Infura), implement retry logic with exponential backoff.
- **Stale balance display**: If user has wallet open for hours without refreshing, balance may be stale. **Mitigation**: Poll balance every 10 seconds, or use WebSocket for real-time updates in future.

### Assumptions
- MockUSDC contract is deployed and accessible on Base Sepolia (confirmed from V0.5)
- Exchange rate APIs are free for V1.0 usage (<10k requests/month)
- Users primarily care about ZAR balance (South African market), USD is secondary
- Transaction history is stored in backend database (indexed from blockchain events)
- Balance polling every 10 seconds is acceptable UX (WebSocket real-time updates deferred to V1.5+)

## 7. Acceptance criteria
- [ ] User sees USDC balance in fiat-first format (default: ZAR, e.g., "R128.40")
- [ ] User can toggle between ZAR, USD, and USDC views
- [ ] Balance updates in real-time after transactions (within 10 seconds)
- [ ] User sees transaction history (most recent first)
- [ ] User can filter transactions by type (all, sent, received, bookings)
- [ ] User can load more transactions (pagination)
- [ ] Empty wallet shows encouraging empty state with "Add Money" CTA
- [ ] Balance fetch errors show clear retry button
- [ ] Exchange rate failures fall back to cached rates with warning
- [ ] Balance display uses tabular numbers (consistent digit spacing)
- [ ] Transaction amounts use clear +/- indicators (sent: "-50.00", received: "+100.00")
- [ ] Currency selection persists across page refreshes (stored in localStorage)
