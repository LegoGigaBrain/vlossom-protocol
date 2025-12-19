/**
 * Conversation Thread Screen (V6.7.0)
 *
 * View and send messages in a conversation.
 */

import React, { useState, useRef, useEffect } from 'react';
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
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography, radius } from '../../src/styles/tokens';
import { VlossomChevronRightIcon, VlossomCalendarIcon } from '../../src/components/icons/VlossomIcons';

// Mock data - in production, this would come from API
const MOCK_CONVERSATION = {
  id: '1',
  participant: {
    id: 'stylist-1',
    displayName: 'Thandi Mbeki',
    avatarUrl: null,
    specialties: ['Braids', 'Locs'],
    bio: 'Specializing in protective styles and natural hair care.',
  },
  bookingId: 'booking-1',
  messages: [
    {
      id: 'm1',
      content: 'Hi! I saw your profile and would love to book an appointment.',
      senderId: 'me',
      isOwn: true,
      readAt: new Date(Date.now() - 3600000).toISOString(),
      createdAt: new Date(Date.now() - 7200000).toISOString(),
    },
    {
      id: 'm2',
      content: 'Hello! Thank you for reaching out. I would be happy to help you with your hair. What style are you interested in?',
      senderId: 'stylist-1',
      isOwn: false,
      readAt: new Date(Date.now() - 3500000).toISOString(),
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: 'm3',
      content: "I'm thinking about getting box braids for my upcoming vacation. How long would that take?",
      senderId: 'me',
      isOwn: true,
      readAt: new Date(Date.now() - 1800000).toISOString(),
      createdAt: new Date(Date.now() - 1900000).toISOString(),
    },
    {
      id: 'm4',
      content: 'Box braids usually take between 4-6 hours depending on the length and thickness you want. Would you like me to send you some options?',
      senderId: 'stylist-1',
      isOwn: false,
      readAt: null,
      createdAt: new Date(Date.now() - 1800000).toISOString(),
    },
  ],
};

interface Message {
  id: string;
  content: string;
  senderId: string;
  isOwn: boolean;
  readAt: string | null;
  createdAt: string;
}

export default function ConversationScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);

  const [messages, setMessages] = useState<Message[]>(MOCK_CONVERSATION.messages);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);

  const participant = MOCK_CONVERSATION.participant;
  const bookingId = MOCK_CONVERSATION.bookingId;

  // Scroll to bottom on mount
  useEffect(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: false });
    }, 100);
  }, []);

  const handleSend = async () => {
    const content = newMessage.trim();
    if (!content || sending) return;

    setSending(true);
    setNewMessage('');

    // Optimistically add message
    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      content,
      senderId: 'me',
      isOwn: true,
      readAt: null,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempMessage]);

    // In production: send via API
    setTimeout(() => {
      setSending(false);
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 500);
  };

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
              {showAvatar && (
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

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: () => (
            <TouchableOpacity
              style={styles.headerTitleContainer}
              onPress={() => router.push(`/stylists/${participant.id}`)}
            >
              {participant.avatarUrl ? (
                <Image
                  source={{ uri: participant.avatarUrl }}
                  style={styles.headerAvatar}
                />
              ) : (
                <View style={styles.headerAvatarPlaceholder}>
                  <Text style={styles.headerAvatarInitial}>
                    {participant.displayName.charAt(0)}
                  </Text>
                </View>
              )}
              <View>
                <Text style={styles.headerName} numberOfLines={1}>
                  {participant.displayName}
                </Text>
                {participant.specialties.length > 0 && (
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
          />

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
                (!newMessage.trim() || sending) && styles.sendButtonDisabled,
              ]}
              onPress={handleSend}
              disabled={!newMessage.trim() || sending}
            >
              <VlossomChevronRightIcon
                size={24}
                color={newMessage.trim() && !sending ? '#FFFFFF' : colors.text.muted}
              />
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
