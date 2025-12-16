"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "../../lib/utils";
import { NotificationBell } from "../notifications/notification-bell";
import { Button } from "../ui/button";
import { ChevronLeft, User } from "lucide-react";

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  backHref?: string;
  showNotifications?: boolean;
  showProfile?: boolean;
  rightAction?: React.ReactNode;
  className?: string;
}

export function AppHeader({
  title,
  subtitle,
  showBack = false,
  backHref,
  showNotifications = true,
  showProfile = false,
  rightAction,
  className,
}: AppHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (backHref) {
      router.push(backHref);
    } else {
      router.back();
    }
  };

  return (
    <header
      className={cn(
        "border-b border-border-default bg-background-primary/80 sticky top-0 z-10 backdrop-blur-sm",
        className
      )}
    >
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Left side */}
          <div className="flex items-center gap-3">
            {showBack && (
              <button
                onClick={handleBack}
                className="p-2 -ml-2 rounded-full hover:bg-background-tertiary transition-gentle"
                aria-label="Go back"
              >
                <ChevronLeft className="w-5 h-5 text-text-secondary" />
              </button>
            )}
            <div>
              <h1 className="text-2xl font-display font-bold text-text-primary">
                {title}
              </h1>
              {subtitle && (
                <p className="text-sm text-text-secondary mt-0.5">{subtitle}</p>
              )}
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {showNotifications && <NotificationBell />}
            {showProfile && (
              <Link href="/profile">
                <Button variant="ghost" size="sm" aria-label="Profile">
                  <User className="w-5 h-5" />
                </Button>
              </Link>
            )}
            {rightAction}
          </div>
        </div>
      </div>
    </header>
  );
}
