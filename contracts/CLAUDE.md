# Smart Contracts

> Purpose: Solidity smart contracts for on-chain booking registry, escrow, reputation anchoring, and DeFi primitives.

## Canonical References
- [Doc 11: DeFi and Liquidity Architecture](../../docs/vlossom/11-defi-and-liquidity-architecture.md)
- [Doc 12: Liquidity Pool Architecture](../../docs/vlossom/12-liquidity-pool-architecture.md)
- [Doc 13: Smart Contract Architecture](../../docs/vlossom/13-smart-contract-architecture.md)

## Key Directories
- `contracts/core/` — BookingRegistry, Escrow
- `contracts/identity/` — AccountFactory, AA wallet components
- `contracts/reputation/` — ReputationRegistry, on-chain anchoring
- `contracts/defi/` — VLP (Vlossom Liquidity Pool)
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
VLP → liquidity pool for instant payouts
Paymaster → gas sponsorship
```

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

# Contract Verification
npx hardhat verify --network base-sepolia <ADDRESS> <CONSTRUCTOR_ARGS>
```
