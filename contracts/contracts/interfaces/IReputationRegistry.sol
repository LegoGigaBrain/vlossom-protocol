// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

/**
 * @title IReputationRegistry
 * @notice Interface for the ReputationRegistry contract
 */
interface IReputationRegistry {
    enum ActorType {
        Stylist,
        Customer,
        PropertyOwner
    }

    enum EventType {
        BookingCompleted,
        BookingCancelled,
        CustomerNoShow,
        StylistNoShow,
        OnTimeArrival,
        LateArrival,
        OnTimeCompletion,
        LateCompletion,
        CustomerReview,
        PropertyOwnerReview,
        DisputeRaised,
        DisputeResolved
    }

    struct ReputationScore {
        uint256 totalScore;
        uint256 tpsScore;
        uint256 reliabilityScore;
        uint256 feedbackScore;
        uint256 disputeScore;
        uint256 completedBookings;
        uint256 cancelledBookings;
        uint256 totalReviews;
        uint256 lastUpdated;
        bool isVerified;
    }

    event ActorRegistered(address indexed actor, ActorType actorType, uint256 timestamp);
    event ReputationEventRecorded(address indexed actor, bytes32 indexed bookingId, EventType eventType, int256 scoreImpact, uint256 timestamp);
    event ScoreUpdated(address indexed actor, uint256 newTotalScore, uint256 newTpsScore, uint256 newReliabilityScore, uint256 newFeedbackScore, uint256 timestamp);
    event VerificationStatusChanged(address indexed actor, bool isVerified, uint256 timestamp);

    function registerActor(address actor, ActorType actorType) external;

    function recordEvent(
        address actor,
        bytes32 bookingId,
        ActorType actorType,
        EventType eventType,
        int256 scoreImpact,
        bytes32 metadataHash
    ) external;

    function recordEventsBatch(
        address[] calldata actors,
        bytes32[] calldata bookingIds,
        ActorType[] calldata actorTypes,
        EventType[] calldata eventTypes,
        int256[] calldata scoreImpacts,
        bytes32[] calldata metadataHashes
    ) external;

    function getReputationScore(address actor) external view returns (
        uint256 totalScore,
        uint256 tpsScore,
        uint256 reliabilityScore,
        uint256 feedbackScore,
        uint256 disputeScore,
        uint256 completedBookings,
        uint256 totalReviews,
        bool isVerified
    );

    function getEventCount(address actor) external view returns (uint256);

    function isActorVerified(address actor) external view returns (bool);

    function getScorePercentage(address actor) external view returns (uint256);

    function totalActors() external view returns (uint256);

    function verificationThreshold() external view returns (uint256);
}
