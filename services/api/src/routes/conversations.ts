/**
 * Conversations API Routes (V6.7.0)
 *
 * Endpoints for direct messaging between users (stylists, customers).
 * Text-only for MVP.
 */

import { Router, Response, NextFunction } from "express";
import { authenticate, type AuthenticatedRequest } from "../middleware/auth";
import { createError } from "../middleware/error-handler";
import { logger } from "../lib/logger";
import { z } from "zod";
import prisma from "../lib/prisma";
import { sendNotification } from "../lib/notifications";

const router: ReturnType<typeof Router> = Router();

// ============================================================================
// Validation Schemas
// ============================================================================

const listConversationsSchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
  includeArchived: z.coerce.boolean().optional().default(false),
});

const startConversationSchema = z.object({
  recipientId: z.string().uuid(),
  bookingId: z.string().uuid().optional(),
  initialMessage: z.string().min(1).max(2000).optional(),
});

const sendMessageSchema = z.object({
  content: z.string().min(1).max(2000),
});

const listMessagesSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  before: z.string().datetime().optional(), // Cursor for pagination
});

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get or create a conversation between two users.
 * Ensures participant1Id < participant2Id for consistent unique constraint.
 */
async function getOrCreateConversation(
  userId1: string,
  userId2: string,
  bookingId?: string
) {
  // Sort IDs to ensure consistent ordering for unique constraint
  const [participant1Id, participant2Id] = [userId1, userId2].sort();

  // Try to find existing conversation
  let conversation = await prisma.conversation.findUnique({
    where: {
      participant1Id_participant2Id: {
        participant1Id,
        participant2Id,
      },
    },
  });

  if (!conversation) {
    // Create new conversation
    conversation = await prisma.conversation.create({
      data: {
        participant1Id,
        participant2Id,
        bookingId,
      },
    });

    logger.info("New conversation created", {
      conversationId: conversation.id,
      participant1Id,
      participant2Id,
      bookingId,
    });
  }

  return conversation;
}

/**
 * Determine if user is participant1 or participant2
 */
function getParticipantPosition(
  conversation: { participant1Id: string; participant2Id: string },
  userId: string
): 1 | 2 | null {
  if (conversation.participant1Id === userId) return 1;
  if (conversation.participant2Id === userId) return 2;
  return null;
}

/**
 * Get the other participant's ID
 */
function getOtherParticipantId(
  conversation: { participant1Id: string; participant2Id: string },
  userId: string
): string | null {
  if (conversation.participant1Id === userId) return conversation.participant2Id;
  if (conversation.participant2Id === userId) return conversation.participant1Id;
  return null;
}

// ============================================================================
// GET /api/v1/conversations
// List user's conversations
// ============================================================================

router.get(
  "/",
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId!;
      const input = listConversationsSchema.parse(req.query);

      // Build where clause - user must be a participant
      const baseWhere = {
        OR: [
          { participant1Id: userId },
          { participant2Id: userId },
        ],
        isActive: true,
      };

      // Add archive filter
      const archiveFilter = input.includeArchived
        ? {}
        : {
            AND: [
              {
                OR: [
                  { participant1Id: userId, participant1ArchivedAt: null },
                  { participant2Id: userId, participant2ArchivedAt: null },
                ],
              },
            ],
          };

      const where = { ...baseWhere, ...archiveFilter };

      const [conversations, total] = await Promise.all([
        prisma.conversation.findMany({
          where,
          orderBy: { lastMessageAt: "desc" },
          take: input.limit,
          skip: input.offset,
        }),
        prisma.conversation.count({ where }),
      ]);

      // Fetch participant details for each conversation
      const participantIds = new Set<string>();
      conversations.forEach((c) => {
        participantIds.add(c.participant1Id);
        participantIds.add(c.participant2Id);
      });

      const participants = await prisma.user.findMany({
        where: { id: { in: Array.from(participantIds) } },
        select: {
          id: true,
          displayName: true,
          avatarUrl: true,
          stylistProfile: {
            select: { specialties: true },
          },
        },
      });

      const participantMap = new Map(participants.map((p) => [p.id, p]));

      // Transform to response format
      const conversationList = conversations.map((conv) => {
        const position = getParticipantPosition(conv, userId);
        const otherUserId = getOtherParticipantId(conv, userId);
        const otherUser = otherUserId ? participantMap.get(otherUserId) : null;
        const unreadCount =
          position === 1
            ? conv.participant1UnreadCount
            : conv.participant2UnreadCount;

        return {
          id: conv.id,
          lastMessageAt: conv.lastMessageAt,
          lastMessagePreview: conv.lastMessagePreview,
          unreadCount,
          bookingId: conv.bookingId,
          participant: otherUser
            ? {
                id: otherUser.id,
                displayName: otherUser.displayName,
                avatarUrl: otherUser.avatarUrl,
                specialties: otherUser.stylistProfile?.specialties || [],
              }
            : null,
          createdAt: conv.createdAt,
        };
      });

      return res.json({
        conversations: conversationList,
        total,
        hasMore: input.offset + conversations.length < total,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(createError("VALIDATION_ERROR", { details: error.errors }));
      }
      logger.error("Error fetching conversations", { error });
      return next(createError("INTERNAL_ERROR"));
    }
  }
);

