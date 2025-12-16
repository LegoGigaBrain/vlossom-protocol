"use client";

import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { cn } from "../../lib/utils";
import {
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Wallet,
  Star,
  AlertTriangle,
  Bell,
  User,
} from "lucide-react";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  data?: {
    bookingId?: string;
    stylistId?: string;
    amount?: string;
    [key: string]: unknown;
  };
}

type NotificationType =
  | "BOOKING_REQUEST"
  | "BOOKING_CONFIRMED"
  | "BOOKING_CANCELLED"
  | "BOOKING_REMINDER"
  | "PAYMENT_RECEIVED"
  | "PAYMENT_SENT"
  | "REVIEW_RECEIVED"
  | "SYSTEM"
  | "GENERAL";

interface NotificationItemProps {
  notification: Notification;
  onMarkRead: (id: string) => void;
  onClick?: () => void;
  showFullMessage?: boolean;
}

const typeConfig: Record<
  NotificationType,
  { icon: typeof Bell; color: string; bgColor: string }
> = {
  BOOKING_REQUEST: {
    icon: Calendar,
    color: "text-status-info",
    bgColor: "bg-status-info/10",
  },
  BOOKING_CONFIRMED: {
    icon: CheckCircle,
    color: "text-status-success",
    bgColor: "bg-status-success/10",
  },
  BOOKING_CANCELLED: {
    icon: XCircle,
    color: "text-status-error",
    bgColor: "bg-status-error/10",
  },
  BOOKING_REMINDER: {
    icon: Clock,
    color: "text-status-warning",
    bgColor: "bg-status-warning/10",
  },
  PAYMENT_RECEIVED: {
    icon: Wallet,
    color: "text-status-success",
    bgColor: "bg-status-success/10",
  },
  PAYMENT_SENT: {
    icon: Wallet,
    color: "text-brand-rose",
    bgColor: "bg-brand-rose/10",
  },
  REVIEW_RECEIVED: {
    icon: Star,
    color: "text-status-warning",
    bgColor: "bg-status-warning/10",
  },
  SYSTEM: {
    icon: AlertTriangle,
    color: "text-status-info",
    bgColor: "bg-status-info/10",
  },
  GENERAL: {
    icon: Bell,
    color: "text-text-secondary",
    bgColor: "bg-background-tertiary",
  },
};

function getNotificationLink(notification: Notification): string | null {
  const { type, data } = notification;

  switch (type) {
    case "BOOKING_REQUEST":
    case "BOOKING_CONFIRMED":
    case "BOOKING_CANCELLED":
    case "BOOKING_REMINDER":
      return data?.bookingId ? `/bookings/${data.bookingId}` : null;
    case "REVIEW_RECEIVED":
      return "/profile";
    case "PAYMENT_RECEIVED":
    case "PAYMENT_SENT":
      return "/wallet";
    default:
      return null;
  }
}

export function NotificationItem({
  notification,
  onMarkRead,
  onClick,
  showFullMessage = false,
}: NotificationItemProps) {
  const config = typeConfig[notification.type] || typeConfig.GENERAL;
  const Icon = config.icon;
  const link = getNotificationLink(notification);

  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
    addSuffix: true,
  });

  const handleClick = () => {
    if (!notification.isRead) {
      onMarkRead(notification.id);
    }
    onClick?.();
  };

  const content = (
    <div
      className={cn(
        "flex gap-3 p-4 transition-gentle",
        !notification.isRead && "bg-brand-rose/5",
        link && "hover:bg-background-tertiary cursor-pointer"
      )}
      onClick={handleClick}
    >
      {/* Icon */}
      <div
        className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
          config.bgColor
        )}
      >
        <Icon className={cn("w-5 h-5", config.color)} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              "text-sm font-medium",
              notification.isRead ? "text-text-secondary" : "text-text-primary"
            )}
          >
            {notification.title}
          </p>
          {!notification.isRead && (
            <span className="w-2 h-2 rounded-full bg-brand-rose shrink-0 mt-1.5" />
          )}
        </div>
        <p
          className={cn(
            "text-sm text-text-secondary mt-0.5",
            !showFullMessage && "line-clamp-2"
          )}
        >
          {notification.message}
        </p>
        <p className="text-xs text-text-muted mt-1">{timeAgo}</p>
      </div>
    </div>
  );

  if (link) {
    return (
      <Link href={link} className="block">
        {content}
      </Link>
    );
  }

  return content;
}
