# Smart Contracts

> Purpose: Solidity smart contracts for on-chain booking registry, escrow, reputation anchoring, and DeFi primitives.

## Current Implementation Status

**V6.2.0 Security & Smart Contract Hardening** (Dec 17, 2025)

Critical security fixes: Guardian recovery nonce system (H-2), Paymaster selector validation (H-1), YieldEngine utilization tracking (M-4). Comprehensive test coverage added.

---

### V6.2.0 Changes

**Guardian Recovery State Fix (H-2)**
- `contracts/identity/VlossomAccount.sol` - Fixed guardian recovery vulnerability
- Implemented nonce-based approval system to prevent replay attacks
- Guardian approvals now tracked per-operation with unique nonces
- Recovery operations require current nonce, auto-increment on approval
- Prevents malicious reuse of old guardian signatures
- Test coverage: `test/VlossomAccount.test.ts` (17 tests)

**Paymaster Selector Validation (H-1)**
- `contracts/paymaster/VlossomPaymaster.sol` - Added assembly bounds checking
- Validates function selector length before decoding
- Prevents malformed calldata from causing undefined behavior
- Rejects transactions with truncated/invalid function selectors
- Enhanced security for paymaster operation validation

**YieldEngine Utilization Fix (M-4)**
- `contracts/defi/VlossomYieldEngine.sol` - Fixed utilization calculation
- Now tracks real-time utilization: `(totalBorrowed * 10000) / totalDeposited`
- APY calculations now reflect actual pool usage
- Accurate interest rate curves based on true pool state
- Improved fairness for liquidity providers

**Testing Infrastructure**
- New test file: `contracts/test/VlossomAccount.test.ts`
- 17 comprehensive tests for guardian recovery flow
- Tests cover: setup, approval, execution, nonce handling, edge cases
- All security fixes validated with automated tests
- Test coverage increased for critical security paths

**Documentation**
- Updated contract documentation with security considerations
- Added inline comments explaining security-critical code sections
- Guardian recovery flow documented in test comments

---

## Canonical References
- [Doc 11: DeFi and Liquidity Architecture](../../docs/vlossom/11-defi-and-liquidity-architecture.md)
- [Doc 12: Liquidity Pool Architecture](../../docs/vlossom/12-liquidity-pool-architecture.md)
- [Doc 13: Smart Contract Architecture](../../docs/vlossom/13-smart-contract-architecture.md)

## Key Directories
- `contracts/core/` — BookingRegistry, Escrow
- `contracts/identity/` — AccountFactory, AA wallet components
- `contracts/reputation/` — ReputationRegistry, on-chain anchoring
- `contracts/defi/` — DeFi liquidity pool system
- `contracts/paymaster/` — VlossomPaymaster for gasless transactions
- `contracts/interfaces/` — Shared interfaces
- `test/` — Hardhat tests
- `scripts/` — Deployment scripts

## Local Conventions
- Solidity 0.8.23+
- OpenZeppelin contracts for standards
- Hardhat for compilation and testing
- TypeChain for type-safe contract interactions
- UUPS upgrades only when necessary

## Contract Architecture
```
AccountFactory → creates AA wallets
BookingRegistry → booking state machine
Escrow → payment protection
ReputationRegistry → on-chain reputation anchoring
Paymaster → gas sponsorship (whitelists + rate limiting)

DeFi Contracts:
├── VlossomGenesisPool (VLP) → Protocol liquidity pool, no cap
├── VlossomCommunityPool → Template for tier-gated community pools
├── VlossomPoolFactory → Deploys community pools via minimal proxy
├── VlossomYieldEngine → APY calculation (Aave-style utilization curve)
├── VlossomTreasury → Fee collection and distribution
└── VlossomSmoothingBuffer → Instant payout support
```

## DeFi System

### Pool Architecture
- **Genesis Pool (VLP)**: Protocol-managed, unlimited cap, benchmark APY
- **Community Pools**: Created by top referrers (Tier 1-3), tiered caps
- **Tier System**:
  - Tier 1 (Top 5% referrers): No cap, $1k fee, 5% creator yield
  - Tier 2 (Top 15%): $100k cap, $2.5k fee, 3% creator yield
  - Tier 3 (Top 30%): $20k cap, $5k fee, 1% creator yield

### APY Calculation (Aave-style)
```solidity
// If utilization <= optimal (80%)
apy = baseRate + (utilization * slope1) / 10000

// If utilization > optimal
apy = baseRate + optimalPortion + (excessUtil * slope2) / 10000
```

Default parameters:
- baseRate: 400 (4%)
- slope1: 1000 (10%)
- slope2: 10000 (100%)
- optimalUtilization: 8000 (80%)

### Fee Split (10% platform fee from bookings)
- 50% → Treasury (operations)
- 40% → VLP Yield (LP rewards)
- 10% → Smoothing Buffer

## Dependencies
- External: OpenZeppelin Contracts v5, Hardhat, ethers v6

## Gotchas
- All user transactions are gasless via Paymaster
- Escrow cannot be bypassed — safety critical
- Paymaster must not be drainable
- Reputation anchoring is aggregate only, not raw logs
- Test everything with `hardhat test`

## Deployed Contracts

### Arbitrum Sepolia Testnet (Chain ID 421614) — PRIMARY
Deployed: Dec 28, 2025 | **11 contracts** | Full DeFi stack

