# Arbitrum Sepolia Deployment

**Network**: Arbitrum Sepolia Testnet
**Chain ID**: 421614
**Deployed**: December 28, 2025
**Status**: PRIMARY TESTNET (Active Development)

---

## Deployment Summary

| Metric | Value |
|--------|-------|
| Total Contracts | 11 |
| Core Contracts | 5 |
| DeFi Contracts | 6 |
| Deployer | `0x65AfAFb64ccdefb29EfC67B2eD323c4e43315895` |
| EntryPoint | `0x0000000071727De22E5E9d8BAf0edAc6f37da032` (v0.7) |

---

## Core Contract Addresses

### VlossomAccountFactory
- **Address**: `0x1B1FD00ce6CDc46FcdD9be9F4C2948e00Ab694A9`
- **Arbiscan**: [View Contract](https://sepolia.arbiscan.io/address/0x1B1FD00ce6CDc46FcdD9be9F4C2948e00Ab694A9#code)
- **Purpose**: Creates deterministic AA wallets using CREATE2
- **Features**:
  - Salt-based address derivation
  - Counterfactual deployment (computed before deployment)
  - Owner-based wallet creation

### VlossomPaymaster
- **Address**: `0x9E52B23a6376EAfa89790a637F99371995C0E68c`
- **Arbiscan**: [View Contract](https://sepolia.arbiscan.io/address/0x9E52B23a6376EAfa89790a637F99371995C0E68c#code)
- **Purpose**: Sponsors gas for user operations (gasless UX)
- **Features**:
  - Rate limiting (50 ops/day per wallet)
  - Function selector whitelist
  - DeFi contract whitelist
  - Emergency pause mechanism

### Escrow
- **Address**: `0xb5ba44265B09679C044Ed60506AE936e35B59Afb`
- **Arbiscan**: [View Contract](https://sepolia.arbiscan.io/address/0xb5ba44265B09679C044Ed60506AE936e35B59Afb#code)
- **Purpose**: Holds USDC during booking lifecycle
- **Features**:
  - Multi-relayer support via AccessControl
  - 90/10 fee split (stylist/platform)
  - Reentrancy protection
  - Emergency recovery with 7-day timelock

### PropertyRegistry
- **Address**: `0xE8395633875F5A11b89D3425C199Dd17e09E7E82`
- **Arbiscan**: [View Contract](https://sepolia.arbiscan.io/address/0xE8395633875F5A11b89D3425C199Dd17e09E7E82#code)
- **Purpose**: Property and chair rental management
- **Features**:
  - EnumerableSet for O(1) operations
  - Approval modes (REQUIRED, AUTO, CONDITIONAL)
  - Chair rental state machine

### ReputationRegistry
- **Address**: `0xdbDFFC205738d2E3A179AEd2450D9Aec9B4D0577`
- **Arbiscan**: [View Contract](https://sepolia.arbiscan.io/address/0xdbDFFC205738d2E3A179AEd2450D9Aec9B4D0577#code)
- **Purpose**: On-chain reputation anchoring
- **Features**:
  - TPS (Time Performance Score) tracking
  - Verification thresholds (70% score + 5 bookings)
  - Batch update support

---

## DeFi Contract Addresses

### VlossomTreasury
- **Address**: `0x5Fda3cE7bEF86A755c8fd35474D9e1d8ecE9e4aA`
- **Purpose**: Fee collection and distribution
- **Fee Split**:
  - 50% → Treasury (operations)
  - 40% → LP Yield (rewards)
  - 10% → Smoothing Buffer

### VlossomYieldEngine
- **Address**: `0x44fE36117B9983AE7C3465E4275A20C9F842Fd82`
- **Purpose**: APY calculation (Aave-style utilization curve)
- **Parameters**:
  - Base Rate: 4% (400 bps)
  - Slope1: 10% (0-80% utilization)
  - Slope2: 100% (80-100% utilization)
  - Optimal Utilization: 80%

### VlossomGenesisPool (VLP)
- **Address**: `0x8722EF54892a28007632A7372091f7B770D4FE0b`
- **Purpose**: Protocol-managed liquidity pool
- **Features**:
  - No deposit cap
  - Benchmark APY
  - LP share accounting

### VlossomSmoothingBuffer
- **Address**: `0xfA938DE45e3E0E78C133Ff55d0b5E90691D19F63`
- **Purpose**: Instant payout support for stylists
- **Allocation**: 10% of platform fees

### VlossomCommunityPoolImpl
- **Address**: `0x58f2f38f9Aed2Af2D4234e27aCA344bC6b38BE29`
- **Purpose**: Template for tier-gated community pools
- **Tiers**:
  - Tier 1 (Top 5%): No cap, $1k fee, 5% creator yield
  - Tier 2 (Top 15%): $100k cap, $2.5k fee, 3% creator yield
  - Tier 3 (Top 30%): $20k cap, $5k fee, 1% creator yield

### VlossomPoolFactory
- **Address**: `0x801c4Fb1c0aCF428848D59b4BD5aB1687C75B7dd`
- **Purpose**: Deploys community pools via minimal proxy (EIP-1167)

---

## Token Addresses

### MockUSDC (Testnet)
- **Address**: `0x67d56A4c0ce977aAd973835b0Fa16d6eAddaCE7d`
- **Purpose**: Testnet faucet token for development
- **Decimals**: 6

### Circle USDC
- **Address**: `0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d`
- **Purpose**: Official Circle USDC on Arbitrum Sepolia
- **Decimals**: 6

---

## Environment Configuration

```bash
# .env for Arbitrum Sepolia
CHAIN_ID=421614
RPC_URL=https://sepolia-rollup.arbitrum.io/rpc
RPC_URL_FALLBACK=https://arbitrum-sepolia.public.blastapi.io

# Contract Addresses
VLOSSOM_ACCOUNT_FACTORY=0x1B1FD00ce6CDc46FcdD9be9F4C2948e00Ab694A9
VLOSSOM_PAYMASTER=0x9E52B23a6376EAfa89790a637F99371995C0E68c
ESCROW_ADDRESS=0xb5ba44265B09679C044Ed60506AE936e35B59Afb
PROPERTY_REGISTRY=0xE8395633875F5A11b89D3425C199Dd17e09E7E82
REPUTATION_REGISTRY=0xdbDFFC205738d2E3A179AEd2450D9Aec9B4D0577

# DeFi Contracts
TREASURY_ADDRESS=0x5Fda3cE7bEF86A755c8fd35474D9e1d8ecE9e4aA
YIELD_ENGINE=0x44fE36117B9983AE7C3465E4275A20C9F842Fd82
GENESIS_POOL=0x8722EF54892a28007632A7372091f7B770D4FE0b
SMOOTHING_BUFFER=0xfA938DE45e3E0E78C133Ff55d0b5E90691D19F63
POOL_FACTORY=0x801c4Fb1c0aCF428848D59b4BD5aB1687C75B7dd

# Tokens
USDC_ADDRESS=0x67d56A4c0ce977aAd973835b0Fa16d6eAddaCE7d
CIRCLE_USDC=0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d

# ERC-4337
ENTRY_POINT=0x0000000071727De22E5E9d8BAf0edAc6f37da032
```

---

## Deployment Scripts

```bash
# Full deployment sequence
npx hardhat run scripts/deploy-arbitrum-sepolia.ts --network arbitrum-sepolia
npx hardhat run scripts/deploy-defi-arbitrum.ts --network arbitrum-sepolia
npx hardhat run scripts/deploy-mockusdc-arbitrum.ts --network arbitrum-sepolia
npx hardhat run scripts/configure-paymaster-defi.ts --network arbitrum-sepolia

# Verify contracts
npx hardhat verify --network arbitrum-sepolia 0x1B1FD00ce6CDc46FcdD9be9F4C2948e00Ab694A9
npx hardhat verify --network arbitrum-sepolia 0x9E52B23a6376EAfa89790a637F99371995C0E68c
npx hardhat verify --network arbitrum-sepolia 0xb5ba44265B09679C044Ed60506AE936e35B59Afb
```

---

## Block Explorers

- **Arbiscan**: https://sepolia.arbiscan.io
- **Blockscout**: https://sepolia-explorer.arbitrum.io

---

## Faucets

- **Arbitrum Sepolia ETH**: https://www.alchemy.com/faucets/arbitrum-sepolia
- **MockUSDC**: Use in-app faucet button (rate limited: 1000 USDC/24hr)

---

## Comparison with Base Sepolia

| Feature | Arbitrum Sepolia | Base Sepolia |
|---------|------------------|--------------|
| Status | **PRIMARY** | LEGACY |
| Total Contracts | 11 | 3 |
| Core Contracts | 5 | 3 |
| DeFi Contracts | 6 | 0 |
| PropertyRegistry | ✅ | ❌ |
| ReputationRegistry | ✅ | ❌ |
| MockUSDC Faucet | ✅ | ❌ |
| Deployed Date | Dec 28, 2025 | Dec 13, 2025 |

---

## Related Documentation

- [Smart Contract Architecture](../docs/vlossom/13-smart-contract-architecture.md)
- [DeFi and Liquidity Architecture](../docs/vlossom/11-defi-and-liquidity-architecture.md)
- [contracts/CLAUDE.md](./CLAUDE.md) - Contract development guide
