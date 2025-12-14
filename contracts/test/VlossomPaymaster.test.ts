import { expect } from "chai";
import { ethers } from "hardhat";
import { VlossomPaymaster, MockEntryPoint } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";

describe("VlossomPaymaster", function () {
  // Test accounts
  let owner: SignerWithAddress;
  let wallet1: SignerWithAddress;
  let wallet2: SignerWithAddress;
  let targetContract: SignerWithAddress;
  let otherContract: SignerWithAddress;
  let otherUser: SignerWithAddress;

  // Contracts
  let paymaster: VlossomPaymaster;
  let mockEntryPoint: MockEntryPoint;

  // Default rate limit settings
  const DEFAULT_MAX_OPS = 50n;
  const DEFAULT_WINDOW = 86400n; // 1 day in seconds

  async function deployPaymasterFixture() {
    [owner, wallet1, wallet2, targetContract, otherContract, otherUser] = await ethers.getSigners();

    // Deploy mock EntryPoint
    const MockEntryPointFactory = await ethers.getContractFactory("MockEntryPoint");
    mockEntryPoint = await MockEntryPointFactory.deploy();
    await mockEntryPoint.waitForDeployment();

    // Deploy paymaster with mock EntryPoint
    const PaymasterFactory = await ethers.getContractFactory("VlossomPaymaster");
    paymaster = await PaymasterFactory.deploy(await mockEntryPoint.getAddress(), owner.address);
    await paymaster.waitForDeployment();

    return { paymaster, mockEntryPoint, owner, wallet1, wallet2, targetContract, otherContract, otherUser };
  }

  describe("Deployment", function () {
    it("Should set the correct owner", async function () {
      const { paymaster, owner } = await loadFixture(deployPaymasterFixture);
      expect(await paymaster.owner()).to.equal(owner.address);
    });

    it("Should set default rate limit settings", async function () {
      const { paymaster } = await loadFixture(deployPaymasterFixture);
      const [maxOps, windowSeconds] = await paymaster.getRateLimitSettings();
      expect(maxOps).to.equal(DEFAULT_MAX_OPS);
      expect(windowSeconds).to.equal(DEFAULT_WINDOW);
    });

    it("Should not be paused initially", async function () {
      const { paymaster } = await loadFixture(deployPaymasterFixture);
      expect(await paymaster.paused()).to.equal(false);
    });
  });

  describe("Whitelist Management", function () {
    it("Should allow owner to whitelist target", async function () {
      const { paymaster, owner, targetContract } = await loadFixture(deployPaymasterFixture);

      await expect(paymaster.connect(owner).setWhitelistedTarget(targetContract.address, true))
        .to.emit(paymaster, "WhitelistUpdated")
        .withArgs(targetContract.address, true);

      expect(await paymaster.isWhitelisted(targetContract.address)).to.be.true;
    });

    it("Should allow owner to remove target from whitelist", async function () {
      const { paymaster, owner, targetContract } = await loadFixture(deployPaymasterFixture);

      await paymaster.connect(owner).setWhitelistedTarget(targetContract.address, true);
      await expect(paymaster.connect(owner).setWhitelistedTarget(targetContract.address, false))
        .to.emit(paymaster, "WhitelistUpdated")
        .withArgs(targetContract.address, false);

      expect(await paymaster.isWhitelisted(targetContract.address)).to.be.false;
    });

    it("Should revert if non-owner tries to update whitelist", async function () {
      const { paymaster, targetContract, otherUser } = await loadFixture(deployPaymasterFixture);

      await expect(
        paymaster.connect(otherUser).setWhitelistedTarget(targetContract.address, true)
      ).to.be.revertedWithCustomError(paymaster, "OwnableUnauthorizedAccount");
    });

    it("Should return false for non-whitelisted target", async function () {
      const { paymaster, targetContract } = await loadFixture(deployPaymasterFixture);
      expect(await paymaster.isWhitelisted(targetContract.address)).to.be.false;
    });
  });

  describe("Rate Limit Management", function () {
    it("Should allow owner to set rate limit", async function () {
      const { paymaster, owner } = await loadFixture(deployPaymasterFixture);

      const newMaxOps = 100n;
      const newWindow = 3600n; // 1 hour

      await expect(paymaster.connect(owner).setRateLimit(newMaxOps, newWindow))
        .to.emit(paymaster, "RateLimitUpdated")
        .withArgs(newMaxOps, newWindow);

      const [maxOps, windowSeconds] = await paymaster.getRateLimitSettings();
      expect(maxOps).to.equal(newMaxOps);
      expect(windowSeconds).to.equal(newWindow);
    });

    it("Should revert if maxOpsPerWindow is zero", async function () {
      const { paymaster, owner } = await loadFixture(deployPaymasterFixture);

      await expect(paymaster.connect(owner).setRateLimit(0, 3600)).to.be.revertedWithCustomError(
        paymaster,
        "InvalidRateLimit"
      );
    });

    it("Should revert if windowSeconds is zero", async function () {
      const { paymaster, owner } = await loadFixture(deployPaymasterFixture);

      await expect(paymaster.connect(owner).setRateLimit(100, 0)).to.be.revertedWithCustomError(
        paymaster,
        "InvalidRateLimit"
      );
    });

    it("Should revert if non-owner tries to set rate limit", async function () {
      const { paymaster, otherUser } = await loadFixture(deployPaymasterFixture);

      await expect(paymaster.connect(otherUser).setRateLimit(100, 3600)).to.be.revertedWithCustomError(
        paymaster,
        "OwnableUnauthorizedAccount"
      );
    });
  });

  describe("Operation Count", function () {
    it("Should return zero for wallet with no operations", async function () {
      const { paymaster, wallet1 } = await loadFixture(deployPaymasterFixture);
      expect(await paymaster.getOperationCount(wallet1.address)).to.equal(0);
    });
  });

  describe("Pause/Unpause", function () {
    it("Should allow owner to pause", async function () {
      const { paymaster, owner } = await loadFixture(deployPaymasterFixture);

      await expect(paymaster.connect(owner).pause())
        .to.emit(paymaster, "PaymasterPaused")
        .withArgs(owner.address);

      expect(await paymaster.paused()).to.be.true;
    });

    it("Should allow owner to unpause", async function () {
      const { paymaster, owner } = await loadFixture(deployPaymasterFixture);

      await paymaster.connect(owner).pause();
      await expect(paymaster.connect(owner).unpause())
        .to.emit(paymaster, "PaymasterUnpaused")
        .withArgs(owner.address);

      expect(await paymaster.paused()).to.be.false;
    });

    it("Should revert if non-owner tries to pause", async function () {
      const { paymaster, otherUser } = await loadFixture(deployPaymasterFixture);

      await expect(paymaster.connect(otherUser).pause()).to.be.revertedWithCustomError(
        paymaster,
        "OwnableUnauthorizedAccount"
      );
    });

    it("Should revert if non-owner tries to unpause", async function () {
      const { paymaster, owner, otherUser } = await loadFixture(deployPaymasterFixture);

      await paymaster.connect(owner).pause();

      await expect(paymaster.connect(otherUser).unpause()).to.be.revertedWithCustomError(
        paymaster,
        "OwnableUnauthorizedAccount"
      );
    });
  });

  describe("Deposit Management", function () {
    it("Should accept ETH via receive", async function () {
      const { paymaster, owner } = await loadFixture(deployPaymasterFixture);

      const amount = ethers.parseEther("1.0");

      await expect(
        owner.sendTransaction({
          to: await paymaster.getAddress(),
          value: amount,
        })
      )
        .to.emit(paymaster, "Funded")
        .withArgs(owner.address, amount);
    });
  });

  describe("EntryPoint Integration", function () {
    // Note: Full integration tests with EntryPoint require a fork or mock
    // These tests verify the contract compiles and basic functionality works

    it("Should have correct EntryPoint set", async function () {
      const { paymaster, mockEntryPoint } = await loadFixture(deployPaymasterFixture);
      // entryPoint is inherited from BasePaymaster
      expect(await paymaster.entryPoint()).to.equal(await mockEntryPoint.getAddress());
    });
  });

  describe("Edge Cases", function () {
    it("Should handle multiple whitelists correctly", async function () {
      const { paymaster, owner, targetContract, otherContract } = await loadFixture(
        deployPaymasterFixture
      );

      // Whitelist multiple targets
      await paymaster.connect(owner).setWhitelistedTarget(targetContract.address, true);
      await paymaster.connect(owner).setWhitelistedTarget(otherContract.address, true);

      expect(await paymaster.isWhitelisted(targetContract.address)).to.be.true;
      expect(await paymaster.isWhitelisted(otherContract.address)).to.be.true;

      // Remove one
      await paymaster.connect(owner).setWhitelistedTarget(targetContract.address, false);

      expect(await paymaster.isWhitelisted(targetContract.address)).to.be.false;
      expect(await paymaster.isWhitelisted(otherContract.address)).to.be.true;
    });

    it("Should allow updating rate limit multiple times", async function () {
      const { paymaster, owner } = await loadFixture(deployPaymasterFixture);

      await paymaster.connect(owner).setRateLimit(10, 60);
      let [maxOps, windowSeconds] = await paymaster.getRateLimitSettings();
      expect(maxOps).to.equal(10);
      expect(windowSeconds).to.equal(60);

      await paymaster.connect(owner).setRateLimit(200, 7200);
      [maxOps, windowSeconds] = await paymaster.getRateLimitSettings();
      expect(maxOps).to.equal(200);
      expect(windowSeconds).to.equal(7200);
    });

    it("Should pause and unpause correctly in sequence", async function () {
      const { paymaster, owner } = await loadFixture(deployPaymasterFixture);

      expect(await paymaster.paused()).to.be.false;

      await paymaster.connect(owner).pause();
      expect(await paymaster.paused()).to.be.true;

      await paymaster.connect(owner).unpause();
      expect(await paymaster.paused()).to.be.false;

      await paymaster.connect(owner).pause();
      expect(await paymaster.paused()).to.be.true;
    });
  });
});
