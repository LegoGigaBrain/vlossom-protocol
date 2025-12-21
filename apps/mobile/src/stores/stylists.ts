/**
 * Stylists Store (V6.8.0)
 *
 * Zustand store for managing stylist discovery state.
 * Handles search, filtering, and selected stylist.
 */

import { create } from 'zustand';
import {
  searchStylists,
  getStylistById,
  getNearbyStylists,
  type StylistSummary,
  type StylistDetail,
  type SearchStylistsParams,
  type ServiceCategory,
  type OperatingMode,
  type SortOption,
} from '../api/stylists';

// ============================================================================
// Types
// ============================================================================

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
   */
  fetchNearbyStylists: async () => {
    const { userLocation, searchRadius, filters } = get();

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
   */
  selectStylist: async (id: string) => {
    set({ selectedStylistLoading: true });

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
}));

// ============================================================================
// Selectors
// ============================================================================

export const selectStylists = (state: StylistsState) => state.stylists;
export const selectSelectedStylist = (state: StylistsState) => state.selectedStylist;
export const selectFilters = (state: StylistsState) => state.filters;
export const selectUserLocation = (state: StylistsState) => state.userLocation;
