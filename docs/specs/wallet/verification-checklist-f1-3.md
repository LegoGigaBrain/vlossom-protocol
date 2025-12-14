# Verification Checklist – F1.3: AA Wallet Creation

## 1. Spec alignment
- [ ] All acceptance criteria from `aa-wallet-creation-spec.md` have passing tests or manual checks
- [ ] No critical behaviour outside the spec (e.g., no manual wallet creation UI)
- [ ] All user stories are satisfied:
  - [ ] New user gets AA wallet automatically on signup
  - [ ] Wallet address is deterministic
  - [ ] All wallet operations are gasless
  - [ ] Wallet creation is idempotent

## 2. UX verification
- [ ] Primary flow (wallet creation during signup) works on desktop
- [ ] Primary flow (wallet creation during signup) works on mobile
- [ ] Alternate flow (wallet already exists) works correctly

### Empty / error / loading states
- [ ] Signup form shows loading state: "Creating your account and wallet..."
- [ ] Signup success message shows: "Welcome to Vlossom! Your wallet is ready."
- [ ] Wallet address is displayed (truncated: `0x1234...5678`)
- [ ] If Paymaster out of gas, error message shows: "Unable to create wallet. Please try again later."
- [ ] If RPC timeout, error message shows: "Wallet creation timed out. Please try again."

### Brand voice compliance (Doc 24)
- [ ] Success message is encouraging: "Welcome to Vlossom! Your wallet is ready." ✅
- [ ] Error messages are helpful, not technical:
  - ❌ "PaymasterInsufficientBalanceError: Paymaster has 0.01 ETH"
  - ✅ "Unable to create wallet. Please try again later."
- [ ] Loading states are calm:
  - ❌ "Deploying smart contract... Please wait!"
  - ✅ "Creating your account and wallet..."

## 3. Security & reliability

### Auth & permissions verified
- [ ] Wallet creation requires successful signup (cannot create wallet without user account)
- [ ] Wallet ownership is tied to userId (stored in database)
- [ ] Only authenticated user can access their own wallet
- [ ] Wallet address is unique per user (no duplicates in database)

### Obvious abuse paths / edge cases tested
- [ ] **Duplicate wallet creation**: User signs up twice with same email → only one wallet created
- [ ] **Paymaster abuse**: User cannot spam wallet creation to drain Paymaster (rate-limited by signup flow)
- [ ] **CREATE2 collision**: Extremely unlikely, but if salt collision occurs, backend retries with different salt
- [ ] **Wallet ownership spoofing**: User A cannot claim User B's wallet (ownership validated on every transaction)
- [ ] **RPC rate limiting**: Backend retries with exponential backoff if RPC rate limit hit
- [ ] **Wallet creation timeout**: If deployment takes > 30 seconds, backend times out and returns error

### Performance benchmarks
- [ ] Wallet creation completes within 5 seconds (p50)
- [ ] Wallet creation completes within 30 seconds (p95)
- [ ] Wallet creation completes within 60 seconds (p99)
- [ ] If wallet creation takes > 60 seconds, user sees error and can retry

## 4. Observability
- [ ] Logs added for critical wallet events:
  - [ ] Wallet created (userId, walletAddress, timestamp)
  - [ ] Wallet already exists (userId, walletAddress, timestamp)
  - [ ] Wallet creation failed (userId, error, timestamp)
  - [ ] Paymaster insufficient balance (balance, required, timestamp)
  - [ ] RPC timeout (userId, rpcUrl, timestamp)
- [ ] Metrics tracked:
  - [ ] Daily wallet creations (count)
  - [ ] Wallet creation success rate (%)
  - [ ] Wallet creation latency (p50, p95, p99)
  - [ ] Paymaster balance (monitored by F5.1)

## Notes:
- **Deterministic wallets**: Wallets are deterministic based on user's email or phone. This means if a user signs up with the same email twice (after deleting their account), they will get the same wallet address. This is acceptable for V1.0.
- **Wallet recovery**: If a user loses access to their account (forgets password), they can recover their wallet by resetting their password (email-based recovery). The wallet is tied to the account, not a seed phrase.
- **Seed phrase deferral**: Seed phrase backup/export is deferred to V1.5+. For V1.0, wallet recovery is handled by account recovery (email/phone).
- **Social recovery deferral**: Social recovery (e.g., Argent-style guardians) is deferred to V1.5+. For V1.0, account recovery is the only recovery mechanism.
- **Multi-sig deferral**: Multi-sig wallets are deferred to V1.5+. For V1.0, all wallets are single-owner AA wallets.
