// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title ReputationRegistry
 * @notice On-chain reputation scoring for Vlossom Protocol three-sided marketplace
 * @dev Records reputation scores and events that can be verified on-chain
 *
 * This contract provides:
 * - Aggregated reputation scores for stylists, customers, and property owners
 * - Immutable event records for accountability
 * - Score thresholds for platform features (verified badge, etc.)
 *
 * Reference: docs/vlossom/08-reputation-system-flow.md
 *
 * Score components for Stylists:
 * - TPS (Time Performance Score): punctuality and timing
 * - Reliability: booking completion rate
 * - Customer feedback: structured ratings
 * - Property owner feedback: workspace behavior
 * - Dispute history: penalty for disputes
 */
contract ReputationRegistry is Ownable, ReentrancyGuard, Pausable {
    /// @dev Custom errors
    error InvalidAddress();
    error InvalidScore();
    error UnauthorizedSubmitter();
    error ActorNotFound();
    error ArrayLengthMismatch();

    /// @notice Actor type in the marketplace
    enum ActorType {
        Stylist,
        Customer,
        PropertyOwner
    }

    /// @notice Reputation event type
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

    /// @notice Aggregated reputation score for an actor
    struct ReputationScore {
        uint256 totalScore;         // Weighted aggregate (0-10000, representing 0.00-100.00)
        uint256 tpsScore;           // Time Performance Score (0-10000)
        uint256 reliabilityScore;   // Booking reliability (0-10000)
        uint256 feedbackScore;      // Customer/owner feedback (0-10000)
        uint256 disputeScore;       // Dispute impact (0-10000, higher = fewer disputes)
        uint256 completedBookings;  // Total completed bookings
        uint256 cancelledBookings;  // Total cancelled bookings
        uint256 totalReviews;       // Number of reviews received
        uint256 lastUpdated;        // Timestamp of last update
        bool isVerified;            // Has met verification threshold
    }

    /// @notice Reputation event record
    struct ReputationEvent {
        bytes32 bookingId;          // Associated booking ID
        ActorType actorType;
        EventType eventType;
        int256 scoreImpact;         // Positive or negative impact (-1000 to +1000)
        uint256 timestamp;
        bytes32 metadataHash;       // Hash of additional off-chain metadata
    }

    /// @notice Authorized submitters (backend services)
    mapping(address => bool) public authorizedSubmitters;

    /// @notice Reputation scores by actor address
    mapping(address => ReputationScore) public reputationScores;

    /// @notice Event history by actor address
    mapping(address => ReputationEvent[]) public eventHistory;

    /// @notice Total registered actors
    uint256 public totalActors;

    /// @notice Verification threshold (default 7000 = 70.00)
    uint256 public verificationThreshold = 7000;

    /// @notice Events
    /// @dev M-4: Added indexed to actorType for efficient filtering by actor type
    event ActorRegistered(
        address indexed actor,
        ActorType indexed actorType,
        uint256 timestamp
    );

    /// @dev M-4: Added indexed to eventType for efficient filtering by event category
    event ReputationEventRecorded(
        address indexed actor,
        bytes32 indexed bookingId,
        EventType indexed eventType,
        int256 scoreImpact,
        uint256 timestamp
    );

    event ScoreUpdated(
        address indexed actor,
        uint256 newTotalScore,
        uint256 newTpsScore,
        uint256 newReliabilityScore,
        uint256 newFeedbackScore,
        uint256 timestamp
    );

    event VerificationStatusChanged(
        address indexed actor,
        bool isVerified,
        uint256 timestamp
    );

    event SubmitterAuthorized(address indexed submitter, bool authorized);

    /**
     * @notice Initialize the reputation registry
     * @param _initialOwner Address of the contract owner
     */
    constructor(address _initialOwner) Ownable(_initialOwner) {
        // Owner is automatically an authorized submitter
        authorizedSubmitters[_initialOwner] = true;
        emit SubmitterAuthorized(_initialOwner, true);
    }

    /// @dev Modifier to restrict to authorized submitters
    modifier onlyAuthorized() {
        if (!authorizedSubmitters[msg.sender]) revert UnauthorizedSubmitter();
        _;
    }

    // ============================================================================
    // Submitter Management
    // ============================================================================

    /**
     * @notice Authorize or revoke a submitter
     * @param submitter Address to authorize
     * @param authorized Whether to authorize or revoke
     */
    function setAuthorizedSubmitter(
        address submitter,
        bool authorized
    ) external onlyOwner {
        if (submitter == address(0)) revert InvalidAddress();
        authorizedSubmitters[submitter] = authorized;
        emit SubmitterAuthorized(submitter, authorized);
    }

    // ============================================================================
    // Reputation Recording
    // ============================================================================

    /**
     * @notice Initialize an actor's reputation (first interaction)
     * @param actor Address of the actor
     * @param actorType Type of actor (Stylist, Customer, PropertyOwner)
     */
    function registerActor(
        address actor,
        ActorType actorType
    ) external onlyAuthorized whenNotPaused {
        if (actor == address(0)) revert InvalidAddress();

        // Only register if not already registered
        if (reputationScores[actor].lastUpdated == 0) {
            reputationScores[actor] = ReputationScore({
                totalScore: 5000,       // Start at 50.00
                tpsScore: 5000,
                reliabilityScore: 5000,
                feedbackScore: 5000,
                disputeScore: 10000,    // Start with perfect dispute score
                completedBookings: 0,
                cancelledBookings: 0,
                totalReviews: 0,
                lastUpdated: block.timestamp,
                isVerified: false
            });

            totalActors++;
            emit ActorRegistered(actor, actorType, block.timestamp);
        }
    }

    /**
     * @notice Record a reputation event
     * @param actor Address of the actor
     * @param bookingId Associated booking ID
     * @param actorType Type of actor
     * @param eventType Type of event
     * @param scoreImpact Score impact (-1000 to +1000)
     * @param metadataHash Hash of off-chain metadata
     */
    function recordEvent(
        address actor,
        bytes32 bookingId,
        ActorType actorType,
        EventType eventType,
        int256 scoreImpact,
        bytes32 metadataHash
    ) external onlyAuthorized nonReentrant whenNotPaused {
        if (actor == address(0)) revert InvalidAddress();
        if (scoreImpact < -1000 || scoreImpact > 1000) revert InvalidScore();

        // Auto-register if needed
        if (reputationScores[actor].lastUpdated == 0) {
            reputationScores[actor] = ReputationScore({
                totalScore: 5000,
                tpsScore: 5000,
                reliabilityScore: 5000,
                feedbackScore: 5000,
                disputeScore: 10000,
                completedBookings: 0,
                cancelledBookings: 0,
                totalReviews: 0,
                lastUpdated: block.timestamp,
                isVerified: false
            });
            totalActors++;
            emit ActorRegistered(actor, actorType, block.timestamp);
        }

        // Record event
        ReputationEvent memory newEvent = ReputationEvent({
            bookingId: bookingId,
            actorType: actorType,
            eventType: eventType,
            scoreImpact: scoreImpact,
            timestamp: block.timestamp,
            metadataHash: metadataHash
        });

        eventHistory[actor].push(newEvent);

        // Update appropriate score component
        ReputationScore storage score = reputationScores[actor];

        if (eventType == EventType.BookingCompleted) {
            score.completedBookings++;
            _updateReliabilityScore(actor);
        } else if (eventType == EventType.BookingCancelled) {
            score.cancelledBookings++;
            _updateReliabilityScore(actor);
        } else if (eventType == EventType.OnTimeArrival ||
                   eventType == EventType.LateArrival ||
                   eventType == EventType.OnTimeCompletion ||
                   eventType == EventType.LateCompletion) {
            _updateTpsScore(actor, scoreImpact);
        } else if (eventType == EventType.CustomerReview ||
                   eventType == EventType.PropertyOwnerReview) {
            score.totalReviews++;
            _updateFeedbackScore(actor, scoreImpact);
        } else if (eventType == EventType.DisputeRaised ||
                   eventType == EventType.DisputeResolved) {
            _updateDisputeScore(actor, scoreImpact);
        }

        score.lastUpdated = block.timestamp;

        // Recalculate total score
        _recalculateTotalScore(actor);

        // Check verification status
        _checkVerificationStatus(actor);

        emit ReputationEventRecorded(actor, bookingId, eventType, scoreImpact, block.timestamp);
    }

    /**
     * @notice Batch record multiple events with full validation (H-3 fix)
     * @param actors Array of actor addresses
     * @param bookingIds Array of booking IDs
     * @param actorTypes Array of actor types
     * @param eventTypes Array of event types
     * @param scoreImpacts Array of score impacts
     * @param metadataHashes Array of metadata hashes
     * @dev H-3 fix: Added all validations from recordEvent to maintain consistency:
     *      - Zero address validation (reverts instead of continuing)
     *      - scoreImpact bounds validation (-1000 to +1000)
     *      - Auto-registration of new actors
     *      - Score component updates based on event type
     *      - Total score recalculation
     *      - Verification status check
     */
    function recordEventsBatch(
        address[] calldata actors,
        bytes32[] calldata bookingIds,
        ActorType[] calldata actorTypes,
        EventType[] calldata eventTypes,
        int256[] calldata scoreImpacts,
        bytes32[] calldata metadataHashes
    ) external onlyAuthorized nonReentrant whenNotPaused {
        // Validate array lengths
        uint256 length = actors.length;
        if (
            length != bookingIds.length ||
            length != actorTypes.length ||
            length != eventTypes.length ||
            length != scoreImpacts.length ||
            length != metadataHashes.length
        ) {
            revert ArrayLengthMismatch();
        }

        for (uint256 i = 0; i < length; i++) {
            address actor = actors[i];
            int256 scoreImpact = scoreImpacts[i];
            ActorType actorType = actorTypes[i];
            EventType eventType = eventTypes[i];

            // H-3 fix: Validate actor address - revert instead of continue
            if (actor == address(0)) revert InvalidAddress();

            // H-3 fix: Validate score impact bounds
            if (scoreImpact < -1000 || scoreImpact > 1000) revert InvalidScore();

            // H-3 fix: Auto-register if needed
            if (reputationScores[actor].lastUpdated == 0) {
                reputationScores[actor] = ReputationScore({
                    totalScore: 5000,
                    tpsScore: 5000,
                    reliabilityScore: 5000,
                    feedbackScore: 5000,
                    disputeScore: 10000,
                    completedBookings: 0,
                    cancelledBookings: 0,
                    totalReviews: 0,
                    lastUpdated: block.timestamp,
                    isVerified: false
                });
                totalActors++;
                emit ActorRegistered(actor, actorType, block.timestamp);
            }

            // Record event
            ReputationEvent memory newEvent = ReputationEvent({
                bookingId: bookingIds[i],
                actorType: actorType,
                eventType: eventType,
                scoreImpact: scoreImpact,
                timestamp: block.timestamp,
                metadataHash: metadataHashes[i]
            });

            eventHistory[actor].push(newEvent);

            // H-3 fix: Update appropriate score component
            ReputationScore storage score = reputationScores[actor];

            if (eventType == EventType.BookingCompleted) {
                score.completedBookings++;
                _updateReliabilityScore(actor);
            } else if (eventType == EventType.BookingCancelled) {
                score.cancelledBookings++;
                _updateReliabilityScore(actor);
            } else if (eventType == EventType.OnTimeArrival ||
                       eventType == EventType.LateArrival ||
                       eventType == EventType.OnTimeCompletion ||
                       eventType == EventType.LateCompletion) {
                _updateTpsScore(actor, scoreImpact);
            } else if (eventType == EventType.CustomerReview ||
                       eventType == EventType.PropertyOwnerReview) {
                score.totalReviews++;
                _updateFeedbackScore(actor, scoreImpact);
            } else if (eventType == EventType.DisputeRaised ||
                       eventType == EventType.DisputeResolved) {
                _updateDisputeScore(actor, scoreImpact);
            }

            score.lastUpdated = block.timestamp;

            // H-3 fix: Recalculate total score
            _recalculateTotalScore(actor);

            // H-3 fix: Check verification status
            _checkVerificationStatus(actor);

            emit ReputationEventRecorded(
                actor,
                bookingIds[i],
                eventType,
                scoreImpact,
                block.timestamp
            );
        }
    }

    // ============================================================================
    // Internal Score Updates
    // ============================================================================

    function _updateTpsScore(address actor, int256 impact) internal {
        ReputationScore storage score = reputationScores[actor];
        int256 newScore = int256(score.tpsScore) + impact;
        if (newScore < 0) newScore = 0;
        if (newScore > 10000) newScore = 10000;
        score.tpsScore = uint256(newScore);
    }

    function _updateReliabilityScore(address actor) internal {
        ReputationScore storage score = reputationScores[actor];
        uint256 total = score.completedBookings + score.cancelledBookings;
        if (total == 0) return;

        // Reliability = completed / total * 10000
        score.reliabilityScore = (score.completedBookings * 10000) / total;
    }

    function _updateFeedbackScore(address actor, int256 impact) internal {
        ReputationScore storage score = reputationScores[actor];
        int256 newScore = int256(score.feedbackScore) + impact;
        if (newScore < 0) newScore = 0;
        if (newScore > 10000) newScore = 10000;
        score.feedbackScore = uint256(newScore);
    }

    function _updateDisputeScore(address actor, int256 impact) internal {
        ReputationScore storage score = reputationScores[actor];
        int256 newScore = int256(score.disputeScore) + impact;
        if (newScore < 0) newScore = 0;
        if (newScore > 10000) newScore = 10000;
        score.disputeScore = uint256(newScore);
    }

    function _recalculateTotalScore(address actor) internal {
        ReputationScore storage score = reputationScores[actor];

        // Weighted average: TPS 30%, Reliability 30%, Feedback 30%, Disputes 10%
        score.totalScore = (
            score.tpsScore * 30 +
            score.reliabilityScore * 30 +
            score.feedbackScore * 30 +
            score.disputeScore * 10
        ) / 100;

        emit ScoreUpdated(
            actor,
            score.totalScore,
            score.tpsScore,
            score.reliabilityScore,
            score.feedbackScore,
            block.timestamp
        );
    }

    function _checkVerificationStatus(address actor) internal {
        ReputationScore storage score = reputationScores[actor];
        bool wasVerified = score.isVerified;

        // Require minimum bookings and score threshold
        bool meetsThreshold = score.totalScore >= verificationThreshold &&
                             score.completedBookings >= 5;

        if (meetsThreshold != wasVerified) {
            score.isVerified = meetsThreshold;
            emit VerificationStatusChanged(actor, meetsThreshold, block.timestamp);
        }
    }

    // ============================================================================
    // View Functions
    // ============================================================================

    /**
     * @notice Get an actor's reputation score
     * @param actor Address to query
     */
    function getReputationScore(address actor) external view returns (
        uint256 totalScore,
        uint256 tpsScore,
        uint256 reliabilityScore,
        uint256 feedbackScore,
        uint256 disputeScore,
        uint256 completedBookings,
        uint256 totalReviews,
        bool isVerified
    ) {
        ReputationScore storage score = reputationScores[actor];
        return (
            score.totalScore,
            score.tpsScore,
            score.reliabilityScore,
            score.feedbackScore,
            score.disputeScore,
            score.completedBookings,
            score.totalReviews,
            score.isVerified
        );
    }

    /**
     * @notice Get event count for an actor
     * @param actor Address to query
     */
    function getEventCount(address actor) external view returns (uint256) {
        return eventHistory[actor].length;
    }

    /**
     * @notice Get a specific event for an actor
     * @param actor Address to query
     * @param index Event index
     */
    function getEvent(address actor, uint256 index) external view returns (
        bytes32 bookingId,
        ActorType actorType,
        EventType eventType,
        int256 scoreImpact,
        uint256 timestamp,
        bytes32 metadataHash
    ) {
        ReputationEvent storage evt = eventHistory[actor][index];
        return (
            evt.bookingId,
            evt.actorType,
            evt.eventType,
            evt.scoreImpact,
            evt.timestamp,
            evt.metadataHash
        );
    }

    /**
     * @notice Check if an actor is verified
     * @param actor Address to check
     */
    function isActorVerified(address actor) external view returns (bool) {
        return reputationScores[actor].isVerified;
    }

    /**
     * @notice Get total score as percentage (0-100)
     * @param actor Address to query
     */
    function getScorePercentage(address actor) external view returns (uint256) {
        return reputationScores[actor].totalScore / 100;
    }

    // ============================================================================
    // Admin Functions
    // ============================================================================

    /**
     * @notice Update verification threshold
     * @param newThreshold New threshold (0-10000)
     */
    function setVerificationThreshold(uint256 newThreshold) external onlyOwner {
        require(newThreshold <= 10000, "Invalid threshold");
        verificationThreshold = newThreshold;
    }

    /**
     * @notice Pause the contract
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause the contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }
}
