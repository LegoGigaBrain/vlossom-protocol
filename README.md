# Vlossom Protocol

**Status:** V6.2.0 - Security, Quality & Smart Contract Hardening 🛡️

A decentralized booking and payment protocol for mobile beauty services, built on Base L2 with Account Abstraction (ERC-4337) and DeFi liquidity pools.

## Features

### V6.2.0 Security & Smart Contract Hardening (Complete - Dec 17, 2025)
- ✅ **TypeScript Any Elimination** - Production code type safety (MAJOR-2)
- ✅ **OpenAPI/Swagger Docs** - Full API documentation at /api/docs
- ✅ **Guardian Recovery Fix (H-2)** - Nonce-based approval invalidation
- ✅ **Paymaster Validation (H-1)** - Comprehensive bounds checking in assembly
- ✅ **YieldEngine Fix (M-4)** - Real utilization tracking with oracles
- ✅ **Smart Contract Tests** - 17 new tests for VlossomAccount recovery

### V6.1.0 Orange Color Governance (Complete - Dec 17, 2025)
- ✅ **Sacred Orange Rule** - Orange reserved for growth/celebration only
- ✅ **Color System Enforcement** - 12 files corrected for proper status colors

### V6.0.0 Mobile App Foundation (Complete - Dec 17, 2025)
- ✅ **React Native App** - Expo-based mobile app with botanical design system
- ✅ **Botanical Icons** - 25+ custom SVG icons replacing generic libraries
- ✅ **Animation System** - Spring-based Framer Motion animations

### V4.0.0 DeFi Integration (Complete - Dec 16, 2025)
- ✅ **DeFi Smart Contracts** - Genesis Pool, Community Pools, Factory, Treasury, Yield Engine
- ✅ **Liquidity Pools** - Deposit USDC, earn yield, withdraw anytime
- ✅ **Tier System** - Top referrers can create community pools (5%/15%/30%)
- ✅ **Yield Engine** - Aave-style APY calculation with utilization curve
- ✅ **Admin Console** - APY params, fee split, emergency controls
- ✅ **Gasless DeFi** - All DeFi transactions sponsored via Paymaster

### V3.4.0 Pre-Styling Completion (Complete)
- ✅ **5-Tab Wallet** - Overview, DeFi, Rewards, History, Advanced
- ✅ **Fiat On/Off-Ramp** - Kotani Pay ZAR integration
- ✅ **Rewards System** - XP, badges, streaks, tier progression
- ✅ **Admin Panel** - Users, Bookings, Disputes, Finance, Logs, DeFi
- ✅ **Settings** - Account, Display, Notifications, Privacy, Security

### V1.0-V3.3 Foundation (Complete)
- ✅ **Smart Contracts** - Escrow + AA wallet stack + Property/Reputation registries
- ✅ **Backend API** - 130+ endpoints across all modules
- ✅ **Payment Flow** - Wallet-booking bridge with escrow integration
- ✅ **Authentication** - JWT + SIWE (Sign-In with Ethereum)
- ✅ **Full Booking Flow** - Discovery → Book → Pay → Track → Review
- ✅ **Stylist Dashboard** - Services, availability, earnings, requests
- ✅ **Property Owner** - Chair rental marketplace
- ✅ **Reputation System** - Reviews, ratings, TPS calculation

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm 8+
- PostgreSQL 14+
- Git

### Installation

```bash
# Clone repository
git clone https://github.com/your-org/vlossom-protocol.git
cd vlossom-protocol

# Install dependencies
pnpm install
```

### Database Setup

1. **Install PostgreSQL 14** from https://www.postgresql.org/download/

2. **Create database:**
   ```bash
   psql -U postgres
   CREATE DATABASE vlossom;
   \q
   ```

3. **Configure environment:**
   ```bash
   cd services/api
   cp .env.example .env
   # Edit .env and update DATABASE_URL with your PostgreSQL password
   ```

4. **Run migrations:**
   ```bash
   pnpm db:generate
   pnpm db:push
   pnpm db:studio  # Verify schema
   ```

See [docs/setup/POSTGRESQL_SETUP.md](docs/setup/POSTGRESQL_SETUP.md) for detailed instructions.

### Running Locally

**Terminal 1 - Start Hardhat Node:**
```bash
cd contracts
npx hardhat node
```

**Terminal 2 - Deploy Contracts:**
```bash
cd contracts
npx hardhat run scripts/deploy-aa.ts --network localhost
npx hardhat run scripts/deploy-escrow.ts --network localhost
```

**Terminal 3 - Start API Server:**
```bash
cd services/api
pnpm dev
```

The API will be available at http://localhost:3002

### Running Tests

```bash
cd services/api
pnpm test                # Run all tests
pnpm test:watch          # Watch mode
pnpm test:coverage       # Coverage report
```

