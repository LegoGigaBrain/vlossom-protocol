# Verification Checklist – F1.5: MockUSDC Faucet (Testnet Only)

## 1. Spec alignment
- [ ] All acceptance criteria from `mockusdc-faucet-spec.md` have passing tests or manual checks
- [ ] No critical behaviour outside the spec (e.g., no variable faucet amount, no mainnet faucet)
- [ ] All user stories are satisfied:
  - [ ] Beta tester can get test USDC easily
  - [ ] New user can fund wallet with test USDC
  - [ ] Developer can quickly fund test wallets
  - [ ] System rate-limits faucet usage

## 2. UX verification
- [ ] Primary flow (claim test USDC) works on desktop
- [ ] Primary flow (claim test USDC) works on mobile
- [ ] Alternate flow (rate limit exceeded) works correctly

### Button visibility
- [ ] "Get Test USDC" button is visible on Base Sepolia testnet
- [ ] "Get Test USDC" button is hidden on mainnet (NOT just disabled)
- [ ] Button is below balance card (prominent placement)
- [ ] Button has secondary style (not primary, to avoid overwhelming main CTA)

### Loading states
- [ ] Button shows loading spinner during mint transaction
- [ ] Button text changes to "Adding USDC..." during transaction
- [ ] Button is disabled during transaction (prevents double-click)

### Success states
- [ ] Success toast appears: "1000 USDC added to your wallet!"
- [ ] Balance card updates immediately (optimistic update)
- [ ] Balance card shows correct new balance after blockchain confirmation
- [ ] Button becomes disabled after successful claim
- [ ] Countdown timer appears: "Next claim in 23h 59m"

### Error states
- [ ] Rate limit error toast: "You can claim test USDC once every 24 hours. Next claim available in Xh Ym."
- [ ] Mint failure error toast: "Unable to add test USDC. Please try again."
- [ ] RPC timeout error toast: "Request timed out. Please try again."
- [ ] Paymaster out of gas error toast: "Service temporarily unavailable. Please try again later."
- [ ] All error toasts have retry button or clear next steps

### Countdown timer
- [ ] Countdown updates every second
- [ ] Countdown format is clear: "12h 34m" (not "45000 seconds")
- [ ] Countdown shows "45m 23s" when < 1 hour remaining
- [ ] Countdown shows "12s" when < 1 minute remaining
- [ ] Countdown reaches "0s" and button becomes enabled exactly 24 hours after claim

### Brand voice compliance (Doc 24)
- [ ] Button text is inviting: "Get Test USDC" ✅ (NOT "Claim Faucet!")
- [ ] Success message is encouraging: "1000 USDC added to your wallet!" ✅
- [ ] Error messages are helpful, not technical:
  - ❌ "Error: FaucetRateLimitExceeded - 86400 seconds remaining"
  - ✅ "You can claim test USDC once every 24 hours. Next claim available in 12h 00m."
- [ ] Loading state is calm: "Adding USDC..." ✅ (NOT "Minting tokens... Please wait!")

## 3. Security & reliability

### Auth & permissions verified
- [ ] Faucet claim requires authentication (JWT required)
- [ ] User can only claim for their own wallet (cannot claim for other wallets)
- [ ] API endpoint validates JWT and returns 401 if unauthenticated

### Obvious abuse paths / edge cases tested
- [ ] **Multi-account abuse**: User creates 10 accounts to claim 10,000 USDC → rate-limited per wallet, but still possible. **Acceptable for V1.0 beta testing.**
- [ ] **Faucet on mainnet**: Faucet is completely disabled on mainnet (environment variable check in backend + frontend)
- [ ] **Claim spamming**: User rapidly clicks button → frontend disables button during transaction, backend checks rate limit before minting
- [ ] **Countdown bypass**: User changes system clock to bypass countdown → backend validates timestamp server-side (immune to client-side manipulation)
- [ ] **Double-claim**: User opens two browser tabs and clicks simultaneously → backend uses database-level locking to prevent double-insert
- [ ] **Large claim amounts**: User modifies frontend code to request 10,000 USDC → backend hardcodes amount to 1000 USDC (ignores client input)

### Mainnet safety
- [ ] Frontend checks `chainId === baseSepolia.id` before showing button
- [ ] Backend checks `ENABLE_FAUCET` environment variable (set to `false` on mainnet)
- [ ] If user somehow sends faucet request on mainnet, backend returns 403 Forbidden
- [ ] Error message: "Faucet is only available on Base Sepolia testnet."

### Performance benchmarks
- [ ] Mint transaction completes within 5 seconds (p50)
- [ ] Mint transaction completes within 30 seconds (p95)
- [ ] Countdown timer updates every second without lag
- [ ] Faucet status check completes within 1 second (p95)

## 4. Observability
- [ ] Logs added for critical faucet events:
  - [ ] Faucet claimed (walletAddress, amount, txHash, timestamp)
  - [ ] Faucet rate limited (walletAddress, nextClaimAt, timestamp)
  - [ ] Faucet mint failed (walletAddress, error, timestamp)
  - [ ] Faucet disabled on mainnet (chainId, timestamp)
- [ ] Metrics tracked:
  - [ ] Daily faucet claims (count)
  - [ ] Total USDC minted (cumulative)
  - [ ] Faucet success rate (%)
  - [ ] Average time between claims per wallet

## Notes:
- **Testnet-only**: This feature is ONLY for Base Sepolia testnet. It will NEVER be deployed to mainnet. Frontend and backend both have checks to prevent mainnet usage.
- **Rate limit**: 24-hour rate limit is per wallet, not per user account. If a user has multiple accounts with different wallets, they can claim 1000 USDC per wallet.
- **Abuse tolerance**: For V1.0 beta testing, multi-account abuse is acceptable (users can create multiple accounts to get more test USDC). If abuse becomes excessive, we can add email/phone verification or manual approval in V1.5+.
- **Faucet sustainability**: MockUSDC has unlimited minting (no max supply), so faucet cannot "run out" of USDC. However, Paymaster can run out of ETH (monitored by F5.1).
- **Countdown persistence**: Countdown timer is calculated from database timestamp, so it persists across page refreshes and devices.
