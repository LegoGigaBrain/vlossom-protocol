# Tasks Breakdown – F1.5: MockUSDC Faucet (Testnet Only)

## 1. Backend

### Database Schema
- [ ] Add `FaucetClaim` model to Prisma schema
  ```prisma
  model FaucetClaim {
    id            String   @id @default(cuid())
    walletAddress String
    amount        Decimal  @default(1000)
    timestamp     DateTime @default(now())
    txHash        String?

    @@index([walletAddress, timestamp])
  }
  ```
- [ ] Run Prisma migration to create `FaucetClaim` table

### API Endpoints
- [ ] Implement `POST /v1/wallet/faucet/claim` endpoint
  - Extract walletAddress from authenticated user (JWT)
  - Check if user claimed within last 24 hours (query FaucetClaim table)
  - If user claimed recently, return 429 error with nextClaimAt timestamp
  - If user eligible, call MockUSDC contract's `mint(walletAddress, 1000e6)`
  - Use Paymaster to sponsor gas
  - Store claim record in FaucetClaim table (walletAddress, timestamp, txHash)
  - Return success response with txHash and nextClaimAt
  - Handle errors (Paymaster out of gas, RPC failures)

- [ ] Implement `GET /v1/wallet/faucet/status` endpoint
  - Extract walletAddress from authenticated user (JWT)
  - Query FaucetClaim table for most recent claim by walletAddress
  - If claim exists and < 24 hours old, return `{ canClaim: false, nextClaimAt: "..." }`
  - If no recent claim, return `{ canClaim: true, nextClaimAt: null }`

### Smart Contract Integration
- [ ] Create `services/api/src/lib/contracts/mockusdc.ts`
  - Initialize ethers.js contract instance for MockUSDC
  - Implement `mint(to: string, amount: bigint)` wrapper function
    - Call contract's `mint(to, amount)` method
    - Use Paymaster to sponsor gas
    - Return transaction hash
  - Verify backend service has MINTER_ROLE on MockUSDC contract

### Environment Variables
- [ ] Add faucet configuration to `.env`
  ```
  MOCKUSDC_ADDRESS=0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
  FAUCET_MINTER_PRIVATE_KEY=<private-key-with-minter-role>
  FAUCET_AMOUNT=1000000000  # 1000 USDC (6 decimals)
  FAUCET_RATE_LIMIT_HOURS=24
  ENABLE_FAUCET=true  # Set to false on mainnet
  ```
- [ ] Update `.env.example` with faucet configuration placeholders

### Rate Limiting Logic
- [ ] Create `services/api/src/lib/faucet/rate-limiter.ts`
  - `canUserClaim(walletAddress: string): Promise<{ canClaim: boolean, nextClaimAt: Date | null }>`
  - Query FaucetClaim table for most recent claim
  - Calculate time since last claim
  - If < 24 hours, return `{ canClaim: false, nextClaimAt: <timestamp> }`
  - If >= 24 hours or no claim, return `{ canClaim: true, nextClaimAt: null }`

### Logging & Analytics
- [ ] Add structured logs for faucet events
  - `faucet.claimed` - { walletAddress, amount, txHash, timestamp }
  - `faucet.rate_limited` - { walletAddress, nextClaimAt, timestamp }
  - `faucet.mint_failed` - { walletAddress, error, timestamp }

## 2. Frontend

### Components
- [ ] Create `apps/web/components/wallet/faucet-button.tsx`
  - "Get Test USDC" button (primary style)
  - Only visible if `chainId === baseSepolia.id` (testnet check)
  - Disabled if `!canClaim`
  - Loading state during mint transaction
  - Success toast: "1000 USDC added to your wallet!"
  - Error toast: "Unable to add test USDC. Please try again."
  - Rate limit toast: "You can claim test USDC once every 24 hours. Next claim available in Xh Ym."
  - Countdown timer: "Next claim in 12h 34m" (updates every second)

### Hooks
- [ ] Create `apps/web/hooks/use-faucet.ts`
  - `useFaucet()` returns: `{ canClaim, nextClaimAt, claim, isLoading, error, timeUntilNextClaim }`
  - Fetches faucet status from `GET /v1/wallet/faucet/status` using React Query
  - `claim()` calls `POST /v1/wallet/faucet/claim`
  - On successful claim, refetches balance (calls `useWalletBalance().refetch()`)
  - `timeUntilNextClaim` is computed in real-time (updates every second)

### API Client
- [ ] Modify `apps/web/lib/wallet-client.ts`
  - Add `claimFaucet(): Promise<FaucetClaimResponse>`
  - Add `getFaucetStatus(): Promise<FaucetStatusResponse>`

### Utilities
- [ ] Create `apps/web/lib/format-countdown.ts`
  - `formatCountdown(nextClaimAt: Date): string`
  - Returns: "12h 34m", "45m 23s", "12s"
  - Updates every second

### UI Updates
- [ ] Modify `apps/web/app/wallet/page.tsx`
  - Add FaucetButton component below balance card (testnet only)
  - Wrap in conditional: `{chainId === baseSepolia.id && <FaucetButton />}`

## 3. Smart contracts (if any)
- [ ] Verify MockUSDC contract has `mint(address to, uint256 amount)` function
  - [ ] Check contract address: `0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0`
  - [ ] Verify backend service address has MINTER_ROLE
  - [ ] Test mint function manually with Hardhat script

- [ ] Write Hardhat script to test faucet
  - [ ] Script: `contracts/scripts/test-faucet.ts`
  - [ ] Mint 1000 USDC to test wallet
  - [ ] Verify balance increased by 1000 USDC
  - [ ] Verify transaction was sponsored by Paymaster

## 4. Testing

### Unit tests
- [ ] Backend: Test `POST /v1/wallet/faucet/claim` with eligible user
- [ ] Backend: Test `POST /v1/wallet/faucet/claim` with rate-limited user (should return 429)
- [ ] Backend: Test `GET /v1/wallet/faucet/status` for eligible user
- [ ] Backend: Test `GET /v1/wallet/faucet/status` for rate-limited user
- [ ] Backend: Test faucet disabled on mainnet (ENABLE_FAUCET=false)
- [ ] Backend: Test mint failure (Paymaster out of gas)

- [ ] Frontend: Test `useFaucet()` hook fetches status
- [ ] Frontend: Test `useFaucet()` hook calls claim
- [ ] Frontend: Test countdown timer updates every second
- [ ] Frontend: Test faucet button is hidden on mainnet

### Integration tests
- [ ] Test full faucet flow: user clicks button → 1000 USDC minted → balance updates
- [ ] Test rate limit: user claims → waits 23 hours → cannot claim again
- [ ] Test rate limit reset: user claims → waits 24 hours → can claim again
- [ ] Test balance update after claim (polling + optimistic update)

### E2E tests / Playwright
- [ ] E2E: New user on Base Sepolia → clicks "Get Test USDC" → balance increases to 1000 USDC
- [ ] E2E: User claims → button becomes disabled with countdown
- [ ] E2E: User on mainnet → "Get Test USDC" button is not visible

## 5. Verification
- [ ] All acceptance criteria from `mockusdc-faucet-spec.md` have passing tests or manual checks
- [ ] Faucet is visible on Base Sepolia testnet
- [ ] Faucet is hidden on mainnet
- [ ] Claim transaction is gasless (Paymaster sponsors)
- [ ] Rate limit works correctly (24 hours)
- [ ] Countdown timer updates in real-time
- [ ] Success/error messages are clear and brand-aligned
- [ ] Logs are structured and include all faucet events
