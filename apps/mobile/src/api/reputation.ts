/**
 * Reputation API Client (V7.1.0)
 *
 * Handles all reputation-related API calls:
 * - Get user reputation score
 * - Get TPS breakdown
 * - Get reputation events
 *
 * Based on docs/vlossom/08-reputation-system-flow.md
 */

import { apiRequest } from './client';

// ============================================================================
// Types
// ============================================================================

export interface ReputationScore {
  id: string;
  userId: string;
  userType: 'CUSTOMER' | 'STYLIST' | 'PROPERTY_OWNER';
  totalScore: number; // 0-10000 (displayed as 0-100%)
  tpsScore: number; // Time Performance Score
  reliabilityScore: number; // Booking reliability
  feedbackScore: number; // Customer/stylist reviews
  disputeScore: number; // Dispute-free bonus
  completedBookings: number;
  cancelledBookings: number;
  noShows: number;
  isVerified: boolean; // 70% + 5 bookings
  lastCalculatedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReputationEvent {
  id: string;
  userId: string;
  eventType:
    | 'BOOKING_COMPLETED'
    | 'NO_SHOW'
    | 'CANCELLATION'
    | 'REVIEW_RECEIVED'
    | 'DISPUTE_OPENED'
    | 'DISPUTE_RESOLVED';
  score: number; // Impact on score (-100 to +100)
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface TPSDetails {
  overall: number; // 0-10000
  startPunctuality: number; // 0-10000 (50% of TPS)
  durationAccuracy: number; // 0-10000 (50% of TPS)
  recentTrend: 'improving' | 'stable' | 'declining';
  bookingsAnalyzed: number;
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Get reputation score for a user
 */
export async function getReputationScore(userId: string): Promise<ReputationScore> {
  return apiRequest<ReputationScore>(`/api/v1/reputation/${userId}`);
}

/**
 * Get current user's reputation score
 */
export async function getMyReputation(): Promise<ReputationScore> {
  return apiRequest<ReputationScore>('/api/v1/reputation/me');
}

/**
 * Get TPS details for a stylist
 */
export async function getTPSDetails(stylistId: string): Promise<TPSDetails> {
  return apiRequest<TPSDetails>(`/api/v1/reputation/${stylistId}/tps`);
}

/**
 * Get reputation events for a user (paginated)
 */
export async function getReputationEvents(
  userId: string,
  params?: { page?: number; limit?: number }
): Promise<{
  events: ReputationEvent[];
  total: number;
  hasMore: boolean;
}> {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.set('page', params.page.toString());
  if (params?.limit) queryParams.set('limit', params.limit.toString());

  const url = `/api/v1/reputation/${userId}/events${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  return apiRequest(url);
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Convert score (0-10000) to percentage (0-100)
 */
export function scoreToPercentage(score: number): number {
  return score / 100;
}

/**
 * Get reputation tier based on percentage
 */
export function getReputationTier(
  percentage: number
): 'excellent' | 'good' | 'average' | 'poor' {
  if (percentage >= 90) return 'excellent';
  if (percentage >= 70) return 'good';
  if (percentage >= 50) return 'average';
  return 'poor';
}

/**
 * Get tier color
 */
export function getTierColor(tier: 'excellent' | 'good' | 'average' | 'poor'): string {
  switch (tier) {
    case 'excellent':
      return '#22C55E'; // Green
    case 'good':
      return '#3B82F6'; // Blue
    case 'average':
      return '#F59E0B'; // Amber
    case 'poor':
      return '#EF4444'; // Red
  }
}

/**
 * Get verification requirements progress
 */
export function getVerificationProgress(score: ReputationScore): {
  scoreProgress: number; // 0-100 (70% required)
  bookingsProgress: number; // 0-100 (5 required)
  isEligible: boolean;
} {
  const scoreProgress = Math.min((score.totalScore / 100 / 70) * 100, 100);
  const bookingsProgress = Math.min((score.completedBookings / 5) * 100, 100);

  return {
    scoreProgress,
    bookingsProgress,
    isEligible: score.totalScore / 100 >= 70 && score.completedBookings >= 5,
  };
}
