import { expect } from "chai";
import { ethers } from "hardhat";
import { VlossomAccount, VlossomAccountFactory, MockEntryPoint } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";

describe("VlossomAccount", function () {
  // Test accounts
  let owner: SignerWithAddress;
  let newOwner: SignerWithAddress;
  let guardian1: SignerWithAddress;
  let guardian2: SignerWithAddress;
  let guardian3: SignerWithAddress;
  let nonGuardian: SignerWithAddress;

  // Contracts
  let account: VlossomAccount;
  let factory: VlossomAccountFactory;
  let mockEntryPoint: MockEntryPoint;

  // Constants
  const RECOVERY_DELAY = 48 * 60 * 60; // 48 hours in seconds
  const MIN_APPROVALS = 2;

  async function deployAccountFixture() {
    [owner, newOwner, guardian1, guardian2, guardian3, nonGuardian] = await ethers.getSigners();

    // Deploy mock EntryPoint
    const MockEntryPointFactory = await ethers.getContractFactory("MockEntryPoint");
    mockEntryPoint = await MockEntryPointFactory.deploy();
    await mockEntryPoint.waitForDeployment();

    // Deploy factory (requires entryPoint and initialOwner)
    const FactoryContract = await ethers.getContractFactory("VlossomAccountFactory");
    factory = await FactoryContract.deploy(await mockEntryPoint.getAddress(), owner.address);
    await factory.waitForDeployment();

    // Create account (userId is bytes32, owner is address)
    const userId = ethers.id("test-user-123");
    const tx = await factory.createAccount(userId, owner.address);
    await tx.wait();
    const accountAddress = await factory.getAccountByUserId(userId);
    account = await ethers.getContractAt("VlossomAccount", accountAddress);

    return { account, factory, mockEntryPoint, owner, newOwner, guardian1, guardian2, guardian3, nonGuardian };
  }

  describe("Guardian Management", function () {
    it("Should allow owner to add guardians", async function () {
      const { account, guardian1 } = await loadFixture(deployAccountFixture);

      await account.addGuardian(guardian1.address);
      expect(await account.isGuardian(guardian1.address)).to.equal(true);
    });

    it("Should not allow adding more than MAX_GUARDIANS", async function () {
      const { account, owner } = await loadFixture(deployAccountFixture);
      const signers = await ethers.getSigners();

      // Add 5 guardians (MAX)
      for (let i = 2; i <= 6; i++) {
        await account.addGuardian(signers[i].address);
      }

      // 6th guardian should fail
      await expect(account.addGuardian(signers[7].address))
        .to.be.revertedWithCustomError(account, "MaxGuardiansReached");
    });

    it("Should allow owner to remove guardians", async function () {
      const { account, guardian1 } = await loadFixture(deployAccountFixture);

      await account.addGuardian(guardian1.address);
      await account.removeGuardian(guardian1.address);
      expect(await account.isGuardian(guardian1.address)).to.equal(false);
    });
  });

  describe("Recovery - Initiation", function () {
    it("Should allow guardian to initiate recovery", async function () {
      const { account, guardian1, guardian2, newOwner } = await loadFixture(deployAccountFixture);

      // Need at least 2 guardians for recovery
      await account.addGuardian(guardian1.address);
      await account.addGuardian(guardian2.address);

      await expect(account.connect(guardian1).initiateRecovery(newOwner.address))
        .to.emit(account, "RecoveryInitiated");

      const request = await account.getRecoveryRequest();
      expect(request.newOwner).to.equal(newOwner.address);
      expect(request.isActive).to.equal(true);
      expect(request.approvalCount).to.equal(1n); // Initiator auto-approves
    });

    it("Should not allow non-guardian to initiate recovery", async function () {
      const { account, guardian1, guardian2, nonGuardian, newOwner } = await loadFixture(deployAccountFixture);

      await account.addGuardian(guardian1.address);
      await account.addGuardian(guardian2.address);

      await expect(account.connect(nonGuardian).initiateRecovery(newOwner.address))
        .to.be.revertedWithCustomError(account, "NotGuardian");
    });

    it("Should not allow recovery to zero address", async function () {
      const { account, guardian1, guardian2 } = await loadFixture(deployAccountFixture);

      await account.addGuardian(guardian1.address);
      await account.addGuardian(guardian2.address);

      await expect(account.connect(guardian1).initiateRecovery(ethers.ZeroAddress))
        .to.be.revertedWithCustomError(account, "InvalidNewOwner");
    });

    it("Should not allow recovery to current owner", async function () {
      const { account, guardian1, guardian2, owner } = await loadFixture(deployAccountFixture);

      await account.addGuardian(guardian1.address);
      await account.addGuardian(guardian2.address);

      await expect(account.connect(guardian1).initiateRecovery(owner.address))
        .to.be.revertedWithCustomError(account, "InvalidNewOwner");
    });
  });

  describe("Recovery - Approval", function () {
    it("Should allow guardians to approve recovery", async function () {
      const { account, guardian1, guardian2, newOwner } = await loadFixture(deployAccountFixture);

      await account.addGuardian(guardian1.address);
      await account.addGuardian(guardian2.address);

      await account.connect(guardian1).initiateRecovery(newOwner.address);

      await expect(account.connect(guardian2).approveRecovery())
        .to.emit(account, "RecoveryApproved");

      const request = await account.getRecoveryRequest();
      expect(request.approvalCount).to.equal(2n);
    });

    it("Should not allow double approval from same guardian", async function () {
      const { account, guardian1, guardian2, newOwner } = await loadFixture(deployAccountFixture);

      await account.addGuardian(guardian1.address);
      await account.addGuardian(guardian2.address);

      await account.connect(guardian1).initiateRecovery(newOwner.address);

      await expect(account.connect(guardian1).approveRecovery())
        .to.be.revertedWithCustomError(account, "AlreadyApproved");
    });
  });

  describe("Recovery - Execution", function () {
    it("Should execute recovery after delay and approvals", async function () {
      const { account, guardian1, guardian2, newOwner } = await loadFixture(deployAccountFixture);

      await account.addGuardian(guardian1.address);
      await account.addGuardian(guardian2.address);

      await account.connect(guardian1).initiateRecovery(newOwner.address);
      await account.connect(guardian2).approveRecovery();

      // Fast forward 48 hours
      await time.increase(RECOVERY_DELAY + 1);

      await expect(account.executeRecovery())
        .to.emit(account, "RecoveryExecuted");

      expect(await account.owner()).to.equal(newOwner.address);
    });

    it("Should not execute recovery before delay", async function () {
      const { account, guardian1, guardian2, newOwner } = await loadFixture(deployAccountFixture);

      await account.addGuardian(guardian1.address);
      await account.addGuardian(guardian2.address);

      await account.connect(guardian1).initiateRecovery(newOwner.address);
      await account.connect(guardian2).approveRecovery();

      // Only wait 1 hour
      await time.increase(3600);

      await expect(account.executeRecovery())
        .to.be.revertedWithCustomError(account, "RecoveryDelayNotMet");
    });

    it("Should not execute recovery without enough approvals", async function () {
      const { account, guardian1, guardian2, newOwner } = await loadFixture(deployAccountFixture);

      await account.addGuardian(guardian1.address);
      await account.addGuardian(guardian2.address);

      await account.connect(guardian1).initiateRecovery(newOwner.address);
      // Only 1 approval (initiator)

      await time.increase(RECOVERY_DELAY + 1);

      await expect(account.executeRecovery())
        .to.be.revertedWithCustomError(account, "InsufficientApprovals");
    });
  });

  describe("Recovery - Cancellation", function () {
    it("Should allow owner to cancel recovery", async function () {
      const { account, guardian1, guardian2, newOwner, owner } = await loadFixture(deployAccountFixture);

      await account.addGuardian(guardian1.address);
      await account.addGuardian(guardian2.address);

      await account.connect(guardian1).initiateRecovery(newOwner.address);

      await expect(account.connect(owner).cancelRecovery())
        .to.emit(account, "RecoveryCancelled");

      const request = await account.getRecoveryRequest();
      expect(request.isActive).to.equal(false);
    });

    it("Should not allow non-owner to cancel recovery", async function () {
      const { account, guardian1, guardian2, newOwner, nonGuardian } = await loadFixture(deployAccountFixture);

      await account.addGuardian(guardian1.address);
      await account.addGuardian(guardian2.address);

      await account.connect(guardian1).initiateRecovery(newOwner.address);

      await expect(account.connect(nonGuardian).cancelRecovery())
        .to.be.revertedWithCustomError(account, "NotOwner");
    });
  });

  describe("H-2 Fix: Recovery Nonce", function () {
    it("Should invalidate old approvals after cancellation", async function () {
      const { account, guardian1, guardian2, guardian3, newOwner } = await loadFixture(deployAccountFixture);

      await account.addGuardian(guardian1.address);
      await account.addGuardian(guardian2.address);
      await account.addGuardian(guardian3.address);

      // Start first recovery
      await account.connect(guardian1).initiateRecovery(newOwner.address);
      await account.connect(guardian2).approveRecovery();

      // Cancel recovery
      await account.cancelRecovery();

      // Start new recovery with same guardian1
      await account.connect(guardian1).initiateRecovery(newOwner.address);

      // Guardian2's old approval should NOT carry over
      const hasApproved = await account.hasApprovedRecovery(guardian2.address);
      expect(hasApproved).to.equal(false);

      // New approval count should be 1 (just guardian1)
      const request = await account.getRecoveryRequest();
      expect(request.approvalCount).to.equal(1n);
    });

    it("Should use new nonce for each recovery attempt", async function () {
      const { account, guardian1, guardian2, newOwner } = await loadFixture(deployAccountFixture);

      await account.addGuardian(guardian1.address);
      await account.addGuardian(guardian2.address);

      // First recovery
      await account.connect(guardian1).initiateRecovery(newOwner.address);
      const nonce1 = await account.getRecoveryNonce();

      await account.cancelRecovery();

      // Second recovery
      await account.connect(guardian1).initiateRecovery(newOwner.address);
      const nonce2 = await account.getRecoveryNonce();

      expect(nonce2).to.equal(nonce1 + 1n);
    });

    it("Should correctly track approvals per nonce", async function () {
      const { account, guardian1, guardian2, guardian3, newOwner } = await loadFixture(deployAccountFixture);

      await account.addGuardian(guardian1.address);
      await account.addGuardian(guardian2.address);
      await account.addGuardian(guardian3.address);

      // First recovery - guardian1 and guardian2 approve
      await account.connect(guardian1).initiateRecovery(newOwner.address);
      await account.connect(guardian2).approveRecovery();

      // Cancel
      await account.cancelRecovery();

      // Second recovery - guardian1 initiates
      await account.connect(guardian1).initiateRecovery(newOwner.address);

      // Guardian3 approves (new participant)
      await account.connect(guardian3).approveRecovery();

      const request = await account.getRecoveryRequest();
      expect(request.approvalCount).to.equal(2n); // guardian1 + guardian3

      // guardian2 should be able to approve again (their old approval was invalidated)
      await expect(account.connect(guardian2).approveRecovery()).to.not.be.reverted;

      const requestAfter = await account.getRecoveryRequest();
      expect(requestAfter.approvalCount).to.equal(3n);
    });
  });
});
