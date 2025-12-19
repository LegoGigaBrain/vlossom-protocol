/**
 * Messages Page (V6.7.0)
 *
 * List of user's conversations with preview and unread indicators.
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useConversations } from "@/hooks/use-messages";
import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/icons";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

type FilterTab = "all" | "unread";

export default function MessagesPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  const { data, isLoading, error } = useConversations();

  // Filter conversations based on tab
  const filteredConversations = data?.conversations.filter((conv) => {
    if (activeTab === "unread") {
      return conv.unreadCount > 0;
    }
    return true;
  });

  const handleConversationClick = (conversationId: string) => {
    router.push(`/messages/${conversationId}`);
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      <AppHeader title="Messages" showNotifications />

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          {(["all", "unread"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-4 py-2 rounded-lg font-medium capitalize transition-colors",
                activeTab === tab
                  ? "bg-primary text-white"
                  : "bg-surface text-text-secondary hover:bg-secondary"
              )}
            >
              {tab}
              {tab === "unread" &&
                data?.conversations.filter((c) => c.unreadCount > 0).length ? (
                <span className="ml-2 px-1.5 py-0.5 text-xs bg-white/20 rounded-full">
                  {data.conversations.filter((c) => c.unreadCount > 0).length}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-status-error/10 flex items-center justify-center">
              <Icon name="calmError" size="lg" className="text-status-error" />
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              Something went wrong
            </h3>
            <p className="text-text-secondary mb-4">
              {error instanceof Error ? error.message : "Failed to load messages"}
            </p>
            <Button variant="secondary" onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3 p-4 bg-surface rounded-xl">
                <Skeleton className="w-12 h-12 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && filteredConversations?.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-brand-rose/10 flex items-center justify-center">
              <Icon name="notifications" size="lg" className="text-brand-rose" />
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              {activeTab === "unread" ? "All caught up!" : "No messages yet"}
            </h3>
            <p className="text-text-secondary mb-4">
              {activeTab === "unread"
                ? "You have no unread messages."
                : "Start a conversation by messaging a stylist."}
            </p>
            {activeTab === "all" && (
              <Button variant="primary" onClick={() => router.push("/stylists")}>
                Find Stylists
              </Button>
            )}
          </div>
        )}

        {/* Conversations List */}
        {!isLoading && !error && filteredConversations && filteredConversations.length > 0 && (
          <div className="space-y-2">
            {filteredConversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => handleConversationClick(conversation.id)}
                className={cn(
                  "w-full flex items-center gap-3 p-4 rounded-xl transition-colors text-left",
                  conversation.unreadCount > 0
                    ? "bg-brand-rose/5 hover:bg-brand-rose/10"
                    : "bg-surface hover:bg-secondary"
                )}
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  {conversation.participant?.avatarUrl ? (
                    <img
                      src={conversation.participant.avatarUrl}
                      alt={conversation.participant.displayName}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-rose to-brand-purple flex items-center justify-center">
                      <span className="text-lg font-semibold text-white">
                        {conversation.participant?.displayName?.charAt(0) || "?"}
                      </span>
                    </div>
                  )}
                  {conversation.unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-brand-rose text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {conversation.unreadCount > 9 ? "9+" : conversation.unreadCount}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span
                      className={cn(
                        "font-medium truncate",
                        conversation.unreadCount > 0
                          ? "text-text-primary"
                          : "text-text-secondary"
                      )}
                    >
                      {conversation.participant?.displayName || "Unknown"}
                    </span>
                    {conversation.bookingId && (
                      <Badge variant="secondary" className="text-xs flex-shrink-0">
                        Booking
                      </Badge>
                    )}
                  </div>
                  <p
                    className={cn(
                      "text-sm truncate",
                      conversation.unreadCount > 0
                        ? "text-text-primary font-medium"
                        : "text-text-muted"
                    )}
                  >
                    {conversation.lastMessagePreview || "No messages yet"}
                  </p>
                </div>

                {/* Time */}
                <div className="flex-shrink-0 text-right">
                  {conversation.lastMessageAt && (
                    <span className="text-xs text-text-muted">
                      {formatDistanceToNow(new Date(conversation.lastMessageAt), {
                        addSuffix: false,
                      })}
                    </span>
                  )}
                </div>

                <Icon name="chevronRight" size="sm" className="text-text-muted flex-shrink-0" />
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
