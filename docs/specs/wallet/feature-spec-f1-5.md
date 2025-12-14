# Feature Spec – F1.5: MockUSDC Faucet (Testnet Only)

## 1. Summary
Testnet-only USDC faucet that mints 1000 MockUSDC tokens to users' AA wallets with a 24-hour rate limit. This enables beta testers to fund their wallets without needing real money or external faucets, accelerating user onboarding and testing flows.

## 2. User stories
- As a **beta tester**, I want to get test USDC easily so that I can test booking flows without needing real money.
- As a **new user**, I want to fund my wallet with test USDC so that I can try the platform without financial risk.
- As a **developer**, I want to quickly fund test wallets so that I can test features end-to-end.
- As the **system**, I want to rate-limit faucet usage so that users don't abuse it and drain the faucet.

## 3. Scope
### In scope
- "Get Test USDC" button on `/wallet` page (testnet only)
- Mint 1000 MockUSDC to user's AA wallet (gasless via Paymaster)
- Rate limit: 1 mint per wallet per 24 hours
- Store faucet claims in database (for rate limiting and analytics)
- Success message: "1000 USDC added to your wallet!"
- Error messages for rate limit and failures
- Disable faucet button if user claimed within 24 hours
- Show countdown timer: "Next claim available in 12h 34m"

### Out of scope
- Admin faucet override (manual claim reset) – deferred to V1.5+
- Variable faucet amount (always 1000 USDC for V1.0)
- Faucet on mainnet (NEVER allowed, testnet only)
- Faucet for external wallets (only works for Vlossom AA wallets)
- Faucet leaderboard or gamification – deferred to V1.5+

## 4. UX Overview

### Primary flow: Claim test USDC
1. User navigates to `/wallet` page (must be on Base Sepolia testnet)
2. User sees "Get Test USDC" button (testnet only, not shown on mainnet)
3. User clicks "Get Test USDC" button
4. System checks if user claimed within last 24 hours
5. If eligible, system calls MockUSDC contract's `mint(walletAddress, 1000e6)` function
6. VlossomPaymaster sponsors gas for mint transaction
7. System stores claim record in database (walletAddress, timestamp)
8. System shows success toast: "1000 USDC added to your wallet!"
9. Balance card updates to show new balance (e.g., "R18,400" if 1000 USDC)
10. "Get Test USDC" button becomes disabled with countdown: "Next claim in 23h 59m"

### Alternate flow: Rate limit exceeded
1. User clicks "Get Test USDC" button
2. System checks if user claimed within last 24 hours
3. User already claimed 12 hours ago
4. System shows error toast: "You can claim test USDC once every 24 hours. Next claim available in 12h 00m."
5. Button remains disabled with countdown timer

### Edge flows
- **Mint transaction fails**: RPC error or Paymaster out of gas → show error toast "Unable to add test USDC. Please try again." with retry button
- **User refreshes page**: Countdown timer persists (calculated from database timestamp)
- **User has multiple devices**: Rate limit is per wallet, not per device → if user claims on Device A, Device B will also show countdown
- **Mainnet detection**: If user is on mainnet, "Get Test USDC" button is completely hidden (NOT just disabled)

## 5. Data & APIs

### Database schema
```prisma
model FaucetClaim {
  id            String   @id @default(cuid())
  walletAddress String
  amount        Decimal  @default(1000) // USDC amount claimed
  timestamp     DateTime @default(now())
  txHash        String?  // Transaction hash (optional, for debugging)

  @@index([walletAddress, timestamp])
}
```

