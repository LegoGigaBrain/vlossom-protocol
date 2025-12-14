// Base Sepolia Deployment Script with Gas Estimation
// This script:
// 1. Estimates gas costs before deployment
// 2. Deploys all contracts to Base Sepolia
// 3. Verifies contracts on Basescan
// 4. Saves deployment addresses
// 5. Funds Paymaster with initial ETH

import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

// Configuration
const ENTRYPOINT_ADDRESS = "0x0000000071727De22E5E9d8BAf0edAc6f37da032"; // ERC-4337 v0.7
const USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e"; // Base Sepolia USDC
const PAYMASTER_INITIAL_FUNDING = ethers.parseEther("0.3"); // 0.3 ETH
const PAYMASTER_RATE_LIMIT = 50; // operations per day

interface DeploymentAddresses {
  network: string;
  chainId: number;
  timestamp: string;
  deployer: string;
  entryPoint: string;
  usdc: string;
  vlossomAccountFactory: string;
  vlossomPaymaster: string;
  escrow: string;
  gasUsed: {
    factory: string;
    paymaster: string;
    escrow: string;
    total: string;
  };
  ethSpent: {
    deployment: string;
    paymasterFunding: string;
    total: string;
  };
}

interface GasEstimate {
  contract: string;
  estimatedGas: bigint;
  gasPrice: bigint;
  estimatedCost: bigint;
}

