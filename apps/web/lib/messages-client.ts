/**
 * Messages API Client (V6.7.0)
 *
 * Client for direct messaging between users.
 */

import { getAuthToken } from "./auth-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

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
  const token = getAuthToken();
  if (!token) {
    throw new Error("Not authenticated");
  }

  const searchParams = new URLSearchParams();
  if (params?.limit) searchParams.set("limit", params.limit.toString());
  if (params?.offset) searchParams.set("offset", params.offset.toString());
  if (params?.includeArchived) searchParams.set("includeArchived", "true");

  const url = `${API_URL}/api/v1/conversations?${searchParams.toString()}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to fetch conversations");
  }

  return response.json();
}

/**
 * Start or get existing conversation with a user
 */
export async function startConversation(params: {
  recipientId: string;
  bookingId?: string;
  initialMessage?: string;
}): Promise<StartConversationResponse> {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Not authenticated");
  }

  const response = await fetch(`${API_URL}/api/v1/conversations`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to start conversation");
  }

  return response.json();
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
  const token = getAuthToken();
  if (!token) {
    throw new Error("Not authenticated");
  }

  const searchParams = new URLSearchParams();
  if (params?.limit) searchParams.set("limit", params.limit.toString());
  if (params?.before) searchParams.set("before", params.before);

  const url = `${API_URL}/api/v1/conversations/${conversationId}?${searchParams.toString()}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to fetch conversation");
  }

  return response.json();
}

/**
 * Send a message in a conversation
 */
export async function sendMessage(
  conversationId: string,
  content: string
): Promise<SendMessageResponse> {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Not authenticated");
  }

  const response = await fetch(
    `${API_URL}/api/v1/conversations/${conversationId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to send message");
  }

  return response.json();
}

/**
 * Mark all messages in a conversation as read
 */
export async function markConversationRead(
  conversationId: string
): Promise<{ success: boolean; markedCount: number }> {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Not authenticated");
  }

  const response = await fetch(
    `${API_URL}/api/v1/conversations/${conversationId}/read`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to mark as read");
  }

  return response.json();
}

/**
 * Archive a conversation
 */
export async function archiveConversation(
  conversationId: string
): Promise<{ success: boolean }> {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Not authenticated");
  }

  const response = await fetch(
    `${API_URL}/api/v1/conversations/${conversationId}/archive`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to archive conversation");
  }

  return response.json();
}

/**
 * Unarchive a conversation
 */
export async function unarchiveConversation(
  conversationId: string
): Promise<{ success: boolean }> {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Not authenticated");
  }

  const response = await fetch(
    `${API_URL}/api/v1/conversations/${conversationId}/archive`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to unarchive conversation");
  }

  return response.json();
}

/**
 * Get total unread message count
 */
export async function getUnreadCount(): Promise<UnreadCountResponse> {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Not authenticated");
  }

  const response = await fetch(`${API_URL}/api/v1/conversations/unread-count`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to fetch unread count");
  }

  return response.json();
}
