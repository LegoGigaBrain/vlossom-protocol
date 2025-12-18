"use client";

import { useState, useEffect } from "react";
import { Icon } from "@/components/icons";
import { cn } from "../../lib/utils";
import { NotificationDropdown } from "./notification-dropdown";
import { useAuth } from "../../hooks/use-auth";

interface NotificationBellProps {
  className?: string;
}

export function NotificationBell({ className }: NotificationBellProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch unread count
  const fetchUnreadCount = async () => {
    if (!user) return;

    try {
      const token = localStorage.getItem("vlossom_token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/notifications/unread-count`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.count || 0);
      }
    } catch (error) {
      console.error("Failed to fetch unread count:", error);
    }
  };

  // Fetch on mount and periodically
  useEffect(() => {
    fetchUnreadCount();

    // Poll every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [user]);

  if (!user) return null;

  return (
    <div className={cn("relative", className)}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative p-2 rounded-full transition-gentle",
          "hover:bg-background-tertiary",
          "focus:outline-none focus:ring-2 focus:ring-brand-rose focus:ring-offset-2",
          isOpen && "bg-background-tertiary"
        )}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Icon name="notifications" size="md" className="text-text-secondary" />

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-xs font-medium text-white bg-brand-rose rounded-full">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-dropdown"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Dropdown Content */}
          <NotificationDropdown
            onClose={() => setIsOpen(false)}
            onMarkAllRead={() => setUnreadCount(0)}
          />
        </>
      )}
    </div>
  );
}
