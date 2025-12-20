/**
 * Admin Sessions Dashboard (V7.0.0)
 *
 * Real-time monitoring of active (in-progress) sessions.
 */

"use client";

import { useState } from "react";
import { SessionCard } from "../../../components/sessions/session-card";
import { BookingDetailPanel } from "../../../components/bookings/booking-detail-panel";
import { useActiveSessions, useUpcomingSessions } from "../../../hooks/use-active-sessions";

export default function SessionsPage() {
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  const { data: activeData, isLoading: activeLoading, error: activeError } = useActiveSessions();
  const { data: upcomingData, isLoading: upcomingLoading } = useUpcomingSessions();

  const activeSessions = activeData?.sessions || [];
  const upcomingSessions = upcomingData?.sessions || [];

  const overtimeSessions = activeSessions.filter((s) => (s.progress || 0) >= 100);
  const onTrackSessions = activeSessions.filter((s) => (s.progress || 0) < 100);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Active Sessions</h1>
          <p className="text-gray-500 mt-1">
            Real-time monitoring of in-progress services.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span className="inline-flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          Live updates every 30s
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500">Active Now</p>
              <p className="text-2xl font-semibold text-gray-900">{activeSessions.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500">Running Late</p>
              <p className="text-2xl font-semibold text-gray-900">{overtimeSessions.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500">Starting Soon</p>
              <p className="text-2xl font-semibold text-gray-900">{upcomingSessions.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {activeLoading && (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <div className="animate-spin h-8 w-8 border-2 border-purple-600 border-t-transparent rounded-full mx-auto" />
          <p className="mt-3 text-gray-500">Loading active sessions...</p>
        </div>
      )}

      {/* Error State */}
      {activeError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
          Failed to load active sessions. Please refresh the page.
        </div>
      )}

      {/* Overtime Sessions (Priority) */}
      {overtimeSessions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-red-500" />
            <h2 className="text-lg font-semibold text-gray-900">
              Running Late ({overtimeSessions.length})
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {overtimeSessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                onClick={() => setSelectedSessionId(session.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* On-Track Sessions */}
      {onTrackSessions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            <h2 className="text-lg font-semibold text-gray-900">
              In Progress ({onTrackSessions.length})
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {onTrackSessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                onClick={() => setSelectedSessionId(session.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!activeLoading && activeSessions.length === 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900">No Active Sessions</h3>
          <p className="text-gray-500 mt-1">
            There are no services in progress right now.
          </p>
        </div>
      )}

      {/* Upcoming Sessions */}
      {upcomingSessions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            <h2 className="text-lg font-semibold text-gray-900">
              Starting Soon ({upcomingSessions.length})
            </h2>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
            {upcomingSessions.map((session) => (
              <button
                key={session.id}
                onClick={() => setSelectedSessionId(session.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-medium">
                    {session.customer.displayName?.[0]?.toUpperCase() ||
                      session.customer.email[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {session.service?.name || "Service"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {session.customer.displayName || session.customer.email}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(session.scheduledStartTime).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  <p className="text-xs text-gray-500">
                    Starts in{" "}
                    {Math.round(
                      (new Date(session.scheduledStartTime).getTime() - Date.now()) / 60000
                    )}
                    m
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Session Detail Panel */}
      <BookingDetailPanel
        bookingId={selectedSessionId}
        onClose={() => setSelectedSessionId(null)}
      />
    </div>
  );
}
