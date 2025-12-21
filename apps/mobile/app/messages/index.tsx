/**
 * Messages List Screen (V6.7.0)
 *
 * Shows list of user's conversations with unread indicators.
 * Connected to Zustand store for API integration.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography, radius } from '../../src/styles/tokens';
import { VlossomNotificationsIcon, VlossomChevronRightIcon } from '../../src/components/icons/VlossomIcons';
import { useMessagesStore } from '../../src/stores/messages';
import type { ConversationSummary } from '../../src/api/messages';

type FilterTab = 'all' | 'unread';

export default function MessagesScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  const {
    conversations,
    conversationsLoading,
    conversationsError,
    fetchConversations,
    refreshUnreadCount,
  } = useMessagesStore();

  // Fetch conversations on mount and focus
  useFocusEffect(
    useCallback(() => {
      fetchConversations(true);
      refreshUnreadCount();
    }, [fetchConversations, refreshUnreadCount])
  );

  // Filter conversations
  const filteredConversations = conversations.filter((conv) => {
    if (activeTab === 'unread') {
      return conv.unreadCount > 0;
    }
    return true;
  });

  const handleRefresh = useCallback(() => {
    fetchConversations(true);
    refreshUnreadCount();
  }, [fetchConversations, refreshUnreadCount]);

  const formatTimeAgo = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' });
  };

  const renderConversation = ({ item }: { item: ConversationSummary }) => {
    if (!item.participant) return null;

    return (
      <TouchableOpacity
        style={[
          styles.conversationItem,
          item.unreadCount > 0 && styles.unreadConversation,
        ]}
        onPress={() => router.push(`/messages/${item.id}`)}
        activeOpacity={0.7}
      >
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          {item.participant.avatarUrl ? (
            <Image
              source={{ uri: item.participant.avatarUrl }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>
                {item.participant.displayName.charAt(0)}
              </Text>
            </View>
          )}
          {item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>
                {item.unreadCount > 9 ? '9+' : item.unreadCount}
              </Text>
            </View>
          )}
        </View>

        {/* Content */}
        <View style={styles.conversationContent}>
          <View style={styles.nameRow}>
            <Text
              style={[
                styles.participantName,
                item.unreadCount > 0 && styles.unreadName,
              ]}
              numberOfLines={1}
            >
              {item.participant.displayName}
            </Text>
            {item.bookingId && (
              <View style={styles.bookingBadge}>
                <Text style={styles.bookingBadgeText}>Booking</Text>
              </View>
            )}
          </View>
          <Text
            style={[
              styles.messagePreview,
              item.unreadCount > 0 && styles.unreadPreview,
            ]}
            numberOfLines={1}
          >
            {item.lastMessagePreview || 'No messages yet'}
          </Text>
        </View>

        {/* Time & Arrow */}
        <View style={styles.conversationMeta}>
          <Text style={styles.timeText}>{formatTimeAgo(item.lastMessageAt)}</Text>
          <VlossomChevronRightIcon size={16} color={colors.text.muted} />
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => {
    if (conversationsLoading && conversations.length === 0) {
      return (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={colors.brand.rose} />
          <Text style={styles.loadingText}>Loading conversations...</Text>
        </View>
      );
    }

    if (conversationsError) {
      return (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconContainer}>
            <VlossomNotificationsIcon size={32} color={colors.status.error} />
          </View>
          <Text style={styles.emptyTitle}>Something went wrong</Text>
          <Text style={styles.emptySubtitle}>{conversationsError}</Text>
          <TouchableOpacity
            style={styles.findStylistsButton}
            onPress={() => fetchConversations(true)}
          >
            <Text style={styles.findStylistsText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.emptyState}>
        <View style={styles.emptyIconContainer}>
          <VlossomNotificationsIcon size={32} color={colors.brand.rose} />
        </View>
        <Text style={styles.emptyTitle}>
          {activeTab === 'unread' ? 'All caught up!' : 'No messages yet'}
        </Text>
        <Text style={styles.emptySubtitle}>
          {activeTab === 'unread'
            ? 'You have no unread messages.'
            : 'Start a conversation by messaging a stylist.'}
        </Text>
        {activeTab === 'all' && (
          <TouchableOpacity
            style={styles.findStylistsButton}
            onPress={() => router.push('/(tabs)/search')}
          >
            <Text style={styles.findStylistsText}>Find Stylists</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const unreadConversationsCount = conversations.filter((c) => c.unreadCount > 0).length;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Filter Tabs */}
      <View style={styles.tabsContainer}>
        {(['all', 'unread'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text
              style={[styles.tabText, activeTab === tab && styles.activeTabText]}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
            {tab === 'unread' && unreadConversationsCount > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>
                  {unreadConversationsCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Conversations List */}
      <FlatList
        data={filteredConversations}
        renderItem={renderConversation}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={conversationsLoading && conversations.length > 0}
            onRefresh={handleRefresh}
            tintColor={colors.brand.rose}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background.secondary,
    borderRadius: radius.lg,
  },
  activeTab: {
    backgroundColor: colors.brand.rose,
  },
  tabText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  tabBadge: {
    marginLeft: spacing.xs,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  tabBadgeText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 10,
    color: '#FFFFFF',
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
    flexGrow: 1,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background.secondary,
    borderRadius: radius.lg,
    marginBottom: spacing.sm,
  },
  unreadConversation: {
    backgroundColor: `${colors.brand.rose}10`,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.brand.rose,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.lg,
    color: '#FFFFFF',
  },
  unreadBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.brand.rose,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  unreadBadgeText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 10,
    color: '#FFFFFF',
  },
  conversationContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  participantName: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    flexShrink: 1,
  },
  unreadName: {
    fontFamily: typography.fontFamily.semibold,
    color: colors.text.primary,
  },
  bookingBadge: {
    marginLeft: spacing.xs,
    backgroundColor: colors.background.tertiary,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  bookingBadgeText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 10,
    color: colors.text.secondary,
  },
  messagePreview: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.text.muted,
  },
  unreadPreview: {
    fontFamily: typography.fontFamily.medium,
    color: colors.text.primary,
  },
  conversationMeta: {
    alignItems: 'flex-end',
    marginLeft: spacing.sm,
  },
  timeText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.text.muted,
    marginBottom: spacing.xs,
  },
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  loadingText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginTop: spacing.md,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${colors.brand.rose}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.lg,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  findStylistsButton: {
    backgroundColor: colors.brand.rose,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
  },
  findStylistsText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.base,
    color: '#FFFFFF',
  },
});
