// Dashboard React Query Hooks
// Reference: docs/specs/stylist-dashboard/MILESTONE-3-PLAN.md

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchDashboard,
  fetchServices,
  createService,
  updateService,
  deleteService,
  fetchAvailability,
  updateAvailability,
  addException,
  removeException,
  fetchProfile,
  updateProfile,
  fetchEarnings,
  fetchEarningsTrend,
  fetchPayoutHistory,
  type DashboardData,
  type StylistService,
  type CreateServiceInput,
  type AvailabilityData,
  type WeeklySchedule,
  type DateException,
  type StylistProfile,
  type EarningsSummary,
} from "@/lib/dashboard-client";

// ============================================================================
// DASHBOARD
// ============================================================================

export function useDashboard() {
  return useQuery<DashboardData>({
    queryKey: ["dashboard"],
    queryFn: fetchDashboard,
    staleTime: 30 * 1000, // 30 seconds
  });
}

// ============================================================================
// SERVICES
// ============================================================================

export function useStylistServices() {
  return useQuery<{ services: StylistService[]; total: number }>({
    queryKey: ["stylist-services"],
    queryFn: fetchServices,
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useCreateService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateServiceInput) => createService(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stylist-services"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useUpdateService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<CreateServiceInput> }) =>
      updateService(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stylist-services"] });
    },
  });
}

export function useDeleteService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteService(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stylist-services"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

// ============================================================================
// AVAILABILITY
// ============================================================================

export function useAvailability() {
  return useQuery<AvailabilityData>({
    queryKey: ["stylist-availability"],
    queryFn: fetchAvailability,
    staleTime: 60 * 1000,
  });
}

export function useUpdateAvailability() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (schedule: WeeklySchedule) => updateAvailability(schedule),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stylist-availability"] });
    },
  });
}

export function useAddException() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (exception: DateException) => addException(exception),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stylist-availability"] });
    },
  });
}

export function useRemoveException() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (date: string) => removeException(date),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stylist-availability"] });
    },
  });
}

// ============================================================================
// PROFILE
// ============================================================================

export function useStylistProfile() {
  return useQuery<StylistProfile>({
    queryKey: ["stylist-profile"],
    queryFn: fetchProfile,
    staleTime: 60 * 1000,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: Partial<StylistProfile>) => updateProfile(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stylist-profile"] });
    },
  });
}

// ============================================================================
// EARNINGS
// ============================================================================

export function useEarnings() {
  return useQuery<EarningsSummary>({
    queryKey: ["stylist-earnings"],
    queryFn: fetchEarnings,
    staleTime: 60 * 1000,
  });
}

export function useEarningsTrend(period: "week" | "month" | "year" = "week") {
  return useQuery({
    queryKey: ["stylist-earnings-trend", period],
    queryFn: () => fetchEarningsTrend(period),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function usePayoutHistory(page: number = 1, limit: number = 10) {
  return useQuery({
    queryKey: ["stylist-payout-history", page, limit],
    queryFn: () => fetchPayoutHistory(page, limit),
    staleTime: 60 * 1000,
  });
}
