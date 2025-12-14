# Escrow Contract Deployment Guide

Quick reference for deploying and verifying the Vlossom Escrow contract.

## Pre-Deployment Checklist

- [ ] Node.js and pnpm installed
- [ ] Dependencies installed (`pnpm install`)
- [ ] Contracts compiled (`pnpm compile`)
- [ ] Tests passing (`pnpm test`)
- [ ] Deployer wallet funded with gas
- [ ] Environment variables configured (see below)

## Environment Variables

Create `.env` file in `contracts/` directory:

```bash
# Required for testnet/mainnet deployment
DEPLOYER_PRIVATE_KEY=your_private_key_here

# Optional: Custom USDC address
USDC_ADDRESS=0x...

# Required for contract verification
BASESCAN_API_KEY=your_basescan_api_key

# Optional: Custom RPC URLs
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
BASE_RPC_URL=https://mainnet.base.org
```

## Deployment Commands

### Local Development
```bash
# Start local Hardhat node
pnpm node

# In separate terminal, deploy
pnpm run deploy:local
```

### Base Sepolia Testnet
```bash
pnpm run deploy:testnet
```

### Base Mainnet (Production)
```bash
# Custom script for mainnet
npx hardhat run scripts/deploy-escrow.ts --network base
```

## USDC Addresses

| Network | USDC Address |
|---------|-------------|
| Base Mainnet | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` |
| Base Sepolia | `0x036CbD53842c5426634e7929541eC2318f3dCF7e` |
| Localhost | Auto-deployed MockUSDC |

## Post-Deployment Steps

### 1. Verify Contract on Basescan

```bash
npx hardhat verify --network base-sepolia \
  <ESCROW_ADDRESS> \
  "<USDC_ADDRESS>" \
  "<OWNER_ADDRESS>"
```

### 2. Set Relayer Address

**Option A: Via Hardhat Console**
```bash
npx hardhat console --network base-sepolia
```
```javascript
const Escrow = await ethers.getContractFactory("Escrow");
const escrow = await Escrow.attach("ESCROW_ADDRESS");
await escrow.setRelayer("BACKEND_RELAYER_ADDRESS");
```

**Option B: Via Custom Script**
```typescript
// scripts/set-relayer.ts
const escrow = await ethers.getContractAt("Escrow", escrowAddress);
const tx = await escrow.setRelayer(relayerAddress);
await tx.wait();
console.log("Relayer set to:", relayerAddress);
```

### 3. Fund Relayer Wallet

The backend relayer needs ETH for gas to call `releaseFunds()` and `refund()`.

**Recommended amounts:**
- Base Sepolia: 0.1 ETH (for testing)
- Base Mainnet: 0.5 ETH (initial funding)

### 4. Update Backend Configuration

Add to backend `.env`:
```bash
ESCROW_CONTRACT_ADDRESS=0x...
ESCROW_RELAYER_PRIVATE_KEY=...
USDC_CONTRACT_ADDRESS=0x...
```

### 5. Verify Integration

Run integration tests:
```bash
# In backend directory
npm test -- escrow.integration.test.ts
```

## Testing on Testnet

### 1. Get Testnet USDC

**Base Sepolia USDC:**
- Use Uniswap Sepolia faucet or
- Bridge from Ethereum Sepolia

### 2. Test Customer Flow

```typescript
// Approve escrow
await usdc.approve(escrowAddress, amount);

// Lock funds
const bookingId = ethers.id("test-booking-123");
await escrow.lockFunds(bookingId, amount);

// Verify
const balance = await escrow.getEscrowBalance(bookingId);
console.log("Locked:", balance.toString());
```

### 3. Test Settlement Flow

```typescript
// As relayer
await escrow.releaseFunds(
  bookingId,
  stylistAddress,
  stylistAmount,
  treasuryAddress,
  platformFeeAmount
);
```

### 4. Test Refund Flow

```typescript
// As relayer
await escrow.refund(
  bookingId,
  refundAmount,
  customerAddress
);
```

## Monitoring & Maintenance

### Event Monitoring

Set up event listeners for:
- `FundsLocked` - New bookings
- `FundsReleased` - Successful settlements
- `FundsRefunded` - Refunds processed
- `RelayerUpdated` - Security-critical config changes

### Health Checks

Monitor:
- Relayer wallet balance (gas)
- Escrow USDC balance vs. database records
- Failed transactions (out of gas, reverts)
- Unusual patterns (high refund rate)

### Emergency Procedures

**If relayer is compromised:**
1. Deploy new relayer wallet
2. Call `setRelayer()` with new address
3. Fund new relayer
4. Update backend config
5. Rotate old keys

**If owner is compromised:**
- Transfer ownership immediately
- No funds are at risk (escrow is trustless)
- Relayer can still operate normally

## Gas Estimates

Approximate gas costs on Base:

| Function | Gas Used | Cost @ 0.001 gwei |
|----------|----------|-------------------|
| lockFunds | ~65,000 | <$0.01 |
| releaseFunds | ~75,000 | <$0.01 |
| refund | ~50,000 | <$0.01 |
| setRelayer | ~45,000 | <$0.01 |

**Note:** Customer `lockFunds` is gasless via Paymaster in production.

## Troubleshooting

### Deployment Fails

**Error:** "Insufficient funds for gas"
- **Solution:** Fund deployer wallet with more ETH

**Error:** "USDC address not found"
- **Solution:** Set `USDC_ADDRESS` environment variable

### Verification Fails

**Error:** "Already verified"
- **Solution:** Contract already verified, no action needed

**Error:** "Invalid constructor arguments"
- **Solution:** Check USDC and owner addresses in verify command

### Transaction Reverts

**Error:** "UnauthorizedCaller"
- **Solution:** Ensure relayer address is set and caller is relayer

**Error:** "InvalidAmount"
- **Solution:** Amount must be > 0

**Error:** "BookingAlreadyExists"
- **Solution:** Each bookingId can only be used once

**Error:** "AmountMismatch"
- **Solution:** `stylistAmount + platformFeeAmount` must equal locked amount

## Security Reminders

- [ ] Never commit private keys to git
- [ ] Store deployer key in hardware wallet or secure vault
- [ ] Rotate relayer keys regularly
- [ ] Monitor relayer activity for anomalies
- [ ] Keep OpenZeppelin dependencies updated
- [ ] Run security audit before mainnet launch
- [ ] Test upgrade procedures on testnet first
- [ ] Document all contract interactions
- [ ] Set up alerting for large withdrawals
- [ ] Maintain separate staging and production environments

## Support & Resources

- **Hardhat Docs:** https://hardhat.org/docs
- **OpenZeppelin Contracts:** https://docs.openzeppelin.com/contracts
- **Base Docs:** https://docs.base.org
- **Basescan:** https://basescan.org / https://sepolia.basescan.org

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-12-13 | Initial escrow implementation |

---

**Last Updated:** 2025-12-13
**Maintained By:** Vlossom Protocol Team
