# Tasks Breakdown – F1.3: AA Wallet Creation

## 1. Backend

### Service Layer
- [ ] Create `services/api/src/lib/wallet/aa-wallet-service.ts`
  - [ ] Implement `createAAWallet(userIdentifier: string): Promise<string>`
    - Compute deterministic wallet address using CREATE2
    - Check if wallet already exists at computed address
    - If wallet doesn't exist, call VlossomAccountFactory's `createAccount(owner)`
    - Use Paymaster to sponsor gas
    - Wait for transaction confirmation (max 30 seconds)
    - Return wallet address
  - [ ] Implement `getWalletAddress(userIdentifier: string): string`
    - Compute deterministic wallet address WITHOUT deploying
    - Used for displaying wallet address before deployment
  - [ ] Implement `verifyWalletOwnership(walletAddress: string, userId: string): Promise<boolean>`
    - Query User table for userId
    - Compare stored walletAddress with provided walletAddress
    - Return true if match, false otherwise

### Contract Integration
- [ ] Create `services/api/src/lib/contracts/vlossom-account-factory.ts`
  - [ ] Initialize ethers.js contract instance for VlossomAccountFactory
  - [ ] Implement `createAccount(owner: string)` wrapper function
    - Call contract's `createAccount(owner)` method
    - Use Paymaster to sponsor gas (ERC-4337 UserOperation)
    - Return transaction hash
  - [ ] Implement `getAddress(owner: string, salt: string)` wrapper function
    - Call contract's `getAddress(owner, salt)` view function
    - Return deterministic wallet address

- [ ] Create `services/api/src/lib/contracts/vlossom-paymaster.ts`
  - [ ] Initialize ethers.js contract instance for VlossomPaymaster
  - [ ] Implement `sponsorUserOperation(userOp: UserOperation)` function
    - Sign UserOperation with Paymaster
    - Return signed UserOperation
  - [ ] Implement `getBalance(): Promise<bigint>` function
    - Query Paymaster's ETH balance
    - Used for monitoring (F5.1)

### Auth Integration
- [ ] Modify `services/api/src/routes/auth.ts`
  - [ ] In `POST /v1/auth/signup`, after creating user record:
    - Call `createAAWallet(user.email || user.phone)`
    - Update user record with walletAddress
    - Log wallet creation event
    - Handle errors (Paymaster out of gas, RPC failures)
    - Return walletAddress in response

### Error Handling
- [ ] Create custom error classes
  - `WalletCreationError` - Generic wallet creation failure
  - `PaymasterInsufficientBalanceError` - Paymaster out of ETH
  - `RPCTimeoutError` - RPC request timed out
  - `WalletAlreadyExistsError` - Wallet already deployed (not an error, just skip)

### Logging
- [ ] Add structured logs for wallet creation events
  - `wallet.created` - { userId, walletAddress, timestamp }
  - `wallet.creation.failed` - { userId, error, timestamp }
  - `wallet.already.exists` - { userId, walletAddress, timestamp }
  - `paymaster.insufficient.balance` - { balance, required, timestamp }

## 2. Frontend

### API Client
- [ ] Modify `apps/web/lib/auth-client.ts`
  - Ensure `signup()` and `login()` responses include `walletAddress`
  - No changes needed (backend already returns walletAddress)

### Wallet State Hook
- [ ] Create `apps/web/hooks/use-wallet.ts`
  - `useWallet()` hook returns: `{ walletAddress, isWalletReady, createWallet }`
  - Reads walletAddress from `useAuth().user.walletAddress`
  - `isWalletReady = !!walletAddress`
  - `createWallet()` is not needed for F1.3 (auto-created on signup)

### UI Components
- [ ] Modify `apps/web/components/auth/signup-form.tsx`
  - After successful signup, show success message: "Welcome to Vlossom! Your wallet is ready."
  - Display walletAddress (truncated: `0x1234...5678`)
  - Show loading state during wallet creation: "Creating your account and wallet..."

## 3. Smart contracts (if any)
- [ ] Verify VlossomAccountFactory is deployed at correct address on Base Sepolia
  - [ ] Check contract address: `0x5FbDB2315678afecb367f032d93F642f64180aa3`
  - [ ] Verify contract is verified on Basescan
  - [ ] Test `createAccount(owner)` function manually with Hardhat script

- [ ] Verify VlossomPaymaster is deployed and funded
  - [ ] Check contract address: `0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512`
  - [ ] Check Paymaster ETH balance (should be >= 1 ETH)
  - [ ] Test gas sponsorship manually with Hardhat script

- [ ] Write Hardhat script to test wallet creation
  - [ ] Script: `contracts/scripts/test-wallet-creation.ts`
  - [ ] Create wallet for test user
  - [ ] Verify wallet is deployed at expected address
  - [ ] Verify wallet ownership

## 4. Testing

### Unit tests
- [ ] Backend: Test `createAAWallet()` with valid user identifier
- [ ] Backend: Test `createAAWallet()` with duplicate identifier (idempotent)
- [ ] Backend: Test `getWalletAddress()` returns deterministic address
- [ ] Backend: Test `verifyWalletOwnership()` with matching userId
- [ ] Backend: Test `verifyWalletOwnership()` with wrong userId (should fail)
- [ ] Backend: Test wallet creation with Paymaster out of gas (should throw PaymasterInsufficientBalanceError)
- [ ] Backend: Test wallet creation with RPC timeout (should throw RPCTimeoutError)

- [ ] Smart Contracts: Test VlossomAccountFactory `createAccount(owner)`
- [ ] Smart Contracts: Test VlossomAccountFactory `getAddress(owner, salt)` returns deterministic address
- [ ] Smart Contracts: Test Paymaster sponsors wallet creation transaction

### Integration tests
- [ ] Test full signup flow with wallet creation
  - [ ] User signs up → wallet created → walletAddress stored in database → user object includes walletAddress
- [ ] Test idempotent wallet creation
  - [ ] User signs up twice with same email → only one wallet created
- [ ] Test wallet ownership validation
  - [ ] User A signs up → wallet created → User B cannot access User A's wallet

### E2E tests / Playwright
- [ ] E2E: User signs up → wallet created → wallet address displayed in UI
- [ ] E2E: User signs up → wallet created → user can view wallet balance (F1.4)

## 5. Verification
- [ ] All acceptance criteria from `aa-wallet-creation-spec.md` have passing tests or manual checks
- [ ] Wallet creation completes within 30 seconds (p95)
- [ ] Wallet creation is gasless (Paymaster sponsors transaction)
- [ ] Wallet address is deterministic (same email → same wallet)
- [ ] Wallet creation is idempotent (no duplicate wallets)
- [ ] Error messages are clear and actionable
- [ ] Logs are structured and include all critical wallet events
