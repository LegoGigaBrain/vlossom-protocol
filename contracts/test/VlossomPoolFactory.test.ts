import { expect } from "chai";
import { ethers } from "hardhat";
import { VlossomPoolFactory, VlossomCommunityPool, MockUSDC } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("VlossomPoolFactory", function () {
  // Test accounts
  let admin: SignerWithAddress;
  let tierValidator: SignerWithAddress;
  let treasury: SignerWithAddress;
  let creator1: SignerWithAddress;
  let creator2: SignerWithAddress;
  let user: SignerWithAddress;

  // Contracts
  let factory: VlossomPoolFactory;
  let poolImplementation: VlossomCommunityPool;
  let usdc: MockUSDC;

  // Constants
  const USDC_DECIMALS = 6;
  const INITIAL_BALANCE = ethers.parseUnits("100000", USDC_DECIMALS);

  // Tier configurations (from factory constructor)
  const TIER1_CAP = BigInt(0); // No cap
  const TIER1_FEE = ethers.parseUnits("1000", USDC_DECIMALS); // $1,000
  const TIER1_CREATOR_BPS = 500; // 5%

  const TIER2_CAP = ethers.parseUnits("100000", USDC_DECIMALS); // $100k
  const TIER2_FEE = ethers.parseUnits("2500", USDC_DECIMALS); // $2,500
  const TIER2_CREATOR_BPS = 300; // 3%

  const TIER3_CAP = ethers.parseUnits("20000", USDC_DECIMALS); // $20k
  const TIER3_FEE = ethers.parseUnits("5000", USDC_DECIMALS); // $5,000
  const TIER3_CREATOR_BPS = 100; // 1%

  async function deployFactoryFixture() {
    [admin, tierValidator, treasury, creator1, creator2, user] = await ethers.getSigners();

    // Deploy MockUSDC
    const MockUSDCFactory = await ethers.getContractFactory("MockUSDC");
    usdc = await MockUSDCFactory.deploy();
    await usdc.waitForDeployment();

    // Deploy pool implementation (for cloning)
    const PoolFactory = await ethers.getContractFactory("VlossomCommunityPool");
    poolImplementation = await PoolFactory.deploy();
    await poolImplementation.waitForDeployment();

    // Deploy factory
    const FactoryContract = await ethers.getContractFactory("VlossomPoolFactory");
    factory = await FactoryContract.deploy(
      await usdc.getAddress(),
      await poolImplementation.getAddress(),
      treasury.address,
      admin.address
    );
    await factory.waitForDeployment();

    // Grant tier validator role
    const TIER_VALIDATOR_ROLE = await factory.TIER_VALIDATOR_ROLE();
    await factory.connect(admin).grantRole(TIER_VALIDATOR_ROLE, tierValidator.address);

    // Mint USDC to creators
    await usdc.mint(creator1.address, INITIAL_BALANCE);
    await usdc.mint(creator2.address, INITIAL_BALANCE);

    // Approve factory for creators
    await usdc.connect(creator1).approve(await factory.getAddress(), ethers.MaxUint256);
    await usdc.connect(creator2).approve(await factory.getAddress(), ethers.MaxUint256);

    return { factory, poolImplementation, usdc, admin, tierValidator, treasury, creator1, creator2, user };
  }

  describe("Deployment", function () {
    it("Should set the correct USDC token address", async function () {
      const { factory, usdc } = await loadFixture(deployFactoryFixture);
      expect(await factory.usdc()).to.equal(await usdc.getAddress());
    });

    it("Should set the correct pool implementation", async function () {
      const { factory, poolImplementation } = await loadFixture(deployFactoryFixture);
      expect(await factory.poolImplementation()).to.equal(await poolImplementation.getAddress());
    });

    it("Should set the correct treasury", async function () {
      const { factory, treasury } = await loadFixture(deployFactoryFixture);
      expect(await factory.treasury()).to.equal(treasury.address);
    });

    it("Should grant admin roles correctly", async function () {
      const { factory, admin } = await loadFixture(deployFactoryFixture);
      const ADMIN_ROLE = await factory.ADMIN_ROLE();
      expect(await factory.hasRole(ADMIN_ROLE, admin.address)).to.equal(true);
    });

    it("Should initialize tier 1 config correctly", async function () {
      const { factory } = await loadFixture(deployFactoryFixture);
      const config = await factory.getTierConfig(1);
      expect(config.cap).to.equal(TIER1_CAP);
      expect(config.creationFee).to.equal(TIER1_FEE);
      expect(config.creatorFeeBps).to.equal(TIER1_CREATOR_BPS);
    });

    it("Should initialize tier 2 config correctly", async function () {
      const { factory } = await loadFixture(deployFactoryFixture);
      const config = await factory.getTierConfig(2);
      expect(config.cap).to.equal(TIER2_CAP);
      expect(config.creationFee).to.equal(TIER2_FEE);
      expect(config.creatorFeeBps).to.equal(TIER2_CREATOR_BPS);
    });

    it("Should initialize tier 3 config correctly", async function () {
      const { factory } = await loadFixture(deployFactoryFixture);
      const config = await factory.getTierConfig(3);
      expect(config.cap).to.equal(TIER3_CAP);
      expect(config.creationFee).to.equal(TIER3_FEE);
      expect(config.creatorFeeBps).to.equal(TIER3_CREATOR_BPS);
    });

    it("Should revert with zero USDC address", async function () {
      const { poolImplementation, treasury, admin } = await loadFixture(deployFactoryFixture);
      const FactoryContract = await ethers.getContractFactory("VlossomPoolFactory");
      await expect(
        FactoryContract.deploy(
          ethers.ZeroAddress,
          await poolImplementation.getAddress(),
          treasury.address,
          admin.address
        )
      ).to.be.revertedWithCustomError(FactoryContract, "InvalidAddress");
    });
  });

  // ==========================================================================
  // Tier Management Tests
  // ==========================================================================
  describe("Tier Management", function () {
    it("Should allow tier validator to set user tier", async function () {
      const { factory, tierValidator, creator1 } = await loadFixture(deployFactoryFixture);

      await factory.connect(tierValidator).setUserTier(creator1.address, 1);

      expect(await factory.getUserTier(creator1.address)).to.equal(1);
    });

    it("Should emit UserTierUpdated event", async function () {
      const { factory, tierValidator, creator1 } = await loadFixture(deployFactoryFixture);

      await expect(
        factory.connect(tierValidator).setUserTier(creator1.address, 2)
      ).to.emit(factory, "UserTierUpdated")
        .withArgs(creator1.address, 2);
    });

    it("Should not allow non-validator to set tier", async function () {
      const { factory, user, creator1 } = await loadFixture(deployFactoryFixture);

      await expect(
        factory.connect(user).setUserTier(creator1.address, 1)
      ).to.be.revertedWithCustomError(factory, "InvalidAddress");
    });

    it("Should revert invalid tier (> 3)", async function () {
      const { factory, tierValidator, creator1 } = await loadFixture(deployFactoryFixture);

      await expect(
        factory.connect(tierValidator).setUserTier(creator1.address, 4)
      ).to.be.revertedWithCustomError(factory, "InvalidTier");
    });

    it("Should allow batch tier updates", async function () {
      const { factory, tierValidator, creator1, creator2 } = await loadFixture(deployFactoryFixture);

      await factory.connect(tierValidator).batchSetUserTiers(
        [creator1.address, creator2.address],
        [1, 2]
      );

      expect(await factory.getUserTier(creator1.address)).to.equal(1);
      expect(await factory.getUserTier(creator2.address)).to.equal(2);
    });
  });

  // ==========================================================================
  // Pool Creation Tests
  // ==========================================================================
  describe("Pool Creation", function () {
    it("Should create pool for tier 1 user", async function () {
      const { factory, tierValidator, creator1 } = await loadFixture(deployFactoryFixture);

      await factory.connect(tierValidator).setUserTier(creator1.address, 1);

      await expect(
        factory.connect(creator1).createPool("My Pool", 1)
      ).to.emit(factory, "PoolCreated");
    });

    it("Should collect creation fee on pool creation", async function () {
      const { factory, usdc, tierValidator, treasury, creator1 } = await loadFixture(deployFactoryFixture);

      await factory.connect(tierValidator).setUserTier(creator1.address, 1);

      const treasuryBalanceBefore = await usdc.balanceOf(treasury.address);
      await factory.connect(creator1).createPool("My Pool", 1);
      const treasuryBalanceAfter = await usdc.balanceOf(treasury.address);

      expect(treasuryBalanceAfter - treasuryBalanceBefore).to.equal(TIER1_FEE);
    });

    it("Should initialize pool with correct parameters", async function () {
      const { factory, usdc, tierValidator, creator1 } = await loadFixture(deployFactoryFixture);

      await factory.connect(tierValidator).setUserTier(creator1.address, 2);

      const tx = await factory.connect(creator1).createPool("Tier 2 Pool", 2);
      const receipt = await tx.wait();

      // Get pool address from event
      const event = receipt?.logs.find(
        (log: any) => log.fragment?.name === "PoolCreated"
      );
      const poolAddress = (event as any)?.args?.[0];

      // Check pool parameters
      const pool = await ethers.getContractAt("VlossomCommunityPool", poolAddress);
      expect(await pool.name()).to.equal("Tier 2 Pool");
      expect(await pool.creator()).to.equal(creator1.address);
      expect(await pool.tier()).to.equal(2);
      expect(await pool.cap()).to.equal(TIER2_CAP);
      expect(await pool.creatorFeeBps()).to.equal(TIER2_CREATOR_BPS);
    });

    it("Should revert if user has no tier", async function () {
      const { factory, creator1 } = await loadFixture(deployFactoryFixture);

      await expect(
        factory.connect(creator1).createPool("My Pool", 1)
      ).to.be.revertedWithCustomError(factory, "InsufficientTier");
    });

    it("Should revert if requesting higher tier than assigned", async function () {
      const { factory, tierValidator, creator1 } = await loadFixture(deployFactoryFixture);

      // User has tier 2 but tries to create tier 1 pool
      await factory.connect(tierValidator).setUserTier(creator1.address, 2);

      await expect(
        factory.connect(creator1).createPool("Elite Pool", 1)
      ).to.be.revertedWithCustomError(factory, "InsufficientTier");
    });

    it("Should allow creating pool at same tier", async function () {
      const { factory, tierValidator, creator1 } = await loadFixture(deployFactoryFixture);

      await factory.connect(tierValidator).setUserTier(creator1.address, 2);

      await expect(
        factory.connect(creator1).createPool("My Pool", 2)
      ).to.emit(factory, "PoolCreated");
    });

    it("Should allow creating pool at lower tier", async function () {
      const { factory, tierValidator, creator1 } = await loadFixture(deployFactoryFixture);

      await factory.connect(tierValidator).setUserTier(creator1.address, 1); // Best tier

      await expect(
        factory.connect(creator1).createPool("Budget Pool", 3) // Lower tier
      ).to.emit(factory, "PoolCreated");
    });

    it("Should revert duplicate pool name", async function () {
      const { factory, tierValidator, creator1, creator2 } = await loadFixture(deployFactoryFixture);

      await factory.connect(tierValidator).setUserTier(creator1.address, 1);
      await factory.connect(tierValidator).setUserTier(creator2.address, 1);

      await factory.connect(creator1).createPool("Unique Name", 1);

      await expect(
        factory.connect(creator2).createPool("Unique Name", 1)
      ).to.be.revertedWithCustomError(factory, "PoolNameTaken");
    });

    it("Should revert invalid tier (0)", async function () {
      const { factory, tierValidator, creator1 } = await loadFixture(deployFactoryFixture);

      await factory.connect(tierValidator).setUserTier(creator1.address, 1);

      await expect(
        factory.connect(creator1).createPool("My Pool", 0)
      ).to.be.revertedWithCustomError(factory, "InvalidTier");
    });

    it("Should revert invalid tier (> 3)", async function () {
      const { factory, tierValidator, creator1 } = await loadFixture(deployFactoryFixture);

      await factory.connect(tierValidator).setUserTier(creator1.address, 1);

      await expect(
        factory.connect(creator1).createPool("My Pool", 4)
      ).to.be.revertedWithCustomError(factory, "InvalidTier");
    });

    it("Should track creator pools correctly", async function () {
      const { factory, tierValidator, creator1 } = await loadFixture(deployFactoryFixture);

      await factory.connect(tierValidator).setUserTier(creator1.address, 1);

      await factory.connect(creator1).createPool("Pool 1", 1);
      await factory.connect(creator1).createPool("Pool 2", 2);

      const creatorPools = await factory.getPoolsByCreator(creator1.address);
      expect(creatorPools.length).to.equal(2);
    });

    it("Should increment total pool count", async function () {
      const { factory, tierValidator, creator1 } = await loadFixture(deployFactoryFixture);

      await factory.connect(tierValidator).setUserTier(creator1.address, 1);

      expect(await factory.getPoolCount()).to.equal(0);

      await factory.connect(creator1).createPool("Pool 1", 1);
      expect(await factory.getPoolCount()).to.equal(1);

      await factory.connect(creator1).createPool("Pool 2", 2);
      expect(await factory.getPoolCount()).to.equal(2);
    });
  });

  // ==========================================================================
  // H-4 FIX: Tier Sync Tests
  // ==========================================================================
  describe("H-4 Fix: Tier Sync on Downgrade", function () {
    it("Should sync all pools when creator tier is downgraded", async function () {
      const { factory, tierValidator, creator1 } = await loadFixture(deployFactoryFixture);

      // Creator starts at tier 1 (best)
      await factory.connect(tierValidator).setUserTier(creator1.address, 1);

      // Create tier 1 pool (no cap, 5% fee)
      const tx = await factory.connect(creator1).createPool("Elite Pool", 1);
      const receipt = await tx.wait();
      const event = receipt?.logs.find(
        (log: any) => log.fragment?.name === "PoolCreated"
      );
      const poolAddress = (event as any)?.args?.[0];
      const pool = await ethers.getContractAt("VlossomCommunityPool", poolAddress);

      // Verify initial tier
      expect(await pool.tier()).to.equal(1);
      expect(await pool.cap()).to.equal(TIER1_CAP);
      expect(await pool.creatorFeeBps()).to.equal(TIER1_CREATOR_BPS);

      // Downgrade creator to tier 2
      await factory.connect(tierValidator).setUserTier(creator1.address, 2);

      // Sync pools to new tier
      await factory.connect(tierValidator).syncPoolsToTier(creator1.address);

      // Verify pool was updated
      expect(await pool.tier()).to.equal(2);
      expect(await pool.cap()).to.equal(TIER2_CAP);
      expect(await pool.creatorFeeBps()).to.equal(TIER2_CREATOR_BPS);
    });

    it("Should sync single pool", async function () {
      const { factory, tierValidator, creator1 } = await loadFixture(deployFactoryFixture);

      await factory.connect(tierValidator).setUserTier(creator1.address, 1);

      const tx = await factory.connect(creator1).createPool("Elite Pool", 1);
      const receipt = await tx.wait();
      const event = receipt?.logs.find(
        (log: any) => log.fragment?.name === "PoolCreated"
      );
      const poolAddress = (event as any)?.args?.[0];
      const pool = await ethers.getContractAt("VlossomCommunityPool", poolAddress);

      // Downgrade to tier 3
      await factory.connect(tierValidator).setUserTier(creator1.address, 3);
      await factory.connect(tierValidator).syncPoolToTier(poolAddress);

      expect(await pool.tier()).to.equal(3);
      expect(await pool.cap()).to.equal(TIER3_CAP);
      expect(await pool.creatorFeeBps()).to.equal(TIER3_CREATOR_BPS);
    });

    it("Should not upgrade pools (only downgrade)", async function () {
      const { factory, tierValidator, creator1 } = await loadFixture(deployFactoryFixture);

      // Start at tier 3
      await factory.connect(tierValidator).setUserTier(creator1.address, 3);

      const tx = await factory.connect(creator1).createPool("Basic Pool", 3);
      const receipt = await tx.wait();
      const event = receipt?.logs.find(
        (log: any) => log.fragment?.name === "PoolCreated"
      );
      const poolAddress = (event as any)?.args?.[0];
      const pool = await ethers.getContractAt("VlossomCommunityPool", poolAddress);

      // Upgrade creator to tier 1
      await factory.connect(tierValidator).setUserTier(creator1.address, 1);
      await factory.connect(tierValidator).syncPoolsToTier(creator1.address);

      // Pool should remain at tier 3 (no automatic upgrade)
      expect(await pool.tier()).to.equal(3);
    });

    it("Should handle creator with no tier gracefully", async function () {
      const { factory, tierValidator, creator1 } = await loadFixture(deployFactoryFixture);

      // Creator has tier 1
      await factory.connect(tierValidator).setUserTier(creator1.address, 1);
      await factory.connect(creator1).createPool("My Pool", 1);

      // Remove tier
      await factory.connect(tierValidator).setUserTier(creator1.address, 0);

      // Sync should not revert, just do nothing
      await expect(
        factory.connect(tierValidator).syncPoolsToTier(creator1.address)
      ).to.not.be.reverted;
    });

    it("Should not allow non-validator to sync pools", async function () {
      const { factory, tierValidator, creator1, user } = await loadFixture(deployFactoryFixture);

      await factory.connect(tierValidator).setUserTier(creator1.address, 1);
      await factory.connect(creator1).createPool("My Pool", 1);

      await expect(
        factory.connect(user).syncPoolsToTier(creator1.address)
      ).to.be.revertedWithCustomError(factory, "InvalidAddress");
    });

    it("Should emit TierParamsUpdated on pool when synced", async function () {
      const { factory, tierValidator, creator1 } = await loadFixture(deployFactoryFixture);

      await factory.connect(tierValidator).setUserTier(creator1.address, 1);

      const tx = await factory.connect(creator1).createPool("Elite Pool", 1);
      const receipt = await tx.wait();
      const event = receipt?.logs.find(
        (log: any) => log.fragment?.name === "PoolCreated"
      );
      const poolAddress = (event as any)?.args?.[0];
      const pool = await ethers.getContractAt("VlossomCommunityPool", poolAddress);

      await factory.connect(tierValidator).setUserTier(creator1.address, 2);

      // Sync and check event
      await expect(
        factory.connect(tierValidator).syncPoolsToTier(creator1.address)
      ).to.emit(pool, "TierParamsUpdated")
        .withArgs(1, 2, TIER2_CAP, TIER2_CREATOR_BPS);
    });

    it("Should sync multiple pools for same creator", async function () {
      const { factory, tierValidator, creator1 } = await loadFixture(deployFactoryFixture);

      await factory.connect(tierValidator).setUserTier(creator1.address, 1);

      // Create multiple pools
      await factory.connect(creator1).createPool("Pool A", 1);
      await factory.connect(creator1).createPool("Pool B", 1);
      await factory.connect(creator1).createPool("Pool C", 2); // Already lower tier

      const creatorPools = await factory.getPoolsByCreator(creator1.address);

      // Downgrade to tier 3
      await factory.connect(tierValidator).setUserTier(creator1.address, 3);
      await factory.connect(tierValidator).syncPoolsToTier(creator1.address);

      // Check all pools
      for (const poolAddr of creatorPools) {
        const pool = await ethers.getContractAt("VlossomCommunityPool", poolAddr);
        expect(await pool.tier()).to.equal(3);
      }
    });
  });

  // ==========================================================================
  // Pool Management Tests
  // ==========================================================================
  describe("Pool Management", function () {
    it("Should allow admin to pause pool", async function () {
      const { factory, admin, tierValidator, creator1 } = await loadFixture(deployFactoryFixture);

      await factory.connect(tierValidator).setUserTier(creator1.address, 1);
      const tx = await factory.connect(creator1).createPool("My Pool", 1);
      const receipt = await tx.wait();
      const event = receipt?.logs.find(
        (log: any) => log.fragment?.name === "PoolCreated"
      );
      const poolAddress = (event as any)?.args?.[0];

      await expect(
        factory.connect(admin).pausePool(poolAddress)
      ).to.emit(factory, "PoolPaused")
        .withArgs(poolAddress);
    });

    it("Should allow admin to unpause pool", async function () {
      const { factory, admin, tierValidator, creator1 } = await loadFixture(deployFactoryFixture);

      await factory.connect(tierValidator).setUserTier(creator1.address, 1);
      const tx = await factory.connect(creator1).createPool("My Pool", 1);
      const receipt = await tx.wait();
      const event = receipt?.logs.find(
        (log: any) => log.fragment?.name === "PoolCreated"
      );
      const poolAddress = (event as any)?.args?.[0];

      await factory.connect(admin).pausePool(poolAddress);

      await expect(
        factory.connect(admin).unpausePool(poolAddress)
      ).to.emit(factory, "PoolUnpaused")
        .withArgs(poolAddress);
    });

    it("Should allow admin to update pool cap", async function () {
      const { factory, admin, tierValidator, creator1 } = await loadFixture(deployFactoryFixture);

      await factory.connect(tierValidator).setUserTier(creator1.address, 3);
      const tx = await factory.connect(creator1).createPool("My Pool", 3);
      const receipt = await tx.wait();
      const event = receipt?.logs.find(
        (log: any) => log.fragment?.name === "PoolCreated"
      );
      const poolAddress = (event as any)?.args?.[0];

      const newCap = ethers.parseUnits("50000", USDC_DECIMALS);
      await factory.connect(admin).updatePoolCap(poolAddress, newCap);

      const pool = await ethers.getContractAt("VlossomCommunityPool", poolAddress);
      expect(await pool.cap()).to.equal(newCap);
    });

    it("Should not allow non-admin to pause pool", async function () {
      const { factory, tierValidator, creator1, user } = await loadFixture(deployFactoryFixture);

      await factory.connect(tierValidator).setUserTier(creator1.address, 1);
      const tx = await factory.connect(creator1).createPool("My Pool", 1);
      const receipt = await tx.wait();
      const event = receipt?.logs.find(
        (log: any) => log.fragment?.name === "PoolCreated"
      );
      const poolAddress = (event as any)?.args?.[0];

      await expect(
        factory.connect(user).pausePool(poolAddress)
      ).to.be.revertedWithCustomError(factory, "InvalidAddress");
    });
  });

  // ==========================================================================
  // Admin Functions Tests
  // ==========================================================================
  describe("Admin Functions", function () {
    it("Should allow admin to update tier config", async function () {
      const { factory, admin } = await loadFixture(deployFactoryFixture);

      const newCap = ethers.parseUnits("200000", USDC_DECIMALS);
      const newFee = ethers.parseUnits("3000", USDC_DECIMALS);
      const newCreatorBps = 400;

      await expect(
        factory.connect(admin).setTierConfig(2, newCap, newFee, newCreatorBps)
      ).to.emit(factory, "TierConfigUpdated")
        .withArgs(2, newCap, newFee, newCreatorBps);

      const config = await factory.getTierConfig(2);
      expect(config.cap).to.equal(newCap);
      expect(config.creationFee).to.equal(newFee);
      expect(config.creatorFeeBps).to.equal(newCreatorBps);
    });

    it("Should allow admin to update pool implementation", async function () {
      const { factory, admin } = await loadFixture(deployFactoryFixture);

      // Deploy new implementation
      const PoolFactory = await ethers.getContractFactory("VlossomCommunityPool");
      const newImplementation = await PoolFactory.deploy();

      await factory.connect(admin).setPoolImplementation(await newImplementation.getAddress());

      expect(await factory.poolImplementation()).to.equal(await newImplementation.getAddress());
    });

    it("Should allow admin to update treasury", async function () {
      const { factory, admin, user } = await loadFixture(deployFactoryFixture);

      await factory.connect(admin).setTreasury(user.address);

      expect(await factory.treasury()).to.equal(user.address);
    });

    it("Should not allow non-admin to update tier config", async function () {
      const { factory, user } = await loadFixture(deployFactoryFixture);

      await expect(
        factory.connect(user).setTierConfig(1, 0, 0, 0)
      ).to.be.revertedWithCustomError(factory, "InvalidAddress");
    });

    it("Should revert setting zero address for implementation", async function () {
      const { factory, admin } = await loadFixture(deployFactoryFixture);

      await expect(
        factory.connect(admin).setPoolImplementation(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(factory, "InvalidAddress");
    });

    it("Should revert setting zero address for treasury", async function () {
      const { factory, admin } = await loadFixture(deployFactoryFixture);

      await expect(
        factory.connect(admin).setTreasury(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(factory, "InvalidAddress");
    });
  });

  // ==========================================================================
  // View Functions Tests
  // ==========================================================================
  describe("View Functions", function () {
    it("Should return all pools", async function () {
      const { factory, tierValidator, creator1 } = await loadFixture(deployFactoryFixture);

      await factory.connect(tierValidator).setUserTier(creator1.address, 1);

      await factory.connect(creator1).createPool("Pool 1", 1);
      await factory.connect(creator1).createPool("Pool 2", 2);

      const allPools = await factory.getAllPools();
      expect(allPools.length).to.equal(2);
    });

    it("Should return active pools only", async function () {
      const { factory, admin, tierValidator, creator1 } = await loadFixture(deployFactoryFixture);

      await factory.connect(tierValidator).setUserTier(creator1.address, 1);

      await factory.connect(creator1).createPool("Pool 1", 1);
      const tx = await factory.connect(creator1).createPool("Pool 2", 2);
      const receipt = await tx.wait();
      const event = receipt?.logs.find(
        (log: any) => log.fragment?.name === "PoolCreated"
      );
      const pool2Address = (event as any)?.args?.[0];

      // Pause Pool 2
      await factory.connect(admin).pausePool(pool2Address);

      const activePools = await factory.getActivePools();
      expect(activePools.length).to.equal(1);
      expect(activePools[0].name).to.equal("Pool 1");
    });

    it("Should return pool record correctly", async function () {
      const { factory, tierValidator, creator1 } = await loadFixture(deployFactoryFixture);

      await factory.connect(tierValidator).setUserTier(creator1.address, 2);

      const tx = await factory.connect(creator1).createPool("Test Pool", 2);
      const receipt = await tx.wait();
      const event = receipt?.logs.find(
        (log: any) => log.fragment?.name === "PoolCreated"
      );
      const poolAddress = (event as any)?.args?.[0];

      const record = await factory.getPoolRecord(poolAddress);
      expect(record.name).to.equal("Test Pool");
      expect(record.creator).to.equal(creator1.address);
      expect(record.tier).to.equal(2);
      expect(record.isActive).to.equal(true);
    });

    it("Should return correct creation fee for tier", async function () {
      const { factory } = await loadFixture(deployFactoryFixture);

      expect(await factory.getCreationFee(1)).to.equal(TIER1_FEE);
      expect(await factory.getCreationFee(2)).to.equal(TIER2_FEE);
      expect(await factory.getCreationFee(3)).to.equal(TIER3_FEE);
    });

    it("Should check if user can create pool correctly", async function () {
      const { factory, tierValidator, creator1 } = await loadFixture(deployFactoryFixture);

      // No tier set
      expect(await factory.canCreatePool(creator1.address, 1)).to.equal(false);

      // Set tier 2
      await factory.connect(tierValidator).setUserTier(creator1.address, 2);

      expect(await factory.canCreatePool(creator1.address, 1)).to.equal(false); // Can't create tier 1
      expect(await factory.canCreatePool(creator1.address, 2)).to.equal(true);  // Can create tier 2
      expect(await factory.canCreatePool(creator1.address, 3)).to.equal(true);  // Can create tier 3
    });
  });
});
