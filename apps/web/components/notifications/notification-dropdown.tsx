"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { NotificationItem, type Notification } from "./notification-item";
import { Skeleton } from "../ui/skeleton";
import { EmptyState } from "../ui/empty-state";
import { Icon } from "@/components/icons";
import { authFetch } from "../../lib/auth-client";

interface NotificationDropdownProps {
  onClose: () => void;
  onMarkAllRead: () => void;
}

/**
 * V8.0.0: Migrated to httpOnly cookie auth
 */
export function NotificationDropdown({ onClose, onMarkAllRead }: NotificationDropdownProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  // Fetch recent notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await authFetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/notifications?limit=5`
        );

        if (response.ok) {
          const data = await response.json();
          setNotifications(data.notifications || []);
        }
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  // Mark all as read
  const handleMarkAllRead = async () => {
    setIsMarkingAll(true);
    try {
      const response = await authFetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/notifications/read-all`,
        { method: "POST" }
      );

      if (response.ok) {
        // Update local state
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, isRead: true }))
        );
        onMarkAllRead();
      }
    } catch (error) {
      console.error("Failed to mark all as read:", error);
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

      // Update local state
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const hasUnread = notifications.some((n) => !n.isRead);

  return (
    <div
      className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-background-primary rounded-card border border-border-default shadow-elevated z-dropdown overflow-hidden"
      role="menu"
      aria-label="Notifications"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-default">
        <h3 className="font-semibold text-text-primary">Notifications</h3>
        {hasUnread && (
          <button
            onClick={handleMarkAllRead}
            disabled={isMarkingAll}
            className="text-xs text-brand-rose hover:text-brand-clay transition-gentle flex items-center gap-1 disabled:opacity-50"
          >
            <Icon name="check" size="xs" />
            Mark all read
          </button>
        )}
      </div>

      {/* Content */}
      <div className="max-h-[400px] overflow-y-auto">
        {isLoading ? (
          // Loading skeletons
          <div className="p-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          // Empty state
          <EmptyState
            illustration="inbox"
            title="No notifications"
            description="You're all caught up!"
            size="sm"
            className="py-8"
          />
        ) : (
          // Notification list
          <div className="divide-y divide-border-default">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkRead={handleMarkRead}
                onClick={onClose}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="px-4 py-3 border-t border-border-default bg-background-tertiary/50">
          <Link
            href="/notifications"
            onClick={onClose}
            className="text-sm text-brand-rose hover:text-brand-clay transition-gentle flex items-center justify-center gap-1"
          >
            View all notifications
            <Icon name="chevronRight" size="sm" />
          </Link>
        </div>
      )}
    </div>
  );
}
