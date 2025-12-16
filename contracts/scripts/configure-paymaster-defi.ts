// Configure Paymaster to Whitelist DeFi Contracts
// This script:
// 1. Adds DeFi contracts to the paymaster whitelist
// 2. Configures allowed function selectors for each contract
// 3. Optionally enables function whitelist enforcement

import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

// Function selectors for DeFi operations
// Format: keccak256("functionName(types)").slice(0,10)
const FUNCTION_SELECTORS = {
  // VlossomGenesisPool functions
  deposit: "0xb6b55f25",           // deposit(uint256)
  withdraw: "0x2e1a7d4d",          // withdraw(uint256)
  claimYield: "0xb88a802f",        // claimYield()

  // VlossomPoolFactory functions
  createPool: "0x20fbb91f",        // createPool(string,uint8)

  // VlossomCommunityPool functions (same as GenesisPool for user functions)
  // deposit, withdraw, claimYield are the same selectors

  // VlossomTreasury functions (for authorized users)
  claimOperatingFunds: "0x0",      // Placeholder - admin only

  // VlossomSmoothingBuffer functions (for authorized users)
  borrowForPayout: "0x0",          // Placeholder - admin only
};

// Calculate function selectors dynamically
function computeSelector(signature: string): string {
  return ethers.id(signature).slice(0, 10);
}

