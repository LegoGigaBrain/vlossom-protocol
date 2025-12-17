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

### Base Sepolia Testnet (Chain ID 84532)
Deployed: Dec 13, 2025

- **VlossomAccountFactory**: `0x1118fA7895A0b9Ae2Ed51F1BC355CFd2c606882d`
  - [View on Basescan](https://sepolia.basescan.org/address/0x1118fA7895A0b9Ae2Ed51F1BC355CFd2c606882d#code)
  - Creates deterministic AA wallets using CREATE2

- **VlossomPaymaster**: `0x66Af4b4c3935C185F832cf2B38A88dABA22cCD8D`
  - [View on Basescan](https://sepolia.basescan.org/address/0x66Af4b4c3935C185F832cf2B38A88dABA22cCD8D#code)
  - Sponsors gas for user operations
  - Current balance: 0.3 ETH

- **Escrow**: `0x925E12051A6badb09D5a8a67aF9dD40ec5725E04`
  - [View on Basescan](https://sepolia.basescan.org/address/0x925E12051A6badb09D5a8a67aF9dD40ec5725E04#code)
  - Holds USDC during booking lifecycle

- **USDC (Circle)**: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`
- **EntryPoint (v0.7)**: `0x0000000071727De22E5E9d8BAf0edAc6f37da032`

**Deployment Info**: See `BASE_SEPOLIA_DEPLOYMENT.md` for full details

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

# Base Sepolia Deployment
npx hardhat run scripts/deploy-base-sepolia.ts --network base-sepolia

# DeFi Deployment
npx hardhat run scripts/deploy-defi.ts --network base-sepolia

# Configure Paymaster DeFi Whitelist (after both deployments)
npx hardhat run scripts/configure-paymaster-defi.ts --network base-sepolia

# Contract Verification
npx hardhat verify --network base-sepolia <ADDRESS> <CONSTRUCTOR_ARGS>
```

## Scripts

| Script | Purpose |
|--------|---------|
| `deploy-base-sepolia.ts` | Deploy core contracts (Factory, Paymaster, Escrow) |
| `deploy-defi.ts` | Deploy DeFi contracts (Pool, Treasury, Factory, etc.) |
| `deploy-aa.ts` | Deploy AA infrastructure locally |
| `deploy-escrow.ts` | Deploy Escrow contract |
| `deploy-property-registry.ts` | Deploy property/rental registry |
| `deploy-reputation-registry.ts` | Deploy reputation anchoring |
| `configure-paymaster-defi.ts` | Whitelist DeFi contracts in paymaster |
