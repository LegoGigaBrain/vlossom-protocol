// MockUSDC Deployment Script for Arbitrum Sepolia
// Deploys a MockUSDC contract for testnet testing with faucet functionality

import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log("║  Vlossom Protocol - MockUSDC (Arbitrum Sepolia)            ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");

  // Get signer
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();

  console.log("📍 Network:", network.name);
  console.log("🔗 Chain ID:", network.chainId.toString());
  console.log("👤 Deployer:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Balance:", ethers.formatEther(balance), "ETH\n");

  // Deploy MockUSDC
  console.log("🚀 Deploying MockUSDC...");
  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const mockUsdc = await MockUSDC.deploy();
  await mockUsdc.waitForDeployment();
  const mockUsdcAddress = await mockUsdc.getAddress();
  console.log("✅ MockUSDC deployed to:", mockUsdcAddress);

  // Verify deployment
  const name = await mockUsdc.name();
  const symbol = await mockUsdc.symbol();
  const decimals = await mockUsdc.decimals();
  console.log(`   Name: ${name}, Symbol: ${symbol}, Decimals: ${decimals}`);

  // Mint initial supply to deployer for testing (10,000,000 USDC)
  const initialSupply = 10_000_000n * 1_000_000n; // 10M USDC with 6 decimals
  console.log("\n🪙 Minting initial supply to deployer...");
  const mintTx = await mockUsdc.mint(deployer.address, initialSupply);
  await mintTx.wait();
  const deployerBalance = await mockUsdc.balanceOf(deployer.address);
  console.log(`✅ Minted ${ethers.formatUnits(deployerBalance, 6)} USDC to deployer`);

  // Update the arbitrum-sepolia.json deployment file
  const deploymentsDir = path.join(__dirname, "../deployments");
  const deploymentFile = path.join(deploymentsDir, "arbitrum-sepolia.json");

  // Read existing deployment
  let deploymentData: Record<string, unknown> = {};
  if (fs.existsSync(deploymentFile)) {
    deploymentData = JSON.parse(fs.readFileSync(deploymentFile, "utf-8"));
  }

  // Update with MockUSDC address
  deploymentData.mockUsdc = mockUsdcAddress;
  deploymentData.usdcNote = "MockUSDC deployed for testnet faucet functionality";

  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentData, null, 2));
  console.log("\n📝 Updated deployment file:", deploymentFile);

  // Print summary
  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log("║  MockUSDC Deployment Summary                               ║");
  console.log("╠════════════════════════════════════════════════════════════╣");
  console.log(`║  MockUSDC Address: ${mockUsdcAddress}   ║`);
  console.log(`║  Deployer Balance: ${ethers.formatUnits(deployerBalance, 6).padStart(15)} USDC              ║`);
  console.log("╚════════════════════════════════════════════════════════════╝\n");

  console.log("📋 Next Steps:");
  console.log("1. Update NEXT_PUBLIC_USDC_ADDRESS in apps/web/.env.production");
  console.log("2. Update USDC_ADDRESS in services/api/.env.production");
  console.log("3. The faucet service will now work with MockUSDC");
  console.log(`\n   MockUSDC Address: ${mockUsdcAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:", error);
    process.exit(1);
  });
