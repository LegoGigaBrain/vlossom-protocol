# Tasks Breakdown – AA Wallet (Account Abstraction Wallet)

## 1. Smart Contracts

### 1.1 VlossomAccountFactory
- [ ] **Create VlossomAccount.sol** — ERC-4337 compliant smart account implementation
  - Extend SimpleAccount from account-abstraction package or use Kernel/Safe variant
  - Support owner-based execution
  - Support guardian addition/removal for recovery
  - Emit events for all state changes
- [ ] **Create VlossomAccountFactory.sol** — Factory for deterministic wallet creation
  - `createAccount(bytes32 userId, address owner)` — deploy new account
  - `getAddress(bytes32 userId)` — compute address without deployment (CREATE2)
  - `accountOf(address owner)` — reverse lookup
  - Store mapping of userId → address
  - Emit `AccountCreated(userId, address, owner)` event
- [ ] **Create IVlossomAccountFactory.sol** — Interface definition

### 1.2 VlossomPaymaster
- [ ] **Create VlossomPaymaster.sol** — Gas sponsorship contract
  - Implement `IPaymaster` interface from ERC-4337
  - `validatePaymasterUserOp()` — validate and authorize gas sponsorship
  - `postOp()` — post-execution accounting
  - Whitelisting: `setWhitelistedTarget(address, bool)`
  - Rate limiting: `maxOpsPerWindow`, `windowSeconds` configurable by owner
  - `getOperationCount(address wallet)` — check usage
  - Emergency pause functionality
- [ ] **Create IVlossomPaymaster.sol** — Interface definition

### 1.3 Testing
- [ ] **VlossomAccountFactory.test.ts** — Unit tests
  - Account creation succeeds
  - Same userId returns same address (determinism)
  - Guardian addition/removal works
  - Only owner can execute
  - Events emitted correctly
- [ ] **VlossomPaymaster.test.ts** — Unit tests
  - Whitelisted operations sponsored
  - Non-whitelisted operations rejected
  - Rate limiting works (reject after max ops)
  - Owner can update limits and whitelist
  - Pause blocks all sponsorship

### 1.4 Deployment
- [ ] **deploy-aa-wallet.ts** — Deployment script
  - Deploy EntryPoint (or use existing on Base)
  - Deploy VlossomAccountFactory
  - Deploy VlossomPaymaster
  - Set initial whitelist (Escrow, BookingRegistry addresses)
  - Set rate limits (50 ops/day default)
  - Fund Paymaster with initial ETH
  - Verify on Basescan

---

## 2. Backend

### 2.1 Database Schema
- [ ] **Add Wallet model to Prisma schema**
  ```prisma
  model Wallet {
    id        String   @id @default(uuid())
    userId    String   @unique
    address   String   @unique
    chainId   Int
    createdAt DateTime @default(now())
    updatedAt DateTime @updatedAt
    user      User     @relation(fields: [userId], references: [id])
  }
  ```
- [ ] **Add WalletTransaction model**
  ```prisma
  model WalletTransaction {
    id            String              @id @default(uuid())
    walletAddress String
    type          WalletTransactionType
    amount        BigInt
    counterparty  String?
    txHash        String?
    status        TransactionStatus
    memo          String?
    createdAt     DateTime            @default(now())
    @@index([walletAddress, createdAt])
  }

  enum WalletTransactionType {
    P2P_SEND
    P2P_RECEIVE
    BOOKING_PAYMENT
    BOOKING_REFUND
    ESCROW_RELEASE
    TIP
    ONRAMP
    OFFRAMP
  }

  enum TransactionStatus {
    PENDING
    CONFIRMED
    FAILED
  }
  ```
- [ ] **Run Prisma migration**

