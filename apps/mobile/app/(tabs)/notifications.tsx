/**
 * Notifications Tab - Global Inbox (V6.0)
 *
 * Purpose: All system events, bookings, messages, alerts
 * Inbox-style interface
 */

import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, textStyles } from '../../src/styles/theme';
import { VlossomNotificationsIcon, VlossomSettingsIcon } from '../../src/components/icons/VlossomIcons';

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const { colors, spacing, borderRadius, shadows } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.lg }]}>
        <Text style={[textStyles.h2, { color: colors.text.primary }]}>Notifications</Text>
        <Pressable>
          <VlossomSettingsIcon size={24} color={colors.text.secondary} />
        </Pressable>
      </View>

      {/* Filter tabs */}
      <View style={[styles.filterTabs, { paddingHorizontal: spacing.lg }]}>
        {['All', 'Bookings', 'Payments', 'Updates'].map((tab, i) => (
          <Pressable
            key={tab}
            style={[
              styles.filterTab,
              {
                borderBottomWidth: 2,
                borderBottomColor: i === 0 ? colors.primary : 'transparent',
                paddingBottom: spacing.sm,
                marginRight: spacing.lg,
              },
            ]}
          >
            <Text
              style={[
                textStyles.bodySmall,
                {
                  color: i === 0 ? colors.primary : colors.text.secondary,
                  fontWeight: i === 0 ? '600' : '400',
                },
              ]}
            >
              {tab}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Notifications list */}
      <ScrollView style={styles.list} contentContainerStyle={{ padding: spacing.lg }}>
        {/* Empty state */}
        <View
          style={[
            styles.emptyState,
            {
              backgroundColor: colors.background.secondary,
              borderRadius: borderRadius.lg,
            },
          ]}
        >
          <View
            style={[
              styles.emptyIcon,
              {
                backgroundColor: colors.surface.light,
                borderRadius: borderRadius.circle,
              },
            ]}
          >
            <VlossomNotificationsIcon size={32} color={colors.primary} />
          </View>
          <Text style={[textStyles.h3, { color: colors.text.primary, marginTop: spacing.lg }]}>
            All caught up
          </Text>
          <Text
            style={[
              textStyles.body,
              { color: colors.text.tertiary, marginTop: spacing.sm, textAlign: 'center' },
            ]}
          >
            You'll see booking confirmations, updates, and important alerts here
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  filterTabs: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5E5',
  },
  filterTab: {},
  list: {
    flex: 1,
  },
  emptyState: {
    padding: 48,
    alignItems: 'center',
  },
  emptyIcon: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
