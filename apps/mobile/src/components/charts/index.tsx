/**
 * Chart Components (V7.5.2 Mobile)
 *
 * Revenue and data visualization components for property owner dashboard.
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Line, Circle, G, Text as SvgText, Rect } from 'react-native-svg';
import { colors, spacing, borderRadius, typography } from '../../styles/tokens';

// =============================================================================
// Types
// =============================================================================

export interface RevenueDataPoint {
  label: string;
  value: number;
  previousValue?: number;
}

export interface RevenueChartProps {
  data: RevenueDataPoint[];
  height?: number;
  showLabels?: boolean;
  showGrid?: boolean;
  showComparison?: boolean;
  showValues?: boolean;
  animated?: boolean;
  variant?: 'line' | 'bar';
  formatValue?: (value: number) => string;
}

export interface BarChartProps {
  data: { label: string; value: number; color?: string }[];
  height?: number;
  barWidth?: number;
  showLabels?: boolean;
  formatValue?: (value: number) => string;
}

// =============================================================================
// Constants
// =============================================================================

const CHART_PADDING = { top: 20, right: 20, bottom: 40, left: 50 };
const DEFAULT_HEIGHT = 200;

// =============================================================================
// Helper Functions
// =============================================================================

function getMinMax(data: RevenueDataPoint[]): { min: number; max: number } {
  let min = Infinity;
  let max = -Infinity;

  data.forEach((point) => {
    min = Math.min(min, point.value);
    max = Math.max(max, point.value);
    if (point.previousValue !== undefined) {
      min = Math.min(min, point.previousValue);
      max = Math.max(max, point.previousValue);
    }
  });

  // Add some padding to min/max
  const range = max - min;
  min = Math.max(0, min - range * 0.1);
  max = max + range * 0.1;

  return { min, max };
}

function defaultFormatValue(value: number): string {
  if (value >= 100000) {
    return `R${(value / 100).toFixed(0)}`;
  }
  return `R${(value / 100).toFixed(0)}`;
}

// =============================================================================
// Revenue Chart (Line Chart)
// =============================================================================

export function RevenueChart({
  data,
  height = DEFAULT_HEIGHT,
  showLabels = true,
  showGrid = true,
  showComparison = false,
  showValues: _showValues = false,
  animated: _animated = true,
  variant = 'line',
  formatValue = defaultFormatValue,
}: RevenueChartProps) {
  // If bar variant is requested, delegate to BarChart
  if (variant === 'bar') {
    const barData = data.map((point) => ({
      label: point.label,
      value: point.value,
    }));
    return (
      <BarChart
        data={barData}
        height={height}
        showLabels={showLabels}
        formatValue={formatValue}
      />
    );
  }
  const screenWidth = Dimensions.get('window').width - spacing.lg * 2;
  const chartWidth = screenWidth - CHART_PADDING.left - CHART_PADDING.right;
  const chartHeight = height - CHART_PADDING.top - CHART_PADDING.bottom;

  const { min, max } = useMemo(() => getMinMax(data), [data]);

  // Generate path for line chart
  const linePath = useMemo(() => {
    if (data.length === 0) return '';

    const xStep = chartWidth / (data.length - 1 || 1);

    return data
      .map((point, i) => {
        const x = CHART_PADDING.left + i * xStep;
        const y =
          CHART_PADDING.top +
          chartHeight -
          ((point.value - min) / (max - min || 1)) * chartHeight;
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');
  }, [data, chartWidth, chartHeight, min, max]);

  // Generate path for comparison line
  const comparisonPath = useMemo(() => {
    if (!showComparison || data.length === 0) return '';

    const xStep = chartWidth / (data.length - 1 || 1);

    return data
      .filter((point) => point.previousValue !== undefined)
      .map((point, i) => {
        const x = CHART_PADDING.left + i * xStep;
        const y =
          CHART_PADDING.top +
          chartHeight -
          ((point.previousValue! - min) / (max - min || 1)) * chartHeight;
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');
  }, [data, chartWidth, chartHeight, min, max, showComparison]);

  // Generate grid lines
  const gridLines = useMemo(() => {
    if (!showGrid) return [];

    const lines: { y: number; label: string }[] = [];
    const steps = 4;
    const stepValue = (max - min) / steps;

    for (let i = 0; i <= steps; i++) {
      const value = min + stepValue * i;
      const y =
        CHART_PADDING.top + chartHeight - (i / steps) * chartHeight;
      lines.push({ y, label: formatValue(value) });
    }

    return lines;
  }, [showGrid, min, max, chartHeight, formatValue]);

  // Data points
  const points = useMemo(() => {
    if (data.length === 0) return [];

    const xStep = chartWidth / (data.length - 1 || 1);

    return data.map((point, i) => ({
      x: CHART_PADDING.left + i * xStep,
      y:
        CHART_PADDING.top +
        chartHeight -
        ((point.value - min) / (max - min || 1)) * chartHeight,
      label: point.label,
      value: point.value,
    }));
  }, [data, chartWidth, chartHeight, min, max]);

  if (data.length === 0) {
    return (
      <View style={[styles.emptyChart, { height }]}>
        <Text style={styles.emptyChartText}>No data available</Text>
      </View>
    );
  }

  return (
    <View style={{ height }}>
      <Svg width={screenWidth} height={height}>
        {/* Grid Lines */}
        {gridLines.map((line, i) => (
          <G key={i}>
            <Line
              x1={CHART_PADDING.left}
              y1={line.y}
              x2={screenWidth - CHART_PADDING.right}
              y2={line.y}
              stroke={colors.border.subtle}
              strokeWidth={1}
              strokeDasharray="4,4"
            />
            <SvgText
              x={CHART_PADDING.left - 8}
              y={line.y + 4}
              fontSize={10}
              fill={colors.text.tertiary}
              textAnchor="end"
            >
              {line.label}
            </SvgText>
          </G>
        ))}

        {/* Comparison Line */}
        {showComparison && comparisonPath && (
          <Path
            d={comparisonPath}
            fill="none"
            stroke={colors.primarySoft}
            strokeWidth={2}
            strokeDasharray="6,4"
          />
        )}

        {/* Main Line */}
        <Path
          d={linePath}
          fill="none"
          stroke={colors.primary}
          strokeWidth={3}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Data Points */}
        {points.map((point, i) => (
          <G key={i}>
            <Circle
              cx={point.x}
              cy={point.y}
              r={5}
              fill={colors.primary}
              stroke={colors.white}
              strokeWidth={2}
            />
          </G>
        ))}

        {/* X-axis Labels */}
        {showLabels &&
          points.map((point, i) => (
            <SvgText
              key={i}
              x={point.x}
              y={height - 10}
              fontSize={10}
              fill={colors.text.tertiary}
              textAnchor="middle"
            >
              {point.label}
            </SvgText>
          ))}
      </Svg>

      {/* Legend */}
      {showComparison && (
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendLine, { backgroundColor: colors.primary }]} />
            <Text style={styles.legendText}>Current</Text>
          </View>
          <View style={styles.legendItem}>
            <View
              style={[
                styles.legendLine,
                { backgroundColor: colors.primarySoft, borderStyle: 'dashed' },
              ]}
            />
            <Text style={styles.legendText}>Previous</Text>
          </View>
        </View>
      )}
    </View>
  );
}

