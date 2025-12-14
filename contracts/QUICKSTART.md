# Escrow Contract Quick Start Guide

Get the Vlossom Escrow contract up and running in 5 minutes.

## Step 1: Install Dependencies

```bash
cd contracts
pnpm install
```

## Step 2: Compile Contracts

```bash
pnpm compile
```

Expected output:
```
Compiled 5 Solidity files successfully
```

## Step 3: Run Tests

```bash
pnpm test
```

Expected output:
```
  Escrow
    Deployment
      ✓ Should set the correct USDC token address
      ✓ Should set the correct owner
      ✓ Should set the correct relayer
      ✓ Should revert if USDC address is zero
    ... (38 tests total)

  38 passing
```

## Step 4: Deploy Locally

### Terminal 1: Start Hardhat Node
```bash
pnpm node
```

### Terminal 2: Deploy
```bash
pnpm run deploy:local
```

Save the output:
```
Escrow deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
MockUSDC deployed to: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
```

## Step 5: Test Integration (Optional)

```bash
npx hardhat console --network localhost
```

```javascript
// Get contracts
const Escrow = await ethers.getContractFactory("Escrow");
const MockUSDC = await ethers.getContractFactory("MockUSDC");

const escrow = await Escrow.attach("0x5FbDB2315678afecb367f032d93F642f64180aa3");
const usdc = await MockUSDC.attach("0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512");

// Get signers
const [owner, customer, stylist, treasury] = await ethers.getSigners();

// Set relayer
await escrow.setRelayer(owner.address);

// Mint USDC to customer
const amount = ethers.parseUnits("100", 6); // 100 USDC
await usdc.mint(customer.address, amount);

// Approve and lock funds
await usdc.connect(customer).approve(await escrow.getAddress(), amount);
const bookingId = ethers.id("test-booking-1");
await escrow.connect(customer).lockFunds(bookingId, amount);

// Check balance
const balance = await escrow.getEscrowBalance(bookingId);
console.log("Locked:", ethers.formatUnits(balance, 6), "USDC");

// Release funds (as relayer/owner)
const stylistAmount = ethers.parseUnits("90", 6);
const feeAmount = ethers.parseUnits("10", 6);
await escrow.releaseFunds(
  bookingId,
  stylist.address,
  stylistAmount,
  treasury.address,
  feeAmount
);

// Verify balances
console.log("Stylist:", ethers.formatUnits(await usdc.balanceOf(stylist.address), 6), "USDC");
console.log("Treasury:", ethers.formatUnits(await usdc.balanceOf(treasury.address), 6), "USDC");
```

## Common Commands

```bash
# Compile contracts
pnpm compile

# Run all tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run tests with gas reporting
REPORT_GAS=true pnpm test

# Clean build artifacts
pnpm clean

# Start local node
pnpm node

# Deploy to local network
pnpm run deploy:local

# Deploy to Base Sepolia
pnpm run deploy:testnet

# Type check TypeScript
pnpm typecheck
```

## Next Steps

1. **Read Documentation:**
   - `contracts/core/README.md` - Contract details
   - `ESCROW_DEPLOYMENT.md` - Production deployment
   - `IMPLEMENTATION_SUMMARY.md` - Technical overview

2. **Deploy to Testnet:**
   ```bash
   # Set environment variables
   export DEPLOYER_PRIVATE_KEY="0x..."
   export BASESCAN_API_KEY="..."

   # Deploy
   pnpm run deploy:testnet
   ```

3. **Integrate with Backend:**
   - Install typechain types: `@vlossom/contracts`
   - Use `Escrow__factory` for type-safe interactions
   - Set up relayer wallet and private key

4. **Set Up Monitoring:**
   - Listen to contract events
   - Monitor relayer gas balance
   - Track escrow vs. database state

## Troubleshooting

### "Cannot find module '@nomicfoundation/hardhat-toolbox'"
```bash
pnpm install
```

### "Insufficient funds for gas"
Make sure your wallet has ETH on the target network.

### "UnauthorizedCaller" error
Set the relayer address:
```javascript
await escrow.setRelayer(relayerAddress);
```

### Tests failing
```bash
pnpm clean
pnpm compile
pnpm test
```

## Resources

- Hardhat: https://hardhat.org
- OpenZeppelin: https://docs.openzeppelin.com
- Base: https://docs.base.org
- TypeChain: https://github.com/dethcrypto/TypeChain

## Support

For issues or questions:
1. Check `ESCROW_DEPLOYMENT.md` troubleshooting section
2. Review test cases in `test/Escrow.test.ts`
3. Consult contract documentation in `contracts/core/README.md`

---

Happy Building! 🚀
