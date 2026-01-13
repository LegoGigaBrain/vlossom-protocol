import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture, time } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { PropertyRegistry } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

/**
 * PropertyRegistry Test Suite
 *
 * Created: January 4, 2026
 * Purpose: Comprehensive tests for PropertyRegistry contract
 *
 * Test Coverage:
 * - Property registration and management
 * - Ownership transfer
 * - Suspension timelock mechanism
 * - Dispute resolution (H-5 fix verification)
 * - Access control
 * - Edge cases and security scenarios
 */

describe("PropertyRegistry", function () {
  // ============ Constants ============

  const PropertyStatus = {
    Pending: 0,
    Verified: 1,
    Suspended: 2,
    Revoked: 3,
  };

  const SUSPENSION_DELAY = 24 * 60 * 60; // 24 hours

  // ============ Fixtures ============

  async function deployPropertyRegistryFixture() {
    const [owner, propertyOwner1, propertyOwner2, admin, unauthorized] =
      await ethers.getSigners();

    const PropertyRegistry = await ethers.getContractFactory("PropertyRegistry");
    const registry = await PropertyRegistry.deploy(owner.address);
    await registry.waitForDeployment();

    // Generate test property IDs
    const propertyId1 = ethers.keccak256(ethers.toUtf8Bytes("property-1"));
    const propertyId2 = ethers.keccak256(ethers.toUtf8Bytes("property-2"));
    const metadataHash1 = ethers.keccak256(ethers.toUtf8Bytes("metadata-1"));
    const metadataHash2 = ethers.keccak256(ethers.toUtf8Bytes("metadata-2"));

    return {
      registry,
      owner,
      propertyOwner1,
      propertyOwner2,
      admin,
      unauthorized,
      propertyId1,
      propertyId2,
      metadataHash1,
      metadataHash2,
    };
  }

  async function deployWithPropertyFixture() {
    const fixture = await deployPropertyRegistryFixture();
    const { registry, propertyOwner1, propertyId1, metadataHash1 } = fixture;

    // Register a property
    await registry.connect(propertyOwner1).registerProperty(propertyId1, metadataHash1);

    return fixture;
  }

  async function deployWithVerifiedPropertyFixture() {
    const fixture = await deployWithPropertyFixture();
    const { registry, owner, propertyId1 } = fixture;

    // Verify the property
    await registry.connect(owner).verifyProperty(propertyId1);

    return fixture;
  }

  // ============ Property Registration Tests ============

  describe("Property Registration", function () {
    it("should register a new property", async function () {
      const { registry, propertyOwner1, propertyId1, metadataHash1 } =
        await loadFixture(deployPropertyRegistryFixture);

      await registry.connect(propertyOwner1).registerProperty(propertyId1, metadataHash1);

      const property = await registry.getProperty(propertyId1);
      expect(property.owner).to.equal(propertyOwner1.address);
      expect(property.metadataHash).to.equal(metadataHash1);
      expect(property.status).to.equal(PropertyStatus.Pending);
    });

    it("should emit PropertyRegistered event", async function () {
      const { registry, propertyOwner1, propertyId1, metadataHash1 } =
        await loadFixture(deployPropertyRegistryFixture);

      await expect(registry.connect(propertyOwner1).registerProperty(propertyId1, metadataHash1))
        .to.emit(registry, "PropertyRegistered")
        .withArgs(propertyId1, propertyOwner1.address, metadataHash1, await time.latest() + 1);
    });

    it("should revert if property ID is zero", async function () {
      const { registry, propertyOwner1, metadataHash1 } =
        await loadFixture(deployPropertyRegistryFixture);

      const zeroId = ethers.ZeroHash;
      await expect(
        registry.connect(propertyOwner1).registerProperty(zeroId, metadataHash1)
      ).to.be.revertedWithCustomError(registry, "InvalidPropertyId");
    });

    it("should revert if property already exists", async function () {
      const { registry, propertyOwner1, propertyId1, metadataHash1 } =
        await loadFixture(deployWithPropertyFixture);

      await expect(
        registry.connect(propertyOwner1).registerProperty(propertyId1, metadataHash1)
      ).to.be.revertedWithCustomError(registry, "PropertyAlreadyRegistered");
    });

    it("should store correct registration timestamp", async function () {
      const { registry, propertyOwner1, propertyId1, metadataHash1 } =
        await loadFixture(deployPropertyRegistryFixture);

      const tx = await registry.connect(propertyOwner1).registerProperty(propertyId1, metadataHash1);
      const block = await tx.getBlock();

      const property = await registry.getProperty(propertyId1);
      expect(property.registeredAt).to.equal(block!.timestamp);
    });

    it("should increment total properties count", async function () {
      const { registry, propertyOwner1, propertyId1, propertyId2, metadataHash1, metadataHash2 } =
        await loadFixture(deployPropertyRegistryFixture);

      expect(await registry.totalProperties()).to.equal(0);

      await registry.connect(propertyOwner1).registerProperty(propertyId1, metadataHash1);
      expect(await registry.totalProperties()).to.equal(1);

      await registry.connect(propertyOwner1).registerProperty(propertyId2, metadataHash2);
      expect(await registry.totalProperties()).to.equal(2);
    });
  });

  // ============ Property Transfer Tests ============

  describe("Property Transfer", function () {
    it("should transfer property to new owner", async function () {
      const { registry, propertyOwner1, propertyOwner2, propertyId1 } =
        await loadFixture(deployWithPropertyFixture);

      await registry.connect(propertyOwner1).transferProperty(propertyId1, propertyOwner2.address);

      const property = await registry.getProperty(propertyId1);
      expect(property.owner).to.equal(propertyOwner2.address);
    });

    it("should emit PropertyTransferred event", async function () {
      const { registry, propertyOwner1, propertyOwner2, propertyId1 } =
        await loadFixture(deployWithPropertyFixture);

      await expect(
        registry.connect(propertyOwner1).transferProperty(propertyId1, propertyOwner2.address)
      )
        .to.emit(registry, "PropertyTransferred")
        .withArgs(propertyId1, propertyOwner1.address, propertyOwner2.address, await time.latest() + 1);
    });

    it("should update EnumerableSet for both owners (H-4 fix)", async function () {
      const { registry, propertyOwner1, propertyOwner2, propertyId1 } =
        await loadFixture(deployWithPropertyFixture);

      // Before transfer
      expect(await registry.getOwnerPropertyCount(propertyOwner1.address)).to.equal(1);
      expect(await registry.getOwnerPropertyCount(propertyOwner2.address)).to.equal(0);
      expect(await registry.ownerHasProperty(propertyOwner1.address, propertyId1)).to.be.true;

      // Transfer
      await registry.connect(propertyOwner1).transferProperty(propertyId1, propertyOwner2.address);

      // After transfer
      expect(await registry.getOwnerPropertyCount(propertyOwner1.address)).to.equal(0);
      expect(await registry.getOwnerPropertyCount(propertyOwner2.address)).to.equal(1);
      expect(await registry.ownerHasProperty(propertyOwner1.address, propertyId1)).to.be.false;
      expect(await registry.ownerHasProperty(propertyOwner2.address, propertyId1)).to.be.true;
    });

    it("should revert if caller is not owner", async function () {
      const { registry, propertyOwner2, propertyId1 } =
        await loadFixture(deployWithPropertyFixture);

      await expect(
        registry.connect(propertyOwner2).transferProperty(propertyId1, propertyOwner2.address)
      ).to.be.revertedWithCustomError(registry, "UnauthorizedOwner");
    });

    it("should revert if new owner is zero address", async function () {
      const { registry, propertyOwner1, propertyId1 } =
        await loadFixture(deployWithPropertyFixture);

      await expect(
        registry.connect(propertyOwner1).transferProperty(propertyId1, ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(registry, "UnauthorizedOwner");
    });

    it("should revert if property not found", async function () {
      const { registry, propertyOwner1, propertyOwner2, propertyId2 } =
        await loadFixture(deployWithPropertyFixture);

      await expect(
        registry.connect(propertyOwner1).transferProperty(propertyId2, propertyOwner2.address)
      ).to.be.revertedWithCustomError(registry, "PropertyNotFound");
    });
  });

  // ============ Metadata Update Tests ============

  describe("Metadata Update", function () {
    it("should update metadata hash", async function () {
      const { registry, propertyOwner1, propertyId1, metadataHash2 } =
        await loadFixture(deployWithPropertyFixture);

      await registry.connect(propertyOwner1).updateMetadata(propertyId1, metadataHash2);

      const property = await registry.getProperty(propertyId1);
      expect(property.metadataHash).to.equal(metadataHash2);
    });

    it("should emit PropertyMetadataUpdated event", async function () {
      const { registry, propertyOwner1, propertyId1, metadataHash1, metadataHash2 } =
        await loadFixture(deployWithPropertyFixture);

      await expect(
        registry.connect(propertyOwner1).updateMetadata(propertyId1, metadataHash2)
      )
        .to.emit(registry, "PropertyMetadataUpdated")
        .withArgs(propertyId1, metadataHash1, metadataHash2, await time.latest() + 1);
    });

    it("should revert if caller is not owner", async function () {
      const { registry, propertyOwner2, propertyId1, metadataHash2 } =
        await loadFixture(deployWithPropertyFixture);

      await expect(
        registry.connect(propertyOwner2).updateMetadata(propertyId1, metadataHash2)
      ).to.be.revertedWithCustomError(registry, "UnauthorizedOwner");
    });
  });

  // ============ Property Verification Tests ============

  describe("Property Verification", function () {
    it("should verify a pending property", async function () {
      const { registry, owner, propertyId1 } =
        await loadFixture(deployWithPropertyFixture);

      await registry.connect(owner).verifyProperty(propertyId1);

      const property = await registry.getProperty(propertyId1);
      expect(property.status).to.equal(PropertyStatus.Verified);
    });

    it("should emit PropertyStatusChanged event", async function () {
      const { registry, owner, propertyId1 } =
        await loadFixture(deployWithPropertyFixture);

      await expect(registry.connect(owner).verifyProperty(propertyId1))
        .to.emit(registry, "PropertyStatusChanged")
        .withArgs(propertyId1, PropertyStatus.Pending, PropertyStatus.Verified, await time.latest() + 1);
    });

    it("should revert if property not found", async function () {
      const { registry, owner, propertyId2 } =
        await loadFixture(deployWithPropertyFixture);

      await expect(
        registry.connect(owner).verifyProperty(propertyId2)
      ).to.be.revertedWithCustomError(registry, "PropertyNotFound");
    });

    it("should revert if caller is not admin", async function () {
      const { registry, propertyOwner1, propertyId1 } =
        await loadFixture(deployWithPropertyFixture);

      await expect(
        registry.connect(propertyOwner1).verifyProperty(propertyId1)
      ).to.be.revertedWithCustomError(registry, "OwnableUnauthorizedAccount");
    });

    it("should revert if property is not pending", async function () {
      const { registry, owner, propertyId1 } =
        await loadFixture(deployWithVerifiedPropertyFixture);

      await expect(
        registry.connect(owner).verifyProperty(propertyId1)
      ).to.be.revertedWithCustomError(registry, "InvalidStatus");
    });
  });

  // ============ Suspension Timelock Tests ============

  describe("Suspension Timelock", function () {
    it("should request suspension with timelock", async function () {
      const { registry, owner, propertyId1 } =
        await loadFixture(deployWithVerifiedPropertyFixture);

      await registry.connect(owner).requestSuspension(propertyId1, "Policy violation");

      const request = await registry.getSuspensionRequest(propertyId1);
      expect(request.isActive).to.be.true;
      expect(request.reason).to.equal("Policy violation");
    });

    it("should emit SuspensionRequested event", async function () {
      const { registry, owner, propertyId1 } =
        await loadFixture(deployWithVerifiedPropertyFixture);

      const currentTime = await time.latest();
      await expect(registry.connect(owner).requestSuspension(propertyId1, "Policy violation"))
        .to.emit(registry, "SuspensionRequested")
        .withArgs(propertyId1, "Policy violation", currentTime + SUSPENSION_DELAY + 1);
    });

    it("should not execute suspension before timelock expires", async function () {
      const { registry, owner, propertyId1 } =
        await loadFixture(deployWithVerifiedPropertyFixture);

      await registry.connect(owner).requestSuspension(propertyId1, "Policy violation");

      // Try to execute immediately
      await expect(
        registry.connect(owner).executeSuspension(propertyId1)
      ).to.be.revertedWithCustomError(registry, "SuspensionDelayNotMet");
    });

    it("should execute suspension after timelock expires", async function () {
      const { registry, owner, propertyId1 } =
        await loadFixture(deployWithVerifiedPropertyFixture);

      await registry.connect(owner).requestSuspension(propertyId1, "Policy violation");

      // Fast forward past timelock
      await time.increase(SUSPENSION_DELAY + 1);

      await registry.connect(owner).executeSuspension(propertyId1);

      const property = await registry.getProperty(propertyId1);
      expect(property.status).to.equal(PropertyStatus.Suspended);
    });

    it("should allow admin to cancel suspension", async function () {
      const { registry, owner, propertyId1 } =
        await loadFixture(deployWithVerifiedPropertyFixture);

      await registry.connect(owner).requestSuspension(propertyId1, "Policy violation");
      await registry.connect(owner).cancelSuspension(propertyId1);

      const request = await registry.getSuspensionRequest(propertyId1);
      expect(request.isActive).to.be.false;
    });

    it("should revert if suspension already pending", async function () {
      const { registry, owner, propertyId1 } =
        await loadFixture(deployWithVerifiedPropertyFixture);

      await registry.connect(owner).requestSuspension(propertyId1, "Policy violation");

      await expect(
        registry.connect(owner).requestSuspension(propertyId1, "Another reason")
      ).to.be.revertedWithCustomError(registry, "SuspensionAlreadyPending");
    });

    it("should revert if no suspension pending", async function () {
      const { registry, owner, propertyId1 } =
        await loadFixture(deployWithVerifiedPropertyFixture);

      await expect(
        registry.connect(owner).executeSuspension(propertyId1)
      ).to.be.revertedWithCustomError(registry, "NoSuspensionPending");
    });
  });

  // ============ Dispute Resolution Tests ============

  describe("Dispute Resolution", function () {
    it("should allow property owner to raise dispute", async function () {
      const { registry, owner, propertyOwner1, propertyId1 } =
        await loadFixture(deployWithVerifiedPropertyFixture);

      await registry.connect(owner).requestSuspension(propertyId1, "Policy violation");
      await registry.connect(propertyOwner1).raiseDispute(propertyId1);

      const request = await registry.getSuspensionRequest(propertyId1);
      expect(request.disputed).to.be.true;
    });

    it("should emit DisputeRaised event", async function () {
      const { registry, owner, propertyOwner1, propertyId1 } =
        await loadFixture(deployWithVerifiedPropertyFixture);

      await registry.connect(owner).requestSuspension(propertyId1, "Policy violation");

      await expect(registry.connect(propertyOwner1).raiseDispute(propertyId1))
        .to.emit(registry, "DisputeRaised")
        .withArgs(propertyId1, propertyOwner1.address);
    });

    it("should enforce timelock when resolving dispute as upheld (H-5 fix)", async function () {
      const { registry, owner, propertyOwner1, propertyId1 } =
        await loadFixture(deployWithVerifiedPropertyFixture);

      await registry.connect(owner).requestSuspension(propertyId1, "Policy violation");
      await registry.connect(propertyOwner1).raiseDispute(propertyId1);

      // Try to resolve immediately with upholdSuspension=true
      await expect(
        registry.connect(owner).resolveDispute(propertyId1, true)
      ).to.be.revertedWithCustomError(registry, "SuspensionDelayNotMet");

      // Fast forward past timelock
      await time.increase(SUSPENSION_DELAY + 1);

      // Now it should work
      await registry.connect(owner).resolveDispute(propertyId1, true);

      const property = await registry.getProperty(propertyId1);
      expect(property.status).to.equal(PropertyStatus.Suspended);
    });

    it("should cancel suspension when dispute is not upheld", async function () {
      const { registry, owner, propertyOwner1, propertyId1 } =
        await loadFixture(deployWithVerifiedPropertyFixture);

      await registry.connect(owner).requestSuspension(propertyId1, "Policy violation");
      await registry.connect(propertyOwner1).raiseDispute(propertyId1);

      // Resolve with upholdSuspension=false (property owner wins)
      await registry.connect(owner).resolveDispute(propertyId1, false);

      const property = await registry.getProperty(propertyId1);
      expect(property.status).to.equal(PropertyStatus.Verified); // Still verified

      const request = await registry.getSuspensionRequest(propertyId1);
      expect(request.isActive).to.be.false;
    });

    it("should revert if no suspension pending", async function () {
      const { registry, propertyOwner1, propertyId1 } =
        await loadFixture(deployWithVerifiedPropertyFixture);

      await expect(
        registry.connect(propertyOwner1).raiseDispute(propertyId1)
      ).to.be.revertedWithCustomError(registry, "NoSuspensionPending");
    });

    it("should revert if dispute already raised", async function () {
      const { registry, owner, propertyOwner1, propertyId1 } =
        await loadFixture(deployWithVerifiedPropertyFixture);

      await registry.connect(owner).requestSuspension(propertyId1, "Policy violation");
      await registry.connect(propertyOwner1).raiseDispute(propertyId1);

      await expect(
        registry.connect(propertyOwner1).raiseDispute(propertyId1)
      ).to.be.revertedWithCustomError(registry, "PropertyUnderDispute");
    });

    it("should revert if caller is not property owner", async function () {
      const { registry, owner, propertyOwner2, propertyId1 } =
        await loadFixture(deployWithVerifiedPropertyFixture);

      await registry.connect(owner).requestSuspension(propertyId1, "Policy violation");

      await expect(
        registry.connect(propertyOwner2).raiseDispute(propertyId1)
      ).to.be.revertedWithCustomError(registry, "UnauthorizedOwner");
    });
  });

  // ============ Reinstatement Tests ============

  describe("Property Reinstatement", function () {
    it("should reinstate suspended property", async function () {
      const { registry, owner, propertyId1 } =
        await loadFixture(deployWithVerifiedPropertyFixture);

      await registry.connect(owner).requestSuspension(propertyId1, "Policy violation");
      await time.increase(SUSPENSION_DELAY + 1);
      await registry.connect(owner).executeSuspension(propertyId1);

      // Now unsuspend
      await registry.connect(owner).unsuspendProperty(propertyId1);

      const property = await registry.getProperty(propertyId1);
      expect(property.status).to.equal(PropertyStatus.Verified);
    });

    it("should emit PropertyStatusChanged event", async function () {
      const { registry, owner, propertyId1 } =
        await loadFixture(deployWithVerifiedPropertyFixture);

      await registry.connect(owner).requestSuspension(propertyId1, "Policy violation");
      await time.increase(SUSPENSION_DELAY + 1);
      await registry.connect(owner).executeSuspension(propertyId1);

      await expect(registry.connect(owner).unsuspendProperty(propertyId1))
        .to.emit(registry, "PropertyStatusChanged")
        .withArgs(propertyId1, PropertyStatus.Suspended, PropertyStatus.Verified, await time.latest() + 1);
    });

    it("should revert if property is not suspended", async function () {
      const { registry, owner, propertyId1 } =
        await loadFixture(deployWithVerifiedPropertyFixture);

      await expect(
        registry.connect(owner).unsuspendProperty(propertyId1)
      ).to.be.revertedWithCustomError(registry, "InvalidStatus");
    });
  });

  // ============ Revocation Tests ============

  describe("Property Revocation", function () {
    it("should revoke property permanently", async function () {
      const { registry, owner, propertyId1 } =
        await loadFixture(deployWithVerifiedPropertyFixture);

      await registry.connect(owner).revokeProperty(propertyId1);

      const property = await registry.getProperty(propertyId1);
      expect(property.status).to.equal(PropertyStatus.Revoked);
    });

    it("should prevent requesting suspension on revoked property", async function () {
      const { registry, owner, propertyId1 } =
        await loadFixture(deployWithVerifiedPropertyFixture);

      await registry.connect(owner).revokeProperty(propertyId1);

      await expect(
        registry.connect(owner).requestSuspension(propertyId1, "Some reason")
      ).to.be.revertedWithCustomError(registry, "InvalidStatus");
    });
  });

  // ============ View Function Tests ============

  describe("View Functions", function () {
    it("should return owner property count", async function () {
      const { registry, propertyOwner1, propertyId1, propertyId2, metadataHash1, metadataHash2 } =
        await loadFixture(deployPropertyRegistryFixture);

      expect(await registry.getOwnerPropertyCount(propertyOwner1.address)).to.equal(0);

      await registry.connect(propertyOwner1).registerProperty(propertyId1, metadataHash1);
      expect(await registry.getOwnerPropertyCount(propertyOwner1.address)).to.equal(1);

      await registry.connect(propertyOwner1).registerProperty(propertyId2, metadataHash2);
      expect(await registry.getOwnerPropertyCount(propertyOwner1.address)).to.equal(2);
    });

    it("should return owner properties array", async function () {
      const { registry, propertyOwner1, propertyId1, propertyId2, metadataHash1, metadataHash2 } =
        await loadFixture(deployPropertyRegistryFixture);

      await registry.connect(propertyOwner1).registerProperty(propertyId1, metadataHash1);
      await registry.connect(propertyOwner1).registerProperty(propertyId2, metadataHash2);

      const properties = await registry.getOwnerProperties(propertyOwner1.address);
      expect(properties.length).to.equal(2);
      expect(properties).to.include(propertyId1);
      expect(properties).to.include(propertyId2);
    });

    it("should check if property exists", async function () {
      const { registry, propertyId1, propertyId2 } =
        await loadFixture(deployWithPropertyFixture);

      expect(await registry.propertyExists(propertyId1)).to.be.true;
      expect(await registry.propertyExists(propertyId2)).to.be.false;
    });

    it("should check if property is verified", async function () {
      const { registry, propertyId1 } =
        await loadFixture(deployWithVerifiedPropertyFixture);

      expect(await registry.isPropertyVerified(propertyId1)).to.be.true;
    });
  });

  // ============ Access Control Tests ============

  describe("Access Control", function () {
    it("should only allow owner to call admin functions", async function () {
      const { registry, unauthorized, propertyId1 } =
        await loadFixture(deployWithPropertyFixture);

      await expect(
        registry.connect(unauthorized).verifyProperty(propertyId1)
      ).to.be.revertedWithCustomError(registry, "OwnableUnauthorizedAccount");
    });

    it("should allow property owner to manage their property", async function () {
      const { registry, propertyOwner1, propertyId1, metadataHash2 } =
        await loadFixture(deployWithPropertyFixture);

      // Should succeed
      await registry.connect(propertyOwner1).updateMetadata(propertyId1, metadataHash2);

      const property = await registry.getProperty(propertyId1);
      expect(property.metadataHash).to.equal(metadataHash2);
    });

    it("should revert unauthorized access attempts", async function () {
      const { registry, unauthorized, propertyId1, metadataHash2 } =
        await loadFixture(deployWithPropertyFixture);

      await expect(
        registry.connect(unauthorized).updateMetadata(propertyId1, metadataHash2)
      ).to.be.revertedWithCustomError(registry, "UnauthorizedOwner");
    });
  });

  // ============ Pause Tests ============

  describe("Pause Functionality", function () {
    it("should pause all operations", async function () {
      const { registry, owner, propertyOwner1, propertyId2, metadataHash2 } =
        await loadFixture(deployWithPropertyFixture);

      await registry.connect(owner).pause();

      await expect(
        registry.connect(propertyOwner1).registerProperty(propertyId2, metadataHash2)
      ).to.be.revertedWithCustomError(registry, "EnforcedPause");
    });

    it("should unpause and resume operations", async function () {
      const { registry, owner, propertyOwner1, propertyId2, metadataHash2 } =
        await loadFixture(deployWithPropertyFixture);

      await registry.connect(owner).pause();
      await registry.connect(owner).unpause();

      // Should work now
      await registry.connect(propertyOwner1).registerProperty(propertyId2, metadataHash2);
      expect(await registry.propertyExists(propertyId2)).to.be.true;
    });

    it("should revert operations when paused", async function () {
      const { registry, owner, propertyOwner1, propertyId1, propertyOwner2 } =
        await loadFixture(deployWithPropertyFixture);

      await registry.connect(owner).pause();

      await expect(
        registry.connect(propertyOwner1).transferProperty(propertyId1, propertyOwner2.address)
      ).to.be.revertedWithCustomError(registry, "EnforcedPause");
    });

    it("should allow view functions when paused", async function () {
      const { registry, owner, propertyId1 } =
        await loadFixture(deployWithPropertyFixture);

      await registry.connect(owner).pause();

      // View functions should still work
      const property = await registry.getProperty(propertyId1);
      expect(property.owner).to.not.equal(ethers.ZeroAddress);
    });
  });

  // ============ Edge Cases and Security Tests ============

  describe("Security Scenarios", function () {
    it("should handle multiple properties per owner correctly", async function () {
      const { registry, propertyOwner1, propertyId1, propertyId2, metadataHash1, metadataHash2 } =
        await loadFixture(deployPropertyRegistryFixture);

      await registry.connect(propertyOwner1).registerProperty(propertyId1, metadataHash1);
      await registry.connect(propertyOwner1).registerProperty(propertyId2, metadataHash2);

      expect(await registry.getOwnerPropertyCount(propertyOwner1.address)).to.equal(2);
    });

    it("should maintain state consistency after failed transactions", async function () {
      const { registry, propertyOwner1, propertyOwner2, propertyId1 } =
        await loadFixture(deployWithPropertyFixture);

      // Try to transfer as non-owner (should fail)
      try {
        await registry.connect(propertyOwner2).transferProperty(propertyId1, propertyOwner2.address);
      } catch {
        // Expected to fail
      }

      // State should be unchanged
      const property = await registry.getProperty(propertyId1);
      expect(property.owner).to.equal(propertyOwner1.address);
      expect(await registry.ownerHasProperty(propertyOwner1.address, propertyId1)).to.be.true;
    });

    it("should correctly track property ownership through multiple transfers", async function () {
      const { registry, propertyOwner1, propertyOwner2, admin, propertyId1 } =
        await loadFixture(deployWithPropertyFixture);

      // Transfer from owner1 to owner2
      await registry.connect(propertyOwner1).transferProperty(propertyId1, propertyOwner2.address);
      expect(await registry.ownerHasProperty(propertyOwner1.address, propertyId1)).to.be.false;
      expect(await registry.ownerHasProperty(propertyOwner2.address, propertyId1)).to.be.true;

      // Transfer from owner2 to admin
      await registry.connect(propertyOwner2).transferProperty(propertyId1, admin.address);
      expect(await registry.ownerHasProperty(propertyOwner2.address, propertyId1)).to.be.false;
      expect(await registry.ownerHasProperty(admin.address, propertyId1)).to.be.true;

      // Verify final state
      const property = await registry.getProperty(propertyId1);
      expect(property.owner).to.equal(admin.address);
    });
  });
});
