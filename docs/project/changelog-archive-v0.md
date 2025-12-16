# Changelog Archive - Pre-V1.0

This file contains changelog entries from the initial development phase (V0.0.1 - V0.2.0).

For the current changelog, see [changelog.md](./changelog.md).

---

## [0.2.0] - 2025-12-13

### Added - Base Sepolia Testnet Deployment
- **VlossomAccountFactory** deployed to Base Sepolia: `0x1118fA7895A0b9Ae2Ed51F1BC355CFd2c606882d`
- **VlossomPaymaster** deployed to Base Sepolia: `0x66Af4b4c3935C185F832cf2B38A88dABA22cCD8D`
- **Escrow** deployed to Base Sepolia: `0x925E12051A6badb09D5a8a67aF9dD40ec5725E04`
- All contracts verified on Basescan with full source code
- Automated deployment script with gas estimation (`deploy-base-sepolia.ts`)
- Paymaster funded with 0.3 ETH for gasless transactions

### Added - Database & Testing
- **PostgreSQL 14** setup complete with Prisma migrations
- **161 unit tests** with 100% business logic coverage
- Jest testing infrastructure for pricing, cancellation policy, and state machine
- Database schema with 8 tables (users, bookings, wallets, transactions, etc.)

### Added - Documentation
- Base Sepolia deployment guide (`BASE_SEPOLIA_DEPLOYMENT.md`)
- PostgreSQL setup guide (`docs/setup/POSTGRESQL_SETUP.md`)
- API environment config for testnet (`.env.base-sepolia`)
- Updated README with testnet deployment info

### Deployment Stats (Base Sepolia)
- Total Gas Used: 3,577,450
- Deployment Cost: 0.0000043 ETH
- Paymaster Funding: 0.3 ETH
- Total Cost: 0.30000429 ETH

### Changed
- All 11 booking endpoints now secured with JWT authentication
- Hardhat config updated to Etherscan API v2
- Contract deployment addresses saved to `deployments/base-sepolia.json`

---

## [0.1.0] - 2024-12-13

### Added - Smart Contracts
- **Escrow contract** - Multi-party settlement with security fixes
- **VlossomAccount** - ERC-4337 smart wallet with CREATE2
- **VlossomAccountFactory** - Deterministic wallet creation
- **VlossomPaymaster** - Gas sponsorship with rate limiting
- **Mock contracts** - MockUSDC, MockEntryPoint for local testing

### Added - Backend Integration
- **Escrow client** (`escrow-client.ts`) - Contract wrapper for lock/release/refund
- **Wallet-booking bridge** (`wallet-booking-bridge.ts`) - Payment flow integration
- **Authentication framework** - JWT + role-based authorization
- **Payment endpoints** - Instructions and confirmation flows

### Deployed - Localhost (chain ID 31337)
- Escrow: `0x5FC8d32690cc91D4c39d9d3abcBD16989F875707`
- Factory: `0x8A791620dd6260079BF849Dc5567aDC3F2FdC318`
- Paymaster: `0x610178dA211FEF7D417bC0e6FeD39F05609AD788`

### Changed
- Booking routes integrated with escrow on confirm/cancel
- Payment flow checks wallet balance and allowances
- State machine transitions trigger smart contract calls

---

## [0.0.1] - 2024-12-12

### Added
- Repository initialization
- Vlossom Product Codex (docs/vlossom/ 00-28)
- LEGO Agent OS integration
- Initial monorepo scaffolding (Turborepo + pnpm)
- Project meta-docs (mission, roadmap, tech-stack)
- CLAUDE.md context files
- Feature spec: booking-flow-v1

---

## Version Summary

| Version | Date | Summary |
|---------|------|---------|
| 0.2.0 | 2025-12-13 | Base Sepolia Deployment + Database + Testing (V0.5 100% Complete) |
| 0.1.0 | 2024-12-13 | V0.5 MVP 85% - Contracts + Escrow Integration |
| 0.0.1 | 2024-12-12 | Initial scaffolding |
