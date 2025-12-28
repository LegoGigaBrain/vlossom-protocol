/**
 * Conversation Thread Page (V6.7.0)
 *
 * View and send messages in a conversation.
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useConversation, useSendMessage, useMarkAsRead } from "@/hooks/use-messages";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/icons";
import { cn } from "@/lib/utils";
import { format, isToday, isYesterday, isSameDay } from "date-fns";

export default function ConversationPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params.id as string;
  const { user } = useAuth();

  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { data, isLoading, error } = useConversation(conversationId);
  const sendMessage = useSendMessage(conversationId);
  const markAsRead = useMarkAsRead(conversationId);

  // Mark as read on mount
  useEffect(() => {
    if (data && data.messages.some((m) => !m.isOwn && !m.readAt)) {
      markAsRead.mutate();
    }
  }, [data]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (data?.messages) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [data?.messages]);

  // Handle send message
  const handleSend = async () => {
    const content = newMessage.trim();
    if (!content || sendMessage.isPending) return;

    setNewMessage("");
    try {
      await sendMessage.mutateAsync(content);
    } catch (error) {
      // Restore message on error
      setNewMessage(content);
    }
  };

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Format time for display
  const formatMessageTime = (date: Date) => {
    return format(date, "h:mm a");
  };

  // Format date header
  const formatDateHeader = (date: Date) => {
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    return format(date, "EEEE, MMMM d");
  };

  // Group messages by date
  const groupedMessages = data?.messages
    ? [...data.messages].reverse().reduce(
        (groups, message) => {
          const date = new Date(message.createdAt);
          const dateKey = format(date, "yyyy-MM-dd");

          if (!groups[dateKey]) {
            groups[dateKey] = {
              date,
              messages: [],
            };
          }
          groups[dateKey].messages.push(message);
          return groups;
        },
        {} as Record<string, { date: Date; messages: typeof data.messages }>
      )
    : {};

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="flex-shrink-0 bg-background-primary border-b border-border-default px-4 py-3 safe-top">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/messages")}
            className="p-2 -ml-2 rounded-lg hover:bg-background-tertiary transition-colors"
          >
            <Icon name="chevronLeft" size="md" className="text-text-primary" />
          </button>

          {isLoading ? (
            <div className="flex items-center gap-3 flex-1">
              <Skeleton className="w-10 h-10 rounded-full" />
              <Skeleton className="h-5 w-32" />
            </div>
          ) : data?.conversation.participant ? (
            <div
              className="flex items-center gap-3 flex-1 cursor-pointer"
              onClick={() =>
                data.conversation.participant &&
                router.push(`/stylists/${data.conversation.participant.id}`)
              }
            >
              {data.conversation.participant.avatarUrl ? (
                <img
                  src={data.conversation.participant.avatarUrl}
                  alt={data.conversation.participant.displayName}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-rose to-brand-purple flex items-center justify-center">
                  <span className="text-sm font-semibold text-white">
                    {data.conversation.participant.displayName.charAt(0)}
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h1 className="font-semibold text-text-primary truncate">
                  {data.conversation.participant.displayName}
                </h1>
                {data.conversation.participant.specialties &&
                  data.conversation.participant.specialties.length > 0 && (
                    <p className="text-xs text-text-muted truncate">
                      {(data.conversation.participant.specialties as string[])
                        .slice(0, 2)
                        .join(", ")}
                    </p>
                  )}
              </div>
            </div>
          ) : (
            <span className="text-text-secondary">Unknown User</span>
          )}

          {data?.conversation.bookingId && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/bookings/${data.conversation.bookingId}`)}
            >
              <Icon name="calendar" size="sm" className="mr-1" />
              Booking
            </Button>
          )}
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-status-error/10 flex items-center justify-center">
              <Icon name="calmError" size="md" className="text-status-error" />
            </div>
            <p className="text-text-secondary mb-3">Failed to load conversation</p>
            <Button variant="secondary" size="sm" onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={cn("flex", i % 2 === 0 ? "justify-end" : "justify-start")}
              >
                <Skeleton
                  className={cn("h-16 rounded-2xl", i % 2 === 0 ? "w-2/3" : "w-1/2")}
                />
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && data?.messages.length === 0 && (
          <div className="text-center py-12">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-brand-rose/10 flex items-center justify-center">
              <Icon name="notifications" size="md" className="text-brand-rose" />
            </div>
            <p className="text-text-secondary">
              No messages yet. Start the conversation!
            </p>
          </div>
        )}

        {/* Messages */}
        {!isLoading &&
          !error &&
          Object.entries(groupedMessages).map(([dateKey, group]) => (
            <div key={dateKey} className="mb-4">
              {/* Date Header */}
              <div className="flex items-center justify-center my-4">
                <span className="text-xs text-text-muted bg-background-tertiary px-3 py-1 rounded-full">
                  {formatDateHeader(group.date)}
                </span>
              </div>

              {/* Messages for this date */}
              <div className="space-y-2">
                {group.messages.map((message, index) => {
                  const isOwn = message.isOwn;
                  const showAvatar =
                    !isOwn &&
                    (index === 0 ||
                      group.messages[index - 1]?.isOwn !== message.isOwn);

                  return (
                    <div
                      key={message.id}
                      className={cn("flex items-end gap-2", isOwn ? "justify-end" : "justify-start")}
                    >
                      {/* Avatar (for received messages) */}
                      {!isOwn && (
                        <div className="w-8 flex-shrink-0">
                          {showAvatar && data?.conversation.participant?.avatarUrl ? (
                            <img
                              src={data.conversation.participant.avatarUrl}
                              alt=""
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : showAvatar ? (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-rose to-brand-purple flex items-center justify-center">
                              <span className="text-xs font-semibold text-white">
                                {data?.conversation.participant?.displayName?.charAt(0) || "?"}
                              </span>
                            </div>
                          ) : null}
                        </div>
                      )}

                      {/* Message Bubble */}
                      <div
                        className={cn(
                          "max-w-[75%] px-4 py-2.5 rounded-2xl",
                          isOwn
                            ? "bg-brand-rose text-white rounded-br-md"
                            : "bg-background-tertiary text-text-primary rounded-bl-md"
                        )}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {message.content}
                        </p>
                        <div
                          className={cn(
                            "flex items-center gap-1 mt-1",
                            isOwn ? "justify-end" : "justify-start"
                          )}
                        >
                          <span
                            className={cn(
                              "text-xs",
                              isOwn ? "text-white/70" : "text-text-muted"
                            )}
                          >
                            {formatMessageTime(new Date(message.createdAt))}
                          </span>
                          {isOwn && message.readAt && (
                            <Icon
                              name="check"
                              size="sm"
                              className="text-white/70"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 bg-background-primary border-t border-border-default p-4 safe-bottom">
        <div className="flex items-end gap-3">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              rows={1}
              className={cn(
                "w-full px-4 py-3 rounded-2xl resize-none",
                "bg-background-tertiary text-text-primary placeholder:text-text-muted",
                "border border-transparent focus:border-brand-rose focus:outline-none",
                "transition-colors",
                "max-h-32"
              )}
              style={{
                minHeight: "48px",
                height: "auto",
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = "auto";
                target.style.height = Math.min(target.scrollHeight, 128) + "px";
              }}
            />
          </div>
          <Button
            variant="primary"
            size="icon"
            onClick={handleSend}
            disabled={!newMessage.trim() || sendMessage.isPending}
            className="flex-shrink-0 w-12 h-12 rounded-full"
          >
            {sendMessage.isPending ? (
              <Icon name="timer" size="md" className="animate-spin" />
            ) : (
              <Icon name="chevronRight" size="md" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
