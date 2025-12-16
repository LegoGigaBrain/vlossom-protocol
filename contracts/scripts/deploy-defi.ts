// DeFi Contracts Deployment Script for Base Sepolia
// This script:
// 1. Deploys MockUSDC (if needed for testing)
// 2. Deploys all DeFi contracts
// 3. Configures contract relationships
// 4. Seeds VLP with initial liquidity
// 5. Saves deployment addresses

import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

// Configuration
const USE_MOCK_USDC = true; // Set to false to use real USDC on mainnet
const REAL_USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e"; // Base Sepolia USDC
const VLP_INITIAL_SEED = 1000n * 1_000_000n; // $1,000 USDC (6 decimals)
const MIN_BUFFER_THRESHOLD = 500n * 1_000_000n; // $500 USDC minimum buffer threshold

interface DefiDeploymentAddresses {
  network: string;
  chainId: number;
  timestamp: string;
  deployer: string;
  usdc: string;
  mockUsdcDeployed: boolean;
  treasury: string;
  yieldEngine: string;
  genesisPool: string;
  smoothingBuffer: string;
  communityPoolImpl: string;
  poolFactory: string;
  gasUsed: {
    mockUsdc?: string;
    treasury: string;
    yieldEngine: string;
    genesisPool: string;
    smoothingBuffer: string;
    communityPoolImpl: string;
    poolFactory: string;
    total: string;
  };
  ethSpent: string;
  vlpSeeded: string;
}

