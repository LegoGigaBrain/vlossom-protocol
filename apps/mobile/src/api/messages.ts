/**
 * Messages API Client (V6.7.0)
 *
 * Client for direct messaging between users.
 */

import { apiRequest } from './client';

// ============================================================================
// Types
// ============================================================================

export interface ConversationParticipant {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  specialties?: string[];
  bio?: string;
}

export interface ConversationSummary {
  id: string;
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
  unreadCount: number;
  bookingId: string | null;
  participant: ConversationParticipant | null;
  createdAt: string;
}

export interface ConversationsListResponse {
  conversations: ConversationSummary[];
  total: number;
  hasMore: boolean;
}

export interface Message {
  id: string;
  content: string;
  senderId: string;
  isOwn: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface ConversationDetail {
  id: string;
  bookingId: string | null;
  participant: ConversationParticipant | null;
  createdAt: string;
}

export interface ConversationWithMessagesResponse {
  conversation: ConversationDetail;
  messages: Message[];
  hasMore: boolean;
  cursor: string | null;
}

export interface StartConversationResponse {
  conversation: {
    id: string;
    bookingId: string | null;
    participant: {
      id: string;
      displayName: string;
      avatarUrl: string | null;
    };
    createdAt: string;
  };
  initialMessage: {
    id: string;
    content: string;
    createdAt: string;
  } | null;
}

export interface SendMessageResponse {
  message: Message;
}

export interface UnreadCountResponse {
  unreadCount: number;
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Get list of user's conversations
 */
export async function getConversations(params?: {
  limit?: number;
  offset?: number;
  includeArchived?: boolean;
}): Promise<ConversationsListResponse> {
  return apiRequest<ConversationsListResponse>('/api/v1/conversations', {
    params: {
      limit: params?.limit,
      offset: params?.offset,
      includeArchived: params?.includeArchived,
    },
  });
}

/**
 * Start or get existing conversation with a user
 */
export async function startConversation(params: {
  recipientId: string;
  bookingId?: string;
  initialMessage?: string;
}): Promise<StartConversationResponse> {
  return apiRequest<StartConversationResponse>('/api/v1/conversations', {
    method: 'POST',
    body: params,
  });
}

/**
 * Get conversation with messages
 */
export async function getConversation(
  conversationId: string,
  params?: {
    limit?: number;
    before?: string;
  }
): Promise<ConversationWithMessagesResponse> {
  return apiRequest<ConversationWithMessagesResponse>(
    `/api/v1/conversations/${conversationId}`,
    {
      params: {
        limit: params?.limit,
        before: params?.before,
      },
    }
  );
}

/**
 * Send a message in a conversation
 */
export async function sendMessage(
  conversationId: string,
  content: string
): Promise<SendMessageResponse> {
  return apiRequest<SendMessageResponse>(
    `/api/v1/conversations/${conversationId}/messages`,
    {
      method: 'POST',
      body: { content },
    }
  );
}

/**
 * Mark all messages in a conversation as read
 */
export async function markConversationRead(
  conversationId: string
): Promise<{ success: boolean; markedCount: number }> {
  return apiRequest<{ success: boolean; markedCount: number }>(
    `/api/v1/conversations/${conversationId}/read`,
    {
      method: 'POST',
    }
  );
}

/**
 * Archive a conversation
 */
export async function archiveConversation(
  conversationId: string
): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>(
    `/api/v1/conversations/${conversationId}/archive`,
    {
      method: 'POST',
    }
  );
}

/**
 * Unarchive a conversation
 */
export async function unarchiveConversation(
  conversationId: string
): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>(
    `/api/v1/conversations/${conversationId}/archive`,
    {
      method: 'DELETE',
    }
  );
}

/**
 * Get total unread message count
 */
export async function getUnreadCount(): Promise<UnreadCountResponse> {
  return apiRequest<UnreadCountResponse>('/api/v1/conversations/unread-count');
}
