import { expect } from "chai";
import { ethers } from "hardhat";
import { VlossomCommunityPool, MockUSDC } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("VlossomCommunityPool", function () {
  // Test accounts
  let factory: SignerWithAddress;
  let creator: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let attacker: SignerWithAddress;

  // Contracts
  let communityPool: VlossomCommunityPool;
  let usdc: MockUSDC;

  // Constants
  const USDC_DECIMALS = 6;
  const PRECISION = ethers.parseUnits("1", 18);
  const MIN_FIRST_DEPOSIT = ethers.parseUnits("1000", USDC_DECIMALS); // $1000
  const DEAD_SHARES = BigInt(1e9);
  const MAX_NAME_LENGTH = 64;

  // Test amounts
  const INITIAL_BALANCE = ethers.parseUnits("10000", USDC_DECIMALS);
  const LARGE_DEPOSIT = ethers.parseUnits("5000", USDC_DECIMALS);
  const SMALL_DEPOSIT = ethers.parseUnits("500", USDC_DECIMALS); // Below minimum
  const POOL_CAP = ethers.parseUnits("20000", USDC_DECIMALS); // $20k cap

  // Tier config
  const TIER = 3;
  const CREATOR_FEE_BPS = 100; // 1%

  async function deployCommunityPoolFixture() {
    [factory, creator, user1, user2, attacker] = await ethers.getSigners();

    // Deploy MockUSDC
    const MockUSDCFactory = await ethers.getContractFactory("MockUSDC");
    usdc = await MockUSDCFactory.deploy();
    await usdc.waitForDeployment();

    // Deploy VlossomCommunityPool
    const CommunityPoolFactory = await ethers.getContractFactory("VlossomCommunityPool");
    communityPool = await CommunityPoolFactory.deploy();
    await communityPool.waitForDeployment();

    // Initialize pool (simulating factory call)
    await communityPool.initialize(
      await usdc.getAddress(),
      factory.address,
      creator.address,
      "Test Community Pool",
      TIER,
      POOL_CAP,
      CREATOR_FEE_BPS
    );

    // Mint USDC to test users
    await usdc.mint(user1.address, INITIAL_BALANCE);
    await usdc.mint(user2.address, INITIAL_BALANCE);
    await usdc.mint(attacker.address, INITIAL_BALANCE);
    await usdc.mint(creator.address, INITIAL_BALANCE);

    // Approve pool for all users
    await usdc.connect(user1).approve(await communityPool.getAddress(), ethers.MaxUint256);
    await usdc.connect(user2).approve(await communityPool.getAddress(), ethers.MaxUint256);
    await usdc.connect(attacker).approve(await communityPool.getAddress(), ethers.MaxUint256);
    await usdc.connect(creator).approve(await communityPool.getAddress(), ethers.MaxUint256);

    return { communityPool, usdc, factory, creator, user1, user2, attacker };
  }

  describe("Initialization", function () {
    it("Should set the correct USDC token address", async function () {
      const { communityPool, usdc } = await loadFixture(deployCommunityPoolFixture);
      expect(await communityPool.usdc()).to.equal(await usdc.getAddress());
    });

    it("Should set the correct factory address", async function () {
      const { communityPool, factory } = await loadFixture(deployCommunityPoolFixture);
      expect(await communityPool.factory()).to.equal(factory.address);
    });

    it("Should set the correct creator address", async function () {
      const { communityPool, creator } = await loadFixture(deployCommunityPoolFixture);
      expect(await communityPool.creator()).to.equal(creator.address);
    });

    it("Should set the correct pool name", async function () {
      const { communityPool } = await loadFixture(deployCommunityPoolFixture);
      expect(await communityPool.name()).to.equal("Test Community Pool");
    });

    it("Should set the correct tier", async function () {
      const { communityPool } = await loadFixture(deployCommunityPoolFixture);
      expect(await communityPool.tier()).to.equal(TIER);
    });

    it("Should set the correct cap", async function () {
      const { communityPool } = await loadFixture(deployCommunityPoolFixture);
      expect(await communityPool.cap()).to.equal(POOL_CAP);
    });

    it("Should set the correct creator fee", async function () {
      const { communityPool } = await loadFixture(deployCommunityPoolFixture);
      expect(await communityPool.creatorFeeBps()).to.equal(CREATOR_FEE_BPS);
    });

    it("Should not allow double initialization", async function () {
      const { communityPool, usdc, factory, creator } = await loadFixture(deployCommunityPoolFixture);

      await expect(
        communityPool.initialize(
          await usdc.getAddress(),
          factory.address,
          creator.address,
          "New Name",
          1,
          0,
          500
        )
      ).to.be.revertedWithCustomError(communityPool, "AlreadyInitialized");
    });

    it("Should initialize supply index to PRECISION", async function () {
      const { communityPool } = await loadFixture(deployCommunityPoolFixture);
      expect(await communityPool.supplyIndex()).to.equal(PRECISION);
    });
  });

  // ==========================================================================
  // C-1 FIX: Donation Attack Prevention Tests
  // ==========================================================================
  describe("C-1 Fix: Donation Attack Prevention", function () {
    it("Should enforce minimum first deposit of $1000 USDC", async function () {
      const { communityPool, user1 } = await loadFixture(deployCommunityPoolFixture);

      await expect(
        communityPool.connect(user1).deposit(SMALL_DEPOSIT)
      ).to.be.revertedWithCustomError(communityPool, "InsufficientFirstDeposit");
    });

    it("Should allow exactly minimum first deposit", async function () {
      const { communityPool, user1 } = await loadFixture(deployCommunityPoolFixture);

      await expect(
        communityPool.connect(user1).deposit(MIN_FIRST_DEPOSIT)
      ).to.emit(communityPool, "Deposited");
    });

    it("Should burn dead shares on first deposit", async function () {
      const { communityPool, user1 } = await loadFixture(deployCommunityPoolFixture);

      await communityPool.connect(user1).deposit(MIN_FIRST_DEPOSIT);

      const totalShares = await communityPool.totalShares();
      const userDeposit = await communityPool.getUserDeposit(user1.address);

      // User shares + dead shares = total shares
      expect(totalShares).to.equal(userDeposit.shares + DEAD_SHARES);
    });

    it("Should allow smaller deposits after first deposit", async function () {
      const { communityPool, user1, user2 } = await loadFixture(deployCommunityPoolFixture);

      await communityPool.connect(user1).deposit(MIN_FIRST_DEPOSIT);

      await expect(
        communityPool.connect(user2).deposit(SMALL_DEPOSIT)
      ).to.emit(communityPool, "Deposited");
    });

    it("Should use actual balance for share calculation", async function () {
      const { communityPool, usdc, user1, user2, attacker } = await loadFixture(deployCommunityPoolFixture);

      await communityPool.connect(user1).deposit(MIN_FIRST_DEPOSIT);

      const sharesBefore = await communityPool.totalShares();
      const poolValue = await usdc.balanceOf(await communityPool.getAddress());

      // Attacker "donates" USDC directly
      const donationAmount = ethers.parseUnits("1000", USDC_DECIMALS);
      await usdc.connect(attacker).transfer(await communityPool.getAddress(), donationAmount);

      // Second user deposits
      await communityPool.connect(user2).deposit(MIN_FIRST_DEPOSIT);

      const user2Deposit = await communityPool.getUserDeposit(user2.address);
      const expectedShares = (MIN_FIRST_DEPOSIT * sharesBefore) / (poolValue + donationAmount);

      expect(user2Deposit.shares).to.equal(expectedShares);
    });
  });

  // ==========================================================================
  // C-2 FIX: Slippage Protection Tests
  // ==========================================================================
  describe("C-2 Fix: Slippage Protection", function () {
    it("Should revert withdraw if output is below minAmountOut", async function () {
      const { communityPool, user1 } = await loadFixture(deployCommunityPoolFixture);

      await communityPool.connect(user1).deposit(LARGE_DEPOSIT);
      const userDeposit = await communityPool.getUserDeposit(user1.address);

      const impossibleMinOut = LARGE_DEPOSIT * BigInt(2);

      await expect(
        communityPool.connect(user1).withdraw(userDeposit.shares, impossibleMinOut)
      ).to.be.revertedWithCustomError(communityPool, "InsufficientOutput");
    });

    it("Should allow withdraw when output meets minAmountOut", async function () {
      const { communityPool, user1 } = await loadFixture(deployCommunityPoolFixture);

      await communityPool.connect(user1).deposit(LARGE_DEPOSIT);
      const userDeposit = await communityPool.getUserDeposit(user1.address);

      const minAmountOut = LARGE_DEPOSIT - ethers.parseUnits("10", USDC_DECIMALS);

      await expect(
        communityPool.connect(user1).withdraw(userDeposit.shares, minAmountOut)
      ).to.emit(communityPool, "Withdrawn");
    });

    it("Should allow withdraw with minAmountOut = 0", async function () {
      const { communityPool, user1 } = await loadFixture(deployCommunityPoolFixture);

      await communityPool.connect(user1).deposit(LARGE_DEPOSIT);
      const userDeposit = await communityPool.getUserDeposit(user1.address);

      await expect(
        communityPool.connect(user1).withdraw(userDeposit.shares, 0)
      ).to.emit(communityPool, "Withdrawn");
    });
  });

  // ==========================================================================
  // H-3 FIX: Name Validation Tests
  // ==========================================================================
  describe("H-3 Fix: Pool Name Validation", function () {
    it("Should allow creator to set valid name", async function () {
      const { communityPool, creator } = await loadFixture(deployCommunityPoolFixture);

      await expect(
        communityPool.connect(creator).setName("My New Pool Name")
      ).to.emit(communityPool, "PoolNameChanged")
        .withArgs("Test Community Pool", "My New Pool Name");
    });

    it("Should revert empty name", async function () {
      const { communityPool, creator } = await loadFixture(deployCommunityPoolFixture);

      await expect(
        communityPool.connect(creator).setName("")
      ).to.be.revertedWithCustomError(communityPool, "InvalidName");
    });

    it("Should revert name exceeding MAX_NAME_LENGTH (64 chars)", async function () {
      const { communityPool, creator } = await loadFixture(deployCommunityPoolFixture);

      // Create a string longer than 64 characters
      const longName = "A".repeat(65);

      await expect(
        communityPool.connect(creator).setName(longName)
      ).to.be.revertedWithCustomError(communityPool, "NameTooLong");
    });

    it("Should allow name exactly at MAX_NAME_LENGTH", async function () {
      const { communityPool, creator } = await loadFixture(deployCommunityPoolFixture);

      const exactName = "A".repeat(64);

      await expect(
        communityPool.connect(creator).setName(exactName)
      ).to.emit(communityPool, "PoolNameChanged");

      expect(await communityPool.name()).to.equal(exactName);
    });

    it("Should not allow non-creator to set name", async function () {
      const { communityPool, user1 } = await loadFixture(deployCommunityPoolFixture);

      await expect(
        communityPool.connect(user1).setName("Hacked Pool")
      ).to.be.revertedWithCustomError(communityPool, "NotCreator");
    });
  });

  // ==========================================================================
  // H-4 FIX: Tier Parameter Update Tests
  // ==========================================================================
  describe("H-4 Fix: Tier Parameter Updates", function () {
    it("Should allow protocol to update tier params", async function () {
      const { communityPool, factory } = await loadFixture(deployCommunityPoolFixture);

      const newTier = 2;
      const newCap = ethers.parseUnits("100000", USDC_DECIMALS);
      const newCreatorFee = 300; // 3%

      await expect(
        communityPool.connect(factory).updateTierParams(newTier, newCap, newCreatorFee)
      ).to.emit(communityPool, "TierParamsUpdated")
        .withArgs(TIER, newTier, newCap, newCreatorFee);
    });

    it("Should update tier correctly", async function () {
      const { communityPool, factory } = await loadFixture(deployCommunityPoolFixture);

      const newTier = 1;
      const newCap = 0; // No cap for tier 1
      const newCreatorFee = 500;

      await communityPool.connect(factory).updateTierParams(newTier, newCap, newCreatorFee);

      expect(await communityPool.tier()).to.equal(newTier);
      expect(await communityPool.cap()).to.equal(newCap);
      expect(await communityPool.creatorFeeBps()).to.equal(newCreatorFee);
    });

    it("Should not allow non-protocol to update tier params", async function () {
      const { communityPool, user1 } = await loadFixture(deployCommunityPoolFixture);

      await expect(
        communityPool.connect(user1).updateTierParams(1, 0, 500)
      ).to.be.revertedWithCustomError(communityPool, "NotProtocol");
    });

    it("Should not allow creator to update tier params", async function () {
      const { communityPool, creator } = await loadFixture(deployCommunityPoolFixture);

      await expect(
        communityPool.connect(creator).updateTierParams(1, 0, 500)
      ).to.be.revertedWithCustomError(communityPool, "NotProtocol");
    });
  });

  // ==========================================================================
  // Pool Cap Tests
  // ==========================================================================
  describe("Pool Deposit Cap", function () {
    it("Should revert deposit exceeding cap", async function () {
      const { communityPool, user1 } = await loadFixture(deployCommunityPoolFixture);

      // Cap is $20,000, try to deposit $25,000
      const overCapDeposit = ethers.parseUnits("25000", USDC_DECIMALS);
      await usdc.mint(user1.address, overCapDeposit);
      await usdc.connect(user1).approve(await communityPool.getAddress(), overCapDeposit);

      await expect(
        communityPool.connect(user1).deposit(overCapDeposit)
      ).to.be.revertedWithCustomError(communityPool, "PoolAtCapacity");
    });

    it("Should allow deposit up to cap", async function () {
      const { communityPool, user1 } = await loadFixture(deployCommunityPoolFixture);

      // Cap is $20,000, deposit exactly that
      const atCapDeposit = POOL_CAP;
      await usdc.mint(user1.address, atCapDeposit);

      await expect(
        communityPool.connect(user1).deposit(atCapDeposit)
      ).to.emit(communityPool, "Deposited");
    });

    it("Should track remaining capacity correctly", async function () {
      const { communityPool, user1 } = await loadFixture(deployCommunityPoolFixture);

      await communityPool.connect(user1).deposit(LARGE_DEPOSIT);

      const remaining = await communityPool.remainingCapacity();
      expect(remaining).to.equal(POOL_CAP - LARGE_DEPOSIT);
    });

    it("Should return max uint256 for uncapped pools", async function () {
      const { usdc, factory, creator } = await loadFixture(deployCommunityPoolFixture);

      // Deploy uncapped pool
      const CommunityPoolFactory = await ethers.getContractFactory("VlossomCommunityPool");
      const uncappedPool = await CommunityPoolFactory.deploy();
      await uncappedPool.initialize(
        await usdc.getAddress(),
        factory.address,
        creator.address,
        "Uncapped Pool",
        1, // Tier 1
        0, // No cap
        500
      );

      expect(await uncappedPool.remainingCapacity()).to.equal(ethers.MaxUint256);
    });
  });

  // ==========================================================================
  // Creator Fee Tests
  // ==========================================================================
  describe("Creator Fees", function () {
    it("Should accumulate creator fees on yield distribution", async function () {
      const { communityPool, usdc, user1 } = await loadFixture(deployCommunityPoolFixture);

      await communityPool.connect(user1).deposit(LARGE_DEPOSIT);

      // Distribute yield
      const yieldAmount = ethers.parseUnits("100", USDC_DECIMALS);
      await usdc.mint(user1.address, yieldAmount);
      await usdc.connect(user1).approve(await communityPool.getAddress(), yieldAmount);
      await communityPool.connect(user1).receiveYield(yieldAmount);

      // Creator fee should be 1% of yield
      const expectedCreatorFee = yieldAmount / BigInt(100);
      expect(await communityPool.creatorFees()).to.equal(expectedCreatorFee);
    });

    it("Should allow creator to claim fees", async function () {
      const { communityPool, usdc, creator, user1 } = await loadFixture(deployCommunityPoolFixture);

      await communityPool.connect(user1).deposit(LARGE_DEPOSIT);

      // Distribute yield
      const yieldAmount = ethers.parseUnits("100", USDC_DECIMALS);
      await usdc.mint(user1.address, yieldAmount);
      await usdc.connect(user1).approve(await communityPool.getAddress(), yieldAmount);
      await communityPool.connect(user1).receiveYield(yieldAmount);

      const creatorBalanceBefore = await usdc.balanceOf(creator.address);
      await communityPool.connect(creator).claimCreatorFees();
      const creatorBalanceAfter = await usdc.balanceOf(creator.address);

      expect(creatorBalanceAfter).to.be.gt(creatorBalanceBefore);
    });

    it("Should not allow non-creator to claim fees", async function () {
      const { communityPool, usdc, user1 } = await loadFixture(deployCommunityPoolFixture);

      await communityPool.connect(user1).deposit(LARGE_DEPOSIT);

      const yieldAmount = ethers.parseUnits("100", USDC_DECIMALS);
      await usdc.mint(user1.address, yieldAmount);
      await usdc.connect(user1).approve(await communityPool.getAddress(), yieldAmount);
      await communityPool.connect(user1).receiveYield(yieldAmount);

      await expect(
        communityPool.connect(user1).claimCreatorFees()
      ).to.be.revertedWithCustomError(communityPool, "NotCreator");
    });

    it("Should revert claim with no fees", async function () {
      const { communityPool, creator } = await loadFixture(deployCommunityPoolFixture);

      await expect(
        communityPool.connect(creator).claimCreatorFees()
      ).to.be.revertedWithCustomError(communityPool, "NoYieldToClaim");
    });
  });

  // ==========================================================================
  // Protocol Functions Tests
  // ==========================================================================
  describe("Protocol Functions", function () {
    it("Should allow protocol to pause pool", async function () {
      const { communityPool, factory, user1 } = await loadFixture(deployCommunityPoolFixture);

      await communityPool.connect(factory).pause();

      await expect(
        communityPool.connect(user1).deposit(LARGE_DEPOSIT)
      ).to.be.revertedWithCustomError(communityPool, "PoolIsPaused");
    });

    it("Should allow protocol to unpause pool", async function () {
      const { communityPool, factory, user1 } = await loadFixture(deployCommunityPoolFixture);

      await communityPool.connect(factory).pause();
      await communityPool.connect(factory).unpause();

      await expect(
        communityPool.connect(user1).deposit(LARGE_DEPOSIT)
      ).to.emit(communityPool, "Deposited");
    });

    it("Should allow protocol to update cap", async function () {
      const { communityPool, factory } = await loadFixture(deployCommunityPoolFixture);

      const newCap = ethers.parseUnits("50000", USDC_DECIMALS);
      await communityPool.connect(factory).setCap(newCap);

      expect(await communityPool.cap()).to.equal(newCap);
    });

    it("Should not allow non-protocol to pause", async function () {
      const { communityPool, user1 } = await loadFixture(deployCommunityPoolFixture);

      await expect(
        communityPool.connect(user1).pause()
      ).to.be.revertedWithCustomError(communityPool, "NotProtocol");
    });
  });

  // ==========================================================================
  // View Functions Tests
  // ==========================================================================
  describe("View Functions", function () {
    it("Should return correct pool info", async function () {
      const { communityPool, user1 } = await loadFixture(deployCommunityPoolFixture);

      await communityPool.connect(user1).deposit(LARGE_DEPOSIT);

      const poolInfo = await communityPool.getPoolInfo();
      expect(poolInfo.totalDeposits).to.equal(LARGE_DEPOSIT);
      expect(poolInfo.totalShares).to.be.gt(0);
      expect(poolInfo.isPaused).to.equal(false);
    });

    it("Should return correct pool details", async function () {
      const { communityPool, creator } = await loadFixture(deployCommunityPoolFixture);

      const details = await communityPool.getPoolDetails();
      expect(details._name).to.equal("Test Community Pool");
      expect(details._creator).to.equal(creator.address);
      expect(details._tier).to.equal(TIER);
      expect(details._cap).to.equal(POOL_CAP);
      expect(details._creatorFeeBps).to.equal(CREATOR_FEE_BPS);
      expect(details._isPaused).to.equal(false);
    });

    it("Should return correct share price", async function () {
      const { communityPool } = await loadFixture(deployCommunityPoolFixture);

      // Before any deposit
      expect(await communityPool.sharePrice()).to.equal(PRECISION);
    });

    it("Should return correct user balance", async function () {
      const { communityPool, user1 } = await loadFixture(deployCommunityPoolFixture);

      await communityPool.connect(user1).deposit(LARGE_DEPOSIT);

      const balance = await communityPool.balanceOf(user1.address);
      expect(balance).to.be.gt(0);
    });
  });

  // ==========================================================================
  // Edge Cases
  // ==========================================================================
  describe("Edge Cases", function () {
    it("Should handle multiple deposits from same user", async function () {
      const { communityPool, user1 } = await loadFixture(deployCommunityPoolFixture);

      await communityPool.connect(user1).deposit(MIN_FIRST_DEPOSIT);
      await communityPool.connect(user1).deposit(SMALL_DEPOSIT);

      const userDeposit = await communityPool.getUserDeposit(user1.address);
      expect(userDeposit.shares).to.be.gt(0);
    });

    it("Should handle partial withdrawals", async function () {
      const { communityPool, user1 } = await loadFixture(deployCommunityPoolFixture);

      await communityPool.connect(user1).deposit(LARGE_DEPOSIT);
      const userDeposit = await communityPool.getUserDeposit(user1.address);

      // Withdraw half
      const halfShares = userDeposit.shares / BigInt(2);
      await communityPool.connect(user1).withdraw(halfShares, 0);

      const remainingDeposit = await communityPool.getUserDeposit(user1.address);
      expect(remainingDeposit.shares).to.be.gt(0);
    });

    it("Should prevent deposits when paused", async function () {
      const { communityPool, factory, user1 } = await loadFixture(deployCommunityPoolFixture);

      await communityPool.connect(factory).pause();

      await expect(
        communityPool.connect(user1).deposit(LARGE_DEPOSIT)
      ).to.be.revertedWithCustomError(communityPool, "PoolIsPaused");
    });

    it("Should prevent withdrawals when paused", async function () {
      const { communityPool, factory, user1 } = await loadFixture(deployCommunityPoolFixture);

      await communityPool.connect(user1).deposit(LARGE_DEPOSIT);
      const userDeposit = await communityPool.getUserDeposit(user1.address);

      await communityPool.connect(factory).pause();

      await expect(
        communityPool.connect(user1).withdraw(userDeposit.shares, 0)
      ).to.be.revertedWithCustomError(communityPool, "PoolIsPaused");
    });
  });
});
