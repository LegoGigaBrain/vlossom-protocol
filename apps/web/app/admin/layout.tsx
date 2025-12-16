"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

/**
 * Admin Layout (F5.1)
 * Protects admin routes and provides navigation
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated and has admin role
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/login?redirect=/admin");
          return;
        }

        // Verify admin role (in production, decode JWT or call API)
        const response = await fetch("/api/v1/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          router.push("/login?redirect=/admin");
          return;
        }

        const user = await response.json();
        if (!user.roles?.includes("ADMIN")) {
          router.push("/dashboard");
          return;
        }

        setIsAuthorized(true);
      } catch (error) {
        console.error("Auth check failed:", error);
        router.push("/login?redirect=/admin");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/admin" className="text-xl font-bold text-purple-600">
                  Vlossom Admin
                </Link>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  href="/admin/paymaster"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Paymaster
                </Link>
                <Link
                  href="/admin/users"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Users
                </Link>
                <Link
                  href="/admin/bookings"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Bookings
                </Link>
                <Link
                  href="/admin/disputes"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Disputes
                </Link>
                <Link
                  href="/admin/finance"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Finance
                </Link>
                <Link
                  href="/admin/properties"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Properties
                </Link>
                <Link
                  href="/admin/logs"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Logs
                </Link>
                <Link
                  href="/admin/defi"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  DeFi
                </Link>
              </div>
            </div>
            <div className="flex items-center">
              <Link
                href="/dashboard"
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Back to App
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
