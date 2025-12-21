# Feature Spec – Direct Messaging (V6.7.0)

## 1. Summary

Direct messaging enables customers and stylists to communicate within the app without exchanging personal contact information. Messages can be standalone (free-form from stylist profile) or linked to specific bookings for contextual discussions.

**Design Principle**: Messaging is a supporting feature, not a primary navigation element. Users access it through contextual entry points (stylist profiles, booking pages) rather than a dedicated tab.

## 2. User Stories

### Customer Stories
- As a customer, I want to message a stylist before booking to ask questions about their services.
- As a customer, I want to discuss booking details with my stylist in the app.
- As a customer, I want to see when my messages have been read.
- As a customer, I want to receive notifications when I get new messages.

### Stylist Stories
- As a stylist, I want to communicate with potential customers to build trust before booking.
- As a stylist, I want to message customers about upcoming appointments.
- As a stylist, I want to quickly see unread messages in my notification bell.
- As a stylist, I want to archive old conversations to keep my inbox clean.

## 3. Scope

### In Scope (MVP - V6.7.0)
- Text-only messaging (no images, files, or voice)
- Free-form conversations from stylist profiles
- Booking-linked conversations
- Unread counts and read receipts
- Push/in-app/SMS notifications for new messages
- Message list and thread views
- Archive/unarchive functionality
- Mobile and web support

### Out of Scope (Future)
- Image/file sharing
- Voice messages
- Video chat
- Typing indicators
- Message search
- Block/report functionality
- Message reactions/emoji
- Group conversations

## 4. UX Overview

### Entry Points (Not in Main Navigation)

**From Stylist Profile:**
- "Message" button next to "Book Now"
- Opens/creates conversation, navigates to thread

**From Booking Details:**
- "Message Stylist" button in stylist section
- Creates booking-linked conversation
- Shows booking context in thread header

**From Notifications:**
- MESSAGE_RECEIVED notification links to conversation
- Unread badge on notification bell

### Message List (`/messages`)

```
┌─────────────────────────────────────────┐
│  Messages                               │
├─────────────────────────────────────────┤
│ [All] [Unread •2]                       │
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │ (T)  Thandi Mbeki         2m   [>] │ │
│ │  •   Hi! I wanted to confirm...    │ │
│ │      [Booking]                     │ │
│ └─────────────────────────────────────┘ │
│ ┌─────────────────────────────────────┐ │
│ │ (P)  Precious Dlamini     1d   [>] │ │
│ │      Thank you for the styling!    │ │
│ └─────────────────────────────────────┘ │
│ ┌─────────────────────────────────────┐ │
│ │ (Z)  Zanele Nkosi         2d   [>] │ │
│ │      See you on Friday!            │ │
│ │      [Booking]                     │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

**Components:**
- Participant avatar (initials or image)
- Display name
- Last message preview (truncated)
- Time ago indicator
- Booking badge (if linked)
- Unread indicator (dot + bold text)

### Conversation Thread (`/messages/[id]`)

```
┌─────────────────────────────────────────┐
│  [<] (T) Thandi Mbeki        [📅]      │
│      Braids, Locs                       │
├─────────────────────────────────────────┤
│                                         │
│              [ Today ]                  │
│                                         │
│         ┌─────────────────────────┐     │
│         │ Hi! I saw your profile │     │
│         │ and would love to book │     │
│         │ an appointment.        │     │
│         │              2:30 PM ✓ │     │
│         └─────────────────────────┘     │
│                                         │
│ ┌─────────────────────────────────┐     │
│ │ Hello! Thank you for reaching  │     │
│ │ out. I would be happy to help. │     │
│ │ What style are you interested? │     │
│ │ 2:35 PM                        │     │
│ └─────────────────────────────────┘     │
│                                         │
├─────────────────────────────────────────┤
│ [ Type a message...          ] [Send]   │
└─────────────────────────────────────────┘
```

**Components:**
- Header with participant info (links to profile)
- Calendar button if booking linked
- Date separators (Today, Yesterday, or full date)
- Message bubbles (own = rose, other = gray)
- Timestamp and read indicator
- Text input with send button

### States

**Loading:**
- Skeleton loader for conversation list
- Spinner in thread during message send

**Empty:**
- "No messages yet" with CTA to find stylists
- "All caught up!" in unread filter

**Error:**
- Retry button with friendly error message

## 5. Data & APIs

### Database Models

**Conversation**
```prisma
model Conversation {
  id                     String    @id @default(uuid())
  participant1Id         String
  participant2Id         String
  bookingId              String?
  lastMessageAt          DateTime?
  lastMessagePreview     String?   @db.VarChar(100)
  participant1UnreadCount Int      @default(0)
  participant2UnreadCount Int      @default(0)
  participant1ArchivedAt DateTime?
  participant2ArchivedAt DateTime?
  isActive               Boolean   @default(true)
  createdAt              DateTime  @default(now())
  updatedAt              DateTime  @updatedAt
  messages               Message[]

  @@unique([participant1Id, participant2Id])
  @@index([participant1Id, lastMessageAt])
  @@index([participant2Id, lastMessageAt])
}
```

**Message**
```prisma
model Message {
  id             String       @id @default(uuid())
  conversationId String
  senderId       String
  content        String       @db.Text
  readAt         DateTime?
  deletedAt      DateTime?
  deletedBy      String?
  createdAt      DateTime     @default(now())
  conversation   Conversation @relation(...)

  @@index([conversationId, createdAt])
}
```

### API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/conversations` | List user's conversations |
| POST | `/api/v1/conversations` | Start or get conversation |
| GET | `/api/v1/conversations/:id` | Get conversation with messages |
| POST | `/api/v1/conversations/:id/messages` | Send message |
| POST | `/api/v1/conversations/:id/read` | Mark as read |
| POST | `/api/v1/conversations/:id/archive` | Archive conversation |
| DELETE | `/api/v1/conversations/:id/archive` | Unarchive conversation |
| GET | `/api/v1/conversations/unread-count` | Get total unread count |

