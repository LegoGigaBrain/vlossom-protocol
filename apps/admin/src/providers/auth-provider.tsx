/**
 * Auth Provider for Admin Panel (V7.0.0)
 *
 * Provides authentication context for admin users.
 */

"use client";

import { ReactNode } from "react";
import { AdminAuthProvider } from "../hooks/use-admin-auth";

export function AuthProvider({ children }: { children: ReactNode }) {
  return <AdminAuthProvider>{children}</AdminAuthProvider>;
}
