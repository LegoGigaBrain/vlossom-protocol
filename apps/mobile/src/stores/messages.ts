/**
 * Messages Store (V6.7.0)
 *
 * Zustand store for managing messages state.
 */

import { create } from 'zustand';
import {
  getConversations,
  getConversation,
  sendMessage as sendMessageAPI,
  markConversationRead,
  getUnreadCount,
  startConversation as startConversationAPI,
  type ConversationSummary,
  type ConversationDetail,
  type Message,
} from '../api/messages';

// ============================================================================
// Types
// ============================================================================

interface MessagesState {
  // Conversations list
  conversations: ConversationSummary[];
  conversationsLoading: boolean;
  conversationsError: string | null;
  hasMoreConversations: boolean;
  totalConversations: number;

  // Active conversation
  activeConversation: ConversationDetail | null;
  messages: Message[];
  messagesLoading: boolean;
  messagesError: string | null;
  hasMoreMessages: boolean;
  messageCursor: string | null;

  // Sending state
  sendingMessage: boolean;
  sendError: string | null;

  // Global unread count
  unreadCount: number;

  // Actions
  fetchConversations: (refresh?: boolean) => Promise<void>;
  fetchConversation: (conversationId: string) => Promise<void>;
  fetchMoreMessages: () => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  markAsRead: () => Promise<void>;
  refreshUnreadCount: () => Promise<void>;
  startConversation: (recipientId: string, bookingId?: string) => Promise<string>;
  clearActiveConversation: () => void;
  reset: () => void;
}

// ============================================================================
// Store
// ============================================================================

const initialState = {
  conversations: [],
  conversationsLoading: false,
  conversationsError: null,
  hasMoreConversations: false,
  totalConversations: 0,

  activeConversation: null,
  messages: [],
  messagesLoading: false,
  messagesError: null,
  hasMoreMessages: false,
  messageCursor: null,

  sendingMessage: false,
  sendError: null,

  unreadCount: 0,
};

export const useMessagesStore = create<MessagesState>((set, get) => ({
  ...initialState,

  fetchConversations: async (refresh = false) => {
    const state = get();
    if (state.conversationsLoading) return;

    set({ conversationsLoading: true, conversationsError: null });

    try {
      const offset = refresh ? 0 : state.conversations.length;
      const response = await getConversations({ limit: 20, offset });

      set({
        conversations: refresh
          ? response.conversations
          : [...state.conversations, ...response.conversations],
        hasMoreConversations: response.hasMore,
        totalConversations: response.total,
        conversationsLoading: false,
      });
    } catch (error) {
      set({
        conversationsError: error instanceof Error ? error.message : 'Failed to load conversations',
        conversationsLoading: false,
      });
    }
  },

  fetchConversation: async (conversationId: string) => {
    set({
      messagesLoading: true,
      messagesError: null,
      messages: [],
      activeConversation: null,
      messageCursor: null,
    });

    try {
      const response = await getConversation(conversationId, { limit: 50 });

      set({
        activeConversation: response.conversation,
        messages: response.messages.reverse(), // API returns newest first, we want oldest first
        hasMoreMessages: response.hasMore,
        messageCursor: response.cursor,
        messagesLoading: false,
      });
    } catch (error) {
      set({
        messagesError: error instanceof Error ? error.message : 'Failed to load conversation',
        messagesLoading: false,
      });
    }
  },

  fetchMoreMessages: async () => {
    const state = get();
    if (!state.activeConversation || !state.hasMoreMessages || state.messagesLoading) {
      return;
    }

    set({ messagesLoading: true });

    try {
      const response = await getConversation(state.activeConversation.id, {
        limit: 50,
        before: state.messageCursor || undefined,
      });

      set({
        messages: [...response.messages.reverse(), ...state.messages],
        hasMoreMessages: response.hasMore,
        messageCursor: response.cursor,
        messagesLoading: false,
      });
    } catch (error) {
      set({
        messagesError: error instanceof Error ? error.message : 'Failed to load more messages',
        messagesLoading: false,
      });
    }
  },

  sendMessage: async (content: string) => {
    const state = get();
    if (!state.activeConversation || state.sendingMessage) return;

    // Optimistic update - add message immediately
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: Message = {
      id: tempId,
      content,
      senderId: 'me',
      isOwn: true,
      readAt: null,
      createdAt: new Date().toISOString(),
    };

    set({
      messages: [...state.messages, optimisticMessage],
      sendingMessage: true,
      sendError: null,
    });

    try {
      const response = await sendMessageAPI(state.activeConversation.id, content);

      // Replace optimistic message with real one
      set((state) => ({
        messages: state.messages.map((m) =>
          m.id === tempId ? response.message : m
        ),
        sendingMessage: false,
      }));

      // Update conversation in list
      set((state) => ({
        conversations: state.conversations.map((c) =>
          c.id === state.activeConversation?.id
            ? {
                ...c,
                lastMessageAt: response.message.createdAt,
                lastMessagePreview: content.substring(0, 100),
              }
            : c
        ),
      }));
    } catch (error) {
      // Remove optimistic message on error
      set((state) => ({
        messages: state.messages.filter((m) => m.id !== tempId),
        sendingMessage: false,
        sendError: error instanceof Error ? error.message : 'Failed to send message',
      }));
    }
  },

  markAsRead: async () => {
    const state = get();
    if (!state.activeConversation) return;

    try {
      await markConversationRead(state.activeConversation.id);

      // Update local unread count
      const conversationUnread = state.conversations.find(
        (c) => c.id === state.activeConversation?.id
      )?.unreadCount || 0;

      set((state) => ({
        unreadCount: Math.max(0, state.unreadCount - conversationUnread),
        conversations: state.conversations.map((c) =>
          c.id === state.activeConversation?.id
            ? { ...c, unreadCount: 0 }
            : c
        ),
      }));
    } catch (error) {
      // Silently fail - not critical
      console.warn('Failed to mark as read:', error);
    }
  },

  refreshUnreadCount: async () => {
    try {
      const response = await getUnreadCount();
      set({ unreadCount: response.unreadCount });
    } catch (error) {
      // Silently fail
      console.warn('Failed to refresh unread count:', error);
    }
  },

  startConversation: async (recipientId: string, bookingId?: string) => {
    const response = await startConversationAPI({ recipientId, bookingId });
    return response.conversation.id;
  },

  clearActiveConversation: () => {
    set({
      activeConversation: null,
      messages: [],
      messagesError: null,
      hasMoreMessages: false,
      messageCursor: null,
    });
  },

  reset: () => {
    set(initialState);
  },
}));
