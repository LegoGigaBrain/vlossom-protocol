/**
 * Messages Hooks (V6.7.0)
 *
 * React Query hooks for direct messaging.
 */

"use client";

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import {
  getConversations,
  getConversation,
  startConversation,
  sendMessage,
  markConversationRead,
  archiveConversation,
  unarchiveConversation,
  getUnreadCount,
  type ConversationSummary,
  type ConversationsListResponse,
  type Message,
} from "@/lib/messages-client";

// ============================================================================
// Query Keys
// ============================================================================

export const messageKeys = {
  all: ["messages"] as const,
  conversations: () => [...messageKeys.all, "conversations"] as const,
  conversationsList: (params?: { includeArchived?: boolean }) =>
    [...messageKeys.conversations(), params] as const,
  conversation: (id: string) => [...messageKeys.all, "conversation", id] as const,
  unreadCount: () => [...messageKeys.all, "unread-count"] as const,
};

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook to get list of conversations
 */
export function useConversations(params?: {
  limit?: number;
  offset?: number;
  includeArchived?: boolean;
}) {
  return useQuery({
    queryKey: messageKeys.conversationsList({ includeArchived: params?.includeArchived }),
    queryFn: () => getConversations(params),
    staleTime: 10 * 1000, // 10 seconds - messages should feel fresh
  });
}

/**
 * Hook to get a single conversation with messages
 */
export function useConversation(conversationId: string, enabled = true) {
  return useQuery({
    queryKey: messageKeys.conversation(conversationId),
    queryFn: () => getConversation(conversationId),
    enabled: !!conversationId && enabled,
    staleTime: 5 * 1000, // 5 seconds
    refetchInterval: 10 * 1000, // Polling for new messages every 10 seconds
  });
}

/**
 * Hook to get conversation with infinite scroll for messages
 */
export function useConversationMessages(conversationId: string, enabled = true) {
  return useInfiniteQuery({
    queryKey: [...messageKeys.conversation(conversationId), "infinite"],
    queryFn: ({ pageParam }) =>
      getConversation(conversationId, {
        limit: 50,
        before: pageParam as string | undefined,
      }),
    getNextPageParam: (lastPage) => lastPage.cursor,
    initialPageParam: undefined as string | undefined,
    enabled: !!conversationId && enabled,
    staleTime: 5 * 1000,
  });
}

/**
 * Hook to get unread message count
 */
export function useUnreadCount() {
  return useQuery({
    queryKey: messageKeys.unreadCount(),
    queryFn: () => getUnreadCount(),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  });
}

/**
 * Hook to start a new conversation
 */
export function useStartConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: {
      recipientId: string;
      bookingId?: string;
      initialMessage?: string;
    }) => startConversation(params),
    onSuccess: (data) => {
      // Invalidate conversations list
      queryClient.invalidateQueries({ queryKey: messageKeys.conversations() });

      // If there was an initial message, also invalidate unread count
      if (data.initialMessage) {
        queryClient.invalidateQueries({ queryKey: messageKeys.unreadCount() });
      }
    },
  });
}

/**
 * Hook to send a message
 */
export function useSendMessage(conversationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (content: string) => sendMessage(conversationId, content),
    onSuccess: (data) => {
      // Optimistically add message to the conversation
      queryClient.setQueryData(
        messageKeys.conversation(conversationId),
        (oldData: Awaited<ReturnType<typeof getConversation>> | undefined) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            messages: [data.message, ...oldData.messages],
          };
        }
      );

      // Invalidate conversations list to update last message preview
      queryClient.invalidateQueries({ queryKey: messageKeys.conversations() });
    },
    onError: () => {
      // Refetch conversation on error
      queryClient.invalidateQueries({
        queryKey: messageKeys.conversation(conversationId),
      });
    },
  });
}

/**
 * Hook to mark conversation as read
 */
export function useMarkAsRead(conversationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => markConversationRead(conversationId),
    onSuccess: () => {
      // Update unread count in conversations list
      queryClient.setQueryData(
        messageKeys.conversationsList(),
        (oldData: ConversationsListResponse | undefined) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            conversations: oldData.conversations.map((conv) =>
              conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv
            ),
          };
        }
      );

      // Invalidate unread count
      queryClient.invalidateQueries({ queryKey: messageKeys.unreadCount() });
    },
  });
}

/**
 * Hook to archive a conversation
 */
export function useArchiveConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conversationId: string) => archiveConversation(conversationId),
    onSuccess: (_, conversationId) => {
      // Remove from non-archived list
      queryClient.setQueryData(
        messageKeys.conversationsList({ includeArchived: false }),
        (oldData: ConversationsListResponse | undefined) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            conversations: oldData.conversations.filter(
              (conv) => conv.id !== conversationId
            ),
            total: oldData.total - 1,
          };
        }
      );

      // Invalidate archived list
      queryClient.invalidateQueries({
        queryKey: messageKeys.conversationsList({ includeArchived: true }),
      });
    },
  });
}

/**
 * Hook to unarchive a conversation
 */
export function useUnarchiveConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conversationId: string) => unarchiveConversation(conversationId),
    onSuccess: () => {
      // Invalidate all conversation lists
      queryClient.invalidateQueries({ queryKey: messageKeys.conversations() });
    },
  });
}

// Re-export types
export type { ConversationSummary, ConversationsListResponse, Message };