### Notification Integration

**Type:** `MESSAGE_RECEIVED`

**Metadata:**
- `conversationId`: Link to conversation
- `senderName`: For notification text
- `messagePreview`: First 50 chars of message

**Channels:**
- In-app notification (links to thread)
- SMS for offline users
- Push notification (mobile, future)

## 6. Component Architecture

### Web (`apps/web`)

```
app/(main)/messages/
├── page.tsx              # Conversations list
└── [id]/
    └── page.tsx          # Conversation thread

lib/
├── messages-client.ts    # API client

hooks/
└── use-messages.ts       # React Query hooks

components/stylists/
└── stylist-profile.tsx   # Message button

components/bookings/
└── booking-details.tsx   # Message Stylist button
```

### Mobile (`apps/mobile`)

```
app/messages/
├── _layout.tsx           # Stack navigator
├── index.tsx             # Conversations list
└── [id].tsx              # Conversation thread

src/api/
├── client.ts             # Base API client
├── messages.ts           # Messages API
└── index.ts

src/stores/
├── messages.ts           # Zustand store
└── index.ts
```

## 7. Implementation Checklist

### Backend
- [x] Prisma models (Conversation, Message)
- [x] REST API routes with Zod validation
- [x] Notification templates (MESSAGE_RECEIVED)
- [x] Index optimization for queries

### Web Frontend
- [x] API client with types
- [x] React Query hooks with optimistic updates
- [x] Messages list page with tabs
- [x] Conversation thread page
- [x] Message button on stylist profile
- [x] Message button on booking details

### Mobile Frontend
- [x] API client with SecureStore auth
- [x] Zustand store for state management
- [x] Messages list screen
- [x] Conversation thread screen
- [ ] Push notification handling (future)

## 8. Security Considerations

- Only conversation participants can access messages
- Participant IDs sorted before unique constraint check (prevents duplicates)
- Soft delete preserves message history for disputes
- Rate limiting on send endpoint
- Message content sanitized (no HTML/scripts)
- Auth token required for all endpoints

## 9. Performance Considerations

- Messages loaded with pagination (50 per request)
- Optimistic updates for immediate feedback
- Unread counts cached per-participant (no aggregation queries)
- Indexes on (conversationId, createdAt) for efficient queries
- Mark as read batched to reduce API calls

## 10. Future Enhancements

1. **Real-time Updates**: SSE or WebSocket for live message delivery
2. **Image Sharing**: Photo attachments for style references
3. **Typing Indicators**: Show when other party is typing
4. **Message Search**: Full-text search across conversations
5. **Block/Report**: Safety features for abuse prevention
6. **Read Receipts Toggle**: User preference for privacy
