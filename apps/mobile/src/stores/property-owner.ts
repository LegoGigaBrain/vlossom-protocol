/**
 * Property Owner Store (V6.10.0)
 *
 * Zustand store for property owner state management.
 * Handles properties, chairs, rental requests, and revenue.
 */

import { create } from 'zustand';
import {
  getMyProperties,
  getProperty,
  getRentalRequests,
  getAllRentalRequests,
  approveRentalRequest,
  rejectRentalRequest,
  updateChair as updateChairAPI,
  getRevenueStats as getRevenueStatsAPI,
  getTransactions as getTransactionsAPI,
  calculatePropertyStats,
  type Property,
  type Chair,
  type ChairStatus,
  type RentalRequest,
  type RentalStatus,
  type PropertyStats,
  type RevenueStats,
  type Transaction,
} from '../api/property-owner';

// ============================================================================
// Types
// ============================================================================

interface PropertyOwnerState {
  // Properties
  properties: Property[];
  propertiesLoading: boolean;
  propertiesError: string | null;

  // Current property
  currentProperty: Property | null;
  currentPropertyLoading: boolean;

  // Stats
  stats: PropertyStats | null;

  // Rental requests
  rentalRequests: RentalRequest[];
  rentalRequestsLoading: boolean;
  rentalRequestsError: string | null;
  rentalRequestsFilter: RentalStatus | null;

  // Revenue
  revenueStats: RevenueStats | null;
  revenueLoading: boolean;
  revenuePeriod: 'week' | 'month' | 'year';

  // Transactions
  transactions: Transaction[];
  transactionsLoading: boolean;

  // Chair update state
  chairUpdateLoading: boolean;
  chairUpdateError: string | null;

  // Rental decision state
  decisionLoading: string | null; // rentalId being processed
  decisionError: string | null;

  // Actions
  fetchProperties: () => Promise<void>;
  fetchProperty: (id: string) => Promise<void>;
  fetchRentalRequests: (propertyId?: string) => Promise<void>;
  setRentalRequestsFilter: (status: RentalStatus | null) => void;
  approveRequest: (rentalId: string) => Promise<boolean>;
  rejectRequest: (rentalId: string, reason?: string) => Promise<boolean>;
  updateChairStatus: (propertyId: string, chairId: string, status: ChairStatus) => Promise<boolean>;
  fetchRevenue: (period?: 'week' | 'month' | 'year') => Promise<void>;
  fetchTransactions: () => Promise<void>;
  setRevenuePeriod: (period: 'week' | 'month' | 'year') => void;
  clearErrors: () => void;
  reset: () => void;
}

// ============================================================================
// Store
// ============================================================================

const initialState = {
  properties: [],
  propertiesLoading: false,
  propertiesError: null,

  currentProperty: null,
  currentPropertyLoading: false,

  stats: null,

  rentalRequests: [],
  rentalRequestsLoading: false,
  rentalRequestsError: null,
  rentalRequestsFilter: null,

  revenueStats: null,
  revenueLoading: false,
  revenuePeriod: 'month' as const,

  transactions: [],
  transactionsLoading: false,

  chairUpdateLoading: false,
  chairUpdateError: null,

  decisionLoading: null,
  decisionError: null,
};

