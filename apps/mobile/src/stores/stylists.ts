/**
 * Stylists Store (V7.1.2)
 *
 * Zustand store for managing stylist discovery state.
 * Handles search, filtering, and selected stylist.
 * Supports demo mode with mock data.
 *
 * V7.1.2: Added earnings chart data for visualization
 */

import { create } from 'zustand';
import {
  searchStylists,
  getStylistById,
  getNearbyStylists,
  getStylistDashboard,
  getStylistEarnings,
  approveBookingRequest,
  declineBookingRequest,
  type StylistSummary,
  type StylistDetail,
  type StylistDashboard,
  type StylistEarnings,
  type PendingRequest,
  type SearchStylistsParams,
  type ServiceCategory,
  type OperatingMode,
  type SortOption,
} from '../api/stylists';
import { MOCK_STYLISTS, getMockStylistDetail, MOCK_STYLIST_DASHBOARD } from '../data/mock-data';
import { getIsDemoMode } from './demo-mode';

// ============================================================================
// Types
// ============================================================================

/**
 * Chart data point for earnings visualization
 */
export interface EarningsChartData {
  label: string;
  value: number;
  previousValue?: number;
}

interface StylistsState {
  // Discovery
  stylists: StylistSummary[];
  stylistsLoading: boolean;
  stylistsError: string | null;

  // Pagination
  page: number;
  hasMore: boolean;
  total: number;

  // Filters
  filters: {
    query: string;
    serviceCategory: ServiceCategory | null;
    operatingMode: OperatingMode | null;
    minPrice: number | null;
    maxPrice: number | null;
    availability: string | null;
    sortBy: SortOption;
  };

  // Location
  userLocation: {
    lat: number;
    lng: number;
  } | null;
  searchRadius: number;

  // Selected stylist
  selectedStylist: StylistDetail | null;
  selectedStylistLoading: boolean;

  // Stylist Dashboard (for stylist role users)
  dashboard: StylistDashboard | null;
  dashboardLoading: boolean;
  dashboardError: string | null;

  // Earnings chart data
  earningsChartData: EarningsChartData[];
  earningsPeriod: 'week' | 'month' | 'year';

  // Actions
  setUserLocation: (lat: number, lng: number) => void;
  setSearchRadius: (radius: number) => void;
  fetchNearbyStylists: () => Promise<void>;
  searchStylists: (params?: Partial<SearchStylistsParams>) => Promise<void>;
  loadMoreStylists: () => Promise<void>;
  setFilter: <K extends keyof StylistsState['filters']>(
    key: K,
    value: StylistsState['filters'][K]
  ) => void;
  clearFilters: () => void;
  selectStylist: (id: string) => Promise<void>;
  clearSelectedStylist: () => void;
  reset: () => void;

  // Dashboard actions (for stylist role)
  fetchDashboard: () => Promise<void>;
  approveRequest: (requestId: string) => Promise<void>;
  declineRequest: (requestId: string, reason?: string) => Promise<void>;
  setEarningsPeriod: (period: 'week' | 'month' | 'year') => void;
}

// ============================================================================
// Initial State
// ============================================================================

const initialFilters = {
  query: '',
  serviceCategory: null as ServiceCategory | null,
  operatingMode: null as OperatingMode | null,
  minPrice: null as number | null,
  maxPrice: null as number | null,
  availability: null as string | null,
  sortBy: 'distance' as SortOption,
};

const initialState = {
  stylists: [] as StylistSummary[],
  stylistsLoading: false,
  stylistsError: null as string | null,

  page: 1,
  hasMore: false,
  total: 0,

  filters: initialFilters,

  userLocation: null as { lat: number; lng: number } | null,
  searchRadius: 25, // Default 25km

  selectedStylist: null as StylistDetail | null,
  selectedStylistLoading: false,

  // Stylist Dashboard
  dashboard: null as StylistDashboard | null,
  dashboardLoading: false,
  dashboardError: null as string | null,

  // Earnings chart
  earningsChartData: [] as EarningsChartData[],
  earningsPeriod: 'month' as 'week' | 'month' | 'year',
};

// ============================================================================
// Store
// ============================================================================

