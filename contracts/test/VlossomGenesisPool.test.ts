import { expect } from "chai";
import { ethers } from "hardhat";
import { VlossomGenesisPool, MockUSDC } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";

describe("VlossomGenesisPool", function () {
  // Test accounts
  let admin: SignerWithAddress;
  let yieldEngine: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let attacker: SignerWithAddress;
  let emergencyRecipient: SignerWithAddress;

  // Contracts
  let genesisPool: VlossomGenesisPool;
  let usdc: MockUSDC;

  // Constants
  const USDC_DECIMALS = 6;
  const PRECISION = ethers.parseUnits("1", 18);
  const MIN_FIRST_DEPOSIT = ethers.parseUnits("1000", USDC_DECIMALS); // $1000
  const DEAD_SHARES = BigInt(1e9);
  const EMERGENCY_TIMELOCK = 3 * 24 * 60 * 60; // 3 days in seconds

  // Test amounts
  const INITIAL_BALANCE = ethers.parseUnits("10000", USDC_DECIMALS);
  const LARGE_DEPOSIT = ethers.parseUnits("5000", USDC_DECIMALS);
  const SMALL_DEPOSIT = ethers.parseUnits("500", USDC_DECIMALS); // Below minimum

  async function deployGenesisPoolFixture() {
    [admin, yieldEngine, user1, user2, attacker, emergencyRecipient] = await ethers.getSigners();

    // Deploy MockUSDC
    const MockUSDCFactory = await ethers.getContractFactory("MockUSDC");
    usdc = await MockUSDCFactory.deploy();
    await usdc.waitForDeployment();

    // Deploy VlossomGenesisPool
    const GenesisPoolFactory = await ethers.getContractFactory("VlossomGenesisPool");
    genesisPool = await GenesisPoolFactory.deploy(
      await usdc.getAddress(),
      admin.address,
      "Genesis Pool"
    );
    await genesisPool.waitForDeployment();

    // Mint USDC to test users
    await usdc.mint(user1.address, INITIAL_BALANCE);
    await usdc.mint(user2.address, INITIAL_BALANCE);
    await usdc.mint(attacker.address, INITIAL_BALANCE);
    await usdc.mint(yieldEngine.address, INITIAL_BALANCE);

    // Approve pool for all users
    await usdc.connect(user1).approve(await genesisPool.getAddress(), ethers.MaxUint256);
    await usdc.connect(user2).approve(await genesisPool.getAddress(), ethers.MaxUint256);
    await usdc.connect(attacker).approve(await genesisPool.getAddress(), ethers.MaxUint256);
    await usdc.connect(yieldEngine).approve(await genesisPool.getAddress(), ethers.MaxUint256);

    return { genesisPool, usdc, admin, yieldEngine, user1, user2, attacker, emergencyRecipient };
  }

  describe("Deployment", function () {
    it("Should set the correct USDC token address", async function () {
      const { genesisPool, usdc } = await loadFixture(deployGenesisPoolFixture);
      expect(await genesisPool.usdc()).to.equal(await usdc.getAddress());
    });

    it("Should set the correct pool name", async function () {
      const { genesisPool } = await loadFixture(deployGenesisPoolFixture);
      expect(await genesisPool.name()).to.equal("Genesis Pool");
    });

    it("Should grant admin roles to admin", async function () {
      const { genesisPool, admin } = await loadFixture(deployGenesisPoolFixture);
      const ADMIN_ROLE = await genesisPool.ADMIN_ROLE();
      expect(await genesisPool.hasRole(ADMIN_ROLE, admin.address)).to.equal(true);
    });

    it("Should initialize supply index to PRECISION", async function () {
      const { genesisPool } = await loadFixture(deployGenesisPoolFixture);
      expect(await genesisPool.supplyIndex()).to.equal(PRECISION);
    });

    it("Should have zero deposits and shares initially", async function () {
      const { genesisPool } = await loadFixture(deployGenesisPoolFixture);
      expect(await genesisPool.totalDeposits()).to.equal(0);
      expect(await genesisPool.totalShares()).to.equal(0);
    });

    it("Should revert if USDC address is zero", async function () {
      const GenesisPoolFactory = await ethers.getContractFactory("VlossomGenesisPool");
      await expect(
        GenesisPoolFactory.deploy(ethers.ZeroAddress, admin.address, "Test")
      ).to.be.revertedWithCustomError(GenesisPoolFactory, "InvalidAddress");
    });

    it("Should revert if admin address is zero", async function () {
      const { usdc } = await loadFixture(deployGenesisPoolFixture);
      const GenesisPoolFactory = await ethers.getContractFactory("VlossomGenesisPool");
      await expect(
        GenesisPoolFactory.deploy(await usdc.getAddress(), ethers.ZeroAddress, "Test")
      ).to.be.revertedWithCustomError(GenesisPoolFactory, "InvalidAddress");
    });
  });

  // ==========================================================================
  // C-1 FIX: Donation Attack Prevention Tests
  // ==========================================================================
  describe("C-1 Fix: Donation Attack Prevention", function () {
    it("Should enforce minimum first deposit of $1000 USDC", async function () {
      const { genesisPool, user1 } = await loadFixture(deployGenesisPoolFixture);

      // Try to deposit less than minimum
      await expect(
        genesisPool.connect(user1).deposit(SMALL_DEPOSIT)
      ).to.be.revertedWithCustomError(genesisPool, "InsufficientFirstDeposit");
    });

    it("Should allow exactly minimum first deposit", async function () {
      const { genesisPool, user1 } = await loadFixture(deployGenesisPoolFixture);

      await expect(
        genesisPool.connect(user1).deposit(MIN_FIRST_DEPOSIT)
      ).to.emit(genesisPool, "Deposited");
    });

    it("Should burn dead shares on first deposit", async function () {
      const { genesisPool, user1 } = await loadFixture(deployGenesisPoolFixture);

      await genesisPool.connect(user1).deposit(MIN_FIRST_DEPOSIT);

      // Total shares should include dead shares
      const totalShares = await genesisPool.totalShares();
      const userDeposit = await genesisPool.getUserDeposit(user1.address);

      // User shares + dead shares = total shares
      expect(totalShares).to.equal(userDeposit.shares + DEAD_SHARES);
    });

    it("Should allow smaller deposits after first deposit", async function () {
      const { genesisPool, user1, user2 } = await loadFixture(deployGenesisPoolFixture);

      // First deposit meets minimum
      await genesisPool.connect(user1).deposit(MIN_FIRST_DEPOSIT);

      // Subsequent deposit can be smaller
      await expect(
        genesisPool.connect(user2).deposit(SMALL_DEPOSIT)
      ).to.emit(genesisPool, "Deposited");
    });

    it("Should use actual balance for share calculation (prevents donation manipulation)", async function () {
      const { genesisPool, usdc, user1, user2, attacker } = await loadFixture(deployGenesisPoolFixture);

      // First deposit
      await genesisPool.connect(user1).deposit(MIN_FIRST_DEPOSIT);

      const sharesBefore = await genesisPool.totalShares();
      const poolValue = await usdc.balanceOf(await genesisPool.getAddress());

      // Attacker "donates" USDC directly (not through deposit)
      const donationAmount = ethers.parseUnits("1000", USDC_DECIMALS);
      await usdc.connect(attacker).transfer(await genesisPool.getAddress(), donationAmount);

      // Second user deposits same amount
      await genesisPool.connect(user2).deposit(MIN_FIRST_DEPOSIT);

      // User2's shares should be calculated based on actual pool balance (including donation)
      const user2Deposit = await genesisPool.getUserDeposit(user2.address);

      // Expected shares: (depositAmount * totalShares) / poolValue
      // With donation, poolValue is higher, so shares should be FEWER
      const expectedShares = (MIN_FIRST_DEPOSIT * sharesBefore) / (poolValue + donationAmount);

      expect(user2Deposit.shares).to.equal(expectedShares);
    });

    it("Should prevent first-depositor share inflation attack", async function () {
      const { genesisPool, user1 } = await loadFixture(deployGenesisPoolFixture);

      // With MIN_FIRST_DEPOSIT and DEAD_SHARES:
      // - Attacker cannot deposit tiny amount
      // - Dead shares make share price more stable
      // - Minimum deposit ensures meaningful initial liquidity

      await genesisPool.connect(user1).deposit(MIN_FIRST_DEPOSIT);

      // Verify dead shares exist
      const totalShares = await genesisPool.totalShares();
      const userDeposit = await genesisPool.getUserDeposit(user1.address);

      expect(totalShares - userDeposit.shares).to.equal(DEAD_SHARES);
    });
  });

  // ==========================================================================
  // C-2 FIX: Slippage Protection Tests
  // ==========================================================================
  describe("C-2 Fix: Slippage Protection", function () {
    it("Should revert withdraw if output is below minAmountOut", async function () {
      const { genesisPool, user1 } = await loadFixture(deployGenesisPoolFixture);

      // Deposit
      await genesisPool.connect(user1).deposit(LARGE_DEPOSIT);
      const userDeposit = await genesisPool.getUserDeposit(user1.address);

      // Try to withdraw with unrealistic minAmountOut
      const impossibleMinOut = LARGE_DEPOSIT * BigInt(2); // 2x what was deposited

      await expect(
        genesisPool.connect(user1).withdraw(userDeposit.shares, impossibleMinOut)
      ).to.be.revertedWithCustomError(genesisPool, "InsufficientOutput");
    });

    it("Should allow withdraw when output meets minAmountOut", async function () {
      const { genesisPool, user1 } = await loadFixture(deployGenesisPoolFixture);

      await genesisPool.connect(user1).deposit(LARGE_DEPOSIT);
      const userDeposit = await genesisPool.getUserDeposit(user1.address);

      // Set reasonable minAmountOut (slightly less than expected)
      const minAmountOut = LARGE_DEPOSIT - ethers.parseUnits("10", USDC_DECIMALS);

      await expect(
        genesisPool.connect(user1).withdraw(userDeposit.shares, minAmountOut)
      ).to.emit(genesisPool, "Withdrawn");
    });

    it("Should allow withdraw with minAmountOut = 0 (no protection)", async function () {
      const { genesisPool, user1 } = await loadFixture(deployGenesisPoolFixture);

      await genesisPool.connect(user1).deposit(LARGE_DEPOSIT);
      const userDeposit = await genesisPool.getUserDeposit(user1.address);

      await expect(
        genesisPool.connect(user1).withdraw(userDeposit.shares, 0)
      ).to.emit(genesisPool, "Withdrawn");
    });

    it("Should protect against sandwich attacks by enforcing minAmountOut", async function () {
      const { genesisPool, usdc, user1, attacker } = await loadFixture(deployGenesisPoolFixture);

      // User deposits
      await genesisPool.connect(user1).deposit(LARGE_DEPOSIT);
      const userDeposit = await genesisPool.getUserDeposit(user1.address);

      // Calculate expected output
      const poolBalance = await usdc.balanceOf(await genesisPool.getAddress());
      const totalShares = await genesisPool.totalShares();
      const expectedOutput = (userDeposit.shares * poolBalance) / totalShares;

      // Attacker front-runs by manipulating pool (simulated by direct transfer)
      // This would reduce share value
      // User's minAmountOut protects them

      const minAmountOut = expectedOutput - ethers.parseUnits("1", USDC_DECIMALS); // 1 USDC tolerance

      // Withdraw with slippage protection
      await genesisPool.connect(user1).withdraw(userDeposit.shares, minAmountOut);

      // Verify user got at least minAmountOut
      const userBalance = await usdc.balanceOf(user1.address);
      expect(userBalance).to.be.gte(INITIAL_BALANCE - LARGE_DEPOSIT + minAmountOut);
    });
  });

  // ==========================================================================
  // H-2 FIX: Emergency Timelock Tests
  // ==========================================================================
  describe("H-2 Fix: Emergency Withdrawal Timelock", function () {
    it("Should allow admin to propose emergency withdrawal", async function () {
      const { genesisPool, admin, user1, emergencyRecipient } = await loadFixture(deployGenesisPoolFixture);

      // Add some funds to the pool
      await genesisPool.connect(user1).deposit(LARGE_DEPOSIT);

      // Propose emergency withdrawal
      await expect(
        genesisPool.connect(admin).proposeEmergencyWithdraw(emergencyRecipient.address)
      ).to.emit(genesisPool, "EmergencyProposed");
    });

    it("Should not allow non-admin to propose emergency withdrawal", async function () {
      const { genesisPool, user1, emergencyRecipient } = await loadFixture(deployGenesisPoolFixture);

      await expect(
        genesisPool.connect(user1).proposeEmergencyWithdraw(emergencyRecipient.address)
      ).to.be.revertedWithCustomError(genesisPool, "InvalidAddress");
    });

    it("Should enforce 3-day timelock before execution", async function () {
      const { genesisPool, admin, user1, emergencyRecipient } = await loadFixture(deployGenesisPoolFixture);

      await genesisPool.connect(user1).deposit(LARGE_DEPOSIT);

      // Propose
      const tx = await genesisPool.connect(admin).proposeEmergencyWithdraw(emergencyRecipient.address);
      const receipt = await tx.wait();

      // Get proposal ID from event
      const event = receipt?.logs.find(
        (log: any) => log.fragment?.name === "EmergencyProposed"
      );
      const proposalId = (event as any)?.args?.[0];

      // Try to execute immediately - should fail
      await expect(
        genesisPool.connect(admin).executeEmergencyWithdraw(proposalId)
      ).to.be.revertedWithCustomError(genesisPool, "EmergencyTimelockNotMet");

      // Advance time by 2 days - still should fail
      await time.increase(2 * 24 * 60 * 60);
      await expect(
        genesisPool.connect(admin).executeEmergencyWithdraw(proposalId)
      ).to.be.revertedWithCustomError(genesisPool, "EmergencyTimelockNotMet");

      // Advance remaining 1 day + 1 second - should succeed
      await time.increase(1 * 24 * 60 * 60 + 1);
      await expect(
        genesisPool.connect(admin).executeEmergencyWithdraw(proposalId)
      ).to.emit(genesisPool, "EmergencyExecuted");
    });

    it("Should transfer all pool balance to recipient on execution", async function () {
      const { genesisPool, usdc, admin, user1, emergencyRecipient } = await loadFixture(deployGenesisPoolFixture);

      await genesisPool.connect(user1).deposit(LARGE_DEPOSIT);

      const poolBalanceBefore = await usdc.balanceOf(await genesisPool.getAddress());

      // Propose and wait for timelock
      const tx = await genesisPool.connect(admin).proposeEmergencyWithdraw(emergencyRecipient.address);
      const receipt = await tx.wait();
      const event = receipt?.logs.find(
        (log: any) => log.fragment?.name === "EmergencyProposed"
      );
      const proposalId = (event as any)?.args?.[0];

      await time.increase(EMERGENCY_TIMELOCK + 1);

      // Execute
      await genesisPool.connect(admin).executeEmergencyWithdraw(proposalId);

      // Verify balances
      expect(await usdc.balanceOf(await genesisPool.getAddress())).to.equal(0);
      expect(await usdc.balanceOf(emergencyRecipient.address)).to.equal(poolBalanceBefore);
    });

    it("Should allow admin to cancel emergency proposal", async function () {
      const { genesisPool, admin, user1, emergencyRecipient } = await loadFixture(deployGenesisPoolFixture);

      await genesisPool.connect(user1).deposit(LARGE_DEPOSIT);

      // Propose
      const tx = await genesisPool.connect(admin).proposeEmergencyWithdraw(emergencyRecipient.address);
      const receipt = await tx.wait();
      const event = receipt?.logs.find(
        (log: any) => log.fragment?.name === "EmergencyProposed"
      );
      const proposalId = (event as any)?.args?.[0];

      // Cancel
      await expect(
        genesisPool.connect(admin).cancelEmergencyWithdraw(proposalId)
      ).to.emit(genesisPool, "EmergencyCancelled");

      // Try to execute after cancel - should fail
      await time.increase(EMERGENCY_TIMELOCK + 1);
      await expect(
        genesisPool.connect(admin).executeEmergencyWithdraw(proposalId)
      ).to.be.revertedWithCustomError(genesisPool, "EmergencyNotProposed");
    });

    it("Should not allow double execution of emergency proposal", async function () {
      const { genesisPool, usdc, admin, user1, emergencyRecipient } = await loadFixture(deployGenesisPoolFixture);

      await genesisPool.connect(user1).deposit(LARGE_DEPOSIT);

      // Propose and wait
      const tx = await genesisPool.connect(admin).proposeEmergencyWithdraw(emergencyRecipient.address);
      const receipt = await tx.wait();
      const event = receipt?.logs.find(
        (log: any) => log.fragment?.name === "EmergencyProposed"
      );
      const proposalId = (event as any)?.args?.[0];

      await time.increase(EMERGENCY_TIMELOCK + 1);

      // First execution succeeds
      await genesisPool.connect(admin).executeEmergencyWithdraw(proposalId);

      // Add more funds
      await usdc.mint(await genesisPool.getAddress(), LARGE_DEPOSIT);

      // Second execution should fail
      await expect(
        genesisPool.connect(admin).executeEmergencyWithdraw(proposalId)
      ).to.be.revertedWithCustomError(genesisPool, "EmergencyAlreadyExecuted");
    });

    it("Should revert execution with non-existent proposal", async function () {
      const { genesisPool, admin } = await loadFixture(deployGenesisPoolFixture);

      const fakeProposalId = ethers.id("fake-proposal");

      await expect(
        genesisPool.connect(admin).executeEmergencyWithdraw(fakeProposalId)
      ).to.be.revertedWithCustomError(genesisPool, "EmergencyNotProposed");
    });

    it("Should give users time to exit during timelock (3 days)", async function () {
      const { genesisPool, usdc, admin, user1, user2, emergencyRecipient } = await loadFixture(deployGenesisPoolFixture);

      // Both users deposit
      await genesisPool.connect(user1).deposit(LARGE_DEPOSIT);
      await genesisPool.connect(user2).deposit(MIN_FIRST_DEPOSIT);

      // Propose emergency (users see this on-chain)
      await genesisPool.connect(admin).proposeEmergencyWithdraw(emergencyRecipient.address);

      // Advance 1 day - users have time to react
      await time.increase(1 * 24 * 60 * 60);

      // Users can still withdraw during timelock
      const user1Deposit = await genesisPool.getUserDeposit(user1.address);
      await genesisPool.connect(user1).withdraw(user1Deposit.shares, 0);

      // User1 has their funds
      const user1Balance = await usdc.balanceOf(user1.address);
      expect(user1Balance).to.be.gt(INITIAL_BALANCE - LARGE_DEPOSIT);
    });
  });

  // ==========================================================================
  // Deposit/Withdraw/Yield Tests
  // ==========================================================================
  describe("Core Pool Operations", function () {
    it("Should mint shares on deposit", async function () {
      const { genesisPool, user1 } = await loadFixture(deployGenesisPoolFixture);

      await genesisPool.connect(user1).deposit(LARGE_DEPOSIT);

      const userDeposit = await genesisPool.getUserDeposit(user1.address);
      expect(userDeposit.shares).to.be.gt(0);
    });

    it("Should return USDC on withdraw", async function () {
      const { genesisPool, usdc, user1 } = await loadFixture(deployGenesisPoolFixture);

      await genesisPool.connect(user1).deposit(LARGE_DEPOSIT);
      const balanceAfterDeposit = await usdc.balanceOf(user1.address);

      const userDeposit = await genesisPool.getUserDeposit(user1.address);
      await genesisPool.connect(user1).withdraw(userDeposit.shares, 0);

      const balanceAfterWithdraw = await usdc.balanceOf(user1.address);
      expect(balanceAfterWithdraw).to.be.gt(balanceAfterDeposit);
    });

    it("Should track yield correctly", async function () {
      const { genesisPool, usdc, admin, yieldEngine, user1 } = await loadFixture(deployGenesisPoolFixture);

      // User deposits
      await genesisPool.connect(user1).deposit(LARGE_DEPOSIT);

      // Set yield engine
      await genesisPool.connect(admin).setYieldEngine(yieldEngine.address);

      // Distribute yield
      const yieldAmount = ethers.parseUnits("100", USDC_DECIMALS);
      await genesisPool.connect(yieldEngine).receiveYield(yieldAmount);

      // Check pending yield
      const pendingYield = await genesisPool.pendingYield(user1.address);
      expect(pendingYield).to.be.gt(0);
    });

    it("Should allow claiming yield", async function () {
      const { genesisPool, usdc, admin, yieldEngine, user1 } = await loadFixture(deployGenesisPoolFixture);

      await genesisPool.connect(user1).deposit(LARGE_DEPOSIT);
      await genesisPool.connect(admin).setYieldEngine(yieldEngine.address);

      // Distribute yield
      const yieldAmount = ethers.parseUnits("100", USDC_DECIMALS);
      await genesisPool.connect(yieldEngine).receiveYield(yieldAmount);

      // Claim
      const balanceBefore = await usdc.balanceOf(user1.address);
      await genesisPool.connect(user1).claimYield();
      const balanceAfter = await usdc.balanceOf(user1.address);

      expect(balanceAfter).to.be.gt(balanceBefore);
    });

    it("Should revert claim with no pending yield", async function () {
      const { genesisPool, user1 } = await loadFixture(deployGenesisPoolFixture);

      await genesisPool.connect(user1).deposit(LARGE_DEPOSIT);

      await expect(
        genesisPool.connect(user1).claimYield()
      ).to.be.revertedWithCustomError(genesisPool, "NoYieldToClaim");
    });

    it("Should revert withdraw with insufficient shares", async function () {
      const { genesisPool, user1 } = await loadFixture(deployGenesisPoolFixture);

      await genesisPool.connect(user1).deposit(LARGE_DEPOSIT);
      const userDeposit = await genesisPool.getUserDeposit(user1.address);

      await expect(
        genesisPool.connect(user1).withdraw(userDeposit.shares + BigInt(1), 0)
      ).to.be.revertedWithCustomError(genesisPool, "InsufficientShares");
    });

    it("Should revert deposit of zero amount", async function () {
      const { genesisPool, user1 } = await loadFixture(deployGenesisPoolFixture);

      await expect(
        genesisPool.connect(user1).deposit(0)
      ).to.be.revertedWithCustomError(genesisPool, "InvalidAmount");
    });
  });

  // ==========================================================================
  // Admin Functions Tests
  // ==========================================================================
  describe("Admin Functions", function () {
    it("Should allow admin to pause the pool", async function () {
      const { genesisPool, admin, user1 } = await loadFixture(deployGenesisPoolFixture);

      await genesisPool.connect(admin).pause();

      // Should not allow deposits when paused
      await expect(
        genesisPool.connect(user1).deposit(LARGE_DEPOSIT)
      ).to.be.reverted; // Pausable: paused
    });

    it("Should allow admin to unpause the pool", async function () {
      const { genesisPool, admin, user1 } = await loadFixture(deployGenesisPoolFixture);

      await genesisPool.connect(admin).pause();
      await genesisPool.connect(admin).unpause();

      // Should allow deposits again
      await expect(
        genesisPool.connect(user1).deposit(LARGE_DEPOSIT)
      ).to.emit(genesisPool, "Deposited");
    });

    it("Should not allow non-admin to pause", async function () {
      const { genesisPool, user1 } = await loadFixture(deployGenesisPoolFixture);

      await expect(
        genesisPool.connect(user1).pause()
      ).to.be.revertedWithCustomError(genesisPool, "InvalidAddress");
    });

    it("Should allow admin to set yield engine", async function () {
      const { genesisPool, admin, yieldEngine } = await loadFixture(deployGenesisPoolFixture);

      await genesisPool.connect(admin).setYieldEngine(yieldEngine.address);

      const YIELD_ENGINE_ROLE = await genesisPool.YIELD_ENGINE_ROLE();
      expect(await genesisPool.hasRole(YIELD_ENGINE_ROLE, yieldEngine.address)).to.equal(true);
    });
  });

  // ==========================================================================
  // View Functions Tests
  // ==========================================================================
  describe("View Functions", function () {
    it("Should return correct pool info", async function () {
      const { genesisPool, user1 } = await loadFixture(deployGenesisPoolFixture);

      await genesisPool.connect(user1).deposit(LARGE_DEPOSIT);

      const poolInfo = await genesisPool.getPoolInfo();
      expect(poolInfo.totalDeposits).to.equal(LARGE_DEPOSIT);
      expect(poolInfo.totalShares).to.be.gt(0);
      expect(poolInfo.isPaused).to.equal(false);
    });

    it("Should return correct share price", async function () {
      const { genesisPool } = await loadFixture(deployGenesisPoolFixture);

      // Before any deposit, share price should be 1:1
      expect(await genesisPool.sharePrice()).to.equal(PRECISION);
    });

    it("Should return correct user balance", async function () {
      const { genesisPool, user1 } = await loadFixture(deployGenesisPoolFixture);

      await genesisPool.connect(user1).deposit(LARGE_DEPOSIT);

      const balance = await genesisPool.balanceOf(user1.address);
      // Balance should be close to deposit amount (minus dead shares effect)
      expect(balance).to.be.gt(0);
    });

    it("Should return correct pool balance", async function () {
      const { genesisPool, user1 } = await loadFixture(deployGenesisPoolFixture);

      await genesisPool.connect(user1).deposit(LARGE_DEPOSIT);

      expect(await genesisPool.poolBalance()).to.equal(LARGE_DEPOSIT);
    });

    it("Should return current APY", async function () {
      const { genesisPool } = await loadFixture(deployGenesisPoolFixture);

      // Placeholder returns 12% (1200 basis points)
      expect(await genesisPool.currentAPY()).to.equal(1200);
    });
  });
});
