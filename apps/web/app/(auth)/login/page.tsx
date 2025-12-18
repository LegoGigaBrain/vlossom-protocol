"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../hooks/use-auth";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { SiweButton, SiweDivider } from "../../../components/auth/siwe-button";
import { VlossomLogo } from "../../../components/ui/vlossom-logo";
import Link from "next/link";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login, refetch } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle successful SIWE authentication
  const handleSiweSuccess = async (isNewUser: boolean) => {
    await refetch();
    if (isNewUser) {
      router.push("/onboarding/complete");
    } else {
      router.push("/");
    }
  };

  // Handle SIWE error
  const handleSiweError = (errorMessage: string) => {
    setError(errorMessage);
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    setError(null);

    try {
      await login({
        email: data.email,
        password: data.password,
      });
      // Redirect handled by useAuth hook
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-secondary px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <VlossomLogo iconSize={48} wordmarkHeight={32} variant="purple" className="justify-center" />
          <div className="space-y-2">
            <h1 className="text-h1 text-brand-rose">Welcome back</h1>
            <p className="text-body text-text-secondary">
              Log in to your Vlossom account
            </p>
          </div>
        </div>

        {/* Login Form */}
        <div className="bg-background-primary rounded-card shadow-vlossom p-8 space-y-6">
          {/* SIWE Button - V3.2 */}
          <div className="space-y-4">
            <SiweButton
              onSuccess={handleSiweSuccess}
              onError={handleSiweError}
              variant="outline"
              className="w-full"
              disabled={isLoading}
            />
          </div>

          <SiweDivider />

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                aria-describedby={errors.email ? "login-email-error" : undefined}
                {...register("email")}
                disabled={isLoading}
              />
              {errors.email && (
                <p id="login-email-error" className="text-sm text-status-error" role="alert">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="/forgot-password"
                  className="text-sm text-brand-rose hover:text-brand-clay transition-gentle"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                autoComplete="current-password"
                aria-describedby={errors.password ? "login-password-error" : undefined}
                {...register("password")}
                disabled={isLoading}
              />
              {errors.password && (
                <p id="login-password-error" className="text-sm text-status-error" role="alert">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 rounded-input bg-status-error/10 border border-status-error">
                <p className="text-sm text-status-error">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Logging in..." : "Log In"}
            </Button>
          </form>

          {/* Signup Link */}
          <div className="text-center pt-4 border-t border-border-subtle">
            <p className="text-sm text-text-secondary">
              New to Vlossom?{" "}
              <Link
                href="/onboarding"
                className="text-brand-rose hover:text-brand-clay transition-gentle font-medium"
              >
                Create an account
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-caption text-text-tertiary">
          V3.2 Beta - Base Sepolia Testnet
        </p>
      </div>
    </div>
  );
}
