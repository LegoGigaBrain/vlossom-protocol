/**
 * Stores Exports (V7.1.0)
 */

export { useAuthStore, selectUser, selectIsAuthenticated, selectIsLoading, selectIsInitialized, selectUserRoles, selectAddRoleLoading } from './auth';
export { useDemoModeStore, selectIsDemoMode, selectIsHydrated, getIsDemoMode } from './demo-mode';
export { useWalletStore, selectBalance, selectWallet, selectTransactions, selectFiatConfig } from './wallet';
export { useMessagesStore } from './messages';
export {
  useStylistsStore,
  selectStylists,
  selectSelectedStylist,
  selectFilters,
  selectUserLocation,
  selectEarningsChartData,
  selectEarningsPeriod,
  type EarningsChartData,
} from './stylists';
export { useNotificationsStore, selectNotifications, selectUnreadCount, selectUnreadNotifications } from './notifications';
export {
  useHairHealthStore,
  selectHairProfile,
  selectHasProfile,
  selectUnlockedNodes,
  selectOnboardingStep,
  selectOnboardingData,
  // V6.9 Calendar Selectors
  selectCalendarSummary,
  selectUpcomingRituals,
  selectCalendarLoading,
  selectHasCalendarEvents,
  selectNextRitual,
  selectOverdueCount,
  selectStreakDays,
  // V7.1 Full Calendar Selectors
  selectCalendarEvents,
  selectSelectedDate,
  selectViewMode,
  selectCalendarMonth,
  // V7.1 Types
  type CalendarViewMode,
  type CalendarEventFull,
} from './hair-health';
export {
  useBookingsStore,
  selectBookings,
  selectBookingsLoading,
  selectCurrentBooking,
  selectBookingStats,
  selectAvailability,
  selectCreateLoading,
  selectCreateError,
  selectUpcomingBookings,
  selectPastBookings,
  selectNextBooking,
} from './bookings';
export {
  usePropertyOwnerStore,
  selectProperties,
  selectPropertiesLoading,
  selectCurrentProperty,
  selectStats,
  selectRentalRequests,
  selectRentalRequestsLoading,
  selectRentalRequestsFilter,
  selectRevenueStats,
  selectRevenueLoading,
  selectRevenuePeriod,
  selectTransactions as selectPropertyTransactions,
  selectPendingRequests,
  selectPendingCount,
  selectTotalRevenueCents,
  selectNetRevenueCents,
  selectPropertyById,
  selectChairsByProperty,
} from './property-owner';

// V7.1: Rewards Store
export {
  useRewardsStore,
  selectUserRewards,
  selectTierInfo,
  selectNextTierInfo,
  selectBadges,
  selectEarnedBadges,
  selectLockedBadges,
  selectStreaks,
  selectActiveStreaks,
  selectAchievements,
  selectOverviewLoading as selectRewardsLoading,
  selectOverviewError as selectRewardsError,
} from './rewards';

// V7.1: DeFi Store
export {
  useDefiStore,
  selectTotalStaked,
  selectTotalStakedUsd,
  selectTotalEarnings,
  selectTotalEarningsUsd,
  selectCurrentApy,
  selectPools,
  selectActivePools,
  selectPositions,
  selectRecentEarnings,
  selectOverviewLoading as selectDefiLoading,
  selectOverviewError as selectDefiError,
  selectStakeLoading,
  selectUnstakeLoading,
} from './defi';

// V7.3: Session Store
export {
  useSessionStore,
  selectIsConnected,
  selectSessionProgress,
  selectSessionState,
  selectActiveSessions,
  selectIsPolling,
  selectConnectionError,
  type SessionState,
  type SessionProgress,
  type ActiveSession,
} from './session';
