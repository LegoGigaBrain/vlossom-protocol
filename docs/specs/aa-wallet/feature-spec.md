# Feature Spec – AA Wallet (Account Abstraction Wallet)

## 1. Summary

The AA Wallet feature provides the foundational wallet infrastructure for Vlossom Protocol. Every user (customer, stylist, property owner) receives an ERC-4337 Account Abstraction wallet on first sign-up, enabling gasless transactions via a Paymaster. This creates a Web2.5 experience where users interact with stablecoins (USDC) without managing gas, seed phrases, or network settings. The wallet is the single financial hub for all Vlossom operations: bookings, P2P transfers, escrow, and future DeFi.

## 2. User Stories

### Customer
- As a **customer**, I want to sign up with email/phone and automatically get a wallet so that I can pay for services without crypto knowledge.
- As a **customer**, I want to see my balance in my local currency (ZAR/NGN) so that I understand my purchasing power.
- As a **customer**, I want to send money to my stylist's @username so that I can tip them easily.
- As a **customer**, I want to add funds via a fiat on-ramp so that I can pay for bookings.

### Stylist
- As a **stylist**, I want to receive payments directly to my wallet so that I have instant access to earnings.
- As a **stylist**, I want to withdraw funds to my bank account so that I can use my earnings offline.
- As a **stylist**, I want to see my transaction history so that I can track my income.

### All Users
- As a **user**, I want all my transactions to be gasless so that I don't need to hold ETH or understand blockchain.
- As a **user**, I want my wallet created silently on sign-up so that I don't face onboarding friction.
- As a **user**, I want to connect an external wallet (MetaMask, Base Wallet) as guardian so that I have recovery options.

## 3. Scope

### In Scope (v1)
- **VlossomAccountFactory** contract: Creates AA wallets for new users
- **VlossomPaymaster** contract: Sponsors gas for whitelisted operations
- **Wallet Service** (backend): Orchestrates wallet creation, balance queries, transaction signing
- **P2P Transfers**: Send USDC to another user's wallet (by address or @username)
- **QR Request/Pay**: Generate QR codes to request payment
- **Transaction History**: View all wallet transactions (bookings, P2P, tips, refunds)
- **Balance Display**: Show fiat-equivalent balance (USDC → ZAR/NGN)
- **Gasless Operations**: All user actions sponsored by Paymaster

### Out of Scope (v1)
- Session keys for assistants/staff
- Multi-sig wallet upgrades
- Hardware wallet integration
- On-ramp/off-ramp implementation (separate feature)
- DeFi tab / LP staking (separate feature, but AA wallet is prerequisite)
- Social recovery mechanisms

## 4. UX Overview

### 4.1 Primary Flow: Silent Wallet Creation

1. User signs up via email/phone/social auth (Privy/Web3Auth)
2. Backend detects new user, calls `VlossomAccountFactory.createAccount()`
3. AA wallet address is deterministically derived and stored
4. User sees "Wallet" tab in app with $0.00 balance
5. No seed phrase, no gas setup, no blockchain prompts

### 4.2 Primary Flow: P2P Transfer

1. User taps "Send" in Wallet tab
2. Enters recipient (@username or wallet address) and amount
3. Confirms transaction (PIN/biometric)
4. Wallet Service signs UserOperation
5. Paymaster sponsors gas
6. USDC transfers from sender to recipient
7. Both parties see updated balances and transaction history

### 4.3 Alternate Flow: QR Request Payment

1. Recipient taps "Request" → enters amount
2. App generates QR code encoding: `vlossom://pay?to=0x...&amount=50&memo=tip`
3. Sender scans QR → confirms payment
4. Standard P2P transfer executes

### 4.4 Alternate Flow: Connect External Wallet

1. User navigates to Settings → Security → "Connect Wallet"
2. Signs message with MetaMask/Base Wallet
3. External wallet becomes guardian of AA account
4. Enables recovery if social login is lost

### 4.5 Edge Cases

- **Insufficient balance**: Show "Add Funds" prompt linking to on-ramp
- **Network congestion**: Queue transaction, show pending status
- **Paymaster out of gas**: Alert admin, fallback to queue (should never happen in prod)
- **Invalid recipient**: Show clear error "User not found"

## 5. Data & APIs

### 5.1 New Entities

**Wallet (PostgreSQL)**
```
wallet {
  id: UUID
  userId: UUID (FK → User)
  address: string (AA wallet address)
  chainId: number (84532 for Base Sepolia, 8453 for Base)
  createdAt: timestamp
  updatedAt: timestamp
}
```

