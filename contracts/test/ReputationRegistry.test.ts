import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture, time } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { ReputationRegistry } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

/**
 * ReputationRegistry Test Suite
 *
 * Created: January 4, 2026
 * Purpose: Comprehensive tests for ReputationRegistry contract
 *
 * Test Coverage:
 * - Event recording (single and batch)
 * - Score calculation and updates
 * - Verification status
 * - Authorized submitter management
 * - Access control
 * - H-6 batch size limit verification
 * - Edge cases and security scenarios
 */

describe("ReputationRegistry", function () {
  // ============ Constants ============

  const ActorType = {
    Stylist: 0,
    Customer: 1,
    PropertyOwner: 2,
  };

  const EventType = {
    BookingCompleted: 0,
    BookingCancelled: 1,
    CustomerNoShow: 2,
    StylistNoShow: 3,
    OnTimeArrival: 4,
    LateArrival: 5,
    OnTimeCompletion: 6,
    LateCompletion: 7,
    CustomerReview: 8,
    PropertyOwnerReview: 9,
    DisputeRaised: 10,
    DisputeResolved: 11,
  };

  const MAX_BATCH_SIZE = 100;
  const VERIFICATION_THRESHOLD = 7000; // 70%
  const MIN_BOOKINGS_FOR_VERIFICATION = 5;

  // ============ Fixtures ============

  async function deployReputationRegistryFixture() {
    const [owner, submitter1, submitter2, stylist, customer, unauthorized] =
      await ethers.getSigners();

    const ReputationRegistry = await ethers.getContractFactory("ReputationRegistry");
    const registry = await ReputationRegistry.deploy(owner.address);
    await registry.waitForDeployment();

    // Authorize submitter
    await registry.setAuthorizedSubmitter(submitter1.address, true);

    // Generate test booking IDs
    const bookingId1 = ethers.keccak256(ethers.toUtf8Bytes("booking-1"));
    const bookingId2 = ethers.keccak256(ethers.toUtf8Bytes("booking-2"));
    const metadataHash = ethers.keccak256(ethers.toUtf8Bytes("metadata"));

    return {
      registry,
      owner,
      submitter1,
      submitter2,
      stylist,
      customer,
      unauthorized,
      bookingId1,
      bookingId2,
      metadataHash,
    };
  }

  async function deployWithRegisteredActorFixture() {
    const fixture = await deployReputationRegistryFixture();
    const { registry, submitter1, stylist, bookingId1, metadataHash } = fixture;

    // Register a stylist
    await registry.connect(submitter1).registerActor(stylist.address, ActorType.Stylist);

    return fixture;
  }

  // ============ Event Recording Tests (Single) ============

  describe("Event Recording (Single)", function () {
    it("should record a booking completed event", async function () {
      const { registry, submitter1, stylist, bookingId1, metadataHash } =
        await loadFixture(deployReputationRegistryFixture);

      await registry.connect(submitter1).recordEvent(
        stylist.address,
        bookingId1,
        ActorType.Stylist,
        EventType.BookingCompleted,
        100,
        metadataHash
      );

      const score = await registry.getReputationScore(stylist.address);
      expect(score.completedBookings).to.equal(1);
    });

    it("should emit ReputationEventRecorded event", async function () {
      const { registry, submitter1, stylist, bookingId1, metadataHash } =
        await loadFixture(deployReputationRegistryFixture);

      await expect(
        registry.connect(submitter1).recordEvent(
          stylist.address,
          bookingId1,
          ActorType.Stylist,
          EventType.BookingCompleted,
          100,
          metadataHash
        )
      )
        .to.emit(registry, "ReputationEventRecorded")
        .withArgs(stylist.address, bookingId1, EventType.BookingCompleted, 100, await time.latest() + 1);
    });

    it("should update actor's score correctly", async function () {
      const { registry, submitter1, stylist, bookingId1, metadataHash } =
        await loadFixture(deployWithRegisteredActorFixture);

      const scoreBefore = await registry.getReputationScore(stylist.address);

      await registry.connect(submitter1).recordEvent(
        stylist.address,
        bookingId1,
        ActorType.Stylist,
        EventType.OnTimeArrival,
        200, // Positive impact
        metadataHash
      );

      const scoreAfter = await registry.getReputationScore(stylist.address);
      expect(scoreAfter.tpsScore).to.be.greaterThan(scoreBefore.tpsScore);
    });

    it("should increment booking count", async function () {
      const { registry, submitter1, stylist, bookingId1, metadataHash } =
        await loadFixture(deployWithRegisteredActorFixture);

      await registry.connect(submitter1).recordEvent(
        stylist.address,
        bookingId1,
        ActorType.Stylist,
        EventType.BookingCompleted,
        100,
        metadataHash
      );

      const score = await registry.getReputationScore(stylist.address);
      expect(score.completedBookings).to.equal(1);
    });

    it("should revert if caller is not authorized", async function () {
      const { registry, unauthorized, stylist, bookingId1, metadataHash } =
        await loadFixture(deployReputationRegistryFixture);

      await expect(
        registry.connect(unauthorized).recordEvent(
          stylist.address,
          bookingId1,
          ActorType.Stylist,
          EventType.BookingCompleted,
          100,
          metadataHash
        )
      ).to.be.revertedWithCustomError(registry, "UnauthorizedSubmitter");
    });

    it("should revert if actor address is zero", async function () {
      const { registry, submitter1, bookingId1, metadataHash } =
        await loadFixture(deployReputationRegistryFixture);

      await expect(
        registry.connect(submitter1).recordEvent(
          ethers.ZeroAddress,
          bookingId1,
          ActorType.Stylist,
          EventType.BookingCompleted,
          100,
          metadataHash
        )
      ).to.be.revertedWithCustomError(registry, "InvalidAddress");
    });

    it("should handle negative score impacts", async function () {
      const { registry, submitter1, stylist, bookingId1, metadataHash } =
        await loadFixture(deployWithRegisteredActorFixture);

      const scoreBefore = await registry.getReputationScore(stylist.address);

      await registry.connect(submitter1).recordEvent(
        stylist.address,
        bookingId1,
        ActorType.Stylist,
        EventType.LateArrival,
        -200, // Negative impact
        metadataHash
      );

      const scoreAfter = await registry.getReputationScore(stylist.address);
      expect(scoreAfter.tpsScore).to.be.lessThan(scoreBefore.tpsScore);
    });

    it("should not allow score to go below zero", async function () {
      const { registry, submitter1, stylist, bookingId1, metadataHash } =
        await loadFixture(deployWithRegisteredActorFixture);

      // Record many negative events
      for (let i = 0; i < 10; i++) {
        const bookingId = ethers.keccak256(ethers.toUtf8Bytes(`booking-${i}`));
        await registry.connect(submitter1).recordEvent(
          stylist.address,
          bookingId,
          ActorType.Stylist,
          EventType.LateArrival,
          -1000, // Maximum negative impact
          metadataHash
        );
      }

      const score = await registry.getReputationScore(stylist.address);
      expect(score.tpsScore).to.be.greaterThanOrEqual(0);
    });

    it("should not allow score to exceed maximum", async function () {
      const { registry, submitter1, stylist, bookingId1, metadataHash } =
        await loadFixture(deployWithRegisteredActorFixture);

      // Record many positive events
      for (let i = 0; i < 20; i++) {
        const bookingId = ethers.keccak256(ethers.toUtf8Bytes(`booking-${i}`));
        await registry.connect(submitter1).recordEvent(
          stylist.address,
          bookingId,
          ActorType.Stylist,
          EventType.OnTimeArrival,
          1000, // Maximum positive impact
          metadataHash
        );
      }

      const score = await registry.getReputationScore(stylist.address);
      expect(score.tpsScore).to.be.lessThanOrEqual(10000);
    });

    it("should revert if score impact exceeds bounds", async function () {
      const { registry, submitter1, stylist, bookingId1, metadataHash } =
        await loadFixture(deployReputationRegistryFixture);

      await expect(
        registry.connect(submitter1).recordEvent(
          stylist.address,
          bookingId1,
          ActorType.Stylist,
          EventType.OnTimeArrival,
          1001, // Exceeds +1000
          metadataHash
        )
      ).to.be.revertedWithCustomError(registry, "InvalidScore");

      await expect(
        registry.connect(submitter1).recordEvent(
          stylist.address,
          bookingId1,
          ActorType.Stylist,
          EventType.LateArrival,
          -1001, // Exceeds -1000
          metadataHash
        )
      ).to.be.revertedWithCustomError(registry, "InvalidScore");
    });
  });

  // ============ Batch Event Recording Tests ============

  describe("Event Recording (Batch)", function () {
    it("should record multiple events in batch", async function () {
      const { registry, submitter1, stylist, customer, metadataHash } =
        await loadFixture(deployReputationRegistryFixture);

      const actors = [stylist.address, customer.address];
      const bookingIds = [
        ethers.keccak256(ethers.toUtf8Bytes("booking-1")),
        ethers.keccak256(ethers.toUtf8Bytes("booking-2")),
      ];
      const actorTypes = [ActorType.Stylist, ActorType.Customer];
      const eventTypes = [EventType.BookingCompleted, EventType.BookingCompleted];
      const scoreImpacts = [100, 100];
      const metadataHashes = [metadataHash, metadataHash];

      await registry.connect(submitter1).recordEventsBatch(
        actors,
        bookingIds,
        actorTypes,
        eventTypes,
        scoreImpacts,
        metadataHashes
      );

      const stylistScore = await registry.getReputationScore(stylist.address);
      const customerScore = await registry.getReputationScore(customer.address);

      expect(stylistScore.completedBookings).to.equal(1);
      expect(customerScore.completedBookings).to.equal(1);
    });

    it("should revert if array lengths mismatch", async function () {
      const { registry, submitter1, stylist, metadataHash } =
        await loadFixture(deployReputationRegistryFixture);

      const actors = [stylist.address, stylist.address];
      const bookingIds = [ethers.keccak256(ethers.toUtf8Bytes("booking-1"))]; // Only 1
      const actorTypes = [ActorType.Stylist, ActorType.Stylist];
      const eventTypes = [EventType.BookingCompleted, EventType.BookingCompleted];
      const scoreImpacts = [100, 100];
      const metadataHashes = [metadataHash, metadataHash];

      await expect(
        registry.connect(submitter1).recordEventsBatch(
          actors,
          bookingIds,
          actorTypes,
          eventTypes,
          scoreImpacts,
          metadataHashes
        )
      ).to.be.revertedWithCustomError(registry, "ArrayLengthMismatch");
    });

    it("should revert if batch size exceeds maximum (H-6 fix)", async function () {
      const { registry, submitter1, stylist, metadataHash } =
        await loadFixture(deployReputationRegistryFixture);

      const batchSize = MAX_BATCH_SIZE + 1;
      const actors = Array(batchSize).fill(stylist.address);
      const bookingIds = Array(batchSize).fill(ethers.keccak256(ethers.toUtf8Bytes("booking")));
      const actorTypes = Array(batchSize).fill(ActorType.Stylist);
      const eventTypes = Array(batchSize).fill(EventType.BookingCompleted);
      const scoreImpacts = Array(batchSize).fill(100);
      const metadataHashes = Array(batchSize).fill(metadataHash);

      await expect(
        registry.connect(submitter1).recordEventsBatch(
          actors,
          bookingIds,
          actorTypes,
          eventTypes,
          scoreImpacts,
          metadataHashes
        )
      ).to.be.revertedWithCustomError(registry, "BatchTooLarge");
    });

    it("should process exactly MAX_BATCH_SIZE events", async function () {
      const { registry, submitter1, stylist, metadataHash } =
        await loadFixture(deployReputationRegistryFixture);

      const batchSize = MAX_BATCH_SIZE;
      const actors = Array(batchSize).fill(stylist.address);
      const bookingIds = Array.from({ length: batchSize }, (_, i) =>
        ethers.keccak256(ethers.toUtf8Bytes(`booking-${i}`))
      );
      const actorTypes = Array(batchSize).fill(ActorType.Stylist);
      const eventTypes = Array(batchSize).fill(EventType.BookingCompleted);
      const scoreImpacts = Array(batchSize).fill(100);
      const metadataHashes = Array(batchSize).fill(metadataHash);

      // Should succeed
      await registry.connect(submitter1).recordEventsBatch(
        actors,
        bookingIds,
        actorTypes,
        eventTypes,
        scoreImpacts,
        metadataHashes
      );

      const score = await registry.getReputationScore(stylist.address);
      expect(score.completedBookings).to.equal(batchSize);
    });

    it("should emit events for each record", async function () {
      const { registry, submitter1, stylist, customer, metadataHash } =
        await loadFixture(deployReputationRegistryFixture);

      const actors = [stylist.address, customer.address];
      const bookingIds = [
        ethers.keccak256(ethers.toUtf8Bytes("booking-1")),
        ethers.keccak256(ethers.toUtf8Bytes("booking-2")),
      ];
      const actorTypes = [ActorType.Stylist, ActorType.Customer];
      const eventTypes = [EventType.BookingCompleted, EventType.BookingCompleted];
      const scoreImpacts = [100, 100];
      const metadataHashes = [metadataHash, metadataHash];

      const tx = await registry.connect(submitter1).recordEventsBatch(
        actors,
        bookingIds,
        actorTypes,
        eventTypes,
        scoreImpacts,
        metadataHashes
      );

      // Check that 2 ReputationEventRecorded events were emitted
      const receipt = await tx.wait();
      const events = receipt!.logs.filter(
        (log) => log.topics[0] === registry.interface.getEvent("ReputationEventRecorded").topicHash
      );
      expect(events.length).to.equal(2);
    });

    it("should handle mixed positive and negative impacts", async function () {
      const { registry, submitter1, stylist, metadataHash } =
        await loadFixture(deployWithRegisteredActorFixture);

      const actors = [stylist.address, stylist.address];
      const bookingIds = [
        ethers.keccak256(ethers.toUtf8Bytes("booking-1")),
        ethers.keccak256(ethers.toUtf8Bytes("booking-2")),
      ];
      const actorTypes = [ActorType.Stylist, ActorType.Stylist];
      const eventTypes = [EventType.OnTimeArrival, EventType.LateArrival];
      const scoreImpacts = [500, -300]; // Net +200
      const metadataHashes = [metadataHash, metadataHash];

      const scoreBefore = await registry.getReputationScore(stylist.address);

      await registry.connect(submitter1).recordEventsBatch(
        actors,
        bookingIds,
        actorTypes,
        eventTypes,
        scoreImpacts,
        metadataHashes
      );

      const scoreAfter = await registry.getReputationScore(stylist.address);
      // TPS should increase by net +200
      expect(scoreAfter.tpsScore).to.equal(Number(scoreBefore.tpsScore) + 200);
    });

    it("should revert on zero address in batch", async function () {
      const { registry, submitter1, stylist, metadataHash } =
        await loadFixture(deployReputationRegistryFixture);

      const actors = [stylist.address, ethers.ZeroAddress]; // Zero address
      const bookingIds = [
        ethers.keccak256(ethers.toUtf8Bytes("booking-1")),
        ethers.keccak256(ethers.toUtf8Bytes("booking-2")),
      ];
      const actorTypes = [ActorType.Stylist, ActorType.Stylist];
      const eventTypes = [EventType.BookingCompleted, EventType.BookingCompleted];
      const scoreImpacts = [100, 100];
      const metadataHashes = [metadataHash, metadataHash];

      await expect(
        registry.connect(submitter1).recordEventsBatch(
          actors,
          bookingIds,
          actorTypes,
          eventTypes,
          scoreImpacts,
          metadataHashes
        )
      ).to.be.revertedWithCustomError(registry, "InvalidAddress");
    });
  });

  // ============ Score Calculation Tests ============

  describe("Score Calculation", function () {
    it("should calculate TPS score correctly", async function () {
      const { registry, submitter1, stylist, metadataHash } =
        await loadFixture(deployWithRegisteredActorFixture);

      // Initial TPS is 5000
      let score = await registry.getReputationScore(stylist.address);
      expect(score.tpsScore).to.equal(5000);

      // Add positive impact
      await registry.connect(submitter1).recordEvent(
        stylist.address,
        ethers.keccak256(ethers.toUtf8Bytes("booking-1")),
        ActorType.Stylist,
        EventType.OnTimeArrival,
        500,
        metadataHash
      );

      score = await registry.getReputationScore(stylist.address);
      expect(score.tpsScore).to.equal(5500);
    });

    it("should calculate reliability score correctly", async function () {
      const { registry, submitter1, stylist, metadataHash } =
        await loadFixture(deployWithRegisteredActorFixture);

      // Complete 8 bookings
      for (let i = 0; i < 8; i++) {
        await registry.connect(submitter1).recordEvent(
          stylist.address,
          ethers.keccak256(ethers.toUtf8Bytes(`booking-${i}`)),
          ActorType.Stylist,
          EventType.BookingCompleted,
          100,
          metadataHash
        );
      }

      // Cancel 2 bookings
      for (let i = 8; i < 10; i++) {
        await registry.connect(submitter1).recordEvent(
          stylist.address,
          ethers.keccak256(ethers.toUtf8Bytes(`booking-${i}`)),
          ActorType.Stylist,
          EventType.BookingCancelled,
          -100,
          metadataHash
        );
      }

      const score = await registry.getReputationScore(stylist.address);
      // 8 completed out of 10 = 80% = 8000
      expect(score.reliabilityScore).to.equal(8000);
    });

    it("should calculate feedback score correctly", async function () {
      const { registry, submitter1, stylist, metadataHash } =
        await loadFixture(deployWithRegisteredActorFixture);

      // Add positive review
      await registry.connect(submitter1).recordEvent(
        stylist.address,
        ethers.keccak256(ethers.toUtf8Bytes("booking-1")),
        ActorType.Stylist,
        EventType.CustomerReview,
        300,
        metadataHash
      );

      const score = await registry.getReputationScore(stylist.address);
      expect(score.feedbackScore).to.equal(5300); // 5000 + 300
      expect(score.totalReviews).to.equal(1);
    });

    it("should calculate dispute score correctly", async function () {
      const { registry, submitter1, stylist, metadataHash } =
        await loadFixture(deployWithRegisteredActorFixture);

      // Initial dispute score is 10000 (perfect)
      let score = await registry.getReputationScore(stylist.address);
      expect(score.disputeScore).to.equal(10000);

      // Raise a dispute (negative impact)
      await registry.connect(submitter1).recordEvent(
        stylist.address,
        ethers.keccak256(ethers.toUtf8Bytes("booking-1")),
        ActorType.Stylist,
        EventType.DisputeRaised,
        -500,
        metadataHash
      );

      score = await registry.getReputationScore(stylist.address);
      expect(score.disputeScore).to.equal(9500);
    });

    it("should calculate weighted total score correctly", async function () {
      const { registry, submitter1, stylist, metadataHash } =
        await loadFixture(deployWithRegisteredActorFixture);

      // Set up known scores
      // TPS: 5000, Reliability: 5000, Feedback: 5000, Dispute: 10000
      // Weighted: (5000*30 + 5000*30 + 5000*30 + 10000*10) / 100 = 5500
      const score = await registry.getReputationScore(stylist.address);
      expect(score.totalScore).to.equal(5500);
    });

    it("should handle edge case with all scores at maximum", async function () {
      const { registry, submitter1, stylist, metadataHash } =
        await loadFixture(deployWithRegisteredActorFixture);

      // Max out TPS
      for (let i = 0; i < 10; i++) {
        await registry.connect(submitter1).recordEvent(
          stylist.address,
          ethers.keccak256(ethers.toUtf8Bytes(`tps-${i}`)),
          ActorType.Stylist,
          EventType.OnTimeArrival,
          1000,
          metadataHash
        );
      }

      // Max out feedback
      for (let i = 0; i < 10; i++) {
        await registry.connect(submitter1).recordEvent(
          stylist.address,
          ethers.keccak256(ethers.toUtf8Bytes(`feedback-${i}`)),
          ActorType.Stylist,
          EventType.CustomerReview,
          1000,
          metadataHash
        );
      }

      const score = await registry.getReputationScore(stylist.address);
      expect(score.tpsScore).to.equal(10000);
      expect(score.feedbackScore).to.equal(10000);
      expect(score.totalScore).to.be.lessThanOrEqual(10000);
    });

    it("should handle edge case with all scores at minimum", async function () {
      const { registry, submitter1, stylist, metadataHash } =
        await loadFixture(deployWithRegisteredActorFixture);

      // Min out all scores
      for (let i = 0; i < 10; i++) {
        await registry.connect(submitter1).recordEvent(
          stylist.address,
          ethers.keccak256(ethers.toUtf8Bytes(`tps-${i}`)),
          ActorType.Stylist,
          EventType.LateArrival,
          -1000,
          metadataHash
        );
      }

      const score = await registry.getReputationScore(stylist.address);
      expect(score.tpsScore).to.equal(0);
    });

    it("should emit ScoreUpdated event", async function () {
      const { registry, submitter1, stylist, metadataHash } =
        await loadFixture(deployWithRegisteredActorFixture);

      await expect(
        registry.connect(submitter1).recordEvent(
          stylist.address,
          ethers.keccak256(ethers.toUtf8Bytes("booking-1")),
          ActorType.Stylist,
          EventType.OnTimeArrival,
          100,
          metadataHash
        )
      ).to.emit(registry, "ScoreUpdated");
    });
  });

  // ============ Verification Status Tests ============

  describe("Verification Status", function () {
    it("should verify actor meeting threshold", async function () {
      const { registry, submitter1, stylist, metadataHash } =
        await loadFixture(deployWithRegisteredActorFixture);

      // Complete 5 bookings (minimum required)
      for (let i = 0; i < 5; i++) {
        await registry.connect(submitter1).recordEvent(
          stylist.address,
          ethers.keccak256(ethers.toUtf8Bytes(`booking-${i}`)),
          ActorType.Stylist,
          EventType.BookingCompleted,
          100,
          metadataHash
        );
      }

      // Add positive TPS to reach 70%+ total
      for (let i = 0; i < 5; i++) {
        await registry.connect(submitter1).recordEvent(
          stylist.address,
          ethers.keccak256(ethers.toUtf8Bytes(`tps-${i}`)),
          ActorType.Stylist,
          EventType.OnTimeArrival,
          500,
          metadataHash
        );
      }

      const score = await registry.getReputationScore(stylist.address);
      expect(score.completedBookings).to.be.greaterThanOrEqual(5);
      expect(score.totalScore).to.be.greaterThanOrEqual(7000);
      expect(score.isVerified).to.be.true;
    });

    it("should not verify actor below score threshold", async function () {
      const { registry, submitter1, stylist, metadataHash } =
        await loadFixture(deployWithRegisteredActorFixture);

      // Complete 5 bookings but with negative TPS
      for (let i = 0; i < 5; i++) {
        await registry.connect(submitter1).recordEvent(
          stylist.address,
          ethers.keccak256(ethers.toUtf8Bytes(`booking-${i}`)),
          ActorType.Stylist,
          EventType.BookingCompleted,
          100,
          metadataHash
        );

        await registry.connect(submitter1).recordEvent(
          stylist.address,
          ethers.keccak256(ethers.toUtf8Bytes(`tps-${i}`)),
          ActorType.Stylist,
          EventType.LateArrival,
          -1000,
          metadataHash
        );
      }

      const score = await registry.getReputationScore(stylist.address);
      expect(score.completedBookings).to.be.greaterThanOrEqual(5);
      expect(score.totalScore).to.be.lessThan(7000);
      expect(score.isVerified).to.be.false;
    });

    it("should not verify actor below booking threshold", async function () {
      const { registry, submitter1, stylist, metadataHash } =
        await loadFixture(deployWithRegisteredActorFixture);

      // Complete only 3 bookings with high scores
      for (let i = 0; i < 3; i++) {
        await registry.connect(submitter1).recordEvent(
          stylist.address,
          ethers.keccak256(ethers.toUtf8Bytes(`booking-${i}`)),
          ActorType.Stylist,
          EventType.BookingCompleted,
          100,
          metadataHash
        );

        await registry.connect(submitter1).recordEvent(
          stylist.address,
          ethers.keccak256(ethers.toUtf8Bytes(`tps-${i}`)),
          ActorType.Stylist,
          EventType.OnTimeArrival,
          1000,
          metadataHash
        );
      }

      const score = await registry.getReputationScore(stylist.address);
      expect(score.completedBookings).to.equal(3);
      expect(score.isVerified).to.be.false;
    });

    it("should emit VerificationStatusChanged event", async function () {
      const { registry, submitter1, stylist, metadataHash } =
        await loadFixture(deployWithRegisteredActorFixture);

      // Build up to verification
      for (let i = 0; i < 4; i++) {
        await registry.connect(submitter1).recordEvent(
          stylist.address,
          ethers.keccak256(ethers.toUtf8Bytes(`booking-${i}`)),
          ActorType.Stylist,
          EventType.BookingCompleted,
          100,
          metadataHash
        );

        await registry.connect(submitter1).recordEvent(
          stylist.address,
          ethers.keccak256(ethers.toUtf8Bytes(`tps-${i}`)),
          ActorType.Stylist,
          EventType.OnTimeArrival,
          500,
          metadataHash
        );
      }

      // 5th booking should trigger verification
      await expect(
        registry.connect(submitter1).recordEvent(
          stylist.address,
          ethers.keccak256(ethers.toUtf8Bytes("booking-4")),
          ActorType.Stylist,
          EventType.BookingCompleted,
          100,
          metadataHash
        )
      ).to.emit(registry, "VerificationStatusChanged");
    });
  });

  // ============ Authorized Submitter Tests ============

  describe("Authorized Submitter Management", function () {
    it("should add authorized submitter", async function () {
      const { registry, owner, submitter2 } =
        await loadFixture(deployReputationRegistryFixture);

      await registry.connect(owner).setAuthorizedSubmitter(submitter2.address, true);
      expect(await registry.authorizedSubmitters(submitter2.address)).to.be.true;
    });

    it("should remove authorized submitter", async function () {
      const { registry, owner, submitter1 } =
        await loadFixture(deployReputationRegistryFixture);

      await registry.connect(owner).setAuthorizedSubmitter(submitter1.address, false);
      expect(await registry.authorizedSubmitters(submitter1.address)).to.be.false;
    });

    it("should emit SubmitterAuthorized event", async function () {
      const { registry, owner, submitter2 } =
        await loadFixture(deployReputationRegistryFixture);

      await expect(registry.connect(owner).setAuthorizedSubmitter(submitter2.address, true))
        .to.emit(registry, "SubmitterAuthorized")
        .withArgs(submitter2.address, true);
    });

    it("should revert if caller is not owner", async function () {
      const { registry, submitter1, submitter2 } =
        await loadFixture(deployReputationRegistryFixture);

      await expect(
        registry.connect(submitter1).setAuthorizedSubmitter(submitter2.address, true)
      ).to.be.revertedWithCustomError(registry, "OwnableUnauthorizedAccount");
    });

    it("should revert if submitter address is zero", async function () {
      const { registry, owner } =
        await loadFixture(deployReputationRegistryFixture);

      await expect(
        registry.connect(owner).setAuthorizedSubmitter(ethers.ZeroAddress, true)
      ).to.be.revertedWithCustomError(registry, "InvalidAddress");
    });
  });

  // ============ Verification Threshold Tests ============

  describe("Verification Threshold", function () {
    it("should update verification threshold", async function () {
      const { registry, owner } =
        await loadFixture(deployReputationRegistryFixture);

      await registry.connect(owner).setVerificationThreshold(8000);
      expect(await registry.verificationThreshold()).to.equal(8000);
    });

    it("should revert if threshold exceeds maximum", async function () {
      const { registry, owner } =
        await loadFixture(deployReputationRegistryFixture);

      await expect(
        registry.connect(owner).setVerificationThreshold(10001)
      ).to.be.revertedWith("Invalid threshold");
    });

    it("should revert if caller is not owner", async function () {
      const { registry, submitter1 } =
        await loadFixture(deployReputationRegistryFixture);

      await expect(
        registry.connect(submitter1).setVerificationThreshold(8000)
      ).to.be.revertedWithCustomError(registry, "OwnableUnauthorizedAccount");
    });
  });

  // ============ Event History Tests ============

  describe("Event History", function () {
    it("should store events in history", async function () {
      const { registry, submitter1, stylist, bookingId1, metadataHash } =
        await loadFixture(deployReputationRegistryFixture);

      await registry.connect(submitter1).recordEvent(
        stylist.address,
        bookingId1,
        ActorType.Stylist,
        EventType.BookingCompleted,
        100,
        metadataHash
      );

      const eventCount = await registry.getEventCount(stylist.address);
      expect(eventCount).to.equal(1);
    });

    it("should retrieve event from history", async function () {
      const { registry, submitter1, stylist, bookingId1, metadataHash } =
        await loadFixture(deployReputationRegistryFixture);

      await registry.connect(submitter1).recordEvent(
        stylist.address,
        bookingId1,
        ActorType.Stylist,
        EventType.BookingCompleted,
        100,
        metadataHash
      );

      const event = await registry.getEvent(stylist.address, 0);
      expect(event.bookingId).to.equal(bookingId1);
      expect(event.actorType).to.equal(ActorType.Stylist);
      expect(event.eventType).to.equal(EventType.BookingCompleted);
      expect(event.scoreImpact).to.equal(100);
    });

    it("should handle multiple events per actor", async function () {
      const { registry, submitter1, stylist, metadataHash } =
        await loadFixture(deployReputationRegistryFixture);

      for (let i = 0; i < 10; i++) {
        await registry.connect(submitter1).recordEvent(
          stylist.address,
          ethers.keccak256(ethers.toUtf8Bytes(`booking-${i}`)),
          ActorType.Stylist,
          EventType.BookingCompleted,
          100,
          metadataHash
        );
      }

      const eventCount = await registry.getEventCount(stylist.address);
      expect(eventCount).to.equal(10);
    });
  });

  // ============ View Function Tests ============

  describe("View Functions", function () {
    it("should return actor reputation score", async function () {
      const { registry, stylist } =
        await loadFixture(deployWithRegisteredActorFixture);

      const score = await registry.getReputationScore(stylist.address);
      expect(score.totalScore).to.be.greaterThan(0);
    });

    it("should return actor verification status", async function () {
      const { registry, stylist } =
        await loadFixture(deployWithRegisteredActorFixture);

      const isVerified = await registry.isActorVerified(stylist.address);
      expect(isVerified).to.be.false; // Not enough bookings yet
    });

    it("should return score as percentage", async function () {
      const { registry, stylist } =
        await loadFixture(deployWithRegisteredActorFixture);

      const percentage = await registry.getScorePercentage(stylist.address);
      expect(percentage).to.equal(55); // 5500 / 100 = 55
    });
  });

  // ============ Access Control Tests ============

  describe("Access Control", function () {
    it("should only allow owner to manage submitters", async function () {
      const { registry, unauthorized, submitter2 } =
        await loadFixture(deployReputationRegistryFixture);

      await expect(
        registry.connect(unauthorized).setAuthorizedSubmitter(submitter2.address, true)
      ).to.be.revertedWithCustomError(registry, "OwnableUnauthorizedAccount");
    });

    it("should only allow authorized submitters to record events", async function () {
      const { registry, unauthorized, stylist, bookingId1, metadataHash } =
        await loadFixture(deployReputationRegistryFixture);

      await expect(
        registry.connect(unauthorized).recordEvent(
          stylist.address,
          bookingId1,
          ActorType.Stylist,
          EventType.BookingCompleted,
          100,
          metadataHash
        )
      ).to.be.revertedWithCustomError(registry, "UnauthorizedSubmitter");
    });

    it("should revert unauthorized access attempts", async function () {
      const { registry, unauthorized, stylist } =
        await loadFixture(deployReputationRegistryFixture);

      await expect(
        registry.connect(unauthorized).registerActor(stylist.address, ActorType.Stylist)
      ).to.be.revertedWithCustomError(registry, "UnauthorizedSubmitter");
    });
  });

  // ============ Pause Tests ============

  describe("Pause Functionality", function () {
    it("should pause event recording", async function () {
      const { registry, owner, submitter1, stylist, bookingId1, metadataHash } =
        await loadFixture(deployReputationRegistryFixture);

      await registry.connect(owner).pause();

      await expect(
        registry.connect(submitter1).recordEvent(
          stylist.address,
          bookingId1,
          ActorType.Stylist,
          EventType.BookingCompleted,
          100,
          metadataHash
        )
      ).to.be.revertedWithCustomError(registry, "EnforcedPause");
    });

    it("should unpause and resume operations", async function () {
      const { registry, owner, submitter1, stylist, bookingId1, metadataHash } =
        await loadFixture(deployReputationRegistryFixture);

      await registry.connect(owner).pause();
      await registry.connect(owner).unpause();

      // Should work now
      await registry.connect(submitter1).recordEvent(
        stylist.address,
        bookingId1,
        ActorType.Stylist,
        EventType.BookingCompleted,
        100,
        metadataHash
      );

      const score = await registry.getReputationScore(stylist.address);
      expect(score.completedBookings).to.equal(1);
    });

    it("should revert recording when paused", async function () {
      const { registry, owner, submitter1, stylist } =
        await loadFixture(deployReputationRegistryFixture);

      await registry.connect(owner).pause();

      await expect(
        registry.connect(submitter1).registerActor(stylist.address, ActorType.Stylist)
      ).to.be.revertedWithCustomError(registry, "EnforcedPause");
    });

    it("should allow view functions when paused", async function () {
      const { registry, owner, stylist } =
        await loadFixture(deployWithRegisteredActorFixture);

      await registry.connect(owner).pause();

      // View functions should still work
      const score = await registry.getReputationScore(stylist.address);
      expect(score.totalScore).to.be.greaterThan(0);
    });
  });

  // ============ Edge Cases and Security Tests ============

  describe("Security Scenarios", function () {
    it("should handle score consistency after multiple operations", async function () {
      const { registry, submitter1, stylist, metadataHash } =
        await loadFixture(deployWithRegisteredActorFixture);

      // Perform many operations
      for (let i = 0; i < 20; i++) {
        await registry.connect(submitter1).recordEvent(
          stylist.address,
          ethers.keccak256(ethers.toUtf8Bytes(`booking-${i}`)),
          ActorType.Stylist,
          i % 2 === 0 ? EventType.BookingCompleted : EventType.BookingCancelled,
          i % 2 === 0 ? 100 : -100,
          metadataHash
        );
      }

      const score = await registry.getReputationScore(stylist.address);
      // 10 completed, 10 cancelled = 50% reliability
      expect(score.reliabilityScore).to.equal(5000);
    });

    it("should auto-register actors on first event", async function () {
      const { registry, submitter1, stylist, bookingId1, metadataHash } =
        await loadFixture(deployReputationRegistryFixture);

      // Record event without prior registration
      await registry.connect(submitter1).recordEvent(
        stylist.address,
        bookingId1,
        ActorType.Stylist,
        EventType.BookingCompleted,
        100,
        metadataHash
      );

      // Actor should be registered
      expect(await registry.totalActors()).to.be.greaterThan(0);
    });

    it("should maintain independent scores per actor", async function () {
      const { registry, submitter1, stylist, customer, metadataHash } =
        await loadFixture(deployReputationRegistryFixture);

      // Record events for both actors
      await registry.connect(submitter1).recordEvent(
        stylist.address,
        ethers.keccak256(ethers.toUtf8Bytes("booking-1")),
        ActorType.Stylist,
        EventType.OnTimeArrival,
        500,
        metadataHash
      );

      await registry.connect(submitter1).recordEvent(
        customer.address,
        ethers.keccak256(ethers.toUtf8Bytes("booking-2")),
        ActorType.Customer,
        EventType.OnTimeArrival,
        -500,
        metadataHash
      );

      const stylistScore = await registry.getReputationScore(stylist.address);
      const customerScore = await registry.getReputationScore(customer.address);

      expect(stylistScore.tpsScore).to.equal(5500);
      expect(customerScore.tpsScore).to.equal(4500);
    });
  });

  // ============ Gas Optimization Tests ============

  describe("Gas Optimization", function () {
    it("should efficiently process batch of 100 events", async function () {
      const { registry, submitter1, stylist, metadataHash } =
        await loadFixture(deployReputationRegistryFixture);

      const batchSize = 100;
      const actors = Array(batchSize).fill(stylist.address);
      const bookingIds = Array.from({ length: batchSize }, (_, i) =>
        ethers.keccak256(ethers.toUtf8Bytes(`booking-${i}`))
      );
      const actorTypes = Array(batchSize).fill(ActorType.Stylist);
      const eventTypes = Array(batchSize).fill(EventType.BookingCompleted);
      const scoreImpacts = Array(batchSize).fill(100);
      const metadataHashes = Array(batchSize).fill(metadataHash);

      const tx = await registry.connect(submitter1).recordEventsBatch(
        actors,
        bookingIds,
        actorTypes,
        eventTypes,
        scoreImpacts,
        metadataHashes
      );

      const receipt = await tx.wait();
      // Just verify it completes successfully
      expect(receipt!.status).to.equal(1);
    });

    it("should measure single event gas cost", async function () {
      const { registry, submitter1, stylist, bookingId1, metadataHash } =
        await loadFixture(deployReputationRegistryFixture);

      const tx = await registry.connect(submitter1).recordEvent(
        stylist.address,
        bookingId1,
        ActorType.Stylist,
        EventType.BookingCompleted,
        100,
        metadataHash
      );

      const receipt = await tx.wait();
      // Log gas used for reference
      console.log(`Single event gas used: ${receipt!.gasUsed.toString()}`);
      expect(receipt!.gasUsed).to.be.lessThan(500000);
    });
  });
});
