# Verification Checklist – F1.4: Wallet Balance Display

## 1. Spec alignment
- [ ] All acceptance criteria from `balance-display-spec.md` have passing tests or manual checks
- [ ] No critical behaviour outside the spec (e.g., no advanced filtering, no export)
- [ ] All user stories are satisfied:
  - [ ] User sees balance in local currency (ZAR)
  - [ ] User can toggle between ZAR/USD/USDC
  - [ ] Balance updates in real-time after transactions
  - [ ] User sees transaction history
  - [ ] Customer sees available balance for bookings
  - [ ] Stylist sees earnings from completed bookings

## 2. UX verification
- [ ] Primary flow (view wallet balance) works on desktop
- [ ] Primary flow (view wallet balance) works on mobile
- [ ] Primary flow (view transaction history) works on desktop
- [ ] Primary flow (view transaction history) works on mobile
- [ ] Alternate flow (empty wallet) works correctly

### Empty / error / loading states
- [ ] Balance card shows skeleton loader while fetching
- [ ] Transaction list shows skeleton loaders (3-5 rows) while fetching
- [ ] Empty wallet shows illustration + "Your wallet is ready. Add funds to get started."
- [ ] Empty wallet shows "Add Money" CTA button (prominent)
- [ ] Empty wallet shows "Get Test USDC" CTA button (testnet only, secondary)
- [ ] Balance fetch error shows: "Unable to load balance. Please try again." with retry button
- [ ] Exchange rate fetch error shows warning: "Exchange rates may be outdated" (still shows last cached rate)
- [ ] Transaction fetch error shows: "Unable to load transactions. Please try again." with retry button

### Currency display
- [ ] Default currency is ZAR (e.g., "R128.40")
- [ ] USD format is correct (e.g., "$128.40")
- [ ] USDC format is correct (e.g., "128.40 USDC")
- [ ] Currency toggle buttons have clear active state (brand-rose background)
- [ ] Currency selection persists across page refreshes (stored in localStorage)
- [ ] Balance uses tabular numbers (consistent digit spacing)

### Transaction display
- [ ] Transactions are sorted by most recent first
- [ ] Each transaction shows: type icon, counterparty, amount, status, timestamp
- [ ] Sent transactions show amount as "-50.00" (negative, red color)
- [ ] Received transactions show amount as "+100.00" (positive, green color)
- [ ] Pending transactions show "(Pending)" badge (yellow)
- [ ] Completed transactions show checkmark icon (green)
- [ ] Failed transactions show error icon (red)
- [ ] Timestamp is relative ("2 hours ago", "Yesterday", "Jan 15")
- [ ] "Load More" button appears if hasMore is true
- [ ] "Load More" button disappears when all transactions loaded

### Brand voice compliance (Doc 24)
- [ ] Empty state message is encouraging: "Your wallet is ready. Add funds to get started." ✅
- [ ] CTAs are invitations, not commands:
  - ✅ "Add Money" (NOT "Deposit Now!")
  - ✅ "Get Test USDC" (NOT "Claim Faucet!")
- [ ] Error messages are helpful, not technical:
  - ❌ "RPC Error: Failed to fetch balance from contract"
  - ✅ "Unable to load balance. Please try again."
- [ ] Loading states are calm:
  - ❌ "Loading... Please wait!"
  - ✅ Skeleton loaders with no text

## 3. Security & reliability

### Auth & permissions verified
- [ ] Wallet page requires authentication (redirects to `/login` if not logged in)
- [ ] User can only see their own balance (not other users' balances)
- [ ] User can only see their own transactions (not other users' transactions)
- [ ] API endpoints validate JWT and return 401 if unauthenticated

### Obvious abuse paths / edge cases tested
- [ ] **Balance refresh spam**: User rapidly clicks refresh → backend rate-limits requests (or frontend debounces)
- [ ] **Stale balance**: User has wallet open for hours → balance still updates every 10 seconds (polling)
- [ ] **Large balances**: User has 1,000,000 USDC → balance displays correctly (no overflow or formatting issues)
- [ ] **Small balances**: User has 0.000001 USDC → balance displays correctly (shows at least 2 decimal places)
- [ ] **Negative balance**: Should never happen (blockchain prevents it), but if it does, show error
- [ ] **Exchange rate API failure**: Falls back to cached rate, shows warning, does not crash
- [ ] **Transaction pagination edge case**: User has exactly 20 transactions → "Load More" button does not appear

### Performance benchmarks
- [ ] Balance fetch completes within 2 seconds (p95)
- [ ] Transaction fetch completes within 2 seconds (p95)
- [ ] Exchange rate fetch completes within 1 second (p95) or uses cached value
- [ ] Currency toggle updates UI instantly (no delay)
- [ ] Transaction "Load More" completes within 2 seconds (p95)

## 4. Observability
- [ ] Logs added for critical wallet events:
  - [ ] Balance fetch (walletAddress, balance, timestamp)
  - [ ] Balance fetch error (walletAddress, error, timestamp)
  - [ ] Transaction fetch (walletAddress, page, limit, timestamp)
  - [ ] Transaction fetch error (walletAddress, error, timestamp)
  - [ ] Exchange rate fetch (rates, timestamp)
  - [ ] Exchange rate fetch error (error, timestamp)
- [ ] Metrics tracked:
  - [ ] Daily active wallets (unique walletAddresses viewing `/wallet`)
  - [ ] Average balance (across all wallets)
  - [ ] Transaction volume (daily USDC sent/received)
  - [ ] Exchange rate API uptime (%)

## Notes:
- **Real-time updates**: For V1.0, balance is polled every 10 seconds. WebSocket real-time updates are deferred to V1.5+ for performance optimization.
- **Transaction history source**: For V1.0, transactions are stored in backend database (manually inserted after each send/receive). Full blockchain event indexing is deferred to V1.5+ for scalability.
- **Exchange rate provider**: Using CoinGecko free tier (<10k requests/month). If usage exceeds limit, will upgrade to paid tier or switch to CoinMarketCap.
- **Currency persistence**: User's selected currency (ZAR/USD/USDC) is stored in localStorage, not in backend database. This means currency preference is per-device, not per-account. This is acceptable for V1.0.
- **Tabular numbers**: Using `font-variant-numeric: tabular-nums` CSS to ensure consistent digit spacing (important for balance display).
