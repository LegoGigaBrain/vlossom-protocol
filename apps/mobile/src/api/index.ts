/**
 * API Exports (V6.10.2)
 *
 * Explicit re-exports to avoid naming conflicts between modules.
 */

// Base client
export {
  apiRequest,
  getAuthToken,
  setAuthToken,
  getRefreshToken,
  setRefreshToken,
  clearTokens,
  APIError,
  API_URL,
  getApiUrl,
} from './client';

// Auth API
export * from './auth';

// Wallet API
export {
  type WalletInfo,
  type WalletBalance,
  type Transaction as WalletTransaction,
  type TransactionsResponse,
  type TransferRequest,
  type TransferResponse,
  type PaymentRequest,
  type CreatePaymentRequestResponse,
  type FiatConfig,
  type Bank,
  type ExchangeRate,
  type OnrampRequest,
  type OnrampResponse,
  type OfframpRequest,
  type OfframpResponse,
  type FiatTransaction,
  getWallet,
  getBalance,
  getTransactions as getWalletTransactions,
  sendTransfer,
  createPaymentRequest,
  getPaymentRequest,
  payPaymentRequest,
  getPendingPaymentRequests,
  claimFaucet,
  getFiatConfig,
  getExchangeRate,
  getBanks,
  initiateOnramp,
  initiateOfframp,
  getFiatTransactionStatus,
  getFiatTransactions,
  formatUsdcAmount,
  formatZarAmount,
  isInsufficientBalanceError,
} from './wallet';

// Messages API
export {
  type ConversationParticipant,
  type ConversationSummary,
  type ConversationsListResponse,
  type Message,
  type ConversationDetail,
  type ConversationWithMessagesResponse,
  type StartConversationResponse,
  type SendMessageResponse,
  type UnreadCountResponse as MessagesUnreadCountResponse,
  getConversations,
  startConversation,
  getConversation,
  sendMessage,
  markConversationRead,
  archiveConversation,
  unarchiveConversation,
  getUnreadCount as getMessagesUnreadCount,
} from './messages';

// Stylists API
export {
  type ServiceCategory,
  type OperatingMode,
  type SortOption,
  type StylistLocation,
  type StylistService,
  type StylistSummary,
  type StylistDetail,
  type PendingRequest,
  type StylistDashboard,
  type StylistEarnings,
  type SearchStylistsParams,
  type SearchStylistsResponse,
  type TimeSlot,
  type DayOfWeek,
  type WeeklySchedule,
  type AvailabilityException,
  type StylistAvailability,
  searchStylists,
  getStylistById,
  getNearbyStylists,
  getAvailableStylists,
  getStylistDashboard,
  getStylistEarnings,
  approveBookingRequest,
  declineBookingRequest,
  getStylistAvailability,
  updateStylistAvailability,
  addAvailabilityException,
  removeAvailabilityException,
  formatPrice,
  formatPriceRange,
  formatDistance,
  getPinColor,
  getOperatingModeLabel,
} from './stylists';

// Notifications API
export {
  type NotificationType,
  type NotificationMetadata,
  type Notification,
  type NotificationsResponse,
  type UnreadCountResponse as NotificationsUnreadCountResponse,
  type MarkReadResponse,
  type MarkAllReadResponse,
  getNotifications,
  getUnreadCount as getNotificationsUnreadCount,
  markAsRead as markNotificationAsRead,
  markAllAsRead as markAllNotificationsAsRead,
  getNotificationIcon,
  getNotificationCategory,
  formatRelativeTime,
} from './notifications';

// Hair Health API
export * from './hair-health';

// Bookings API
export {
  type BookingStatus,
  type LocationType,
  type BookingStylist,
  type BookingService,
  type Booking,
  type BookingPage,
  type CreateBookingRequest,
  type PriceBreakdown,
  type BookingStats,
  type AvailabilitySlot,
  type StylistAvailability as BookingStylistAvailability,
  type Review,
  type CreateReviewRequest,
  type ReviewResponse,
  getBookings,
  getBooking,
  createBooking,
  updateBookingStatus,
  confirmPayment,
  cancelBooking,
  getBookingStats,
  getStylistAvailability as getBookingStylistAvailability,
  calculatePriceBreakdown,
  getCancellationPolicy,
  calculateRefund,
  canCancelBooking,
  generateTimeSlots,
  submitReview,
  getStylistReviews,
  getBookingReview,
  getBookingStatusLabel,
  getBookingStatusColor,
} from './bookings';

// Property Owner API
export * from './property-owner';

// Rewards API
export {
  type RewardTier,
  type Badge as RewardBadge,
  type Streak,
  type Achievement,
  type XPHistoryItem,
  type TierInfo,
  type UserXPSummary,
  type UserRewards,
  type RewardsOverview,
  type LeaderboardEntry,
  type ReferralInfo,
  TIER_CONFIG,
  getRewardsOverview,
  getXPSummary,
  getXPHistory,
  getBadges,
  getBadgeDefinitions,
  getStreak,
  getTiers,
  getLeaderboard,
  getUserPublicRewards,
  getReferralCode,
  getReferralStats,
  getTierFromXp,
  calculateTierProgress,
  getTierColor as getRewardTierColor,
  getTierIconName,
  formatXp,
  getBadgeCategoryLabel,
  getStreakStatusLabel,
  isStreakExpiring,
} from './rewards';

// DeFi API
export * from './defi';

// Reputation API
export {
  type ReputationScore,
  type ReputationEvent,
  type TPSDetails,
  getReputationScore,
  getMyReputation,
  getTPSDetails,
  getReputationEvents,
  scoreToPercentage,
  getReputationTier,
  getTierColor as getReputationTierColor,
  getVerificationProgress,
} from './reputation';
