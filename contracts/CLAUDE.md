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

## Commands
```bash
pnpm compile    # Compile contracts
pnpm test       # Run tests
pnpm node       # Start local node
```
