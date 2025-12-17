/**
 * Live Updates Hook
 * V5.0: Phase 4 - Server-Sent Events for real-time booking updates
 *
 * Features:
 * - SSE connection management
 * - Automatic reconnection with exponential backoff
 * - Event-based updates for session progress
 * - Connection state management
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { getAuthToken } from "../lib/auth-client";

type LiveUpdateEventType =
  | "connected"
  | "progress"
  | "arrived"
  | "session_ended"
  | "status_changed"
  | "error";

interface SessionProgress {
  bookingId: string;
  etaMinutes?: number;
  progressPercent?: number;
  currentStep?: string;
  lat?: number;
  lng?: number;
  lastUpdate: string;
}

interface LiveUpdateEvent {
  type: LiveUpdateEventType;
  data: Record<string, unknown>;
  timestamp: Date;
}

interface LiveUpdatesOptions {
  /** Booking ID to subscribe to */
  bookingId: string;
  /** Callback when a live update is received */
  onUpdate?: (event: LiveUpdateEvent) => void;
  /** Callback when session progress updates */
  onProgress?: (progress: SessionProgress) => void;
  /** Callback when stylist arrives */
  onArrived?: () => void;
  /** Callback when session ends */
  onSessionEnded?: () => void;
  /** Callback when connection state changes */
  onConnectionChange?: (connected: boolean) => void;
  /** Max reconnection attempts (default: 5) */
  maxReconnectAttempts?: number;
  /** Auto-connect on mount (default: true) */
  autoConnect?: boolean;
}

interface LiveUpdatesState {
  /** Whether connected to SSE stream */
  isConnected: boolean;
  /** Whether currently reconnecting */
  isReconnecting: boolean;
  /** Number of reconnection attempts */
  reconnectAttempts: number;
  /** Last error message */
  error: string | null;
  /** Last received event */
  lastEvent: LiveUpdateEvent | null;
  /** Current session progress */
  sessionProgress: SessionProgress | null;
}

interface LiveUpdatesReturn extends LiveUpdatesState {
  /** Connect to SSE stream */
  connect: () => void;
  /** Disconnect from SSE stream */
  disconnect: () => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

export function useLiveUpdates(options: LiveUpdatesOptions): LiveUpdatesReturn {
  const {
    bookingId,
    onUpdate,
    onProgress,
    onArrived,
    onSessionEnded,
    onConnectionChange,
    maxReconnectAttempts = 5,
    autoConnect = true,
  } = options;

  const [token, setToken] = useState<string | null>(null);

  // Get token on mount
  useEffect(() => {
    setToken(getAuthToken());
  }, []);

  const [state, setState] = useState<LiveUpdatesState>({
    isConnected: false,
    isReconnecting: false,
    reconnectAttempts: 0,
    error: null,
    lastEvent: null,
    sessionProgress: null,
  });

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Parse incoming SSE event
   */
  const parseEvent = useCallback(
    (eventType: string, data: string): void => {
      try {
        const parsedData = JSON.parse(data);

        const event: LiveUpdateEvent = {
          type: eventType as LiveUpdateEventType,
          data: parsedData,
          timestamp: new Date(),
        };

        setState((prev) => ({
          ...prev,
          lastEvent: event,
        }));

        onUpdate?.(event);

        // Handle specific event types
        switch (eventType) {
          case "progress":
            setState((prev) => ({
              ...prev,
              sessionProgress: parsedData as SessionProgress,
            }));
            onProgress?.(parsedData as SessionProgress);
            break;

          case "arrived":
            onArrived?.();
            break;

          case "session_ended":
            setState((prev) => ({
              ...prev,
              sessionProgress: null,
            }));
            onSessionEnded?.();
            break;

          case "connected":
            // Initial connection established
            break;
        }
      } catch (error) {
        console.error("Error parsing SSE event:", error);
      }
    },
    [onUpdate, onProgress, onArrived, onSessionEnded]
  );

  /**
   * Connect to SSE stream
   */
  const connect = useCallback(() => {
    if (!token || !bookingId || eventSourceRef.current) {
      return;
    }

    // Clear any pending reconnect
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    try {
      // Note: EventSource doesn't support custom headers natively
      // We use query param for auth (server should validate)
      const url = `${API_URL}/api/v1/bookings/${bookingId}/live?token=${encodeURIComponent(token)}`;

      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        setState((prev) => ({
          ...prev,
          isConnected: true,
          isReconnecting: false,
          reconnectAttempts: 0,
          error: null,
        }));
        onConnectionChange?.(true);
      };

      eventSource.onerror = () => {
        setState((prev) => ({
          ...prev,
          isConnected: false,
          error: "Connection lost",
        }));
        onConnectionChange?.(false);

        // Close and attempt reconnect
        eventSource.close();
        eventSourceRef.current = null;

        // Attempt reconnection with exponential backoff
        setState((prev) => {
          if (prev.reconnectAttempts < maxReconnectAttempts) {
            const delay = Math.min(1000 * Math.pow(2, prev.reconnectAttempts), 30000);

            reconnectTimeoutRef.current = setTimeout(() => {
              setState((p) => ({
                ...p,
                isReconnecting: true,
                reconnectAttempts: p.reconnectAttempts + 1,
              }));
              connect();
            }, delay);
          }

          return {
            ...prev,
            isReconnecting: prev.reconnectAttempts < maxReconnectAttempts,
          };
        });
      };

      // Listen for specific event types
      eventSource.addEventListener("connected", (e) => {
        parseEvent("connected", e.data);
      });

      eventSource.addEventListener("progress", (e) => {
        parseEvent("progress", e.data);
      });

      eventSource.addEventListener("arrived", (e) => {
        parseEvent("arrived", e.data);
      });

      eventSource.addEventListener("session_ended", (e) => {
        parseEvent("session_ended", e.data);
      });

      eventSource.addEventListener("status_changed", (e) => {
        parseEvent("status_changed", e.data);
      });
    } catch (error) {
      console.error("Error connecting to SSE:", error);
      setState((prev) => ({
        ...prev,
        error: "Failed to connect",
      }));
    }
  }, [token, bookingId, maxReconnectAttempts, onConnectionChange, parseEvent]);

  /**
   * Disconnect from SSE stream
   */
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    setState((prev) => ({
      ...prev,
      isConnected: false,
      isReconnecting: false,
      reconnectAttempts: 0,
    }));

    onConnectionChange?.(false);
  }, [onConnectionChange]);

  // Auto-connect on mount if enabled
  useEffect(() => {
    if (autoConnect && token && bookingId) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, token, bookingId, connect, disconnect]);

  return {
    ...state,
    connect,
    disconnect,
  };
}

/**
 * Hook to fetch active session progress (polling fallback)
 */
export function useSessionProgress(bookingId: string | null) {
  const [token, setToken] = useState<string | null>(null);
  const [progress, setProgress] = useState<SessionProgress | null>(null);

  // Get token on mount
  useEffect(() => {
    setToken(getAuthToken());
  }, []);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProgress = useCallback(async () => {
    if (!token || !bookingId) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_URL}/api/v1/bookings/${bookingId}/session/progress`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch session progress");
      }

      const data = await response.json();

      if (data.hasActiveSession && data.progress) {
        setProgress(data.progress);
      } else {
        setProgress(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [token, bookingId]);

  // Initial fetch
  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  return {
    progress,
    isLoading,
    error,
    refetch: fetchProgress,
  };
}
