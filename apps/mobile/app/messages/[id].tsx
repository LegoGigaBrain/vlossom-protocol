/**
 * Conversation Thread Screen (V6.7.0)
 *
 * View and send messages in a conversation.
 * Connected to Zustand store for API integration.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography, radius } from '../../src/styles/tokens';
import { VlossomChevronRightIcon, VlossomCalendarIcon } from '../../src/components/icons/VlossomIcons';
import { useMessagesStore } from '../../src/stores/messages';
import type { Message } from '../../src/api/messages';

export default function ConversationScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  const conversationId = id as string;

  const [newMessage, setNewMessage] = useState('');

  const {
    activeConversation,
    messages,
    messagesLoading,
    messagesError,
    sendingMessage,
    sendError,
    fetchConversation,
    sendMessage,
    markAsRead,
    clearActiveConversation,
  } = useMessagesStore();

  // Fetch conversation on mount
  useEffect(() => {
    if (conversationId) {
      fetchConversation(conversationId);
    }
    return () => {
      clearActiveConversation();
    };
  }, [conversationId, fetchConversation, clearActiveConversation]);

  // Mark as read when messages load
  useEffect(() => {
    if (messages.length > 0 && messages.some((m) => !m.isOwn && !m.readAt)) {
      markAsRead();
    }
  }, [messages, markAsRead]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const handleSend = useCallback(async () => {
    const content = newMessage.trim();
    if (!content || sendingMessage) return;

    setNewMessage('');
    await sendMessage(content);
  }, [newMessage, sendingMessage, sendMessage]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-ZA', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDateHeader = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    return date.toLocaleDateString('en-ZA', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  };

  const participant = activeConversation?.participant;
  const bookingId = activeConversation?.bookingId;

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const showDateHeader =
      index === 0 ||
      new Date(item.createdAt).toDateString() !==
        new Date(messages[index - 1].createdAt).toDateString();

    const showAvatar =
      !item.isOwn &&
      (index === 0 || messages[index - 1].isOwn !== item.isOwn);

    return (
      <View>
        {showDateHeader && (
          <View style={styles.dateHeader}>
            <Text style={styles.dateHeaderText}>
              {formatDateHeader(item.createdAt)}
            </Text>
          </View>
        )}

        <View
          style={[
            styles.messageRow,
            item.isOwn ? styles.ownMessageRow : styles.otherMessageRow,
          ]}
        >
          {/* Avatar for received messages */}
          {!item.isOwn && (
            <View style={styles.avatarSpace}>
              {showAvatar && participant && (
                participant.avatarUrl ? (
                  <Image
                    source={{ uri: participant.avatarUrl }}
                    style={styles.messageAvatar}
                  />
                ) : (
                  <View style={styles.messageAvatarPlaceholder}>
                    <Text style={styles.messageAvatarInitial}>
                      {participant.displayName.charAt(0)}
                    </Text>
                  </View>
                )
              )}
            </View>
          )}

          {/* Message Bubble */}
          <View
            style={[
              styles.messageBubble,
              item.isOwn ? styles.ownBubble : styles.otherBubble,
            ]}
          >
            <Text
              style={[
                styles.messageText,
                item.isOwn ? styles.ownMessageText : styles.otherMessageText,
              ]}
            >
              {item.content}
            </Text>
            <View style={styles.messageFooter}>
              <Text
                style={[
                  styles.messageTime,
                  item.isOwn ? styles.ownMessageTime : styles.otherMessageTime,
                ]}
              >
                {formatTime(item.createdAt)}
              </Text>
              {item.isOwn && item.readAt && (
                <Text style={styles.readIndicator}>Read</Text>
              )}
            </View>
          </View>
        </View>
      </View>
    );
  };

  // Loading state
  if (messagesLoading && messages.length === 0) {
    return (
      <>
        <Stack.Screen
          options={{
            headerTitle: 'Loading...',
          }}
        />
        <SafeAreaView style={styles.container} edges={['bottom']}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.brand.rose} />
            <Text style={styles.loadingText}>Loading conversation...</Text>
          </View>
        </SafeAreaView>
      </>
    );
  }

  // Error state
  if (messagesError) {
    return (
      <>
        <Stack.Screen
          options={{
            headerTitle: 'Error',
          }}
        />
        <SafeAreaView style={styles.container} edges={['bottom']}>
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>Something went wrong</Text>
            <Text style={styles.errorText}>{messagesError}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => fetchConversation(conversationId)}
            >
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: () => (
            <TouchableOpacity
              style={styles.headerTitleContainer}
              onPress={() => participant && router.push(`/stylists/${participant.id}`)}
            >
              {participant?.avatarUrl ? (
                <Image
                  source={{ uri: participant.avatarUrl }}
                  style={styles.headerAvatar}
                />
              ) : participant ? (
                <View style={styles.headerAvatarPlaceholder}>
                  <Text style={styles.headerAvatarInitial}>
                    {participant.displayName.charAt(0)}
                  </Text>
                </View>
              ) : null}
              <View>
                <Text style={styles.headerName} numberOfLines={1}>
                  {participant?.displayName || 'Unknown'}
                </Text>
                {participant?.specialties && participant.specialties.length > 0 && (
                  <Text style={styles.headerSpecialties} numberOfLines={1}>
                    {participant.specialties.slice(0, 2).join(', ')}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          ),
          headerRight: () =>
            bookingId ? (
              <TouchableOpacity
                onPress={() => router.push(`/booking/${bookingId}`)}
                style={styles.headerBookingButton}
              >
                <VlossomCalendarIcon size={20} color={colors.brand.rose} />
              </TouchableOpacity>
            ) : null,
        }}
      />

      <SafeAreaView style={styles.container} edges={['bottom']}>
        <KeyboardAvoidingView
          style={styles.keyboardAvoid}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          {/* Messages */}
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({ animated: false })
            }
            ListEmptyComponent={
              <View style={styles.emptyMessages}>
                <Text style={styles.emptyMessagesText}>
                  No messages yet. Start the conversation!
                </Text>
              </View>
            }
          />

          {/* Send Error */}
          {sendError && (
            <View style={styles.sendErrorContainer}>
              <Text style={styles.sendErrorText}>{sendError}</Text>
            </View>
          )}

          {/* Input Area */}
          <View style={styles.inputContainer}>
            <TextInput
              value={newMessage}
              onChangeText={setNewMessage}
              placeholder="Type a message..."
              placeholderTextColor={colors.text.muted}
              style={styles.textInput}
              multiline
              maxLength={2000}
              returnKeyType="send"
              onSubmitEditing={handleSend}
              blurOnSubmit={false}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!newMessage.trim() || sendingMessage) && styles.sendButtonDisabled,
              ]}
              onPress={handleSend}
              disabled={!newMessage.trim() || sendingMessage}
            >
              {sendingMessage ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <VlossomChevronRightIcon
                  size={24}
                  color={newMessage.trim() ? '#FFFFFF' : colors.text.muted}
                />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  keyboardAvoid: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginTop: spacing.md,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  errorTitle: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.lg,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  errorText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  retryButton: {
    backgroundColor: colors.brand.rose,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
  },
  retryButtonText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.base,
    color: '#FFFFFF',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: 200,
  },
  headerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: spacing.sm,
  },
  headerAvatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.brand.rose,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  headerAvatarInitial: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.sm,
    color: '#FFFFFF',
  },
  headerName: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
  },
  headerSpecialties: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.text.muted,
  },
  headerBookingButton: {
    padding: spacing.sm,
  },
  messagesList: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    flexGrow: 1,
  },
  emptyMessages: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyMessagesText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  dateHeader: {
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  dateHeaderText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.text.muted,
    backgroundColor: colors.background.tertiary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
    maxWidth: '80%',
  },
  ownMessageRow: {
    alignSelf: 'flex-end',
  },
  otherMessageRow: {
    alignSelf: 'flex-start',
  },
  avatarSpace: {
    width: 32,
    marginRight: spacing.xs,
  },
  messageAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  messageAvatarPlaceholder: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.brand.rose,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageAvatarInitial: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.xs,
    color: '#FFFFFF',
  },
  messageBubble: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.xl,
  },
  ownBubble: {
    backgroundColor: colors.brand.rose,
    borderBottomRightRadius: radius.sm,
  },
  otherBubble: {
    backgroundColor: colors.background.tertiary,
    borderBottomLeftRadius: radius.sm,
  },
  messageText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.base,
    lineHeight: 20,
  },
  ownMessageText: {
    color: '#FFFFFF',
  },
  otherMessageText: {
    color: colors.text.primary,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: spacing.xs,
  },
  messageTime: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
  },
  ownMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  otherMessageTime: {
    color: colors.text.muted,
  },
  readIndicator: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  sendErrorContainer: {
    backgroundColor: colors.status.error,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  sendErrorText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },
  textInput: {
    flex: 1,
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    backgroundColor: colors.background.tertiary,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    maxHeight: 100,
    minHeight: 44,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.brand.rose,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  sendButtonDisabled: {
    backgroundColor: colors.background.tertiary,
  },
});