// ============================================================================
// POST /api/v1/conversations
// Start or get existing conversation
// ============================================================================

router.post(
  "/",
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId!;
      const input = startConversationSchema.parse(req.body);

      // Can't message yourself
      if (input.recipientId === userId) {
        return next(
          createError("VALIDATION_ERROR", {
            message: "Cannot start a conversation with yourself",
          })
        );
      }

      // Check recipient exists
      const recipient = await prisma.user.findUnique({
        where: { id: input.recipientId },
        select: {
          id: true,
          displayName: true,
          avatarUrl: true,
        },
      });

      if (!recipient) {
        return next(createError("USER_NOT_FOUND", { message: "Recipient not found" }));
      }

      // Verify booking exists if provided
      if (input.bookingId) {
        const booking = await prisma.booking.findUnique({
          where: { id: input.bookingId },
          select: { customerId: true, stylistId: true },
        });

        if (!booking) {
          return next(createError("NOT_FOUND", { message: "Booking not found" }));
        }

        // User must be a party to the booking
        if (booking.customerId !== userId && booking.stylistId !== userId) {
          return next(
            createError("FORBIDDEN", { message: "You are not a party to this booking" })
          );
        }
      }

      // Get or create conversation
      const conversation = await getOrCreateConversation(
        userId,
        input.recipientId,
        input.bookingId
      );

      // If initial message provided, send it
      let initialMessage = null;
      if (input.initialMessage) {
        initialMessage = await prisma.message.create({
          data: {
            conversationId: conversation.id,
            senderId: userId,
            content: input.initialMessage,
          },
        });

        // Update conversation metadata
        const otherPosition = getParticipantPosition(conversation, input.recipientId);
        await prisma.conversation.update({
          where: { id: conversation.id },
          data: {
            lastMessageAt: new Date(),
            lastMessagePreview: input.initialMessage.slice(0, 100),
            ...(otherPosition === 1
              ? { participant1UnreadCount: { increment: 1 } }
              : { participant2UnreadCount: { increment: 1 } }),
          },
        });

        // Send notification to recipient
        const sender = await prisma.user.findUnique({
          where: { id: userId },
          select: { displayName: true },
        });

        await sendNotification({
          userId: input.recipientId,
          type: "MESSAGE_RECEIVED",
          channels: ["IN_APP"],
          metadata: {
            conversationId: conversation.id,
            senderName: sender?.displayName || "Someone",
            messagePreview: input.initialMessage.slice(0, 50),
            deepLink: `/messages/${conversation.id}`,
          },
        }).catch((err) => {
          logger.warn("Failed to send message notification", { error: err });
        });
      }

      logger.info("Conversation started/retrieved", {
        conversationId: conversation.id,
        userId,
        recipientId: input.recipientId,
        hasInitialMessage: !!input.initialMessage,
      });

      return res.status(201).json({
        conversation: {
          id: conversation.id,
          bookingId: conversation.bookingId,
          participant: {
            id: recipient.id,
            displayName: recipient.displayName,
            avatarUrl: recipient.avatarUrl,
          },
          createdAt: conversation.createdAt,
        },
        initialMessage: initialMessage
          ? {
              id: initialMessage.id,
              content: initialMessage.content,
              createdAt: initialMessage.createdAt,
            }
          : null,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(createError("VALIDATION_ERROR", { details: error.errors }));
      }
      logger.error("Error starting conversation", { error });
      return next(createError("INTERNAL_ERROR"));
    }
  }
);

// ============================================================================
// GET /api/v1/conversations/:id
// Get conversation details with messages
// ============================================================================

