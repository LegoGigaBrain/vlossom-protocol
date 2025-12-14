# Feature Spec – F1.3: AA Wallet Creation

## 1. Summary
Automatic creation of ERC-4337 Account Abstraction (AA) smart contract wallets for all users on first signup, using deterministic CREATE2 deployment via VlossomAccountFactory. All wallet operations are gasless (sponsored by VlossomPaymaster), providing a Web2-like UX where users never see gas fees.

## 2. User stories
- As a **new user**, I want an AA wallet created automatically when I sign up so that I can transact without manually deploying a wallet.
- As a **user**, I want my wallet address to be deterministic (based on my account) so that it's predictable and recoverable.
- As a **user**, I want all wallet transactions to be gasless so that I never worry about gas fees or needing ETH.
- As the **system**, I want wallet creation to be idempotent so that duplicate signups don't create multiple wallets.

## 3. Scope
### In scope
- Automatic AA wallet creation on user signup (triggered by auth system)
- Deterministic CREATE2 deployment (wallet address computed before deployment)
- VlossomAccountFactory integration (calls `createAccount(owner)`)
- VlossomPaymaster sponsorship (gasless wallet deployment)
- Store walletAddress in User table
- Idempotent wallet creation (check if wallet already exists before deploying)
- Error handling for wallet creation failures (Paymaster out of gas, RPC errors)

### Out of scope
- Manual wallet creation (user-initiated) – not needed for V1.0
- Multi-sig wallets – deferred to V1.5+
- Social recovery – deferred to V1.5+
- Hardware wallet support – deferred to V1.5+
- Wallet import from existing private key – deferred to V1.5+
- Wallet export/backup – deferred to V1.5+

## 4. UX Overview

### Primary flow: Wallet creation during signup
1. User completes signup form (F1.2: Authentication System)
2. Backend creates user record in database
3. Backend calls `createAAWallet(userEmail or userPhone)` service function
4. Service computes deterministic wallet address using CREATE2 and user's email/phone hash as salt
5. Service calls VlossomAccountFactory's `createAccount(owner)` function
6. VlossomAccountFactory deploys VlossomAccount contract (ERC-4337 wallet)
7. VlossomPaymaster sponsors gas for deployment transaction
8. Service stores walletAddress in User table
9. Backend returns user object with walletAddress to frontend
10. Frontend shows success message: "Welcome to Vlossom! Your wallet is ready."

### Alternate flow: Wallet already exists (idempotent)
1. User tries to sign up with email that already exists
2. Backend checks if user exists by email
3. If user exists, backend checks if walletAddress is already set
4. If walletAddress exists, backend skips wallet creation
5. Backend returns existing user object with walletAddress

### Edge flows
- **Paymaster out of gas**: VlossomPaymaster has insufficient ETH to sponsor deployment → backend returns 500 error "Unable to create wallet. Please try again later." → admin receives alert to refill Paymaster
- **RPC failure**: Base Sepolia RPC is down or slow → backend retries up to 3 times with exponential backoff → if still fails, returns 500 error
- **Wallet creation timeout**: Deployment transaction takes > 30 seconds → backend times out and returns error → user can retry signup
- **Duplicate wallet address**: CREATE2 collision (extremely unlikely) → backend detects collision and retries with different salt

## 5. Data & APIs

### Modified entities (Prisma schema)
```prisma
model User {
  id            String   @id @default(cuid())
  email         String?  @unique
  phone         String?  @unique
  passwordHash  String?
  role          Role     @default(CUSTOMER)
  walletAddress String   @unique // AA wallet address (added in F1.2, populated here)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([walletAddress])
}
```

### Backend service functions
- `createAAWallet(userIdentifier: string): Promise<string>`
  - Input: User's email or phone number (used as deterministic salt)
  - Output: Deployed wallet address
  - Steps:
    1. Compute deterministic wallet address using CREATE2 formula:
       - `salt = keccak256(userIdentifier)`
       - `walletAddress = computeCreate2Address(VlossomAccountFactory, salt, VlossomAccountBytecode)`
    2. Check if wallet already exists at computed address (call `eth_getCode(walletAddress)`)
    3. If wallet exists, return existing address
    4. If wallet doesn't exist, call VlossomAccountFactory's `createAccount(owner)` with Paymaster sponsorship
    5. Wait for transaction confirmation (max 30 seconds)
    6. Verify wallet was deployed successfully
    7. Return wallet address

### Smart contract interactions
- **VlossomAccountFactory** (already deployed at `0x5FbDB2315678afecb367f032d93F642f64180aa3` on Base Sepolia)
  - `createAccount(address owner) public returns (VlossomAccount)`
    - Creates a new AA wallet with `owner` as the owner
    - Uses CREATE2 for deterministic deployment
    - Returns wallet contract instance

- **VlossomPaymaster** (already deployed at `0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512` on Base Sepolia)
  - Sponsors gas for all wallet creation transactions
  - Must have sufficient ETH balance (monitored by F5.1: Paymaster Monitoring Dashboard)

### Environment variables
- `VLOSSOM_ACCOUNT_FACTORY_ADDRESS` - VlossomAccountFactory contract address
- `VLOSSOM_PAYMASTER_ADDRESS` - VlossomPaymaster contract address
- `BASE_SEPOLIA_RPC_URL` - RPC URL for Base Sepolia testnet
- `WALLET_DEPLOYER_PRIVATE_KEY` - Private key for backend service to sign transactions (or use Paymaster directly)

## 6. Risks & assumptions

### Risks
- **Paymaster runs out of ETH**: If Paymaster balance < 0.01 ETH, wallet creation will fail. **Mitigation**: Monitor Paymaster balance (F5.1), set alerts for balance < 0.1 ETH, auto-refill Paymaster from treasury wallet.
- **RPC rate limiting**: If backend exceeds Base Sepolia RPC rate limits, wallet creation will fail. **Mitigation**: Use dedicated RPC provider (Alchemy, Infura, QuickNode), implement retry logic with exponential backoff.
- **CREATE2 salt collision**: Two users with similar emails could theoretically collide (extremely unlikely). **Mitigation**: Use full email/phone + timestamp as salt to ensure uniqueness.
- **Wallet ownership mismatch**: If backend loses track of which user owns which wallet, users could access wrong wallets. **Mitigation**: Store walletAddress in User table as source of truth, validate ownership on every transaction.

### Assumptions
- VlossomAccountFactory contract is already deployed and verified on Base Sepolia (confirmed from V0.5 completion)
- VlossomPaymaster contract is already deployed and funded with >= 1 ETH (confirmed from V0.5 completion)
- Base Sepolia RPC is reliable and responsive (<5s transaction confirmation time)
- Users will not need to import existing wallets (all wallets are created fresh on signup)
- Wallet recovery is handled by account recovery (email/phone), not seed phrases

## 7. Acceptance criteria
- [ ] User signs up and AA wallet is created automatically
- [ ] Wallet address is stored in User table
- [ ] Wallet creation is gasless (Paymaster sponsors transaction)
- [ ] Wallet address is deterministic (same email/phone → same wallet address)
- [ ] Wallet creation is idempotent (re-running create doesn't deploy duplicate)
- [ ] Wallet ownership is validated (only user with matching email/phone can access wallet)
- [ ] Backend logs wallet creation events (userId, walletAddress, timestamp)
- [ ] If Paymaster runs out of gas, backend returns clear error message
- [ ] If RPC fails, backend retries up to 3 times before failing
- [ ] Wallet creation completes within 30 seconds (p95)
