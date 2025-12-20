/**
 * Session Card Component (V7.0.0)
 *
 * Card showing active session progress and details.
 */

"use client";

import type { ActiveSession } from "../../lib/sessions-client";

interface SessionCardProps {
  session: ActiveSession;
  onClick: () => void;
}

export function SessionCard({ session, onClick }: SessionCardProps) {
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTimeRemaining = () => {
    if (!session.estimatedEndTime) return "Unknown";

    const remaining = new Date(session.estimatedEndTime).getTime() - Date.now();
    if (remaining <= 0) return "Overtime";

    const minutes = Math.floor(remaining / 60000);
    if (minutes < 60) return `${minutes}m remaining`;

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m remaining`;
  };

  const progress = session.progress || 0;
  const isOvertime = progress >= 100;

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white rounded-lg border border-gray-200 p-4 hover:border-purple-300 hover:shadow-sm transition-all"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs text-gray-500 font-mono">
            {session.id.slice(0, 8)}
          </p>
          <p className="text-sm font-medium text-gray-900 mt-1">
            {session.service?.name || "Service"}
          </p>
        </div>
        <span
          className={`px-2 py-1 text-xs font-medium rounded ${
            isOvertime
              ? "bg-red-100 text-red-700"
              : progress > 75
                ? "bg-amber-100 text-amber-700"
                : "bg-green-100 text-green-700"
          }`}
        >
          {isOvertime ? "Overtime" : `${progress}%`}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
        <div
          className={`h-full transition-all duration-500 ${
            isOvertime
              ? "bg-red-500"
              : progress > 75
                ? "bg-amber-500"
                : "bg-green-500"
          }`}
          style={{ width: `${Math.min(100, progress)}%` }}
        />
      </div>

      {/* Customer and Stylist */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 text-xs font-medium">
            {session.customer.displayName?.[0]?.toUpperCase() ||
              session.customer.email[0].toUpperCase()}
          </div>
          <span className="text-sm text-gray-700 truncate max-w-[80px]">
            {session.customer.displayName || session.customer.email.split("@")[0]}
          </span>
        </div>
        <span className="text-gray-300">→</span>
        {session.stylist ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700 truncate max-w-[80px]">
              {session.stylist.displayName || session.stylist.email.split("@")[0]}
            </span>
            <div className="h-7 w-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-medium">
              {session.stylist.displayName?.[0]?.toUpperCase() ||
                session.stylist.email[0].toUpperCase()}
            </div>
          </div>
        ) : (
          <span className="text-sm text-gray-400">No stylist</span>
        )}
      </div>

      {/* Time info */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>
          {formatTime(session.scheduledStartTime)} - {formatTime(session.scheduledEndTime)}
        </span>
        <span className={isOvertime ? "text-red-600 font-medium" : ""}>
          {getTimeRemaining()}
        </span>
      </div>
    </button>
  );
}