**WalletTransaction (PostgreSQL - indexed from chain)**
```
wallet_transaction {
  id: UUID
  walletAddress: string
  type: enum (P2P_SEND, P2P_RECEIVE, BOOKING_PAYMENT, BOOKING_REFUND, ESCROW_RELEASE, TIP, ONRAMP, OFFRAMP)
  amount: bigint (USDC in smallest unit)
  counterparty: string (address or @username)
  txHash: string
  status: enum (PENDING, CONFIRMED, FAILED)
  memo: string (optional)
  createdAt: timestamp
}
```

### 5.2 Smart Contract Functions

**VlossomAccountFactory**
```solidity
function createAccount(bytes32 userId, address owner) external returns (address)
function getAddress(bytes32 userId) external view returns (address)
function accountOf(address owner) external view returns (address)
```

**VlossomPaymaster**
```solidity
function validatePaymasterUserOp(UserOperation calldata userOp, bytes32 userOpHash, uint256 maxCost) external returns (bytes memory context, uint256 validationData)
function postOp(PostOpMode mode, bytes calldata context, uint256 actualGasCost) external
// Rate limiting
function getOperationCount(address wallet) external view returns (uint256)
function setRateLimit(uint256 maxOpsPerWindow, uint256 windowSeconds) external onlyOwner
// Whitelisting
function setWhitelistedTarget(address target, bool allowed) external onlyOwner
function isWhitelisted(address target) external view returns (bool)
```

### 5.3 Backend API Endpoints

**Wallet Service**
```
POST   /api/wallet/create         - Create wallet for user (internal, called on signup)
GET    /api/wallet/balance        - Get wallet balance (USDC + fiat equivalent)
GET    /api/wallet/address        - Get user's AA wallet address
GET    /api/wallet/transactions   - Get transaction history (paginated)
POST   /api/wallet/transfer       - Send P2P transfer
POST   /api/wallet/request        - Generate payment request (returns QR data)
GET    /api/wallet/request/:id    - Get payment request details
```

### 5.4 Permissions & Roles

| Action | Customer | Stylist | Owner | Admin |
|--------|----------|---------|-------|-------|
| View own wallet | Yes | Yes | Yes | No |
| Send P2P | Yes | Yes | Yes | No |
| View tx history | Yes | Yes | Yes | No |
| Set Paymaster limits | No | No | No | Yes |
| Fund Paymaster | No | No | No | Yes |

## 6. Risks & Assumptions

### Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| Paymaster draining | Critical | Whitelist only Vlossom contracts, rate limiting per wallet |
| Wallet factory compromise | Critical | Multi-sig ownership, time-locked upgrades |
| User loses social login | High | External wallet guardian option, support recovery flow |
| Chain downtime | Medium | Queue transactions, retry mechanism |
| Gas price spikes | Medium | Paymaster budget monitoring, auto-top-up from treasury |

### Assumptions
- Users have smartphones with internet connectivity
- USDC is available on Base (confirmed)
- Privy/Web3Auth supports AA wallet creation (confirmed)
- Exchange rates (USDC/ZAR) are fetched from reliable API (Coingecko, Chainlink)

## 7. Acceptance Criteria

### Wallet Creation
- [ ] New user signup automatically creates AA wallet within 2 seconds
- [ ] Wallet address is deterministic (same userId always = same address)
- [ ] User sees wallet balance immediately after signup (even if $0)
- [ ] No seed phrase or manual setup required

### P2P Transfers
- [ ] User can send USDC to another user by @username
- [ ] User can send USDC to any valid EVM address
- [ ] Transaction completes in <10 seconds (optimistic UI)
- [ ] Both sender and recipient see transaction in history
- [ ] Zero gas cost to user

### Balance & History
- [ ] Balance displays in local fiat currency (ZAR/NGN) with stablecoin amount secondary
- [ ] Transaction history shows all types (P2P, bookings, tips, refunds)
- [ ] History is paginated (20 items per page)
- [ ] Each transaction shows: type, amount, counterparty, timestamp, status

### Paymaster
- [ ] All whitelisted operations are gasless
- [ ] Rate limiting prevents abuse (max 50 ops/day per wallet)
- [ ] Non-whitelisted contracts are rejected
- [ ] Admin can fund paymaster from treasury
- [ ] Admin receives alert when paymaster balance < threshold

### Security
- [ ] Wallet creation emits event for audit trail
- [ ] P2P transfers use ReentrancyGuard
- [ ] Invalid recipient addresses are rejected with clear error
- [ ] External wallet guardian can be added/removed