// =============================================================================
// Bar Chart
// =============================================================================

export function BarChart({
  data,
  height = DEFAULT_HEIGHT,
  barWidth = 40,
  showLabels = true,
  formatValue = defaultFormatValue,
}: BarChartProps) {
  const screenWidth = Dimensions.get('window').width - spacing.lg * 2;
  const chartHeight = height - CHART_PADDING.top - CHART_PADDING.bottom;

  const maxValue = useMemo(() => {
    return Math.max(...data.map((d) => d.value), 1);
  }, [data]);

  const bars = useMemo(() => {
    const totalBarsWidth = data.length * barWidth;
    const gap = (screenWidth - totalBarsWidth - CHART_PADDING.left - CHART_PADDING.right) / (data.length + 1);

    return data.map((point, i) => {
      const barHeight = (point.value / maxValue) * chartHeight;
      const x = CHART_PADDING.left + gap + i * (barWidth + gap);
      const y = CHART_PADDING.top + chartHeight - barHeight;

      return {
        x,
        y,
        width: barWidth,
        height: barHeight,
        label: point.label,
        value: point.value,
        color: point.color || colors.primary,
      };
    });
  }, [data, barWidth, screenWidth, chartHeight, maxValue]);

  if (data.length === 0) {
    return (
      <View style={[styles.emptyChart, { height }]}>
        <Text style={styles.emptyChartText}>No data available</Text>
      </View>
    );
  }

  return (
    <View style={{ height }}>
      <Svg width={screenWidth} height={height}>
        {bars.map((bar, i) => (
          <G key={i}>
            {/* Bar */}
            <Rect
              x={bar.x}
              y={bar.y}
              width={bar.width}
              height={bar.height}
              fill={bar.color}
              rx={4}
              ry={4}
            />
            {/* Value Label */}
            <SvgText
              x={bar.x + bar.width / 2}
              y={bar.y - 8}
              fontSize={10}
              fill={colors.text.primary}
              textAnchor="middle"
              fontWeight="600"
            >
              {formatValue(bar.value)}
            </SvgText>
            {/* X-axis Label */}
            {showLabels && (
              <SvgText
                x={bar.x + bar.width / 2}
                y={height - 10}
                fontSize={10}
                fill={colors.text.tertiary}
                textAnchor="middle"
              >
                {bar.label}
              </SvgText>
            )}
          </G>
        ))}
      </Svg>
    </View>
  );
}

// =============================================================================
// Styles
// =============================================================================

const styles = StyleSheet.create({
  emptyChart: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
  },
  emptyChartText: {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize.bodySmall,
    color: colors.text.tertiary,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
    marginTop: spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendLine: {
    width: 16,
    height: 3,
    borderRadius: 1.5,
  },
  legendText: {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize.caption,
    color: colors.text.secondary,
  },
});

export default RevenueChart;