router.get(
  "/:id",
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId!;
      const { id } = req.params;
      const input = listMessagesSchema.parse(req.query);

      // Fetch conversation
      const conversation = await prisma.conversation.findUnique({
        where: { id },
      });

      if (!conversation) {
        return next(createError("NOT_FOUND", { message: "Conversation not found" }));
      }

      // Check user is a participant
      const position = getParticipantPosition(conversation, userId);
      if (!position) {
        return next(
          createError("FORBIDDEN", { message: "You are not part of this conversation" })
        );
      }

      // Fetch messages
      const messagesWhere = {
        conversationId: id,
        deletedAt: null,
        ...(input.before ? { createdAt: { lt: new Date(input.before) } } : {}),
      };

      const messages = await prisma.message.findMany({
        where: messagesWhere,
        orderBy: { createdAt: "desc" },
        take: input.limit,
      });

      // Fetch other participant details
      const otherUserId = getOtherParticipantId(conversation, userId);
      const otherUser = otherUserId
        ? await prisma.user.findUnique({
            where: { id: otherUserId },
            select: {
              id: true,
              displayName: true,
              avatarUrl: true,
              stylistProfile: {
                select: { specialties: true, bio: true },
              },
            },
          })
        : null;

      // Mark messages as read (ones sent by other user)
      if (messages.length > 0) {
        await prisma.message.updateMany({
          where: {
            conversationId: id,
            senderId: { not: userId },
            readAt: null,
          },
          data: { readAt: new Date() },
        });

        // Reset unread count for this user
        await prisma.conversation.update({
          where: { id },
          data:
            position === 1
              ? { participant1UnreadCount: 0 }
              : { participant2UnreadCount: 0 },
        });
      }

      return res.json({
        conversation: {
          id: conversation.id,
          bookingId: conversation.bookingId,
          participant: otherUser
            ? {
                id: otherUser.id,
                displayName: otherUser.displayName,
                avatarUrl: otherUser.avatarUrl,
                specialties: otherUser.stylistProfile?.specialties || [],
                bio: otherUser.stylistProfile?.bio,
              }
            : null,
          createdAt: conversation.createdAt,
        },
        messages: messages.map((m) => ({
          id: m.id,
          content: m.content,
          senderId: m.senderId,
          isOwn: m.senderId === userId,
          readAt: m.readAt,
          createdAt: m.createdAt,
        })),
        hasMore: messages.length === input.limit,
        cursor: messages.length > 0 ? messages[messages.length - 1].createdAt.toISOString() : null,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(createError("VALIDATION_ERROR", { details: error.errors }));
      }
      logger.error("Error fetching conversation", { error });
      return next(createError("INTERNAL_ERROR"));
    }
  }
);

// ============================================================================
// POST /api/v1/conversations/:id/messages
// Send a message
// ============================================================================

router.post(
  "/:id/messages",
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId!;
      const { id } = req.params;
      const input = sendMessageSchema.parse(req.body);

      // Fetch conversation
      const conversation = await prisma.conversation.findUnique({
        where: { id },
      });

      if (!conversation) {
        return next(createError("NOT_FOUND", { message: "Conversation not found" }));
      }

      // Check user is a participant
      const position = getParticipantPosition(conversation, userId);
      if (!position) {
        return next(
          createError("FORBIDDEN", { message: "You are not part of this conversation" })
        );
      }

      // Create message
      const message = await prisma.message.create({
        data: {
          conversationId: id,
          senderId: userId,
          content: input.content,
        },
      });

      // Update conversation metadata
      const otherPosition = position === 1 ? 2 : 1;
      await prisma.conversation.update({
        where: { id },
        data: {
          lastMessageAt: new Date(),
          lastMessagePreview: input.content.slice(0, 100),
          ...(otherPosition === 1
            ? { participant1UnreadCount: { increment: 1 } }
            : { participant2UnreadCount: { increment: 1 } }),
        },
      });

      // Send notification to other participant
      const otherUserId = getOtherParticipantId(conversation, userId);
      if (otherUserId) {
        const sender = await prisma.user.findUnique({
          where: { id: userId },
          select: { displayName: true },
        });

        await sendNotification({
          userId: otherUserId,
          type: "MESSAGE_RECEIVED",
          channels: ["IN_APP"],
          metadata: {
            conversationId: id,
            senderName: sender?.displayName || "Someone",
            messagePreview: input.content.slice(0, 50),
            deepLink: `/messages/${id}`,
          },
        }).catch((err) => {
          logger.warn("Failed to send message notification", { error: err });
        });
      }

      logger.info("Message sent", {
        conversationId: id,
        messageId: message.id,
        senderId: userId,
      });

      return res.status(201).json({
        message: {
          id: message.id,
          content: message.content,
          senderId: message.senderId,
          isOwn: true,
          createdAt: message.createdAt,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(createError("VALIDATION_ERROR", { details: error.errors }));
      }
      logger.error("Error sending message", { error });
      return next(createError("INTERNAL_ERROR"));
    }
  }
);