**Current Test Coverage:**
- 161 passing tests
- 100% coverage on business logic (pricing, cancellation, state machine)

## Project Structure

```
vlossom-protocol/
├── apps/
│   └── web/                   # Next.js Frontend
│       ├── app/
│       │   ├── onboarding/    # Signup flow
│       │   ├── login/         # Authentication
│       │   ├── wallet/        # Wallet dashboard
│       │   ├── stylists/      # Stylist discovery & profiles
│       │   │   └── [id]/      # Dynamic stylist profile
│       │   └── bookings/      # My Bookings & details
│       │       └── [id]/      # Dynamic booking details
│       ├── components/
│       │   ├── ui/            # Base UI components
│       │   ├── stylists/      # Stylist cards, grid, filters
│       │   ├── booking/       # Booking dialog steps
│       │   └── bookings/      # Booking list, cards, status
│       ├── hooks/             # React Query hooks
│       └── lib/               # API clients, utilities
├── contracts/                 # Smart contracts (Hardhat)
│   ├── contracts/
│   │   ├── core/              # Escrow contract
│   │   ├── identity/          # AA wallet (VlossomAccount + Factory)
│   │   ├── paymaster/         # VlossomPaymaster
│   │   └── interfaces/        # Contract interfaces
│   ├── scripts/               # Deployment scripts
│   └── test/                  # Contract tests
├── services/
│   └── api/                   # Backend API (Express + Prisma)
│       ├── src/
│       │   ├── lib/           # Business logic
│       │   ├── routes/        # API endpoints
│       │   └── middleware/    # Auth, logging, errors
│       └── prisma/            # Database schema
└── docs/                      # Documentation
    ├── project/               # Roadmap, specs
    ├── setup/                 # Setup guides
    └── specs/                 # Feature specifications
```

## Documentation

- [Product Roadmap](docs/project/roadmap.md) - Development progress
- [Changelog](docs/project/changelog.md) - Version history
- [PostgreSQL Setup](docs/setup/POSTGRESQL_SETUP.md) - Database configuration
- [Base Sepolia Deployment](contracts/BASE_SEPOLIA_DEPLOYMENT.md) - Testnet deployment guide
- [Escrow Deployment](contracts/ESCROW_DEPLOYMENT.md) - Local deployment guide
- [API Documentation](services/api/README.md) - API endpoints reference

## Deployed Contracts

### Base Sepolia Testnet

**Core Contracts (Dec 13, 2025)**
```bash
VlossomAccountFactory:  0x1118fA7895A0b9Ae2Ed51F1BC355CFd2c606882d
VlossomPaymaster:       0x66Af4b4c3935C185F832cf2B38A88dABA22cCD8D
Escrow:                 0x925E12051A6badb09D5a8a67aF9dD40ec5725E04
USDC (Circle):          0x036CbD53842c5426634e7929541eC2318f3dCF7e
EntryPoint (v0.7):      0x0000000071727De22E5E9d8BAf0edAc6f37da032
```

**DeFi Contracts (V4.0 - Dec 16, 2025)**
```bash
# Deploy with: npx hardhat run scripts/deploy-defi.ts --network base-sepolia
# See contracts/deployments/defi-base-sepolia.json for addresses after deployment

VlossomGenesisPool:     # Protocol liquidity pool (VLP)
VlossomPoolFactory:     # Community pool deployer
VlossomTreasury:        # Fee collection
VlossomYieldEngine:     # APY calculation
VlossomSmoothingBuffer: # Instant payout support
MockUSDC:               # Testnet USDC (mintable)
```

**Basescan Links:**
- [VlossomAccountFactory](https://sepolia.basescan.org/address/0x1118fA7895A0b9Ae2Ed51F1BC355CFd2c606882d#code)
- [VlossomPaymaster](https://sepolia.basescan.org/address/0x66Af4b4c3935C185F832cf2B38A88dABA22cCD8D#code)
- [Escrow](https://sepolia.basescan.org/address/0x925E12051A6badb09D5a8a67aF9dD40ec5725E04#code)

**Deployment Stats:**
- Total Gas Used: 3,577,450
- Deployment Cost: 0.0000043 ETH
- Paymaster Funded: 0.3 ETH
- Total Cost: 0.30000429 ETH

### Localhost

```bash
Escrow:                 0x5FC8d32690cc91D4c39d9d3abcBD16989F875707
VlossomAccountFactory:  0x8A791620dd6260079BF849Dc5567aDC3F2FdC318
VlossomPaymaster:       0x610178dA211FEF7D417bC0e6FeD39F05609AD788
MockUSDC:               0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9
EntryPoint (v0.7):      0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines.

## License

MIT