### 2.2 Wallet Service
- [ ] **Create services/wallet/src/** — New service package
- [ ] **Implement AA client** — ERC-4337 bundler integration
  - Use permissionless.js, viem, or stackup SDK
  - Configure for Base Sepolia / Base Mainnet
  - Support UserOperation creation and submission
- [ ] **Implement WalletService class**
  - `createWallet(userId, ownerAddress?)` — Create AA wallet via factory
  - `getWallet(userId)` — Get wallet by user ID
  - `getBalance(address)` — Fetch USDC balance
  - `getTransactions(address, pagination)` — Fetch tx history from DB
- [ ] **Implement TransferService class**
  - `sendP2P(from, to, amount, memo?)` — Execute P2P transfer
  - `createPaymentRequest(recipient, amount, memo)` — Generate request
  - `getPaymentRequest(requestId)` — Fetch request details

### 2.3 API Routes
- [ ] **POST /api/wallet/create** — Create wallet (internal, on signup)
  - Input: `{ userId: string }`
  - Output: `{ address: string }`
- [ ] **GET /api/wallet/balance** — Get balance
  - Auth: Bearer token
  - Output: `{ usdc: string, fiat: string, currency: string }`
- [ ] **GET /api/wallet/address** — Get wallet address
  - Auth: Bearer token
  - Output: `{ address: string, chainId: number }`
- [ ] **GET /api/wallet/transactions** — Get history
  - Auth: Bearer token
  - Query: `?page=1&limit=20`
  - Output: `{ transactions: [...], total: number, page: number }`
- [ ] **POST /api/wallet/transfer** — Send P2P
  - Auth: Bearer token
  - Input: `{ to: string, amount: string, memo?: string }`
  - Output: `{ txHash: string, status: string }`
- [ ] **POST /api/wallet/request** — Create payment request
  - Auth: Bearer token
  - Input: `{ amount: string, memo?: string }`
  - Output: `{ requestId: string, qrData: string }`
- [ ] **GET /api/wallet/request/:id** — Get payment request
  - Output: `{ recipient: string, amount: string, memo: string }`

### 2.4 User Signup Integration
- [ ] **Hook into auth flow** — Auto-create wallet on new user
  - After successful signup in auth service
  - Call `WalletService.createWallet(userId)`
  - Store wallet address in user profile

### 2.5 Chain Event Indexer
- [ ] **Index Transfer events** — For USDC token
  - Filter: from OR to = Vlossom wallet addresses
  - Upsert WalletTransaction records
  - Update status to CONFIRMED when block finalized
- [ ] **Index AccountCreated events** — From VlossomAccountFactory
  - Log wallet creation for audit

---

## 3. Frontend

### 3.1 Wallet Tab UI
- [ ] **Create WalletScreen component**
  - Balance display (fiat primary, stablecoin secondary)
  - Quick actions: Send, Request, Add Funds
  - Recent transactions list (last 5)
  - "View All" link to full history
- [ ] **Create BalanceCard component**
  - Animated balance counter
  - Currency toggle (ZAR/NGN/USDC)
  - Refresh button
- [ ] **Create TransactionList component**
  - Transaction row: icon, type, amount, counterparty, time
  - Color coding: green (receive), red (send)
  - Pull-to-refresh
- [ ] **Create TransactionDetail screen**
  - Full details: hash, timestamp, status, counterparty
  - Link to block explorer

### 3.2 Send Flow
- [ ] **Create SendScreen component**
  - Recipient input (address or @username)
  - Amount input with fiat/crypto toggle
  - Memo input (optional)
  - Fee display ($0.00 - gasless!)
  - Review screen before confirmation
- [ ] **Create RecipientSearch component**
  - Search users by @username
  - Recent recipients
  - Address validation
- [ ] **Implement PIN/biometric confirmation**

### 3.3 Request Flow
- [ ] **Create RequestScreen component**
  - Amount input
  - Memo input
  - Generate QR button
- [ ] **Create QRDisplay component**
  - Render QR code
  - Share button
  - Copy link button
- [ ] **Create QRScanner component**
  - Camera-based QR scanner
  - Parse vlossom:// deep links
  - Pre-fill send form

### 3.4 State Management
- [ ] **Create wallet store** (Zustand)
  - `balance: { usdc: string, fiat: string }`
  - `transactions: Transaction[]`
  - `loading: boolean`
  - `fetchBalance()`
  - `fetchTransactions()`
  - `sendTransfer(to, amount, memo)`

### 3.5 API Integration
- [ ] **Create wallet API hooks**
  - `useWalletBalance()` — SWR/React Query hook
  - `useWalletTransactions(page)` — Paginated hook
  - `useSendTransfer()` — Mutation hook
  - `usePaymentRequest()` — Request creation hook

---

## 4. Testing

### 4.1 Unit Tests
- [ ] **Backend: WalletService tests**
  - createWallet creates on chain and in DB
  - getBalance returns correct amount
  - sendP2P creates UserOp and submits
- [ ] **Backend: API route tests**
  - Auth required for all endpoints
  - Validation errors return 400
  - Success returns correct shape

### 4.2 Integration Tests
- [ ] **E2E: Wallet creation on signup**
  - New user signs up → wallet exists in DB
  - Wallet address matches factory getAddress()
- [ ] **E2E: P2P transfer**
  - User A sends to User B
  - Both balances update correctly
  - Both have transaction records
- [ ] **E2E: Gasless verification**
  - User with 0 ETH can still send USDC
  - Paymaster pays gas

### 4.3 Contract Tests (Hardhat)
- [ ] **Fork tests on Base Sepolia**
  - Create account via factory
  - Execute USDC transfer via account
  - Paymaster sponsors gas

---

## 5. Documentation & Verification

- [ ] **Update contracts/CLAUDE.md** — Add AA wallet section
- [ ] **Update services/api/CLAUDE.md** — Add wallet service section
- [ ] **Create wallet API documentation** — OpenAPI spec
- [ ] **Map each acceptance criterion → tests / manual checks**
  - Document in verification-checklist.md

---

## Task Priority Order

1. **Smart Contracts** (1.1, 1.2) — Foundation
2. **Contract Tests** (1.3) — Validate before backend
3. **Database Schema** (2.1) — Enable backend work
4. **Wallet Service** (2.2) — Core business logic
5. **API Routes** (2.3) — Expose to frontend
6. **Signup Integration** (2.4) — Wire up creation
7. **Chain Indexer** (2.5) — Transaction history
8. **Frontend Wallet Tab** (3.1) — User visibility
9. **Send/Request Flows** (3.2, 3.3) — Core features
10. **E2E Tests** (4.2, 4.3) — Validate full flow
11. **Documentation** (5) — Wrap up