// ============================================================================
// POST /api/v1/conversations/:id/read
// Mark all messages in conversation as read
// ============================================================================

router.post(
  "/:id/read",
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId!;
      const { id } = req.params;

      // Fetch conversation
      const conversation = await prisma.conversation.findUnique({
        where: { id },
      });

      if (!conversation) {
        return next(createError("NOT_FOUND", { message: "Conversation not found" }));
      }

      // Check user is a participant
      const position = getParticipantPosition(conversation, userId);
      if (!position) {
        return next(
          createError("FORBIDDEN", { message: "You are not part of this conversation" })
        );
      }

      // Mark all unread messages from other user as read
      const result = await prisma.message.updateMany({
        where: {
          conversationId: id,
          senderId: { not: userId },
          readAt: null,
        },
        data: { readAt: new Date() },
      });

      // Reset unread count
      await prisma.conversation.update({
        where: { id },
        data:
          position === 1
            ? { participant1UnreadCount: 0 }
            : { participant2UnreadCount: 0 },
      });

      logger.info("Messages marked as read", {
        conversationId: id,
        userId,
        count: result.count,
      });

      return res.json({ success: true, markedCount: result.count });
    } catch (error) {
      logger.error("Error marking messages as read", { error });
      return next(createError("INTERNAL_ERROR"));
    }
  }
);

// ============================================================================
// POST /api/v1/conversations/:id/archive
// Archive a conversation (hide from list)
// ============================================================================

router.post(
  "/:id/archive",
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId!;
      const { id } = req.params;

      const conversation = await prisma.conversation.findUnique({
        where: { id },
      });

      if (!conversation) {
        return next(createError("NOT_FOUND", { message: "Conversation not found" }));
      }

      const position = getParticipantPosition(conversation, userId);
      if (!position) {
        return next(
          createError("FORBIDDEN", { message: "You are not part of this conversation" })
        );
      }

      await prisma.conversation.update({
        where: { id },
        data:
          position === 1
            ? { participant1ArchivedAt: new Date() }
            : { participant2ArchivedAt: new Date() },
      });

      logger.info("Conversation archived", { conversationId: id, userId });

      return res.json({ success: true });
    } catch (error) {
      logger.error("Error archiving conversation", { error });
      return next(createError("INTERNAL_ERROR"));
    }
  }
);

// ============================================================================
// DELETE /api/v1/conversations/:id/archive
// Unarchive a conversation
// ============================================================================

router.delete(
  "/:id/archive",
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId!;
      const { id } = req.params;

      const conversation = await prisma.conversation.findUnique({
        where: { id },
      });

      if (!conversation) {
        return next(createError("NOT_FOUND", { message: "Conversation not found" }));
      }

      const position = getParticipantPosition(conversation, userId);
      if (!position) {
        return next(
          createError("FORBIDDEN", { message: "You are not part of this conversation" })
        );
      }

      await prisma.conversation.update({
        where: { id },
        data:
          position === 1
            ? { participant1ArchivedAt: null }
            : { participant2ArchivedAt: null },
      });

      logger.info("Conversation unarchived", { conversationId: id, userId });

      return res.json({ success: true });
    } catch (error) {
      logger.error("Error unarchiving conversation", { error });
      return next(createError("INTERNAL_ERROR"));
    }
  }
);

// ============================================================================
// GET /api/v1/conversations/unread-count
// Get total unread message count across all conversations
// ============================================================================

router.get(
  "/unread-count",
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId!;

      // Sum unread counts where user is participant1
      const asParticipant1 = await prisma.conversation.aggregate({
        where: {
          participant1Id: userId,
          isActive: true,
          participant1ArchivedAt: null,
        },
        _sum: { participant1UnreadCount: true },
      });

      // Sum unread counts where user is participant2
      const asParticipant2 = await prisma.conversation.aggregate({
        where: {
          participant2Id: userId,
          isActive: true,
          participant2ArchivedAt: null,
        },
        _sum: { participant2UnreadCount: true },
      });

      const totalUnread =
        (asParticipant1._sum.participant1UnreadCount || 0) +
        (asParticipant2._sum.participant2UnreadCount || 0);

      return res.json({ unreadCount: totalUnread });
    } catch (error) {
      logger.error("Error fetching unread count", { error });
      return next(createError("INTERNAL_ERROR"));
    }
  }
);

export default router;