### Backend API endpoints
- `POST /v1/wallet/faucet/claim` - Claim test USDC
  - Request body: (none, uses authenticated user's walletAddress)
  - Response: `{ message: "1000 USDC added to your wallet!", txHash: "0xabc...", nextClaimAt: "2025-12-15T10:30:00Z" }`
  - Error responses:
    - 429 Too Many Requests: `{ error: "Rate limit exceeded", nextClaimAt: "2025-12-15T10:30:00Z" }`
    - 500 Internal Server Error: `{ error: "Unable to mint USDC" }`

- `GET /v1/wallet/faucet/status` - Check if user can claim
  - Request: (none, uses authenticated user's walletAddress)
  - Response: `{ canClaim: false, nextClaimAt: "2025-12-15T10:30:00Z" }`
  - Used to disable button and show countdown

### Smart contract interactions
- **MockUSDC** (already deployed at `0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0` on Base Sepolia)
  - `mint(address to, uint256 amount) public`
    - Mints `amount` USDC to address `to`
    - Only callable by faucet service (backend has minter role)
    - Amount: 1000 USDC = `1000 * 10^6` (6 decimals)

### Frontend components
- `apps/web/components/wallet/faucet-button.tsx` - "Get Test USDC" button with countdown timer
  - Only visible on Base Sepolia testnet
  - Disabled if user claimed within 24 hours
  - Shows countdown: "Next claim in 12h 34m"
  - Shows loading state during mint transaction
  - Shows success/error toasts

### Frontend utilities
- `apps/web/lib/wallet-client.ts` - Add faucet methods
  - `claimFaucet(): Promise<FaucetClaimResponse>`
  - `getFaucetStatus(): Promise<FaucetStatusResponse>`

- `apps/web/hooks/use-faucet.ts` - React hook for faucet state
  - `useFaucet()` returns: `{ canClaim, nextClaimAt, claim, isLoading, error }`
  - Calls `GET /v1/wallet/faucet/status` on mount
  - `claim()` calls `POST /v1/wallet/faucet/claim`
  - Refetches balance after successful claim

### Environment variables
- `MOCKUSDC_ADDRESS` - MockUSDC contract address (Base Sepolia only)
- `FAUCET_MINTER_PRIVATE_KEY` - Private key with MINTER_ROLE on MockUSDC contract
- `FAUCET_AMOUNT` - Amount to mint per claim (default: 1000 USDC)
- `FAUCET_RATE_LIMIT_HOURS` - Rate limit in hours (default: 24)

## 6. Risks & assumptions

### Risks
- **Faucet abuse**: Users create multiple accounts to drain faucet. **Mitigation**: Rate limit per wallet (24 hours), monitor faucet claims for anomalies, require email/phone verification (already part of signup).
- **Paymaster runs out of gas**: If Paymaster has insufficient ETH, mint transactions fail. **Mitigation**: Monitor Paymaster balance (F5.1), set alerts for balance < 0.1 ETH.
- **Faucet on mainnet**: If code is accidentally deployed to mainnet, users could mint infinite USDC. **Mitigation**: Hardcode testnet-only check in frontend and backend, use environment variable to disable faucet on mainnet.
- **RPC failures**: If Base Sepolia RPC is down, mint transactions fail. **Mitigation**: Use dedicated RPC provider (Alchemy, Infura), implement retry logic.

### Assumptions
- MockUSDC contract has unrestricted minting (no max supply) – confirmed from contract deployment
- Backend service has MINTER_ROLE on MockUSDC contract – confirmed from V0.5 deployment
- 1000 USDC per claim is sufficient for testing booking flows (cheapest service: ~50 USDC)
- 24-hour rate limit is sufficient to prevent abuse while allowing retesting
- Users will not need to claim more than 1000 USDC per day for testing
- Faucet will NEVER be deployed to mainnet (testnet-only feature)

## 7. Acceptance criteria
- [ ] "Get Test USDC" button is visible on `/wallet` page (Base Sepolia testnet only)
- [ ] "Get Test USDC" button is hidden on mainnet (NOT just disabled)
- [ ] User can claim 1000 MockUSDC by clicking button
- [ ] Claim transaction is gasless (Paymaster sponsors)
- [ ] Balance updates immediately after claim (optimistic + polling)
- [ ] Success toast shows: "1000 USDC added to your wallet!"
- [ ] Button is disabled after claim with countdown: "Next claim in 23h 59m"
- [ ] User cannot claim again until 24 hours have passed
- [ ] If user tries to claim within 24 hours, error toast shows: "You can claim test USDC once every 24 hours. Next claim available in Xh Ym."
- [ ] Countdown timer updates in real-time (every second)
- [ ] Claim record is stored in database (walletAddress, timestamp, txHash)
- [ ] Backend logs faucet claims (for analytics and abuse detection)
- [ ] If mint transaction fails, error toast shows: "Unable to add test USDC. Please try again." with retry button
- [ ] Faucet is completely disabled on mainnet (environment variable check)
