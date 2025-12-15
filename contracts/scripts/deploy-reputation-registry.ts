import { ethers, network } from "hardhat";

/**
 * Deploy script for ReputationRegistry contract
 *
 * Usage:
 * - localhost: npx hardhat run scripts/deploy-reputation-registry.ts --network localhost
 * - Base Sepolia: npx hardhat run scripts/deploy-reputation-registry.ts --network base-sepolia
 *
 * Environment variables optional:
 * - DEPLOYER_PRIVATE_KEY: Private key of deployer account
 * - RELAYER_ADDRESS: Address to authorize as submitter (backend service)
 */

async function main() {
  console.log("\n=== Deploying ReputationRegistry Contract ===\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Network:", network.name);

  // Get deployer balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH\n");

  // Deploy ReputationRegistry contract
  console.log("Deploying ReputationRegistry contract...");
  const ReputationRegistryFactory = await ethers.getContractFactory("ReputationRegistry");
  const reputationRegistry = await ReputationRegistryFactory.deploy(deployer.address);
  await reputationRegistry.waitForDeployment();

  const reputationRegistryAddress = await reputationRegistry.getAddress();
  console.log("ReputationRegistry deployed to:", reputationRegistryAddress);

  // Authorize relayer if provided
  const relayerAddress = process.env.RELAYER_ADDRESS;
  if (relayerAddress && relayerAddress !== deployer.address) {
    console.log("\nAuthorizing relayer as submitter:", relayerAddress);
    await reputationRegistry.setAuthorizedSubmitter(relayerAddress, true);
    console.log("Relayer authorized successfully");
  }

  // Verify deployment
  console.log("\n=== Verifying Deployment ===\n");
  const owner = await reputationRegistry.owner();
  const isPaused = await reputationRegistry.paused();
  const totalActors = await reputationRegistry.totalActors();
  const verificationThreshold = await reputationRegistry.verificationThreshold();
  const isDeployerAuthorized = await reputationRegistry.authorizedSubmitters(deployer.address);

  console.log("Owner address:", owner);
  console.log("Contract paused:", isPaused);
  console.log("Total actors:", totalActors.toString());
  console.log("Verification threshold:", (Number(verificationThreshold) / 100).toFixed(2) + "%");
  console.log("Deployer is authorized submitter:", isDeployerAuthorized);

  // Log configuration instructions
  console.log("\n=== Post-Deployment Steps ===\n");
  console.log("1. Update backend configuration with ReputationRegistry address:");
  console.log(`   REPUTATION_REGISTRY_ADDRESS=${reputationRegistryAddress}`);
  console.log("\n2. Authorize backend relayer as submitter (if not done above):");
  console.log(`   reputationRegistry.setAuthorizedSubmitter("<RELAYER_ADDRESS>", true)`);
  console.log("\n3. Update indexer to listen for ReputationRegistry events");
  console.log("\n4. Admin functions available (owner only):");
  console.log("   - setAuthorizedSubmitter(address, bool)");
  console.log("   - setVerificationThreshold(uint256)");
  console.log("   - pause() / unpause()");
  console.log("\n5. Submitter functions (authorized addresses):");
  console.log("   - registerActor(address, ActorType)");
  console.log("   - recordEvent(address, bookingId, ActorType, EventType, scoreImpact, metadataHash)");
  console.log("   - recordEventsBatch(...)");

  // Save deployment info
  const deploymentInfo = {
    network: network.name,
    chainId: (await ethers.provider.getNetwork()).chainId,
    reputationRegistry: reputationRegistryAddress,
    owner: owner,
    deployer: deployer.address,
    paused: isPaused,
    verificationThreshold: Number(verificationThreshold),
    timestamp: new Date().toISOString(),
    features: {
      threeWayReputation: true,
      tpsTracking: true,
      reliabilityScore: true,
      feedbackScore: true,
      disputeTracking: true,
      verificationBadges: true,
      batchEvents: true,
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
      `npx hardhat verify --network ${network.name} ${reputationRegistryAddress} "${deployer.address}"`
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