export const usePropertyOwnerStore = create<PropertyOwnerState>((set, get) => ({
  ...initialState,

  /**
   * Fetch all properties owned by the current user
   */
  fetchProperties: async () => {
    set({ propertiesLoading: true, propertiesError: null });

    try {
      const properties = await getMyProperties();
      const stats = calculatePropertyStats(properties);

      set({
        properties,
        stats,
        propertiesLoading: false,
      });
    } catch (error) {
      set({
        propertiesLoading: false,
        propertiesError: error instanceof Error ? error.message : 'Failed to fetch properties',
      });
    }
  },

  /**
   * Fetch a single property by ID
   */
  fetchProperty: async (id: string) => {
    set({ currentPropertyLoading: true });

    try {
      const property = await getProperty(id);
      set({
        currentProperty: property,
        currentPropertyLoading: false,
      });
    } catch (error) {
      console.warn('Failed to fetch property:', error);
      set({ currentPropertyLoading: false });
    }
  },

  /**
   * Fetch rental requests
   */
  fetchRentalRequests: async (propertyId?: string) => {
    const state = get();
    set({ rentalRequestsLoading: true, rentalRequestsError: null });

    try {
      let requests: RentalRequest[];

      if (propertyId) {
        requests = await getRentalRequests(propertyId, state.rentalRequestsFilter || undefined);
      } else {
        requests = await getAllRentalRequests(state.rentalRequestsFilter || undefined);
      }

      set({
        rentalRequests: requests,
        rentalRequestsLoading: false,
      });
    } catch (error) {
      set({
        rentalRequestsLoading: false,
        rentalRequestsError: error instanceof Error ? error.message : 'Failed to fetch requests',
      });
    }
  },

  /**
   * Set filter for rental requests
   */
  setRentalRequestsFilter: (status: RentalStatus | null) => {
    set({ rentalRequestsFilter: status });
    // Refetch with new filter
    get().fetchRentalRequests();
  },

  /**
   * Approve a rental request
   */
  approveRequest: async (rentalId: string) => {
    set({ decisionLoading: rentalId, decisionError: null });

    try {
      const updated = await approveRentalRequest(rentalId);

      // Update in list
      set((state) => ({
        rentalRequests: state.rentalRequests.map((r) =>
          r.id === rentalId ? updated : r
        ),
        decisionLoading: null,
      }));

      return true;
    } catch (error) {
      set({
        decisionLoading: null,
        decisionError: error instanceof Error ? error.message : 'Failed to approve request',
      });
      return false;
    }
  },

  /**
   * Reject a rental request
   */
  rejectRequest: async (rentalId: string, reason?: string) => {
    set({ decisionLoading: rentalId, decisionError: null });

    try {
      const updated = await rejectRentalRequest(rentalId, reason);

      // Update in list
      set((state) => ({
        rentalRequests: state.rentalRequests.map((r) =>
          r.id === rentalId ? updated : r
        ),
        decisionLoading: null,
      }));

      return true;
    } catch (error) {
      set({
        decisionLoading: null,
        decisionError: error instanceof Error ? error.message : 'Failed to reject request',
      });
      return false;
    }
  },

  /**
   * Update a chair's status
   */
  updateChairStatus: async (propertyId: string, chairId: string, status: ChairStatus) => {
    set({ chairUpdateLoading: true, chairUpdateError: null });

    try {
      const updatedChair = await updateChairAPI(propertyId, chairId, { status });

      // Update in properties list
      set((state) => ({
        properties: state.properties.map((p) => {
          if (p.id !== propertyId) return p;
          return {
            ...p,
            chairs: p.chairs.map((c) =>
              c.id === chairId ? { ...c, status: updatedChair.status } : c
            ),
          };
        }),
        currentProperty: state.currentProperty?.id === propertyId
          ? {
              ...state.currentProperty,
              chairs: state.currentProperty.chairs.map((c) =>
                c.id === chairId ? { ...c, status: updatedChair.status } : c
              ),
            }
          : state.currentProperty,
        chairUpdateLoading: false,
      }));

      // Recalculate stats
      const newStats = calculatePropertyStats(get().properties);
      set({ stats: newStats });

      return true;
    } catch (error) {
      set({
        chairUpdateLoading: false,
        chairUpdateError: error instanceof Error ? error.message : 'Failed to update chair',
      });
      return false;
    }
  },

  /**
   * Fetch revenue stats
   */
  fetchRevenue: async (period?: 'week' | 'month' | 'year') => {
    const activePeriod = period || get().revenuePeriod;
    set({ revenueLoading: true, revenuePeriod: activePeriod });

    try {
      const stats = await getRevenueStatsAPI(activePeriod);
      set({
        revenueStats: stats,
        revenueLoading: false,
      });
    } catch (error) {
      console.warn('Failed to fetch revenue:', error);
      set({ revenueLoading: false });
    }
  },

  /**
   * Fetch transactions
   */
  fetchTransactions: async () => {
    const state = get();
    set({ transactionsLoading: true });

    try {
      const transactions = await getTransactionsAPI(state.revenuePeriod);
      set({
        transactions,
        transactionsLoading: false,
      });
    } catch (error) {
      console.warn('Failed to fetch transactions:', error);
      set({ transactionsLoading: false });
    }
  },

  /**
   * Set revenue period and refetch
   */
  setRevenuePeriod: (period: 'week' | 'month' | 'year') => {
    set({ revenuePeriod: period });
    get().fetchRevenue(period);
    get().fetchTransactions();
  },

  /**
   * Clear all error states
   */
  clearErrors: () => {
    set({
      propertiesError: null,
      rentalRequestsError: null,
      chairUpdateError: null,
      decisionError: null,
    });
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

export const selectProperties = (state: PropertyOwnerState) => state.properties;
export const selectPropertiesLoading = (state: PropertyOwnerState) => state.propertiesLoading;
export const selectCurrentProperty = (state: PropertyOwnerState) => state.currentProperty;
export const selectStats = (state: PropertyOwnerState) => state.stats;

export const selectRentalRequests = (state: PropertyOwnerState) => state.rentalRequests;
export const selectRentalRequestsLoading = (state: PropertyOwnerState) => state.rentalRequestsLoading;
export const selectRentalRequestsFilter = (state: PropertyOwnerState) => state.rentalRequestsFilter;

export const selectRevenueStats = (state: PropertyOwnerState) => state.revenueStats;
export const selectRevenueLoading = (state: PropertyOwnerState) => state.revenueLoading;
export const selectRevenuePeriod = (state: PropertyOwnerState) => state.revenuePeriod;
export const selectTransactions = (state: PropertyOwnerState) => state.transactions;

export const selectDecisionLoading = (state: PropertyOwnerState) => state.decisionLoading;
export const selectChairUpdateLoading = (state: PropertyOwnerState) => state.chairUpdateLoading;

// Derived selectors
export const selectPendingRequests = (state: PropertyOwnerState) =>
  state.rentalRequests.filter((r) => r.status === 'PENDING_APPROVAL');

export const selectPendingCount = (state: PropertyOwnerState) =>
  state.stats?.pendingRequests || 0;

export const selectTotalRevenueCents = (state: PropertyOwnerState) =>
  state.revenueStats?.totalRevenueCents || 0;

export const selectNetRevenueCents = (state: PropertyOwnerState) =>
  state.revenueStats?.netRevenueCents || 0;

export const selectPropertyById = (id: string) => (state: PropertyOwnerState) =>
  state.properties.find((p) => p.id === id);

export const selectChairsByProperty = (propertyId: string) => (state: PropertyOwnerState) => {
  const property = state.properties.find((p) => p.id === propertyId);
  return property?.chairs || [];
};
