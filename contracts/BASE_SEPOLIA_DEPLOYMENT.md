# Base Sepolia Deployment Guide

**Deployment Date:** December 13, 2025
**Network:** Base Sepolia Testnet
**Chain ID:** 84532

## Deployed Contracts

| Contract | Address | Basescan |
|----------|---------|----------|
| **VlossomAccountFactory** | `0x1118fA7895A0b9Ae2Ed51F1BC355CFd2c606882d` | [View](https://sepolia.basescan.org/address/0x1118fA7895A0b9Ae2Ed51F1BC355CFd2c606882d#code) |
| **VlossomPaymaster** | `0x66Af4b4c3935C185F832cf2B38A88dABA22cCD8D` | [View](https://sepolia.basescan.org/address/0x66Af4b4c3935C185F832cf2B38A88dABA22cCD8D#code) |
| **Escrow** | `0x925E12051A6badb09D5a8a67aF9dD40ec5725E04` | [View](https://sepolia.basescan.org/address/0x925E12051A6badb09D5a8a67aF9dD40ec5725E04#code) |
| **EntryPoint (v0.7)** | `0x0000000071727De22E5E9d8BAf0edAc6f37da032` | [View](https://sepolia.basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032) |
| **USDC (Circle)** | `0x036CbD53842c5426634e7929541eC2318f3dCF7e` | [View](https://sepolia.basescan.org/address/0x036CbD53842c5426634e7929541eC2318f3dCF7e) |

## Deployment Summary

### Gas Usage

| Contract | Gas Used | Cost (ETH) |
|----------|----------|------------|
| VlossomAccountFactory | 1,843,338 | 0.0000022 |
| VlossomPaymaster | 932,020 | 0.0000011 |
| Escrow | 802,092 | 0.00000097 |
| **Total** | **3,577,450** | **0.0000043** |

### Costs

- **Deployment Cost:** 0.0000043 ETH (~$0.01 USD)
- **Paymaster Funding:** 0.3 ETH
- **Total Cost:** 0.30000429 ETH
- **Remaining Balance:** 2.19999564 ETH (from initial 2.5 ETH)

## Contract Details

### VlossomAccountFactory

**Purpose:** Creates smart contract wallets (ERC-4337 accounts) for users

**Constructor Parameters:**
- `entryPoint`: `0x0000000071727De22E5E9d8BAf0edAc6f37da032`
- `initialOwner`: `0x65AfAFb64ccdefb29EfC67B2eD323c4e43315895`

**Key Functions:**
- `createAccount(address owner, uint256 salt)` - Create new smart wallet
- `getAddress(address owner, uint256 salt)` - Get deterministic wallet address

### VlossomPaymaster

**Purpose:** Sponsors gas fees for user operations (gasless transactions)

**Constructor Parameters:**
- `entryPoint`: `0x0000000071727De22E5E9d8BAf0edAc6f37da032`
- `initialOwner`: `0x65AfAFb64ccdefb29EfC67B2eD323c4e43315895`

**Current Balance:** 0.3 ETH

**Key Functions:**
- `deposit()` - Add ETH to sponsor gas
- `withdraw(address payable withdrawAddress, uint256 amount)` - Withdraw funds (owner only)
- `setWhitelistedTarget(address target, bool allowed)` - Manage whitelisted contracts

**Monitoring:**
- Monitor balance at: https://sepolia.basescan.org/address/0x66Af4b4c3935C185F832cf2B38A88dABA22cCD8D
- Alert if balance < 0.1 ETH
- Top up when needed via `deposit()` function

### Escrow

**Purpose:** Holds USDC during booking lifecycle with time-locked release

**Constructor Parameters:**
- `_usdc`: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`
- `_initialOwner`: `0x65AfAFb64ccdefb29EfC67B2eD323c4e43315895`
- `_initialRelayer`: `0x65AfAFb64ccdefb29EfC67B2eD323c4e43315895`

**Key Functions:**
- `lockFunds(uint256 bookingId, address customer, address stylist, ...)` - Lock USDC
- `releaseToStylist(uint256 bookingId)` - Release funds to stylist
- `releaseToBoth(uint256 bookingId)` - Partial release (split payments)
- `refundToCustomer(uint256 bookingId, uint256 refundAmount)` - Refund customer

## Configuration

### Environment Variables

Update `services/api/.env` or use `.env.base-sepolia`:

```bash
# Blockchain Configuration (Base Sepolia)
CHAIN_ID=84532
RPC_URL="https://base-sepolia.g.alchemy.com/v2/YOUR_API_KEY"

# Smart Contract Addresses
ENTRY_POINT_ADDRESS="0x0000000071727De22E5E9d8BAf0edAc6f37da032"
FACTORY_ADDRESS="0x1118fA7895A0b9Ae2Ed51F1BC355CFd2c606882d"
PAYMASTER_ADDRESS="0x66Af4b4c3935C185F832cf2B38A88dABA22cCD8D"
ESCROW_ADDRESS="0x925E12051A6badb09D5a8a67aF9dD40ec5725E04"
USDC_ADDRESS="0x036CbD53842c5426634e7929541eC2318f3dCF7e"

# Relayer Configuration
RELAYER_PRIVATE_KEY="YOUR_PRIVATE_KEY"
```

### Hardhat Configuration

The deployment was done using:

```typescript
// hardhat.config.ts
networks: {
  "base-sepolia": {
    url: process.env.BASE_SEPOLIA_RPC_URL,
    accounts: [process.env.DEPLOYER_PRIVATE_KEY],
    chainId: 84532,
  }
}
```

## Verification

All contracts are verified on Basescan with full source code visibility.

**Verify a contract manually:**

```bash
npx hardhat verify --network base-sepolia <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
```

**Examples:**

```bash
# VlossomAccountFactory
npx hardhat verify --network base-sepolia \
  0x1118fA7895A0b9Ae2Ed51F1BC355CFd2c606882d \
  0x0000000071727De22E5E9d8BAf0edAc6f37da032 \
  0x65AfAFb64ccdefb29EfC67B2eD323c4e43315895

# VlossomPaymaster
npx hardhat verify --network base-sepolia \
  0x66Af4b4c3935C185F832cf2B38A88dABA22cCD8D \
  0x0000000071727De22E5E9d8BAf0edAc6f37da032 \
  0x65AfAFb64ccdefb29EfC67B2eD323c4e43315895

# Escrow
npx hardhat verify --network base-sepolia \
  0x925E12051A6badb09D5a8a67aF9dD40ec5725E04 \
  0x036CbD53842c5426634e7929541eC2318f3dCF7e \
  0x65AfAFb64ccdefb29EfC67B2eD323c4e43315895 \
  0x65AfAFb64ccdefb29EfC67B2eD323c4e43315895
```

## Testing on Base Sepolia

### Get Test ETH

Get Base Sepolia ETH from:
- https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet
- https://www.alchemy.com/faucets/base-sepolia

### Get Test USDC

The USDC contract at `0x036CbD53842c5426634e7929541eC2318f3dCF7e` is Circle's official testnet deployment.

Get test USDC:
1. Bridge from Ethereum Sepolia using Base bridge
2. Swap testnet ETH for USDC on testnet DEXs

### Create a Test Booking

1. **Create smart wallet:**
   ```typescript
   const factory = await ethers.getContractAt(
     "VlossomAccountFactory",
     "0x1118fA7895A0b9Ae2Ed51F1BC355CFd2c606882d"
   );
   await factory.createAccount(userAddress, 0);
   ```

2. **Approve USDC to Escrow:**
   ```typescript
   const usdc = await ethers.getContractAt("IERC20", "0x036CbD53842c5426634e7929541eC2318f3dCF7e");
   await usdc.approve("0x925E12051A6badb09D5a8a67aF9dD40ec5725E04", amount);
   ```

3. **Lock funds:**
   ```typescript
   const escrow = await ethers.getContractAt("Escrow", "0x925E12051A6badb09D5a8a67aF9dD40ec5725E04");
   await escrow.lockFunds(bookingId, customer, stylist, ...);
   ```

## Monitoring

### Paymaster Balance

Monitor the Paymaster balance to ensure it can sponsor transactions:

- **Current Balance:** 0.3 ETH
- **Minimum Alert Threshold:** 0.1 ETH
- **Monitor URL:** https://sepolia.basescan.org/address/0x66Af4b4c3935C185F832cf2B38A88dABA22cCD8D

**Check balance via ethers:**

```typescript
const paymaster = await ethers.getContractAt(
  "VlossomPaymaster",
  "0x66Af4b4c3935C185F832cf2B38A88dABA22cCD8D"
);
const balance = await paymaster.getDeposit();
console.log("Paymaster balance:", ethers.formatEther(balance), "ETH");
```

**Top up Paymaster:**

```typescript
await paymaster.deposit({ value: ethers.parseEther("0.5") });
```

### Transaction Monitoring

Monitor all transactions:
- Factory: https://sepolia.basescan.org/address/0x1118fA7895A0b9Ae2Ed51F1BC355CFd2c606882d
- Paymaster: https://sepolia.basescan.org/address/0x66Af4b4c3935C185F832cf2B38A88dABA22cCD8D
- Escrow: https://sepolia.basescan.org/address/0x925E12051A6badb09D5a8a67aF9dD40ec5725E04

## Deployment Files

- **Deployment Addresses:** `contracts/deployments/base-sepolia.json`
- **Deployment Script:** `contracts/scripts/deploy-base-sepolia.ts`
- **Environment Config:** `contracts/.env`
- **API Config:** `services/api/.env.base-sepolia`

## Security Considerations

### Testnet Only

⚠️ **WARNING:** These contracts are deployed on a testnet with testnet credentials. DO NOT use for production or real funds.

### Private Keys

The deployer and relayer private keys in `.env` files are for testnet only. For mainnet deployment:

1. Use a hardware wallet or secure key management system
2. Never commit private keys to git
3. Use different keys for deployer and relayer roles
4. Rotate keys regularly

### Contract Upgrades

The deployed contracts are **NOT upgradeable**. Any changes require a new deployment.

## Troubleshooting

### Insufficient Paymaster Balance

If UserOps fail with "AA31 paymaster deposit too low":

```bash
cd contracts
npx hardhat run scripts/fund-paymaster.ts --network base-sepolia
```

### RPC Rate Limits

If you hit Alchemy rate limits, upgrade your plan or use multiple RPC endpoints in a fallback configuration.

### USDC Approval Issues

Ensure USDC approval is done before calling `lockFunds`:

```typescript
// Check allowance
const allowance = await usdc.allowance(customer, escrowAddress);
if (allowance < amount) {
  await usdc.approve(escrowAddress, ethers.MaxUint256);
}
```

## Next Steps

1. **Frontend Integration:** Update frontend to use Base Sepolia network
2. **Testing:** Comprehensive end-to-end testing on testnet
3. **Monitoring Setup:** Set up alerts for Paymaster balance
4. **Audit:** Security audit before mainnet deployment
5. **Mainnet Deployment:** Deploy to Base mainnet after successful testing

## Support

- **Base Documentation:** https://docs.base.org
- **ERC-4337 Docs:** https://docs.alchemy.com/docs/account-abstraction-overview
- **Basescan Support:** https://basescan.org/contactus

---

**Deployed by:** 0x65AfAFb64ccdefb29EfC67B2eD323c4e43315895
**Deployment Transaction:** See `contracts/deployments/base-sepolia.json` for transaction hashes