async function main() {
  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log("║  Vlossom Protocol - DeFi Contracts Deployment             ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");

  // Get signer
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();

  console.log("📍 Network:", network.name);
  console.log("🔗 Chain ID:", network.chainId.toString());
  console.log("👤 Deployer:", deployer.address);

  // Check balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Balance:", ethers.formatEther(balance), "ETH");

  if (balance < ethers.parseEther("0.05")) {
    throw new Error("❌ Insufficient balance! Need at least 0.05 ETH");
  }

  // Get current gas price
  const feeData = await ethers.provider.getFeeData();
  const gasPrice = feeData.gasPrice || ethers.parseUnits("1", "gwei");
  console.log("⛽ Current Gas Price:", ethers.formatUnits(gasPrice, "gwei"), "Gwei\n");

  const gasUsed: Record<string, bigint> = {};

  // ============================================================================
  // STEP 1: Deploy or Use USDC
  // ============================================================================

  console.log("═══════════════════════════════════════════════════════════");
  console.log("🪙 STEP 1: USDC Setup");
  console.log("═══════════════════════════════════════════════════════════\n");

  let usdcAddress: string;
  let mockUsdcDeployed = false;

  if (USE_MOCK_USDC) {
    console.log("🏭 Deploying MockUSDC...");
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const mockUsdc = await MockUSDC.deploy();
    await mockUsdc.waitForDeployment();
    usdcAddress = await mockUsdc.getAddress();
    const receipt = await ethers.provider.getTransactionReceipt(mockUsdc.deploymentTransaction()!.hash);
    gasUsed.mockUsdc = receipt!.gasUsed;
    mockUsdcDeployed = true;
    console.log("   ✅ MockUSDC deployed at:", usdcAddress);
    console.log(`   ⛽ Gas used: ${gasUsed.mockUsdc.toLocaleString()}\n`);

    // Mint initial USDC to deployer for seeding
    console.log(`   💰 Minting ${(VLP_INITIAL_SEED / 1_000_000n).toString()} USDC to deployer...`);
    const mintTx = await mockUsdc.mint(deployer.address, VLP_INITIAL_SEED);
    await mintTx.wait();
    console.log("   ✅ USDC minted\n");
  } else {
    usdcAddress = REAL_USDC_ADDRESS;
    console.log("   📌 Using existing USDC:", usdcAddress, "\n");
  }

  // ============================================================================
  // STEP 2: Deploy Treasury
  // ============================================================================

  console.log("═══════════════════════════════════════════════════════════");
  console.log("🏛️ STEP 2: Deploying VlossomTreasury");
  console.log("═══════════════════════════════════════════════════════════\n");

  const VlossomTreasury = await ethers.getContractFactory("VlossomTreasury");
  const treasury = await VlossomTreasury.deploy(
    usdcAddress,
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
  // STEP 3: Deploy Yield Engine
  // ============================================================================

  console.log("═══════════════════════════════════════════════════════════");
  console.log("📈 STEP 3: Deploying VlossomYieldEngine");
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
  // STEP 4: Deploy Genesis Pool (VLP)
  // ============================================================================

  console.log("═══════════════════════════════════════════════════════════");
  console.log("🌟 STEP 4: Deploying VlossomGenesisPool (VLP)");
  console.log("═══════════════════════════════════════════════════════════\n");

  const VlossomGenesisPool = await ethers.getContractFactory("VlossomGenesisPool");
  const genesisPool = await VlossomGenesisPool.deploy(
    usdcAddress,
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
  // STEP 5: Deploy Smoothing Buffer
  // ============================================================================

  console.log("═══════════════════════════════════════════════════════════");
  console.log("🔄 STEP 5: Deploying VlossomSmoothingBuffer");
  console.log("═══════════════════════════════════════════════════════════\n");

  const VlossomSmoothingBuffer = await ethers.getContractFactory("VlossomSmoothingBuffer");
  const smoothingBuffer = await VlossomSmoothingBuffer.deploy(
    usdcAddress,
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
  // STEP 6: Deploy Community Pool Implementation
  // ============================================================================

  console.log("═══════════════════════════════════════════════════════════");
  console.log("👥 STEP 6: Deploying VlossomCommunityPool (Implementation)");
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
  // STEP 7: Deploy Pool Factory
  // ============================================================================

  console.log("═══════════════════════════════════════════════════════════");
  console.log("🏭 STEP 7: Deploying VlossomPoolFactory");
  console.log("═══════════════════════════════════════════════════════════\n");

  const VlossomPoolFactory = await ethers.getContractFactory("VlossomPoolFactory");
  const poolFactory = await VlossomPoolFactory.deploy(
    usdcAddress,
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
  // STEP 8: Configure Contract Relationships
  // ============================================================================

  console.log("═══════════════════════════════════════════════════════════");
  console.log("🔗 STEP 8: Configuring Contract Relationships");
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
  // STEP 9: Seed VLP with Initial Liquidity
  // ============================================================================

  console.log("═══════════════════════════════════════════════════════════");
  console.log("💰 STEP 9: Seeding Genesis Pool with Initial Liquidity");
  console.log("═══════════════════════════════════════════════════════════\n");

  if (USE_MOCK_USDC) {
    const usdc = await ethers.getContractAt("MockUSDC", usdcAddress);

    // Approve VLP to spend USDC
    console.log("   📝 Approving VLP to spend USDC...");
    const approveTx = await usdc.approve(genesisPoolAddress, VLP_INITIAL_SEED);
    await approveTx.wait();
    console.log("   ✅ Approved\n");

    // Deposit to VLP
    console.log(`   📝 Depositing ${(VLP_INITIAL_SEED / 1_000_000n).toString()} USDC to VLP...`);
    const depositTx = await genesisPool.deposit(VLP_INITIAL_SEED);
    await depositTx.wait();
    console.log("   ✅ VLP seeded with initial liquidity\n");
  } else {
    console.log("   ⚠️ Skipping seed - using real USDC. Seed manually.\n");
  }

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
    network: network.name || "base-sepolia",
    chainId: Number(network.chainId),
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    usdc: usdcAddress,
    mockUsdcDeployed,
    treasury: treasuryAddress,
    yieldEngine: yieldEngineAddress,
    genesisPool: genesisPoolAddress,
    smoothingBuffer: smoothingBufferAddress,
    communityPoolImpl: communityPoolImplAddress,
    poolFactory: poolFactoryAddress,
    gasUsed: {
      ...(gasUsed.mockUsdc && { mockUsdc: gasUsed.mockUsdc.toString() }),
      treasury: gasUsed.treasury.toString(),
      yieldEngine: gasUsed.yieldEngine.toString(),
      genesisPool: gasUsed.genesisPool.toString(),
      smoothingBuffer: gasUsed.smoothingBuffer.toString(),
      communityPoolImpl: gasUsed.communityPoolImpl.toString(),
      poolFactory: gasUsed.poolFactory.toString(),
      total: totalGas.toString(),
    },
    ethSpent: ethers.formatEther(totalCost),
    vlpSeeded: USE_MOCK_USDC ? (VLP_INITIAL_SEED / 1_000_000n).toString() : "0",
  };

  // Create deployments directory if it doesn't exist
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  // Save deployment file
  const deploymentFile = path.join(deploymentsDir, "defi-base-sepolia.json");
  fs.writeFileSync(deploymentFile, JSON.stringify(deployment, null, 2));
  console.log("   ✅ Saved to:", deploymentFile, "\n");

  // ============================================================================
  // STEP 10: Configure Paymaster Whitelist (if deployed)
  // ============================================================================

  const coreDeploymentPath = path.join(deploymentsDir, "base-sepolia.json");

  if (fs.existsSync(coreDeploymentPath)) {
    console.log("═══════════════════════════════════════════════════════════");
    console.log("💳 STEP 10: Configuring Paymaster DeFi Whitelist");
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
        { name: "USDC", address: usdcAddress },
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
        usdcAddress,
        [approve, transfer],
        true
      )).wait();
      console.log("   ✅ USDC functions configured");

      console.log("\n   🎉 Paymaster DeFi whitelist configured!\n");
    }
  } else {
    console.log("\n   ⚠️ Core deployment not found - skipping paymaster config");
    console.log("   📝 Run 'npx hardhat run scripts/configure-paymaster-defi.ts' after deploying core contracts\n");
  }

  // ============================================================================
  // Final Output
  // ============================================================================

  console.log("═══════════════════════════════════════════════════════════");
  console.log("✅ DEFI DEPLOYMENT COMPLETE!");
  console.log("═══════════════════════════════════════════════════════════\n");
  console.log("📋 Deployed Contracts:\n");
  console.log(`USDC:                   ${usdcAddress} ${mockUsdcDeployed ? "(Mock)" : "(Real)"}`);
  console.log(`VlossomTreasury:        ${treasuryAddress}`);
  console.log(`VlossomYieldEngine:     ${yieldEngineAddress}`);
  console.log(`VlossomGenesisPool:     ${genesisPoolAddress}`);
  console.log(`VlossomSmoothingBuffer: ${smoothingBufferAddress}`);
  console.log(`CommunityPool Impl:     ${communityPoolImplAddress}`);
  console.log(`VlossomPoolFactory:     ${poolFactoryAddress}\n`);

  if (USE_MOCK_USDC) {
    console.log(`💰 VLP Seeded: $${(VLP_INITIAL_SEED / 1_000_000n).toString()} USDC\n`);
  }

  console.log("═══════════════════════════════════════════════════════════");
  console.log("📝 Next Steps:");
  console.log("═══════════════════════════════════════════════════════════\n");
  console.log("1. Verify contracts on Basescan:");
  console.log(`   npx hardhat verify --network base-sepolia ${treasuryAddress} ${usdcAddress} ${deployer.address} ${deployer.address}`);
  console.log(`   npx hardhat verify --network base-sepolia ${yieldEngineAddress} ${deployer.address}`);
  console.log(`   npx hardhat verify --network base-sepolia ${genesisPoolAddress} ${usdcAddress} ${deployer.address} "Vlossom Liquidity Pool"`);
  console.log(`   npx hardhat verify --network base-sepolia ${smoothingBufferAddress} ${usdcAddress} ${deployer.address} ${MIN_BUFFER_THRESHOLD.toString()}`);
  console.log(`   npx hardhat verify --network base-sepolia ${poolFactoryAddress} ${usdcAddress} ${communityPoolImplAddress} ${treasuryAddress} ${deployer.address}\n`);
  console.log("2. Update services/api/.env with DeFi contract addresses");
  console.log("3. Add DeFi contracts to Paymaster whitelist");
  console.log("4. Update frontend environment variables\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:", error);
    process.exit(1);
  });