export const useStylistsStore = create<StylistsState>((set, get) => ({
  ...initialState,

  /**
   * Set user's current location
   */
  setUserLocation: (lat: number, lng: number) => {
    set({ userLocation: { lat, lng } });
  },

  /**
   * Set search radius
   */
  setSearchRadius: (radius: number) => {
    set({ searchRadius: radius });
  },

  /**
   * Fetch nearby stylists based on user location
   * In demo mode, returns mock stylists instead of API call
   */
  fetchNearbyStylists: async () => {
    const { userLocation, searchRadius, filters } = get();

    // Demo mode: return mock stylists
    if (getIsDemoMode()) {
      set({ stylistsLoading: true, stylistsError: null });
      // Simulate brief loading for UX
      await new Promise((resolve) => setTimeout(resolve, 300));

      let mockData = [...MOCK_STYLISTS];
      // Apply operating mode filter if set
      if (filters.operatingMode) {
        mockData = mockData.filter((s) => s.operatingMode === filters.operatingMode);
      }

      set({
        stylists: mockData,
        stylistsLoading: false,
        page: 1,
        hasMore: false,
        total: mockData.length,
      });
      return;
    }

    if (!userLocation) {
      set({ stylistsError: 'Location not available' });
      return;
    }

    set({ stylistsLoading: true, stylistsError: null });

    try {
      const stylists = await getNearbyStylists(
        userLocation.lat,
        userLocation.lng,
        {
          radius: searchRadius,
          limit: 50,
          operatingMode: filters.operatingMode || undefined,
        }
      );

      set({
        stylists,
        stylistsLoading: false,
        page: 1,
        hasMore: false, // getNearbyStylists doesn't paginate
        total: stylists.length,
      });
    } catch (error) {
      set({
        stylistsLoading: false,
        stylistsError: error instanceof Error ? error.message : 'Failed to fetch stylists',
      });
    }
  },

  /**
   * Search stylists with filters
   */
  searchStylists: async (params = {}) => {
    const { userLocation, searchRadius, filters } = get();

    set({ stylistsLoading: true, stylistsError: null });

    try {
      const response = await searchStylists({
        query: params.query ?? (filters.query || undefined),
        lat: userLocation?.lat,
        lng: userLocation?.lng,
        radius: searchRadius,
        serviceCategory: params.serviceCategory ?? filters.serviceCategory ?? undefined,
        operatingMode: params.operatingMode ?? filters.operatingMode ?? undefined,
        minPrice: params.minPrice ?? filters.minPrice ?? undefined,
        maxPrice: params.maxPrice ?? filters.maxPrice ?? undefined,
        availability: params.availability ?? filters.availability ?? undefined,
        sortBy: params.sortBy ?? filters.sortBy,
        page: 1,
        pageSize: 20,
      });

      set({
        stylists: response.items,
        stylistsLoading: false,
        page: 1,
        hasMore: response.pagination.page < response.pagination.totalPages,
        total: response.pagination.total,
      });
    } catch (error) {
      set({
        stylistsLoading: false,
        stylistsError: error instanceof Error ? error.message : 'Search failed',
      });
    }
  },

  /**
   * Load more stylists (pagination)
   */
  loadMoreStylists: async () => {
    const { page, hasMore, stylistsLoading, userLocation, searchRadius, filters, stylists } = get();

    if (!hasMore || stylistsLoading) return;

    set({ stylistsLoading: true });

    try {
      const response = await searchStylists({
        query: filters.query || undefined,
        lat: userLocation?.lat,
        lng: userLocation?.lng,
        radius: searchRadius,
        serviceCategory: filters.serviceCategory ?? undefined,
        operatingMode: filters.operatingMode ?? undefined,
        minPrice: filters.minPrice ?? undefined,
        maxPrice: filters.maxPrice ?? undefined,
        availability: filters.availability ?? undefined,
        sortBy: filters.sortBy,
        page: page + 1,
        pageSize: 20,
      });

      set({
        stylists: [...stylists, ...response.items],
        stylistsLoading: false,
        page: page + 1,
        hasMore: response.pagination.page < response.pagination.totalPages,
      });
    } catch (error) {
      set({
        stylistsLoading: false,
        stylistsError: error instanceof Error ? error.message : 'Failed to load more',
      });
    }
  },

  /**
   * Set a single filter value
   */
  setFilter: (key, value) => {
    set((state) => ({
      filters: {
        ...state.filters,
        [key]: value,
      },
    }));
  },

  /**
   * Clear all filters
   */
  clearFilters: () => {
    set({ filters: initialFilters });
  },

  /**
   * Select a stylist and load full details
   * In demo mode, returns mock stylist detail
   */
  selectStylist: async (id: string) => {
    set({ selectedStylistLoading: true });

    // Demo mode: return mock stylist detail
    if (getIsDemoMode()) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      const mockStylist = getMockStylistDetail(id);
      set({
        selectedStylist: mockStylist,
        selectedStylistLoading: false,
      });
      return;
    }

    try {
      const stylist = await getStylistById(id);
      set({
        selectedStylist: stylist,
        selectedStylistLoading: false,
      });
    } catch (error) {
      set({
        selectedStylistLoading: false,
      });
    }
  },

  /**
   * Clear selected stylist
   */
  clearSelectedStylist: () => {
    set({ selectedStylist: null });
  },

  /**
   * Reset store to initial state
   */
  reset: () => {
    set(initialState);
  },

  // ============================================================================
  // Stylist Dashboard Actions (for stylist role users)
  // ============================================================================

  /**
   * Fetch stylist dashboard data
   * In demo mode, returns mock dashboard data
   */
  fetchDashboard: async () => {
    set({ dashboardLoading: true, dashboardError: null });

    // Demo mode: return mock dashboard
    if (getIsDemoMode()) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      set({
        dashboard: MOCK_STYLIST_DASHBOARD as unknown as StylistDashboard,
        dashboardLoading: false,
      });
      return;
    }

    try {
      const dashboard = await getStylistDashboard();
      set({
        dashboard,
        dashboardLoading: false,
      });
    } catch (error) {
      set({
        dashboardLoading: false,
        dashboardError: error instanceof Error ? error.message : 'Failed to load dashboard',
      });
    }
  },

  /**
   * Approve a pending booking request
   */
  approveRequest: async (requestId: string) => {
    // Demo mode: just remove from pending list
    if (getIsDemoMode()) {
      const { dashboard } = get();
      if (dashboard) {
        set({
          dashboard: {
            ...dashboard,
            stats: {
              ...dashboard.stats,
              pendingRequests: dashboard.stats.pendingRequests - 1,
              upcomingBookings: dashboard.stats.upcomingBookings + 1,
            },
            pendingRequests: dashboard.pendingRequests.filter((r) => r.id !== requestId),
          },
        });
      }
      return;
    }

    try {
      await approveBookingRequest(requestId);
      // Refresh dashboard after approval
      await get().fetchDashboard();
    } catch (error) {
      console.error('Failed to approve request:', error);
      throw error;
    }
  },

  /**
   * Decline a pending booking request
   */
  declineRequest: async (requestId: string, reason?: string) => {
    // Demo mode: just remove from pending list
    if (getIsDemoMode()) {
      const { dashboard } = get();
      if (dashboard) {
        set({
          dashboard: {
            ...dashboard,
            stats: {
              ...dashboard.stats,
              pendingRequests: dashboard.stats.pendingRequests - 1,
            },
            pendingRequests: dashboard.pendingRequests.filter((r) => r.id !== requestId),
          },
        });
      }
      return;
    }

    try {
      await declineBookingRequest(requestId, reason);
      // Refresh dashboard after decline
      await get().fetchDashboard();
    } catch (error) {
      console.error('Failed to decline request:', error);
      throw error;
    }
  },

  /**
   * Set earnings period and generate chart data
   */
  setEarningsPeriod: (period: 'week' | 'month' | 'year') => {
    const { dashboard } = get();
    const baseEarnings = dashboard?.stats.thisMonthEarnings || 180000; // Fallback for demo

    // Generate chart data based on period
    const chartData = generateEarningsChartData(period, baseEarnings);

    set({
      earningsPeriod: period,
      earningsChartData: chartData,
    });
  },
}));

