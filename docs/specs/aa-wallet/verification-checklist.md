# Verification Checklist – AA Wallet (Account Abstraction Wallet)

## 1. Spec Alignment

### Wallet Creation
- [ ] New user signup automatically creates AA wallet within 2 seconds
  - **Test**: `WalletService.createWallet.test.ts` → `should create wallet on signup`
  - **Manual**: Sign up new user, verify wallet appears in DB
- [ ] Wallet address is deterministic (same userId always = same address)
  - **Test**: `VlossomAccountFactory.test.ts` → `should return same address for same userId`
  - **Manual**: Call `getAddress()` multiple times, verify consistency
- [ ] User sees wallet balance immediately after signup (even if $0)
  - **Test**: E2E test → new user sees Wallet tab with $0.00
  - **Manual**: Complete signup flow, verify Wallet tab renders
- [ ] No seed phrase or manual setup required
  - **Manual**: Full signup flow does not prompt for seed phrase

### P2P Transfers
- [ ] User can send USDC to another user by @username
  - **Test**: `TransferService.test.ts` → `should resolve @username to address`
  - **Manual**: Send $1 to @testuser, verify delivery
- [ ] User can send USDC to any valid EVM address
  - **Test**: `TransferService.test.ts` → `should send to raw address`
  - **Manual**: Send $1 to 0x... address, verify receipt
- [ ] Transaction completes in <10 seconds (optimistic UI)
  - **Test**: E2E test → measure time from send to confirmation
  - **Manual**: Stopwatch test of send flow
- [ ] Both sender and recipient see transaction in history
  - **Test**: E2E test → verify tx appears in both users' history
  - **Manual**: Check both accounts after transfer
- [ ] Zero gas cost to user
  - **Test**: `VlossomPaymaster.test.ts` → `should sponsor whitelisted ops`
  - **Manual**: User with 0 ETH can send USDC

### Balance & History
- [ ] Balance displays in local fiat currency (ZAR/NGN) with stablecoin amount secondary
  - **Test**: Frontend unit test → BalanceCard shows fiat first
  - **Manual**: Verify UI shows "R50.00 (~50 USDC)"
- [ ] Transaction history shows all types (P2P, bookings, tips, refunds)
  - **Test**: `WalletService.getTransactions.test.ts` → returns all types
  - **Manual**: Create multiple tx types, verify all appear
- [ ] History is paginated (20 items per page)
  - **Test**: API test → returns max 20 items per request
  - **Manual**: User with 50+ txs sees pagination
- [ ] Each transaction shows: type, amount, counterparty, timestamp, status
  - **Test**: Frontend unit test → TransactionRow displays all fields
  - **Manual**: Visual inspection of tx list

### Paymaster
- [ ] All whitelisted operations are gasless
  - **Test**: `VlossomPaymaster.test.ts` → sponsors Escrow, P2P calls
  - **Manual**: Execute various ops, verify no ETH deducted from user
- [ ] Rate limiting prevents abuse (max 50 ops/day per wallet)
  - **Test**: `VlossomPaymaster.test.ts` → rejects after 50 ops
  - **Manual**: Script 51 ops from same wallet, verify 51st fails
- [ ] Non-whitelisted contracts are rejected
  - **Test**: `VlossomPaymaster.test.ts` → rejects non-whitelisted target
  - **Manual**: Try to call arbitrary contract, verify rejection
- [ ] Admin can fund paymaster from treasury
  - **Test**: Integration test → admin funds paymaster
  - **Manual**: Admin sends ETH to paymaster address
- [ ] Admin receives alert when paymaster balance < threshold
  - **Test**: Mock alert service → triggers when balance low
  - **Manual**: Drain paymaster below threshold, verify alert

### Security
- [ ] Wallet creation emits event for audit trail
  - **Test**: `VlossomAccountFactory.test.ts` → emits AccountCreated
  - **Manual**: Check block explorer for events
- [ ] P2P transfers use ReentrancyGuard
  - **Test**: Attempted reentrancy reverts
  - **Manual**: Code review confirms modifier present
- [ ] Invalid recipient addresses are rejected with clear error
  - **Test**: API test → 400 error with message
  - **Manual**: Try sending to invalid address, verify error
- [ ] External wallet guardian can be added/removed
  - **Test**: `VlossomAccount.test.ts` → guardian add/remove works
  - **Manual**: Connect MetaMask as guardian, verify in account

---

## 2. UX Verification

### Primary Flow: Silent Wallet Creation
- [ ] Primary flow works on mobile (iOS/Android)
  - **Manual**: Test signup on real iOS device
  - **Manual**: Test signup on real Android device
