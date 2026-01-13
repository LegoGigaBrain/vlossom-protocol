"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { NotificationItem, type Notification } from "../../components/notifications/notification-item";
import { Button } from "../../components/ui/button";
import { Skeleton } from "../../components/ui/skeleton";
import { EmptyState } from "../../components/ui/empty-state";
import { ErrorState } from "../../components/ui/error-state";
import { useAuth } from "../../hooks/use-auth";
import { Icon } from "@/components/icons";
import { authFetch } from "../../lib/auth-client";

const ITEMS_PER_PAGE = 10;

/**
 * V8.0.0: Migrated to httpOnly cookie auth
 */
export default function NotificationsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: ITEMS_PER_PAGE.toString(),
        ...(filter === "unread" && { unreadOnly: "true" }),
      });

      const response = await authFetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/notifications?${params}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch notifications");
      }

      const data = await response.json();
      setNotifications(data.notifications || []);
      setTotalPages(Math.ceil((data.total || 0) / ITEMS_PER_PAGE) || 1);
    } catch (err) {
      setError("Failed to load notifications. Please try again.");
      console.error("Failed to fetch notifications:", err);
    } finally {
      setIsLoading(false);
    }
  }, [user, page, filter]);

  useEffect(() => {
    fetchNotifications();
  }, [user, page, filter, fetchNotifications]);

  // Mark all as read
  const handleMarkAllRead = async () => {
    setIsMarkingAll(true);
    try {
      const response = await authFetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/notifications/read-all`,
        { method: "POST" }
      );

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, isRead: true }))
        );
      }
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    } finally {
      setIsMarkingAll(false);
    }
  };

  // Mark single notification as read
  const handleMarkRead = async (id: string) => {
    try {
      await authFetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/notifications/${id}/read`,
        { method: "POST" }
      );

      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const hasUnread = notifications.some((n) => !n.isRead);

  if (authLoading) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-8">
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex gap-3 p-4 bg-background-secondary rounded-card">
              <Skeleton className="w-10 h-10 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-brand-rose/10 flex items-center justify-center">
            <Icon name="notifications" size="sm" className="text-brand-rose" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Notifications</h1>
            <p className="text-sm text-text-secondary">
              Stay updated on your bookings and activity
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {hasUnread && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllRead}
              disabled={isMarkingAll}
              className="text-brand-rose"
            >
              <Icon name="check" size="sm" className="mr-1" />
              Mark all read
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/settings/notifications")}
          >
            <Icon name="settings" size="sm" />
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => {
            setFilter("all");
            setPage(1);
          }}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-gentle ${
            filter === "all"
              ? "bg-brand-rose text-white"
              : "bg-background-tertiary text-text-secondary hover:bg-background-secondary"
          }`}
        >
          All
        </button>
        <button
          onClick={() => {
            setFilter("unread");
            setPage(1);
          }}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-gentle ${
            filter === "unread"
              ? "bg-brand-rose text-white"
              : "bg-background-tertiary text-text-secondary hover:bg-background-secondary"
          }`}
        >
          Unread
        </button>
      </div>

      {/* Content */}
      {error ? (
        <ErrorState
          type="generic"
          title="Failed to load notifications"
          description={error}
          onRetry={fetchNotifications}
        />
      ) : isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex gap-3 p-4 bg-background-secondary rounded-card">
              <Skeleton className="w-10 h-10 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-1/4" />
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState
          illustration="inbox"
          title={filter === "unread" ? "No unread notifications" : "No notifications yet"}
          description={
            filter === "unread"
              ? "You're all caught up! Check back later for new updates."
              : "When you book services or receive updates, they'll appear here."
          }
          action={
            filter === "unread"
              ? {
                  label: "View all notifications",
                  onClick: () => setFilter("all"),
                }
              : undefined
          }
        />
      ) : (
        <>
          {/* Notification List */}
          <div className="bg-background-secondary rounded-card divide-y divide-border-default overflow-hidden">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkRead={handleMarkRead}
                showFullMessage
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-border-default">
              <p className="text-sm text-text-secondary">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <Icon name="chevronLeft" size="sm" className="mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                  <Icon name="chevronRight" size="sm" className="ml-1" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