async function main() {
  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log("║  Vlossom Protocol - Paymaster DeFi Whitelist Config       ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");

  // Get signer
  const [deployer] = await ethers.getSigners();
  console.log("👤 Deployer:", deployer.address);

  // Load deployment addresses
  const coreDeploymentPath = path.join(__dirname, "..", "deployments", "base-sepolia.json");
  const defiDeploymentPath = path.join(__dirname, "..", "deployments", "defi-base-sepolia.json");

  if (!fs.existsSync(coreDeploymentPath)) {
    throw new Error("❌ Core deployment file not found. Deploy core contracts first.");
  }

  if (!fs.existsSync(defiDeploymentPath)) {
    throw new Error("❌ DeFi deployment file not found. Deploy DeFi contracts first.");
  }

  const coreDeployment = JSON.parse(fs.readFileSync(coreDeploymentPath, "utf-8"));
  const defiDeployment = JSON.parse(fs.readFileSync(defiDeploymentPath, "utf-8"));

  const paymasterAddress = coreDeployment.vlossomPaymaster;
  console.log("📌 Paymaster Address:", paymasterAddress);

  // Get paymaster contract
  const paymaster = await ethers.getContractAt("VlossomPaymaster", paymasterAddress);

  // ============================================================================
  // Step 1: Whitelist DeFi Contracts
  // ============================================================================

  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("🎯 Step 1: Whitelisting DeFi Contracts");
  console.log("═══════════════════════════════════════════════════════════\n");

  const defiContracts = [
    { name: "VlossomGenesisPool", address: defiDeployment.genesisPool },
    { name: "VlossomPoolFactory", address: defiDeployment.poolFactory },
    { name: "VlossomTreasury", address: defiDeployment.treasury },
    { name: "VlossomSmoothingBuffer", address: defiDeployment.smoothingBuffer },
    { name: "VlossomYieldEngine", address: defiDeployment.yieldEngine },
    { name: "USDC", address: defiDeployment.usdc },
  ];

  for (const contract of defiContracts) {
    const isWhitelisted = await paymaster.isWhitelisted(contract.address);

    if (isWhitelisted) {
      console.log(`   ✓ ${contract.name} already whitelisted`);
    } else {
      console.log(`   📝 Whitelisting ${contract.name}...`);
      const tx = await paymaster.setWhitelistedTarget(contract.address, true);
      await tx.wait();
      console.log(`   ✅ ${contract.name} whitelisted: ${contract.address}`);
    }
  }

  // ============================================================================
  // Step 2: Configure Function Selectors
  // ============================================================================

  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("🎯 Step 2: Configuring Function Selectors");
  console.log("═══════════════════════════════════════════════════════════\n");

  // Compute function selectors
  const selectors = {
    // ERC20 approve (needed for deposits)
    approve: computeSelector("approve(address,uint256)"),
    transfer: computeSelector("transfer(address,uint256)"),

    // Pool functions
    deposit: computeSelector("deposit(uint256)"),
    withdraw: computeSelector("withdraw(uint256)"),
    claimYield: computeSelector("claimYield()"),

    // Factory functions
    createPool: computeSelector("createPool(string,uint8)"),
  };

  console.log("   📋 Function Selectors:");
  for (const [name, selector] of Object.entries(selectors)) {
    console.log(`      ${name}: ${selector}`);
  }

  // Configure selectors for each contract
  const contractSelectors: { address: string; name: string; selectors: string[] }[] = [
    {
      name: "VlossomGenesisPool",
      address: defiDeployment.genesisPool,
      selectors: [selectors.deposit, selectors.withdraw, selectors.claimYield],
    },
    {
      name: "VlossomPoolFactory",
      address: defiDeployment.poolFactory,
      selectors: [selectors.createPool],
    },
    {
      name: "USDC",
      address: defiDeployment.usdc,
      selectors: [selectors.approve, selectors.transfer],
    },
  ];

  console.log("\n   📝 Setting allowed functions for each contract...\n");

  for (const config of contractSelectors) {
    console.log(`   ${config.name} (${config.address}):`);

    // Batch set all selectors for this contract
    const tx = await paymaster.setAllowedFunctionsBatch(
      config.address,
      config.selectors,
      true
    );
    await tx.wait();

    for (const selector of config.selectors) {
      const name = Object.entries(selectors).find(([_, s]) => s === selector)?.[0] || "unknown";
      console.log(`      ✅ ${name} (${selector})`);
    }
  }

  // ============================================================================
  // Step 3: Verify Configuration
  // ============================================================================

  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("🔍 Step 3: Verifying Configuration");
  console.log("═══════════════════════════════════════════════════════════\n");

  // Verify whitelists
  for (const contract of defiContracts) {
    const isWhitelisted = await paymaster.isWhitelisted(contract.address);
    console.log(`   ${isWhitelisted ? "✅" : "❌"} ${contract.name} whitelisted: ${isWhitelisted}`);
  }

  // Verify function selectors
  console.log("\n   Function selector verification:");
  for (const config of contractSelectors) {
    console.log(`\n   ${config.name}:`);
    for (const selector of config.selectors) {
      const isAllowed = await paymaster.isFunctionAllowed(config.address, selector);
      const name = Object.entries(selectors).find(([_, s]) => s === selector)?.[0] || "unknown";
      console.log(`      ${isAllowed ? "✅" : "❌"} ${name}: ${isAllowed}`);
    }
  }

  // ============================================================================
  // Step 4: Optionally Enable Function Whitelist Enforcement
  // ============================================================================

  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("⚙️  Step 4: Function Whitelist Enforcement");
  console.log("═══════════════════════════════════════════════════════════\n");

  const isEnforced = await paymaster.enforceFunctionWhitelist();
  console.log(`   Current enforcement status: ${isEnforced ? "ENABLED" : "DISABLED"}`);

  // Note: We leave enforcement disabled by default for flexibility
  // Enable it in production for tighter security
  if (!isEnforced) {
    console.log("   ℹ️  Function whitelist enforcement is disabled.");
    console.log("   📝 To enable, run: paymaster.setFunctionWhitelistEnforced(true)");
  }

  // ============================================================================
  // Summary
  // ============================================================================

  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("✅ PAYMASTER DEFI CONFIGURATION COMPLETE!");
  console.log("═══════════════════════════════════════════════════════════\n");

  console.log("📋 Whitelisted Contracts:");
  for (const contract of defiContracts) {
    console.log(`   • ${contract.name}: ${contract.address}`);
  }

  console.log("\n📋 Allowed Functions:");
  console.log("   • deposit(uint256)     - Deposit USDC to pools");
  console.log("   • withdraw(uint256)    - Withdraw from pools");
  console.log("   • claimYield()         - Claim accumulated yield");
  console.log("   • createPool(...)      - Create community pool");
  console.log("   • approve(...)         - Approve USDC spending");
  console.log("   • transfer(...)        - Transfer USDC");

  console.log("\n📝 Notes:");
  console.log("   • Users can now interact with DeFi contracts gaslessly");
  console.log("   • Rate limits still apply (50 ops/day default)");
  console.log("   • Community pools deployed via factory will also need whitelisting");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Configuration failed:", error);
    process.exit(1);
  });
