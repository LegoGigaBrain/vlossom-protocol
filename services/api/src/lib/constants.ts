/**
 * Application Constants
 *
 * L-3: Extract magic numbers and configuration values to centralized constants.
 * All values in cents use BigInt for precision with financial calculations.
 */

// ============================================================================
// PLATFORM FEES
// ============================================================================

export const PLATFORM_FEES = {
  /** Default platform fee percentage for service bookings */
  DEFAULT_PERCENTAGE: 10,
  /** Platform fee percentage for property chair rentals */
  PROPERTY_PERCENTAGE: 10,
  /** Minimum platform fee in cents (R1.00) */
  MINIMUM_CENTS: 100n,
} as const;

// ============================================================================
// RATE LIMITS
// ============================================================================

export const RATE_LIMITS = {
  /** Cooldown period between faucet claims (hours) */
  FAUCET_COOLDOWN_HOURS: 24,
  /** Maximum escrow operations per minute per relayer */
  ESCROW_OPS_PER_MINUTE: 10,
  /** Maximum total USDC amount through escrow per hour (6 decimals) */
  MAX_HOURLY_ESCROW_AMOUNT: 100_000_000_000n, // $100,000 USDC
  /** Warning threshold for rate limit (percentage of limit) */
  RATE_LIMIT_WARNING_THRESHOLD: 0.8,
} as const;

// ============================================================================
// TIMEOUTS (in milliseconds)
// ============================================================================

export const TIMEOUTS = {
  /** Default HTTP request timeout */
  DEFAULT_REQUEST_MS: 30_000,
  /** Blockchain transaction timeout */
  BLOCKCHAIN_TX_MS: 60_000,
  /** External API call timeout (Google Maps, SendGrid, etc.) */
  EXTERNAL_API_MS: 10_000,
  /** Wallet UserOperation timeout */
  USER_OP_MS: 120_000,
} as const;

// ============================================================================
// BOOKING CONSTRAINTS
// ============================================================================

export const BOOKING_CONSTRAINTS = {
  /** Minimum service price in cents (R10.00) */
  MIN_PRICE_CENTS: 1_000n,
  /** Maximum service price in cents (R50,000.00) */
  MAX_PRICE_CENTS: 5_000_000n,
  /** Minimum service duration in minutes */
  MIN_DURATION_MINUTES: 15,
  /** Maximum service duration in minutes (8 hours) */
  MAX_DURATION_MINUTES: 480,
  /** Hours before scheduled time for customer to confirm */
  AUTO_CONFIRM_HOURS: 24,
  /** Hours before scheduled time for reminder notification */
  REMINDER_HOURS: 24,
  /** Maximum number of concurrent pending bookings per customer */
  MAX_PENDING_PER_CUSTOMER: 5,
} as const;

// ============================================================================
// CANCELLATION POLICY
// ============================================================================

export const CANCELLATION_POLICY = {
  /** Hours before service for full refund */
  FULL_REFUND_HOURS: 24,
  /** Hours before service for partial refund */
  PARTIAL_REFUND_HOURS: 4,
  /** Partial refund percentage (0-100) */
  PARTIAL_REFUND_PERCENTAGE: 50,
  /** Minimum hours before service for any refund */
  NO_REFUND_HOURS: 1,
} as const;

// ============================================================================
// GEOGRAPHIC CONSTANTS
// ============================================================================

export const GEOGRAPHIC = {
  /** Default search radius in kilometers */
  DEFAULT_SEARCH_RADIUS_KM: 50,
  /** Maximum search radius in kilometers */
  MAX_SEARCH_RADIUS_KM: 500,
  /** Minimum service radius for mobile stylists */
  MIN_SERVICE_RADIUS_KM: 5,
  /** Maximum service radius for mobile stylists */
  MAX_SERVICE_RADIUS_KM: 100,
  /** Earth radius in kilometers (for Haversine formula) */
  EARTH_RADIUS_KM: 6_371,
} as const;

// ============================================================================
// PAGINATION
// ============================================================================