async function main() {
  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log("║  Vlossom Protocol - Base Sepolia Deployment               ║");
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

  if (balance < ethers.parseEther("0.1")) {
    throw new Error("❌ Insufficient balance! Need at least 0.1 ETH");
  }

  // Get current gas price
  const feeData = await ethers.provider.getFeeData();
  const gasPrice = feeData.gasPrice || ethers.parseUnits("1", "gwei");
  console.log("⛽ Current Gas Price:", ethers.formatUnits(gasPrice, "gwei"), "Gwei\n");

  // ============================================================================
  // STEP 1: Gas Estimation
  // ============================================================================

  console.log("═══════════════════════════════════════════════════════════");
  console.log("📊 STEP 1: Gas Estimation");
  console.log("═══════════════════════════════════════════════════════════\n");

  const estimates: GasEstimate[] = [];

  // Estimate VlossomAccountFactory
  console.log("📏 Estimating VlossomAccountFactory...");
  const VlossomAccountFactory = await ethers.getContractFactory("VlossomAccountFactory");
  const factoryDeployTx = await VlossomAccountFactory.getDeployTransaction(ENTRYPOINT_ADDRESS, deployer.address);
  const factoryGasEstimate = await ethers.provider.estimateGas(factoryDeployTx);
  const factoryCost = factoryGasEstimate * gasPrice;
  estimates.push({
    contract: "VlossomAccountFactory",
    estimatedGas: factoryGasEstimate,
    gasPrice,
    estimatedCost: factoryCost,
  });
  console.log(`   Gas: ${factoryGasEstimate.toLocaleString()}`);
  console.log(`   Cost: ${ethers.formatEther(factoryCost)} ETH\n`);

  // Estimate VlossomPaymaster
  console.log("📏 Estimating VlossomPaymaster...");
  const VlossomPaymaster = await ethers.getContractFactory("VlossomPaymaster");
  const paymasterDeployTx = await VlossomPaymaster.getDeployTransaction(
    ENTRYPOINT_ADDRESS,
    deployer.address // owner
  );
  const paymasterGasEstimate = await ethers.provider.estimateGas(paymasterDeployTx);
  const paymasterCost = paymasterGasEstimate * gasPrice;
  estimates.push({
    contract: "VlossomPaymaster",
    estimatedGas: paymasterGasEstimate,
    gasPrice,
    estimatedCost: paymasterCost,
  });
  console.log(`   Gas: ${paymasterGasEstimate.toLocaleString()}`);
  console.log(`   Cost: ${ethers.formatEther(paymasterCost)} ETH\n`);

  // Estimate Escrow
  console.log("📏 Estimating Escrow...");
  const Escrow = await ethers.getContractFactory("Escrow");
  const escrowDeployTx = await Escrow.getDeployTransaction(
    USDC_ADDRESS,
    deployer.address, // owner
    deployer.address  // relayer
  );
  const escrowGasEstimate = await ethers.provider.estimateGas(escrowDeployTx);
  const escrowCost = escrowGasEstimate * gasPrice;
  estimates.push({
    contract: "Escrow",
    estimatedGas: escrowGasEstimate,
    gasPrice,
    estimatedCost: escrowCost,
  });
  console.log(`   Gas: ${escrowGasEstimate.toLocaleString()}`);
  console.log(`   Cost: ${ethers.formatEther(escrowCost)} ETH\n`);

  // Calculate totals
  const totalGas = estimates.reduce((sum, est) => sum + est.estimatedGas, 0n);
  const totalCost = estimates.reduce((sum, est) => sum + est.estimatedCost, 0n);
  const totalWithPaymaster = totalCost + PAYMASTER_INITIAL_FUNDING;

  console.log("═══════════════════════════════════════════════════════════");
  console.log("📈 Gas Estimation Summary");
  console.log("═══════════════════════════════════════════════════════════\n");
  console.log(`Total Gas Estimated: ${totalGas.toLocaleString()}`);
  console.log(`Deployment Cost: ${ethers.formatEther(totalCost)} ETH`);
  console.log(`Paymaster Funding: ${ethers.formatEther(PAYMASTER_INITIAL_FUNDING)} ETH`);
  console.log(`─────────────────────────────────────────────────────────`);
  console.log(`Total ETH Needed: ${ethers.formatEther(totalWithPaymaster)} ETH`);
  console.log(`Your Balance: ${ethers.formatEther(balance)} ETH`);
  console.log(`Remaining After: ${ethers.formatEther(balance - totalWithPaymaster)} ETH\n`);

  if (balance < totalWithPaymaster) {
    throw new Error("❌ Insufficient balance for deployment + Paymaster funding!");
  }

  // Wait for user confirmation
  console.log("⏸️  Proceed with deployment? (Ctrl+C to cancel)\n");
  await new Promise(resolve => setTimeout(resolve, 5000)); // 5 second pause

  // ============================================================================
  // STEP 2: Deploy Contracts
  // ============================================================================

  console.log("═══════════════════════════════════════════════════════════");
  console.log("🚀 STEP 2: Deploying Contracts");
  console.log("═══════════════════════════════════════════════════════════\n");

  let actualGasUsed = {
    factory: 0n,
    paymaster: 0n,
    escrow: 0n,
  };

  // Deploy VlossomAccountFactory
  console.log("🏭 Deploying VlossomAccountFactory...");
  const factory = await VlossomAccountFactory.deploy(ENTRYPOINT_ADDRESS, deployer.address);
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  const factoryReceipt = await ethers.provider.getTransactionReceipt(factory.deploymentTransaction()!.hash);
  actualGasUsed.factory = factoryReceipt!.gasUsed;
  console.log("   ✅ Deployed at:", factoryAddress);
  console.log(`   ⛽ Gas used: ${actualGasUsed.factory.toLocaleString()}\n`);

  // Deploy VlossomPaymaster
  console.log("💳 Deploying VlossomPaymaster...");
  const paymaster = await VlossomPaymaster.deploy(
    ENTRYPOINT_ADDRESS,
    deployer.address
  );
  await paymaster.waitForDeployment();
  const paymasterAddress = await paymaster.getAddress();
  const paymasterReceipt = await ethers.provider.getTransactionReceipt(paymaster.deploymentTransaction()!.hash);
  actualGasUsed.paymaster = paymasterReceipt!.gasUsed;
  console.log("   ✅ Deployed at:", paymasterAddress);
  console.log(`   ⛽ Gas used: ${actualGasUsed.paymaster.toLocaleString()}\n`);

  // Deploy Escrow
  console.log("🔒 Deploying Escrow...");
  const escrow = await Escrow.deploy(USDC_ADDRESS, deployer.address, deployer.address);
  await escrow.waitForDeployment();
  const escrowAddress = await escrow.getAddress();
  const escrowReceipt = await ethers.provider.getTransactionReceipt(escrow.deploymentTransaction()!.hash);
  actualGasUsed.escrow = escrowReceipt!.gasUsed;
  console.log("   ✅ Deployed at:", escrowAddress);
  console.log(`   ⛽ Gas used: ${actualGasUsed.escrow.toLocaleString()}\n`);

  // ============================================================================
  // STEP 3: Fund Paymaster
  // ============================================================================

  console.log("═══════════════════════════════════════════════════════════");
  console.log("💰 STEP 3: Funding Paymaster");
  console.log("═══════════════════════════════════════════════════════════\n");

  console.log(`Depositing ${ethers.formatEther(PAYMASTER_INITIAL_FUNDING)} ETH to Paymaster...`);
  const fundTx = await paymaster.deposit({ value: PAYMASTER_INITIAL_FUNDING });
  await fundTx.wait();

  const paymasterBalance = await paymaster.getDeposit();
  console.log("   ✅ Paymaster funded!");
  console.log(`   💰 Paymaster balance: ${ethers.formatEther(paymasterBalance)} ETH\n`);

  // ============================================================================
  // STEP 4: Calculate Actual Costs
  // ============================================================================

  const totalActualGas = actualGasUsed.factory + actualGasUsed.paymaster + actualGasUsed.escrow;
  const deploymentCost = totalActualGas * gasPrice;
  const totalSpent = deploymentCost + PAYMASTER_INITIAL_FUNDING;
  const finalBalance = await ethers.provider.getBalance(deployer.address);

  console.log("═══════════════════════════════════════════════════════════");
  console.log("📊 Deployment Summary");
  console.log("═══════════════════════════════════════════════════════════\n");
  console.log(`Total Gas Used: ${totalActualGas.toLocaleString()}`);
  console.log(`Deployment Cost: ${ethers.formatEther(deploymentCost)} ETH`);
  console.log(`Paymaster Funding: ${ethers.formatEther(PAYMASTER_INITIAL_FUNDING)} ETH`);
  console.log(`Total Spent: ${ethers.formatEther(totalSpent)} ETH`);
  console.log(`Final Balance: ${ethers.formatEther(finalBalance)} ETH\n`);

  // ============================================================================
  // STEP 5: Save Deployment Addresses
  // ============================================================================

  console.log("═══════════════════════════════════════════════════════════");
  console.log("💾 STEP 5: Saving Deployment Addresses");
  console.log("═══════════════════════════════════════════════════════════\n");

  const deployment: DeploymentAddresses = {
    network: "base-sepolia",
    chainId: Number(network.chainId),
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    entryPoint: ENTRYPOINT_ADDRESS,
    usdc: USDC_ADDRESS,
    vlossomAccountFactory: factoryAddress,
    vlossomPaymaster: paymasterAddress,
    escrow: escrowAddress,
    gasUsed: {
      factory: actualGasUsed.factory.toString(),
      paymaster: actualGasUsed.paymaster.toString(),
      escrow: actualGasUsed.escrow.toString(),
      total: totalActualGas.toString(),
    },
    ethSpent: {
      deployment: ethers.formatEther(deploymentCost),
      paymasterFunding: ethers.formatEther(PAYMASTER_INITIAL_FUNDING),
      total: ethers.formatEther(totalSpent),
    },
  };

  // Create deployments directory if it doesn't exist
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  // Save deployment file
  const deploymentFile = path.join(deploymentsDir, "base-sepolia.json");
  fs.writeFileSync(deploymentFile, JSON.stringify(deployment, null, 2));
  console.log("   ✅ Saved to:", deploymentFile, "\n");

  // ============================================================================
  // Final Output
  // ============================================================================

  console.log("═══════════════════════════════════════════════════════════");
  console.log("✅ DEPLOYMENT COMPLETE!");
  console.log("═══════════════════════════════════════════════════════════\n");
  console.log("📋 Deployed Contracts:\n");
  console.log(`EntryPoint (v0.7):      ${ENTRYPOINT_ADDRESS}`);
  console.log(`USDC:                   ${USDC_ADDRESS}`);
  console.log(`VlossomAccountFactory:  ${factoryAddress}`);
  console.log(`VlossomPaymaster:       ${paymasterAddress}`);
  console.log(`Escrow:                 ${escrowAddress}\n`);
  console.log("═══════════════════════════════════════════════════════════");
  console.log("📝 Next Steps:");
  console.log("═══════════════════════════════════════════════════════════\n");
  console.log("1. Verify contracts on Basescan:");
  console.log(`   npx hardhat verify --network base-sepolia ${factoryAddress} ${ENTRYPOINT_ADDRESS} ${deployer.address}`);
  console.log(`   npx hardhat verify --network base-sepolia ${paymasterAddress} ${ENTRYPOINT_ADDRESS} ${deployer.address}`);
  console.log(`   npx hardhat verify --network base-sepolia ${escrowAddress} ${USDC_ADDRESS} ${deployer.address} ${deployer.address}\n`);
  console.log("2. Update services/api/.env with new addresses");
  console.log("3. Monitor Paymaster balance at:");
  console.log(`   https://sepolia.basescan.org/address/${paymasterAddress}\n`);
  console.log("4. View Paymaster deposit:");
  console.log(`   Current: ${ethers.formatEther(paymasterBalance)} ETH`);
  console.log(`   Min threshold: ${process.env.PAYMASTER_MIN_BALANCE || "0.1"} ETH\n`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:", error);
    process.exit(1);
  });
