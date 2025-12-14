import { ethers, network } from "hardhat";

/**
 * Deploy script for Escrow contract
 *
 * Usage:
 * - localhost: npx hardhat run scripts/deploy-escrow.ts --network localhost
 * - Base Sepolia: npx hardhat run scripts/deploy-escrow.ts --network base-sepolia
 *
 * Environment variables required for testnet/mainnet:
 * - DEPLOYER_PRIVATE_KEY: Private key of deployer account
 * - USDC_ADDRESS: Address of USDC token contract (optional, will deploy mock if not provided)
 * - RELAYER_ADDRESS: Address of the backend relayer service (required)
 */

async function main() {
  console.log("\n=== Deploying Escrow Contract ===\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Network:", network.name);

  // Get deployer balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH\n");

  // USDC addresses for different networks
  const USDC_ADDRESSES: Record<string, string> = {
    "base": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // Base mainnet USDC
    "base-sepolia": "0x036CbD53842c5426634e7929541eC2318f3dCF7e", // Base Sepolia USDC
  };

  let usdcAddress: string;

  // Determine USDC address based on network
  if (network.name === "localhost" || network.name === "hardhat") {
    console.log("Deploying MockUSDC for local network...");
    const MockUSDCFactory = await ethers.getContractFactory("MockUSDC");
    const mockUsdc = await MockUSDCFactory.deploy();
    await mockUsdc.waitForDeployment();
    usdcAddress = await mockUsdc.getAddress();
    console.log("MockUSDC deployed to:", usdcAddress);

    // Mint some USDC to deployer for testing
    const mintAmount = ethers.parseUnits("10000", 6); // 10,000 USDC
    await mockUsdc.mint(deployer.address, mintAmount);
    console.log(`Minted ${ethers.formatUnits(mintAmount, 6)} USDC to deployer\n`);
  } else if (process.env.USDC_ADDRESS) {
    // Use provided USDC address from environment
    usdcAddress = process.env.USDC_ADDRESS;
    console.log("Using USDC address from environment:", usdcAddress, "\n");
  } else if (USDC_ADDRESSES[network.name]) {
    // Use known USDC address for network
    usdcAddress = USDC_ADDRESSES[network.name];
    console.log("Using known USDC address for", network.name, ":", usdcAddress, "\n");
  } else {
    throw new Error(
      `USDC address not found for network ${network.name}. Please provide USDC_ADDRESS environment variable.`
    );
  }

  // Determine relayer address (required for security - H-2 fix)
  let relayerAddress: string;

  if (network.name === "localhost" || network.name === "hardhat") {
    // For local testing, use deployer as relayer
    relayerAddress = deployer.address;
    console.log("Using deployer as relayer for local network:", relayerAddress);
  } else if (process.env.RELAYER_ADDRESS) {
    relayerAddress = process.env.RELAYER_ADDRESS;
    console.log("Using relayer address from environment:", relayerAddress);
  } else {
    throw new Error(
      "RELAYER_ADDRESS environment variable is required for non-local deployments. " +
      "This is a security requirement - relayer must be set at deployment time."
    );
  }

  // Deploy Escrow contract with relayer initialized (security fix H-2)
  console.log("\nDeploying Escrow contract...");
  const EscrowFactory = await ethers.getContractFactory("Escrow");
  const escrow = await EscrowFactory.deploy(usdcAddress, deployer.address, relayerAddress);
  await escrow.waitForDeployment();

  const escrowAddress = await escrow.getAddress();
  console.log("Escrow deployed to:", escrowAddress);

  // Verify deployment
  console.log("\n=== Verifying Deployment ===\n");
  const usdcInContract = await escrow.usdc();
  const owner = await escrow.owner();
  const relayer = await escrow.getRelayer();
  const isPaused = await escrow.paused();

  console.log("USDC token address:", usdcInContract);
  console.log("Owner address:", owner);
  console.log("Relayer address:", relayer);
  console.log("Contract paused:", isPaused);

  // Verify relayer is set correctly
  if (relayer === ethers.ZeroAddress) {
    throw new Error("CRITICAL: Relayer was not set correctly!");
  }
  console.log("✓ Relayer initialized at deployment (security fix H-2)");

  // Log configuration instructions
  console.log("\n=== Post-Deployment Steps ===\n");
  console.log("1. Fund the backend relayer with gas for transactions");
  console.log("\n2. Update backend configuration with escrow address:");
  console.log(`   ESCROW_CONTRACT_ADDRESS=${escrowAddress}`);
  console.log("\n3. (Optional) To change relayer later, owner can call:");
  console.log(`   escrow.setRelayer("<NEW_RELAYER_ADDRESS>")`);
  console.log("\n4. Emergency controls (owner only):");
  console.log(`   escrow.pause()   // Stop all operations`);
  console.log(`   escrow.unpause() // Resume operations`);

  // Save deployment info to file
  const deploymentInfo = {
    network: network.name,
    chainId: (await ethers.provider.getNetwork()).chainId,
    escrow: escrowAddress,
    usdc: usdcAddress,
    owner: owner,
    relayer: relayer,
    deployer: deployer.address,
    paused: isPaused,
    timestamp: new Date().toISOString(),
    securityFeatures: {
      partialRefundsDisabled: true, // C-1 fix
      relayerInitializedAtDeployment: true, // H-2 fix
      pausableEnabled: true, // M-1 fix
    },
  };

  console.log("\n=== Deployment Complete ===\n");
  console.log("Deployment info:", JSON.stringify(deploymentInfo, (_, v) =>
    typeof v === 'bigint' ? v.toString() : v, 2));

  // Verify on Basescan if not local network
  if (network.name !== "localhost" && network.name !== "hardhat") {
    console.log("\n=== Contract Verification ===\n");
    console.log("To verify on Basescan, run:");
    console.log(
      `npx hardhat verify --network ${network.name} ${escrowAddress} "${usdcAddress}" "${deployer.address}" "${relayerAddress}"`
    );
  }

  return deploymentInfo;
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
