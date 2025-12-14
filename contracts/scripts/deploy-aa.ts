import { ethers, network } from "hardhat";

/**
 * Deploy script for AA Wallet contracts (VlossomAccountFactory and VlossomPaymaster)
 *
 * Usage:
 * - localhost: npx hardhat run scripts/deploy-aa.ts --network localhost
 * - Base Sepolia: npx hardhat run scripts/deploy-aa.ts --network base-sepolia
 *
 * Environment variables:
 * - DEPLOYER_PRIVATE_KEY: Private key of deployer account (required for testnets)
 * - PAYMASTER_INITIAL_DEPOSIT: Initial ETH deposit for paymaster (optional, defaults to 0.1 ETH)
 * - WHITELISTED_CONTRACTS: Comma-separated addresses to whitelist (optional)
 */

// EntryPoint v0.7 address (deployed on all chains)
const ENTRY_POINT_V07 = "0x0000000071727De22E5E9d8BAf0edAc6f37da032";

async function main() {
  console.log("\n=== Deploying AA Wallet Contracts ===\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Network:", network.name);

  // Get deployer balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH\n");

  // Verify EntryPoint exists on network, deploy mock for local
  console.log("=== Verifying EntryPoint ===\n");
  let entryPointAddress = ENTRY_POINT_V07;
  const entryPointCode = await ethers.provider.getCode(ENTRY_POINT_V07);

  if (entryPointCode === "0x") {
    if (network.name === "localhost" || network.name === "hardhat") {
      console.log("EntryPoint not found on local network");
      console.log("Deploying MockEntryPoint for local testing...");

      const MockEntryPointFactory = await ethers.getContractFactory("MockEntryPoint");
      const mockEntryPoint = await MockEntryPointFactory.deploy();
      await mockEntryPoint.waitForDeployment();
      entryPointAddress = await mockEntryPoint.getAddress();

      console.log("MockEntryPoint deployed to:", entryPointAddress, "\n");
    } else {
      throw new Error(`EntryPoint v0.7 not found at ${ENTRY_POINT_V07} on ${network.name}`);
    }
  } else {
    console.log("✓ EntryPoint v0.7 found at:", ENTRY_POINT_V07, "\n");
  }

  // Deploy VlossomAccountFactory
  console.log("=== Deploying VlossomAccountFactory ===\n");
  const FactoryContract = await ethers.getContractFactory("VlossomAccountFactory");
  const factory = await FactoryContract.deploy(entryPointAddress, deployer.address);
  await factory.waitForDeployment();

  const factoryAddress = await factory.getAddress();
  console.log("VlossomAccountFactory deployed to:", factoryAddress);

  // Verify factory deployment
  const accountImpl = await factory.accountImplementation();
  console.log("VlossomAccount implementation:", accountImpl);
  console.log("Factory owner:", await factory.owner());
  console.log("Factory EntryPoint:", await factory.entryPoint(), "\n");

  // Deploy VlossomPaymaster
  console.log("=== Deploying VlossomPaymaster ===\n");
  const PaymasterContract = await ethers.getContractFactory("VlossomPaymaster");
  const paymaster = await PaymasterContract.deploy(entryPointAddress, deployer.address);
  await paymaster.waitForDeployment();

  const paymasterAddress = await paymaster.getAddress();
  console.log("VlossomPaymaster deployed to:", paymasterAddress);

  // Verify paymaster deployment
  const [maxOps, windowSeconds] = await paymaster.getRateLimitSettings();
  console.log("Paymaster owner:", await paymaster.owner());
  console.log("Paymaster EntryPoint:", await paymaster.entryPoint());
  console.log("Rate limit:", maxOps.toString(), "ops per", (windowSeconds / 86400n).toString(), "day(s)");
  console.log("Paymaster paused:", await paymaster.paused(), "\n");

  // Optional: Fund the paymaster
  const initialDeposit = process.env.PAYMASTER_INITIAL_DEPOSIT
    ? ethers.parseEther(process.env.PAYMASTER_INITIAL_DEPOSIT)
    : ethers.parseEther("0.1");

  if (network.name !== "localhost" && network.name !== "hardhat") {
    console.log("=== Funding Paymaster ===\n");
    console.log(`Depositing ${ethers.formatEther(initialDeposit)} ETH to paymaster...`);

    const depositTx = await paymaster.deposit({ value: initialDeposit });
    await depositTx.wait();

    const paymasterBalance = await paymaster.getDeposit();
    console.log("Paymaster deposit balance:", ethers.formatEther(paymasterBalance), "ETH\n");
  }

  // Optional: Whitelist contracts
  if (process.env.WHITELISTED_CONTRACTS) {
    console.log("=== Whitelisting Contracts ===\n");
    const contracts = process.env.WHITELISTED_CONTRACTS.split(",").map((s) => s.trim());

    for (const contractAddress of contracts) {
      if (ethers.isAddress(contractAddress)) {
        const tx = await paymaster.setWhitelistedTarget(contractAddress, true);
        await tx.wait();
        console.log("✓ Whitelisted:", contractAddress);
      } else {
        console.log("⚠️  Invalid address, skipping:", contractAddress);
      }
    }
    console.log();
  }

  // Log deployment summary
  console.log("=== Deployment Summary ===\n");

  const deploymentInfo = {
    network: network.name,
    chainId: (await ethers.provider.getNetwork()).chainId.toString(),
    entryPoint: entryPointAddress,
    factory: {
      address: factoryAddress,
      implementation: accountImpl,
      owner: await factory.owner(),
    },
    paymaster: {
      address: paymasterAddress,
      owner: await paymaster.owner(),
      rateLimit: {
        maxOps: maxOps.toString(),
        windowSeconds: windowSeconds.toString(),
      },
      paused: await paymaster.paused(),
    },
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
  };

  console.log(JSON.stringify(deploymentInfo, null, 2));

  // Post-deployment instructions
  console.log("\n=== Post-Deployment Steps ===\n");
  console.log("1. Update backend configuration:");
  console.log(`   ACCOUNT_FACTORY_ADDRESS=${factoryAddress}`);
  console.log(`   PAYMASTER_ADDRESS=${paymasterAddress}`);
  console.log(`   ENTRY_POINT_ADDRESS=${entryPointAddress}`);

  console.log("\n2. Whitelist Vlossom contracts for gas sponsorship:");
  console.log("   await paymaster.setWhitelistedTarget(ESCROW_ADDRESS, true)");
  console.log("   await paymaster.setWhitelistedTarget(OTHER_CONTRACT, true)");

  console.log("\n3. Fund the paymaster for gas sponsorship:");
  console.log("   await paymaster.deposit({ value: ethers.parseEther('1.0') })");

  console.log("\n4. Adjust rate limiting if needed:");
  console.log("   await paymaster.setRateLimit(100, 86400) // 100 ops per day");

  console.log("\n5. Emergency controls (owner only):");
  console.log("   await paymaster.pause()   // Stop gas sponsorship");
  console.log("   await paymaster.unpause() // Resume sponsorship");

  // Verification commands
  if (network.name !== "localhost" && network.name !== "hardhat") {
    console.log("\n=== Contract Verification ===\n");
    console.log("To verify on Basescan, run:");
    console.log(
      `npx hardhat verify --network ${network.name} ${factoryAddress} "${entryPointAddress}" "${deployer.address}"`
    );
    console.log(
      `npx hardhat verify --network ${network.name} ${paymasterAddress} "${entryPointAddress}" "${deployer.address}"`
    );
  }

  console.log("\n=== Deployment Complete ===\n");

  return deploymentInfo;
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