/**
 * Generate mock chart data for earnings visualization
 * Produces realistic-looking data with variance and trends
 */
function generateEarningsChartData(
  period: 'week' | 'month' | 'year',
  baseEarnings: number
): EarningsChartData[] {
  const data: EarningsChartData[] = [];

  if (period === 'week') {
    // Last 7 days
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const dailyBase = baseEarnings / 30; // Average daily from monthly

    days.forEach((day, i) => {
      // Weekend variance: Saturday/Sunday typically higher for stylists
      const weekendMultiplier = i >= 5 ? 1.5 : 0.8;
      const variance = 0.5 + Math.random();
      const value = Math.round(dailyBase * weekendMultiplier * variance);
      const prevVariance = 0.5 + Math.random();
      const previousValue = Math.round(dailyBase * weekendMultiplier * prevVariance);

      data.push({ label: day, value, previousValue });
    });
  } else if (period === 'month') {
    // Last 4 weeks
    const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
    const weeklyBase = baseEarnings / 4;

    weeks.forEach((week) => {
      const variance = 0.7 + Math.random() * 0.6;
      const value = Math.round(weeklyBase * variance);
      const prevVariance = 0.7 + Math.random() * 0.6;
      const previousValue = Math.round(weeklyBase * prevVariance);

      data.push({ label: week, value, previousValue });
    });
  } else {
    // Last 12 months
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    // Create a growth trend over the year
    const growthFactor = 1.15; // 15% growth per quarter average

    months.forEach((month, i) => {
      const seasonalMultiplier = 0.9 + 0.2 * Math.sin((i / 12) * Math.PI * 2); // Seasonal wave
      const quarterGrowth = Math.pow(growthFactor, i / 4);
      const variance = 0.85 + Math.random() * 0.3;
      const value = Math.round(baseEarnings * seasonalMultiplier * quarterGrowth * variance);
      const prevVariance = 0.85 + Math.random() * 0.3;
      const previousValue = Math.round(baseEarnings * seasonalMultiplier * prevVariance);

      data.push({ label: month, value, previousValue });
    });
  }

  return data;
}

// ============================================================================
// Selectors
// ============================================================================

export const selectStylists = (state: StylistsState) => state.stylists;
export const selectSelectedStylist = (state: StylistsState) => state.selectedStylist;
export const selectFilters = (state: StylistsState) => state.filters;
export const selectUserLocation = (state: StylistsState) => state.userLocation;
export const selectEarningsChartData = (state: StylistsState) => state.earningsChartData;
export const selectEarningsPeriod = (state: StylistsState) => state.earningsPeriod;
