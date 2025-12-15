import { ethers, network } from "hardhat";

/**
 * Deploy script for PropertyRegistry contract
 *
 * Usage:
 * - localhost: npx hardhat run scripts/deploy-property-registry.ts --network localhost
 * - Base Sepolia: npx hardhat run scripts/deploy-property-registry.ts --network base-sepolia
 *
 * Environment variables optional:
 * - DEPLOYER_PRIVATE_KEY: Private key of deployer account
 */

async function main() {
  console.log("\n=== Deploying PropertyRegistry Contract ===\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Network:", network.name);

  // Get deployer balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH\n");

  // Deploy PropertyRegistry contract
  console.log("Deploying PropertyRegistry contract...");
  const PropertyRegistryFactory = await ethers.getContractFactory("PropertyRegistry");
  const propertyRegistry = await PropertyRegistryFactory.deploy(deployer.address);
  await propertyRegistry.waitForDeployment();

  const propertyRegistryAddress = await propertyRegistry.getAddress();
  console.log("PropertyRegistry deployed to:", propertyRegistryAddress);

  // Verify deployment
  console.log("\n=== Verifying Deployment ===\n");
  const owner = await propertyRegistry.owner();
  const isPaused = await propertyRegistry.paused();
  const totalProperties = await propertyRegistry.totalProperties();

  console.log("Owner address:", owner);
  console.log("Contract paused:", isPaused);
  console.log("Total properties:", totalProperties.toString());

  // Log configuration instructions
  console.log("\n=== Post-Deployment Steps ===\n");
  console.log("1. Update backend configuration with PropertyRegistry address:");
  console.log(`   PROPERTY_REGISTRY_ADDRESS=${propertyRegistryAddress}`);
  console.log("\n2. Update indexer to listen for PropertyRegistry events");
  console.log("\n3. Admin functions available (owner only):");
  console.log("   - verifyProperty(bytes32 propertyId)");
  console.log("   - suspendProperty(bytes32 propertyId)");
  console.log("   - unsuspendProperty(bytes32 propertyId)");
  console.log("   - revokeProperty(bytes32 propertyId)");
  console.log("   - pause() / unpause()");

  // Save deployment info
  const deploymentInfo = {
    network: network.name,
    chainId: (await ethers.provider.getNetwork()).chainId,
    propertyRegistry: propertyRegistryAddress,
    owner: owner,
    deployer: deployer.address,
    paused: isPaused,
    timestamp: new Date().toISOString(),
    features: {
      propertyRegistration: true,
      ownershipTransfer: true,
      metadataUpdates: true,
      adminVerification: true,
      pausable: true,
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
      `npx hardhat verify --network ${network.name} ${propertyRegistryAddress} "${deployer.address}"`
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
