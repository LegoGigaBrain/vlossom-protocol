/**
 * Authentication hook using React Query
 * Reference: docs/specs/auth/feature-spec.md
 */

"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { getCurrentUser, login as loginApi, signup as signupApi, logout as logoutApi, type SignupRequest, type LoginRequest } from "../lib/auth-client";

export function useAuth() {
  const queryClient = useQueryClient();
  const router = useRouter();

  // Query for current user
  const {
    data: user,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["auth", "currentUser"],
    queryFn: getCurrentUser,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });

  // Sign up function
  const signup = async (data: SignupRequest) => {
    const result = await signupApi(data);

    // Update query cache with new user
    queryClient.setQueryData(["auth", "currentUser"], result.user);

    // Redirect based on role
    if (result.user.role === "STYLIST") {
      router.push("/stylist/dashboard");
    } else {
      router.push("/wallet");
    }

    return result;
  };

  // Login function
  const login = async (data: LoginRequest) => {
    const result = await loginApi(data);

    // Update query cache with user
    queryClient.setQueryData(["auth", "currentUser"], result.user);

    // Redirect based on role
    if (result.user.role === "STYLIST") {
      router.push("/stylist/dashboard");
    } else {
      router.push("/wallet");
    }

    return result;
  };

  // Logout function
  const logout = async () => {
    await logoutApi();

    // Clear query cache
    queryClient.setQueryData(["auth", "currentUser"], null);
    queryClient.clear();

    // Redirect to login
    router.push("/login");
  };

  return {
    user: user ?? null,
    isLoading,
    isAuthenticated: !!user,
    error,
    signup,
    login,
    logout,
    refetch,
  };
}

export type UseAuthReturn = ReturnType<typeof useAuth>;