export const PAGINATION = {
  /** Default page size */
  DEFAULT_PAGE_SIZE: 20,
  /** Maximum page size */
  MAX_PAGE_SIZE: 100,
  /** Default starting page */
  DEFAULT_PAGE: 1,
} as const;

// ============================================================================
// WALLET CONSTANTS
// ============================================================================

export const WALLET = {
  /** USDC token decimals */
  USDC_DECIMALS: 6,
  /** Minimum transfer amount in smallest unit (0.01 USDC) */
  MIN_TRANSFER_AMOUNT: 10_000n,
  /** Faucet claim amount in smallest unit (100 USDC for testnet) */
  FAUCET_CLAIM_AMOUNT: 100_000_000n,
  /** Payment request expiry in minutes */
  PAYMENT_REQUEST_EXPIRY_MINUTES: 30,
  /** Maximum payment request expiry in minutes (24 hours) */
  MAX_PAYMENT_REQUEST_EXPIRY_MINUTES: 1_440,
} as const;

// ============================================================================
// TRAVEL TIME
// ============================================================================

export const TRAVEL_TIME = {
  /** Default travel buffer in minutes (parking, setup, etc.) */
  DEFAULT_BUFFER_MINUTES: 30,
  /** Average driving speed in km/h for Haversine fallback */
  AVERAGE_SPEED_KMH: 40,
  /** Travel time cache TTL in minutes */
  CACHE_TTL_MINUTES: 60,
  /** Traffic buffer multiplier (20% extra time) */
  TRAFFIC_BUFFER_MULTIPLIER: 1.2,
} as const;

// ============================================================================
// REPUTATION SYSTEM
// ============================================================================

export const REPUTATION = {
  /** Initial reputation score (0-10000 representing 0.00-100.00) */
  INITIAL_SCORE: 5_000,
  /** Maximum reputation score */
  MAX_SCORE: 10_000,
  /** Minimum reputation score */
  MIN_SCORE: 0,
  /** Score impact for on-time completion */
  ON_TIME_BONUS: 10,
  /** Score impact for late arrival (negative) */
  LATE_PENALTY: -15,
  /** Score impact for cancellation (negative) */
  CANCELLATION_PENALTY: -25,
  /** Minimum bookings for verified badge */
  VERIFIED_BOOKING_THRESHOLD: 10,
} as const;

// ============================================================================
// CIRCUIT BREAKER
// ============================================================================

export const CIRCUIT_BREAKER = {
  /** Default failure threshold before opening circuit */
  DEFAULT_FAILURE_THRESHOLD: 5,
  /** Default reset timeout in milliseconds (1 minute) */
  DEFAULT_RESET_TIMEOUT_MS: 60_000,
  /** Default successes needed in half-open state */
  DEFAULT_HALF_OPEN_THRESHOLD: 2,
  /** Google Maps specific failure threshold */
  GOOGLE_MAPS_FAILURE_THRESHOLD: 5,
  /** SendGrid specific failure threshold */
  SENDGRID_FAILURE_THRESHOLD: 3,
} as const;

// ============================================================================
// PROPERTY/CHAIR RENTAL
// ============================================================================

export const PROPERTY_RENTAL = {
  /** Default platform fee percentage for chair rentals */
  PLATFORM_FEE_PERCENTAGE: 10,
  /** Maximum images per property */
  MAX_PROPERTY_IMAGES: 10,
  /** Maximum amenities per chair */
  MAX_CHAIR_AMENITIES: 20,
} as const;

// ============================================================================
// INPUT VALIDATION
// ============================================================================

export const INPUT_LIMITS = {
  /** Maximum bio length */
  MAX_BIO_LENGTH: 500,
  /** Maximum service description length */
  MAX_SERVICE_DESCRIPTION_LENGTH: 500,
  /** Maximum review comment length */
  MAX_REVIEW_COMMENT_LENGTH: 500,
  /** Maximum address length */
  MAX_ADDRESS_LENGTH: 200,
  /** Maximum display name length */
  MAX_DISPLAY_NAME_LENGTH: 100,
  /** Minimum bio length for stylists */
  MIN_BIO_LENGTH: 50,
} as const;
