/**
 * TravelPricing Component (V7.5.2)
 *
 * Displays travel fee information for mobile stylists.
 * Shows distance-based pricing and estimated arrival time.
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing, typography, borderRadius } from '../../styles/tokens';
import { VlossomLocationIcon, VlossomClockIcon } from '../icons/VlossomIcons';

export interface TravelFeeBreakdown {
  distanceKm: number;
  baseFeeCents: number;
  perKmFeeCents: number;
  totalFeeCents: number;
  estimatedMinutes: number;
}

export interface TravelMultiplier {
  name: string;
  multiplier: number;
  description?: string;
}

export interface TravelPricingProps {
  /**
   * Travel fee breakdown details
   */
  breakdown: TravelFeeBreakdown;
  /**
   * Optional multipliers (e.g., peak time, urgency)
   */
  multipliers?: TravelMultiplier[];
  /**
   * Show detailed breakdown
   */
  showDetails?: boolean;
  /**
   * Compact display mode
   */
  compact?: boolean;
  /**
   * Additional container styles
   */
  style?: ViewStyle;
}

/**
 * Calculate travel fee based on distance
 */
export function calculateTravelFee(
  distanceKm: number,
  options?: {
    baseFeeCents?: number;
    perKmFeeCents?: number;
    minFeeCents?: number;
    multipliers?: TravelMultiplier[];
  }
): TravelFeeBreakdown {
  const baseFeeCents = options?.baseFeeCents ?? 2000; // R20 base
  const perKmFeeCents = options?.perKmFeeCents ?? 500; // R5 per km
  const minFeeCents = options?.minFeeCents ?? 2000; // R20 minimum

  let totalFeeCents = baseFeeCents + Math.ceil(distanceKm * perKmFeeCents);

  // Apply multipliers
  if (options?.multipliers) {
    for (const mult of options.multipliers) {
      totalFeeCents = Math.ceil(totalFeeCents * mult.multiplier);
    }
  }

  // Enforce minimum
  totalFeeCents = Math.max(totalFeeCents, minFeeCents);

  // Estimate travel time (avg 30 km/h in city traffic)
  const estimatedMinutes = Math.ceil((distanceKm / 30) * 60);

  return {
    distanceKm,
    baseFeeCents,
    perKmFeeCents,
    totalFeeCents,
    estimatedMinutes,
  };
}

function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)}m`;
  }
  return `${km.toFixed(1)}km`;
}

function formatCents(cents: number): string {
  return `R${(cents / 100).toFixed(2)}`;
}

function formatMinutes(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

export function TravelPricing({
  breakdown,
  multipliers,
  showDetails = true,
  compact = false,
  style,
}: TravelPricingProps) {
  if (compact) {
    return (
      <View style={[styles.compactContainer, style]}>
        <VlossomLocationIcon size={14} color={colors.text.secondary} />
        <Text style={styles.compactText}>
          {formatDistance(breakdown.distanceKm)} · {formatCents(breakdown.totalFeeCents)}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <Text style={styles.title}>Travel Fee</Text>
        <Text style={styles.fee}>{formatCents(breakdown.totalFeeCents)}</Text>
      </View>

      {showDetails && (
        <View style={styles.details}>
          <View style={styles.detailRow}>
            <VlossomLocationIcon size={16} color={colors.text.tertiary} />
            <Text style={styles.detailText}>
              Distance: {formatDistance(breakdown.distanceKm)}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <VlossomClockIcon size={16} color={colors.text.tertiary} />
            <Text style={styles.detailText}>
              Est. travel time: {formatMinutes(breakdown.estimatedMinutes)}
            </Text>
          </View>
        </View>
      )}

      {multipliers && multipliers.length > 0 && (
        <View style={styles.multipliers}>
          {multipliers.map((mult, index) => (
            <View key={index} style={styles.multiplierRow}>
              <Text style={styles.multiplierName}>{mult.name}</Text>
              <Text style={styles.multiplierValue}>
                {mult.multiplier > 1 ? '+' : ''}
                {Math.round((mult.multiplier - 1) * 100)}%
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
  },
  fee: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize.h3,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
  },
  details: {
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  detailText: {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  compactText: {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  multipliers: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
    gap: spacing.xs,
  },
  multiplierRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  multiplierName: {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  multiplierValue: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.status.warning,
  },
});

export default TravelPricing;
