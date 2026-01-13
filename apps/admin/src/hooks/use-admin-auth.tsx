/**
 * Admin Authentication Hook (V7.0.0)
 *
 * React hook for admin authentication state with role verification.
 * Only allows users with ADMIN role to access the admin panel.
 */

"use client";

import { useEffect, useState, useCallback, createContext, useContext, ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  getCurrentAdmin,
  adminLogin,
  adminLogout,
  AdminUser,
  ApiError,
} from "../lib/admin-client";

export interface AdminAuthState {
  user: AdminUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

export interface AdminAuthActions {
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export type AdminAuthContextValue = AdminAuthState & AdminAuthActions;

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<AdminAuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    error: null,
  });

  const refreshUser = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const user = await getCurrentAdmin();

      if (user) {
        setState({
          user,
          isLoading: false,
          isAuthenticated: true,
          error: null,
        });
      } else {
        setState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
          error: null,
        });
      }
    } catch (err) {
      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        error: err instanceof Error ? err.message : "Authentication failed",
      });
    }
  }, []);

  const login = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const result = await adminLogin(email, password);
        const user = result.user as AdminUser;

        // Verify admin role
        const roles = user.roles || [];
        if (!roles.includes("ADMIN")) {
          setState({
            user: null,
            isLoading: false,
            isAuthenticated: false,
            error: "Access denied. Admin privileges required.",
          });
          return false;
        }

        setState({
          user,
          isLoading: false,
          isAuthenticated: true,
          error: null,
        });

        return true;
      } catch (err) {
        let errorMessage = "Login failed";

        if (err instanceof ApiError) {
          errorMessage = err.message;
        } else if (err instanceof Error) {
          errorMessage = err.message;
        }

        setState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
          error: errorMessage,
        });

        return false;
      }
    },
    []
  );

  const logout = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      await adminLogout();
    } catch {
      // Ignore logout errors
    }

    setState({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      error: null,
    });

    router.push("/login");
  }, [router]);

  // Check auth on mount
  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const value: AdminAuthContextValue = {
    ...state,
    login,
    logout,
    refreshUser,
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth(): AdminAuthContextValue {
  const context = useContext(AdminAuthContext);

  if (!context) {
    throw new Error("useAdminAuth must be used within AdminAuthProvider");
  }

  return context;
}

/**
 * Hook that redirects to login if not authenticated
 * Use this in protected pages
 */
export function useRequireAuth(): AdminAuthState {
  const router = useRouter();
  const auth = useAdminAuth();

  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated) {
      router.push("/login");
    }
  }, [auth.isLoading, auth.isAuthenticated, router]);

  return auth;
}