- [ ] Primary flow works on web
  - **Manual**: Test signup on Chrome, Safari, Firefox

### Send Flow
- [ ] Send amount input works with decimal amounts (e.g., $5.50)
  - **Manual**: Enter 5.50, verify correct amount sent
- [ ] Confirmation screen shows correct recipient and amount
  - **Manual**: Visual verification
- [ ] Success state shows transaction hash
  - **Manual**: Complete send, verify hash displayed

### Empty / Error / Loading States
- [ ] Empty wallet shows helpful message ("Add funds to get started")
  - **Manual**: New user with $0 sees appropriate prompt
- [ ] Error state shows user-friendly message (not technical error)
  - **Manual**: Trigger error (e.g., send to invalid address), verify message
- [ ] Loading state shows spinner/skeleton during fetch
  - **Manual**: Slow network simulation, verify loading indicator

### QR Flow
- [ ] QR code scanner works on mobile
  - **Manual**: Scan QR with camera, verify parsing
- [ ] QR code can be shared via system share sheet
  - **Manual**: Tap share button, verify share options appear

---

## 3. Security & Reliability

### Auth & Permissions
- [ ] All wallet endpoints require authentication
  - **Test**: API test → 401 without token
  - **Manual**: Call endpoints without auth, verify rejection
- [ ] User can only access their own wallet
  - **Test**: API test → cannot fetch other user's wallet
  - **Manual**: Attempt to access other user's wallet, verify forbidden
- [ ] Only owner can execute from AA wallet
  - **Test**: `VlossomAccount.test.ts` → non-owner execute reverts
  - **Manual**: Attempt execute from non-owner EOA

### Abuse Protection
- [ ] Rate limiting per wallet enforced
  - **Test**: Paymaster test → rate limit works
  - **Manual**: Automated 51 ops test
- [ ] Large transfers flagged for review (if threshold set)
  - **Test**: Backend test → large transfer triggers flag
  - **Manual**: Send >$10,000, verify flag in admin panel
- [ ] Invalid operations do not drain paymaster
  - **Test**: Failed ops don't consume paymaster gas
  - **Manual**: Submit invalid UserOp, verify paymaster balance unchanged

### Edge Cases
- [ ] Concurrent sends from same wallet handled correctly
  - **Test**: Integration test → two sends, both succeed with correct nonce
  - **Manual**: Rapid double-tap send button
- [ ] Network failure shows retry option
  - **Manual**: Turn off network mid-send, verify retry prompt
- [ ] Wallet recovery via guardian works
  - **Test**: `VlossomAccount.test.ts` → guardian can recover
  - **Manual**: Full recovery flow test

---

## 4. Observability

### Logs
- [ ] Wallet creation logged with userId and address
  - **Manual**: Check logs after signup
- [ ] P2P transfers logged with from, to, amount, txHash
  - **Manual**: Check logs after transfer
- [ ] Errors logged with stack trace and context
  - **Manual**: Trigger error, verify logs

### Metrics
- [ ] Total wallets created (counter)
  - **Manual**: Verify metric in Prometheus/Grafana
- [ ] P2P transfer volume (sum, daily)
  - **Manual**: Verify metric tracks transfers
- [ ] Paymaster gas usage (daily)
  - **Manual**: Verify paymaster spend is tracked
- [ ] API latency (p50, p99)
  - **Manual**: Verify latency histograms

### Alerts
- [ ] Alert: Paymaster balance below threshold
  - **Manual**: Drain and verify alert fires
- [ ] Alert: Wallet creation failure rate > 1%
  - **Manual**: Mock failures, verify alert
- [ ] Alert: P2P transfer failure rate > 5%
  - **Manual**: Mock failures, verify alert

---

## 5. Contract Security Checklist

- [ ] All external functions have correct access control
  - **Code review**: Factory, Paymaster, Account
- [ ] ReentrancyGuard on all fund-moving functions
  - **Code review**: Confirm modifier present
- [ ] SafeERC20 used for token transfers
  - **Code review**: Confirm import and usage
- [ ] No unchecked external calls
  - **Code review**: All calls wrapped properly
- [ ] Events emitted for all state changes
  - **Code review**: Verify events exist
- [ ] Pausable emergency mechanism exists
  - **Test**: Paymaster pause blocks operations
- [ ] Test coverage >90%
  - **CI**: Coverage report meets threshold

---

## Notes

- All tests should run in CI pipeline (GitHub Actions)
- Manual tests documented in QA runbook
- Security tests run before testnet deployment
- Contract audit scheduled before mainnet deployment
- Paymaster funding monitored via ops dashboard