**Core Contracts:**
- **VlossomAccountFactory**: `0x1B1FD00ce6CDc46FcdD9be9F4C2948e00Ab694A9`
  - [View on Arbiscan](https://sepolia.arbiscan.io/address/0x1B1FD00ce6CDc46FcdD9be9F4C2948e00Ab694A9#code)
  - Creates deterministic AA wallets using CREATE2

- **VlossomPaymaster**: `0x9E52B23a6376EAfa89790a637F99371995C0E68c`
  - [View on Arbiscan](https://sepolia.arbiscan.io/address/0x9E52B23a6376EAfa89790a637F99371995C0E68c#code)
  - Sponsors gas for user operations

- **Escrow**: `0xb5ba44265B09679C044Ed60506AE936e35B59Afb`
  - [View on Arbiscan](https://sepolia.arbiscan.io/address/0xb5ba44265B09679C044Ed60506AE936e35B59Afb#code)
  - Holds USDC during booking lifecycle

- **PropertyRegistry**: `0xE8395633875F5A11b89D3425C199Dd17e09E7E82`
  - [View on Arbiscan](https://sepolia.arbiscan.io/address/0xE8395633875F5A11b89D3425C199Dd17e09E7E82#code)
  - Property and chair rental management

- **ReputationRegistry**: `0xdbDFFC205738d2E3A179AEd2450D9Aec9B4D0577`
  - [View on Arbiscan](https://sepolia.arbiscan.io/address/0xdbDFFC205738d2E3A179AEd2450D9Aec9B4D0577#code)
  - On-chain reputation anchoring

**DeFi Contracts:**
- **VlossomTreasury**: `0x5Fda3cE7bEF86A755c8fd35474D9e1d8ecE9e4aA`
- **VlossomYieldEngine**: `0x44fE36117B9983AE7C3465E4275A20C9F842Fd82`
- **VlossomGenesisPool**: `0x8722EF54892a28007632A7372091f7B770D4FE0b`
- **VlossomSmoothingBuffer**: `0xfA938DE45e3E0E78C133Ff55d0b5E90691D19F63`
- **VlossomCommunityPoolImpl**: `0x58f2f38f9Aed2Af2D4234e27aCA344bC6b38BE29`
- **VlossomPoolFactory**: `0x801c4Fb1c0aCF428848D59b4BD5aB1687C75B7dd`

**Tokens & Infrastructure:**
- **MockUSDC**: `0x67d56A4c0ce977aAd973835b0Fa16d6eAddaCE7d` (testnet faucet)
- **Circle USDC**: `0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d`
- **EntryPoint (v0.7)**: `0x0000000071727De22E5E9d8BAf0edAc6f37da032`

**Deployment Info**: See `ARBITRUM_SEPOLIA_DEPLOYMENT.md` for full details

---

### Base Sepolia Testnet (Chain ID 84532) — LEGACY
Deployed: Dec 13, 2025 | Core contracts only (no DeFi)

> ⚠️ **Note**: Base Sepolia deployment is deprecated. Use Arbitrum Sepolia for all development.

- **VlossomAccountFactory**: `0x1118fA7895A0b9Ae2Ed51F1BC355CFd2c606882d`
- **VlossomPaymaster**: `0x66Af4b4c3935C185F832cf2B38A88dABA22cCD8D`
- **Escrow**: `0x925E12051A6badb09D5a8a67aF9dD40ec5725E04`
- **USDC (Circle)**: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`

**Deployment Info**: See `BASE_SEPOLIA_DEPLOYMENT.md` for details

---

### Localhost (Chain ID 31337)
- Escrow: `0x5FC8d32690cc91D4c39d9d3abcBD16989F875707`
- VlossomAccountFactory: `0x8A791620dd6260079BF849Dc5567aDC3F2FdC318`
- VlossomPaymaster: `0x610178dA211FEF7D417bC0e6FeD39F05609AD788`
- MockUSDC: `0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9`

## Commands
```bash
pnpm compile    # Compile contracts
pnpm test       # Run tests
pnpm node       # Start local node

# Arbitrum Sepolia Deployment (PRIMARY)
npx hardhat run scripts/deploy-arbitrum-sepolia.ts --network arbitrum-sepolia
npx hardhat run scripts/deploy-defi-arbitrum.ts --network arbitrum-sepolia
npx hardhat run scripts/deploy-mockusdc-arbitrum.ts --network arbitrum-sepolia

# Configure Paymaster DeFi Whitelist
npx hardhat run scripts/configure-paymaster-defi.ts --network arbitrum-sepolia

# Contract Verification
npx hardhat verify --network arbitrum-sepolia <ADDRESS> <CONSTRUCTOR_ARGS>

# Base Sepolia (LEGACY - not recommended)
npx hardhat run scripts/deploy-base-sepolia.ts --network base-sepolia
```

## Scripts

| Script | Purpose |
|--------|---------|
| `deploy-arbitrum-sepolia.ts` | Deploy core contracts to Arbitrum Sepolia (PRIMARY) |
| `deploy-defi-arbitrum.ts` | Deploy DeFi contracts to Arbitrum Sepolia |
| `deploy-mockusdc-arbitrum.ts` | Deploy MockUSDC for testnet faucet |
| `deploy-base-sepolia.ts` | Deploy core contracts to Base Sepolia (LEGACY) |
| `deploy-defi.ts` | Deploy DeFi contracts (generic) |
| `deploy-aa.ts` | Deploy AA infrastructure locally |
| `deploy-escrow.ts` | Deploy Escrow contract |
| `deploy-property-registry.ts` | Deploy property/rental registry |
| `deploy-reputation-registry.ts` | Deploy reputation anchoring |
| `configure-paymaster-defi.ts` | Whitelist DeFi contracts in paymaster |
