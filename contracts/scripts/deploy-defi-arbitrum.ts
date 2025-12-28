// DeFi Contracts Deployment Script for Arbitrum Sepolia
// This script:
// 1. Uses existing USDC on Arbitrum Sepolia
// 2. Deploys all DeFi contracts
// 3. Configures contract relationships
// 4. Saves deployment addresses

import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

// Configuration for Arbitrum Sepolia
const USDC_ADDRESS = "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d"; // Arbitrum Sepolia USDC
const MIN_BUFFER_THRESHOLD = 500n * 1_000_000n; // $500 USDC minimum buffer threshold

interface DefiDeploymentAddresses {
  network: string;
  chainId: number;
  timestamp: string;
  deployer: string;
  usdc: string;
  treasury: string;
  yieldEngine: string;
  genesisPool: string;
  smoothingBuffer: string;
  communityPoolImpl: string;
  poolFactory: string;
  gasUsed: {
    treasury: string;
    yieldEngine: string;
    genesisPool: string;
    smoothingBuffer: string;
    communityPoolImpl: string;
    poolFactory: string;
    total: string;
  };
  ethSpent: string;
}

async function main() {
  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log("║  Vlossom Protocol - DeFi Contracts (Arbitrum Sepolia)      ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");

  // Get signer
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();

  console.log("📍 Network:", network.name);
  console.log("🔗 Chain ID:", network.chainId.toString());
  console.log("👤 Deployer:", deployer.address);

  // Verify we're on Arbitrum Sepolia
  if (network.chainId !== 421614n) {
    throw new Error("❌ Wrong network! Expected Arbitrum Sepolia (421614)");
  }

  // Check balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Balance:", ethers.formatEther(balance), "ETH");

  if (balance < ethers.parseEther("0.05")) {
    throw new Error("❌ Insufficient balance! Need at least 0.05 ETH");
  }

  // Get current gas price
  const feeData = await ethers.provider.getFeeData();
  const gasPrice = feeData.gasPrice || ethers.parseUnits("0.1", "gwei");
  console.log("⛽ Current Gas Price:", ethers.formatUnits(gasPrice, "gwei"), "Gwei\n");

  const gasUsed: Record<string, bigint> = {};

  // ============================================================================
  // STEP 1: Deploy Treasury
  // ============================================================================

  console.log("═══════════════════════════════════════════════════════════");
  console.log("🏛️ STEP 1: Deploying VlossomTreasury");
  console.log("═══════════════════════════════════════════════════════════\n");

  const VlossomTreasury = await ethers.getContractFactory("VlossomTreasury");
  const treasury = await VlossomTreasury.deploy(
    USDC_ADDRESS,
    deployer.address,  // admin
    deployer.address   // operations wallet (use deployer for testnet)
  );
  await treasury.waitForDeployment();
  const treasuryAddress = await treasury.getAddress();
  const treasuryReceipt = await ethers.provider.getTransactionReceipt(treasury.deploymentTransaction()!.hash);
  gasUsed.treasury = treasuryReceipt!.gasUsed;
  console.log("   ✅ Treasury deployed at:", treasuryAddress);
  console.log(`   ⛽ Gas used: ${gasUsed.treasury.toLocaleString()}\n`);

  // ============================================================================
  // STEP 2: Deploy Yield Engine
  // ============================================================================

  console.log("═══════════════════════════════════════════════════════════");
  console.log("📈 STEP 2: Deploying VlossomYieldEngine");
  console.log("═══════════════════════════════════════════════════════════\n");

  const VlossomYieldEngine = await ethers.getContractFactory("VlossomYieldEngine");
  const yieldEngine = await VlossomYieldEngine.deploy(deployer.address);
  await yieldEngine.waitForDeployment();
  const yieldEngineAddress = await yieldEngine.getAddress();
  const yieldEngineReceipt = await ethers.provider.getTransactionReceipt(yieldEngine.deploymentTransaction()!.hash);
  gasUsed.yieldEngine = yieldEngineReceipt!.gasUsed;
  console.log("   ✅ YieldEngine deployed at:", yieldEngineAddress);
  console.log(`   ⛽ Gas used: ${gasUsed.yieldEngine.toLocaleString()}\n`);

  // ============================================================================
  // STEP 3: Deploy Genesis Pool (VLP)
  // ============================================================================

  console.log("═══════════════════════════════════════════════════════════");
  console.log("🌟 STEP 3: Deploying VlossomGenesisPool (VLP)");
  console.log("═══════════════════════════════════════════════════════════\n");

  const VlossomGenesisPool = await ethers.getContractFactory("VlossomGenesisPool");
  const genesisPool = await VlossomGenesisPool.deploy(
    USDC_ADDRESS,
    deployer.address,  // admin
    "Vlossom Liquidity Pool"  // name
  );
  await genesisPool.waitForDeployment();
  const genesisPoolAddress = await genesisPool.getAddress();
  const genesisPoolReceipt = await ethers.provider.getTransactionReceipt(genesisPool.deploymentTransaction()!.hash);
  gasUsed.genesisPool = genesisPoolReceipt!.gasUsed;
  console.log("   ✅ GenesisPool deployed at:", genesisPoolAddress);
  console.log(`   ⛽ Gas used: ${gasUsed.genesisPool.toLocaleString()}\n`);

  // ============================================================================
  // STEP 4: Deploy Smoothing Buffer
  // ============================================================================

  console.log("═══════════════════════════════════════════════════════════");
  console.log("🔄 STEP 4: Deploying VlossomSmoothingBuffer");
  console.log("═══════════════════════════════════════════════════════════\n");

  const VlossomSmoothingBuffer = await ethers.getContractFactory("VlossomSmoothingBuffer");
  const smoothingBuffer = await VlossomSmoothingBuffer.deploy(
    USDC_ADDRESS,
    deployer.address,  // admin
    MIN_BUFFER_THRESHOLD
  );
  await smoothingBuffer.waitForDeployment();
  const smoothingBufferAddress = await smoothingBuffer.getAddress();
  const smoothingBufferReceipt = await ethers.provider.getTransactionReceipt(smoothingBuffer.deploymentTransaction()!.hash);
  gasUsed.smoothingBuffer = smoothingBufferReceipt!.gasUsed;
  console.log("   ✅ SmoothingBuffer deployed at:", smoothingBufferAddress);
  console.log(`   ⛽ Gas used: ${gasUsed.smoothingBuffer.toLocaleString()}\n`);

  // ============================================================================
  // STEP 5: Deploy Community Pool Implementation
  // ============================================================================

  console.log("═══════════════════════════════════════════════════════════");
  console.log("👥 STEP 5: Deploying VlossomCommunityPool (Implementation)");
  console.log("═══════════════════════════════════════════════════════════\n");

  const VlossomCommunityPool = await ethers.getContractFactory("VlossomCommunityPool");
  const communityPoolImpl = await VlossomCommunityPool.deploy();
  await communityPoolImpl.waitForDeployment();
  const communityPoolImplAddress = await communityPoolImpl.getAddress();
  const communityPoolImplReceipt = await ethers.provider.getTransactionReceipt(communityPoolImpl.deploymentTransaction()!.hash);
  gasUsed.communityPoolImpl = communityPoolImplReceipt!.gasUsed;
  console.log("   ✅ CommunityPool Implementation deployed at:", communityPoolImplAddress);
  console.log(`   ⛽ Gas used: ${gasUsed.communityPoolImpl.toLocaleString()}\n`);

  // ============================================================================
  // STEP 6: Deploy Pool Factory
  // ============================================================================

  console.log("═══════════════════════════════════════════════════════════");
  console.log("🏭 STEP 6: Deploying VlossomPoolFactory");
  console.log("═══════════════════════════════════════════════════════════\n");

  const VlossomPoolFactory = await ethers.getContractFactory("VlossomPoolFactory");
  const poolFactory = await VlossomPoolFactory.deploy(
    USDC_ADDRESS,
    communityPoolImplAddress,
    treasuryAddress,
    deployer.address  // admin
  );
  await poolFactory.waitForDeployment();
  const poolFactoryAddress = await poolFactory.getAddress();
  const poolFactoryReceipt = await ethers.provider.getTransactionReceipt(poolFactory.deploymentTransaction()!.hash);
  gasUsed.poolFactory = poolFactoryReceipt!.gasUsed;
  console.log("   ✅ PoolFactory deployed at:", poolFactoryAddress);
  console.log(`   ⛽ Gas used: ${gasUsed.poolFactory.toLocaleString()}\n`);

  // ============================================================================
  // STEP 7: Configure Contract Relationships
  // ============================================================================

  console.log("═══════════════════════════════════════════════════════════");
  console.log("🔗 STEP 7: Configuring Contract Relationships");
  console.log("═══════════════════════════════════════════════════════════\n");

  // Configure Treasury
  console.log("   📝 Setting Treasury addresses...");
  const setAddressesTx = await treasury.setAddresses(
    genesisPoolAddress,
    smoothingBufferAddress,
    deployer.address  // operations wallet
  );
  await setAddressesTx.wait();
  console.log("   ✅ Treasury addresses configured\n");

  // Configure SmoothingBuffer
  console.log("   📝 Setting SmoothingBuffer addresses...");
  const setBufferAddressesTx = await smoothingBuffer.setAddresses(
    genesisPoolAddress,
    treasuryAddress
  );
  await setBufferAddressesTx.wait();
  console.log("   ✅ SmoothingBuffer addresses configured\n");

  // Register Genesis Pool in Yield Engine
  console.log("   📝 Registering Genesis Pool in YieldEngine...");
  const registerPoolTx = await yieldEngine.registerPool(genesisPoolAddress);
  await registerPoolTx.wait();
  console.log("   ✅ Genesis Pool registered\n");

  // Grant YIELD_DISTRIBUTOR_ROLE to Treasury on GenesisPool
  console.log("   📝 Granting yield distributor role to Treasury...");
  const YIELD_DISTRIBUTOR_ROLE = await genesisPool.YIELD_DISTRIBUTOR_ROLE();
  const grantRoleTx = await genesisPool.grantRole(YIELD_DISTRIBUTOR_ROLE, treasuryAddress);
  await grantRoleTx.wait();
  console.log("   ✅ Treasury granted yield distributor role\n");

  // ============================================================================
  // Calculate Totals and Save
  // ============================================================================

  const totalGas = Object.values(gasUsed).reduce((sum, g) => sum + g, 0n);
  const totalCost = totalGas * gasPrice;
  const finalBalance = await ethers.provider.getBalance(deployer.address);

  console.log("═══════════════════════════════════════════════════════════");
  console.log("📊 Deployment Summary");
  console.log("═══════════════════════════════════════════════════════════\n");
  console.log(`Total Gas Used: ${totalGas.toLocaleString()}`);
  console.log(`Total ETH Spent: ${ethers.formatEther(totalCost)} ETH`);
  console.log(`Final Balance: ${ethers.formatEther(finalBalance)} ETH\n`);

  // Save deployment addresses
  const deployment: DefiDeploymentAddresses = {
    network: "arbitrum-sepolia",
    chainId: Number(network.chainId),
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    usdc: USDC_ADDRESS,
    treasury: treasuryAddress,
    yieldEngine: yieldEngineAddress,
    genesisPool: genesisPoolAddress,
    smoothingBuffer: smoothingBufferAddress,
    communityPoolImpl: communityPoolImplAddress,
    poolFactory: poolFactoryAddress,
    gasUsed: {
      treasury: gasUsed.treasury.toString(),
      yieldEngine: gasUsed.yieldEngine.toString(),
      genesisPool: gasUsed.genesisPool.toString(),
      smoothingBuffer: gasUsed.smoothingBuffer.toString(),
      communityPoolImpl: gasUsed.communityPoolImpl.toString(),
      poolFactory: gasUsed.poolFactory.toString(),
      total: totalGas.toString(),
    },
    ethSpent: ethers.formatEther(totalCost),
  };

  // Create deployments directory if it doesn't exist
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  // Save deployment file
  const deploymentFile = path.join(deploymentsDir, "defi-arbitrum-sepolia.json");
  fs.writeFileSync(deploymentFile, JSON.stringify(deployment, null, 2));
  console.log("   ✅ Saved to:", deploymentFile, "\n");

  // ============================================================================
  // Configure Paymaster Whitelist
  // ============================================================================

  const coreDeploymentPath = path.join(deploymentsDir, "arbitrum-sepolia.json");

  if (fs.existsSync(coreDeploymentPath)) {
    console.log("═══════════════════════════════════════════════════════════");
    console.log("💳 STEP 8: Configuring Paymaster DeFi Whitelist");
    console.log("═══════════════════════════════════════════════════════════\n");

    const coreDeployment = JSON.parse(fs.readFileSync(coreDeploymentPath, "utf-8"));
    const paymasterAddress = coreDeployment.vlossomPaymaster;

    if (paymasterAddress) {
      console.log("   📌 Paymaster found:", paymasterAddress);

      const paymaster = await ethers.getContractAt("VlossomPaymaster", paymasterAddress);

      // Whitelist DeFi contracts
      const defiContractsToWhitelist = [
        { name: "GenesisPool", address: genesisPoolAddress },
        { name: "PoolFactory", address: poolFactoryAddress },
        { name: "Treasury", address: treasuryAddress },
        { name: "SmoothingBuffer", address: smoothingBufferAddress },
        { name: "YieldEngine", address: yieldEngineAddress },
        { name: "USDC", address: USDC_ADDRESS },
      ];

      for (const contract of defiContractsToWhitelist) {
        const isWhitelisted = await paymaster.isWhitelisted(contract.address);
        if (!isWhitelisted) {
          console.log(`   📝 Whitelisting ${contract.name}...`);
          const tx = await paymaster.setWhitelistedTarget(contract.address, true);
          await tx.wait();
          console.log(`   ✅ ${contract.name} whitelisted`);
        } else {
          console.log(`   ✓ ${contract.name} already whitelisted`);
        }
      }

      // Configure function selectors for user-facing contracts
      const approve = ethers.id("approve(address,uint256)").slice(0, 10);
      const transfer = ethers.id("transfer(address,uint256)").slice(0, 10);
      const depositSel = ethers.id("deposit(uint256)").slice(0, 10);
      const withdrawSel = ethers.id("withdraw(uint256)").slice(0, 10);
      const claimYieldSel = ethers.id("claimYield()").slice(0, 10);
      const createPoolSel = ethers.id("createPool(string,uint8)").slice(0, 10);

      console.log("\n   📝 Setting allowed function selectors...");

      // GenesisPool: deposit, withdraw, claimYield
      await (await paymaster.setAllowedFunctionsBatch(
        genesisPoolAddress,
        [depositSel, withdrawSel, claimYieldSel],
        true
      )).wait();
      console.log("   ✅ GenesisPool functions configured");

      // PoolFactory: createPool
      await (await paymaster.setAllowedFunctionsBatch(
        poolFactoryAddress,
        [createPoolSel],
        true
      )).wait();
      console.log("   ✅ PoolFactory functions configured");

      // USDC: approve, transfer
      await (await paymaster.setAllowedFunctionsBatch(
        USDC_ADDRESS,
        [approve, transfer],
        true
      )).wait();
      console.log("   ✅ USDC functions configured");

      console.log("\n   🎉 Paymaster DeFi whitelist configured!\n");
    }
  } else {
    console.log("\n   ⚠️ Core deployment not found - skipping paymaster config");
  }

  // ============================================================================
  // Final Output
  // ============================================================================

  console.log("═══════════════════════════════════════════════════════════");
  console.log("✅ DEFI DEPLOYMENT COMPLETE!");
  console.log("═══════════════════════════════════════════════════════════\n");
  console.log("📋 Deployed Contracts:\n");
  console.log(`USDC:                   ${USDC_ADDRESS}`);
  console.log(`VlossomTreasury:        ${treasuryAddress}`);
  console.log(`VlossomYieldEngine:     ${yieldEngineAddress}`);
  console.log(`VlossomGenesisPool:     ${genesisPoolAddress}`);
  console.log(`VlossomSmoothingBuffer: ${smoothingBufferAddress}`);
  console.log(`CommunityPool Impl:     ${communityPoolImplAddress}`);
  console.log(`VlossomPoolFactory:     ${poolFactoryAddress}\n`);

  console.log("═══════════════════════════════════════════════════════════");
  console.log("📝 Next Steps:");
  console.log("═══════════════════════════════════════════════════════════\n");
  console.log("1. Update services/api/.env with DeFi contract addresses");
  console.log("2. Update frontend environment variables");
  console.log("3. Seed VLP with testnet USDC if needed\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:", error);
    process.exit(1);
  });
