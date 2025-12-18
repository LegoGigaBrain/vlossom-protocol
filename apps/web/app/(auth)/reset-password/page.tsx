"use client";

import { useState, useEffect, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { PasswordStrength } from "../../../components/ui/password-strength";
import { toast } from "../../../hooks/use-toast";
import { Icon } from "@/components/icons";

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const password = watch("password", "");

  // Check for token on mount
  useEffect(() => {
    if (!token) {
      setError("Invalid reset link. Please request a new password reset.");
    }
  }, [token]);

  const onSubmit = async (data: ResetPasswordForm) => {
    if (!token) {
      setError("Invalid reset link. Please request a new password reset.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/reset-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token,
            password: data.password,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to reset password");
      }

      setIsSuccess(true);
      toast.success("Password reset successful", "You can now log in with your new password.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to reset password";
      setError(message);
      toast.error("Reset failed", message);
    } finally {
      setIsLoading(false);
    }
  };

  // Success state
  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-secondary px-4">
        <div className="w-full max-w-md space-y-8">
          <div className="bg-background-primary rounded-card shadow-card p-8 text-center space-y-6">
            {/* Success Icon */}
            <div className="w-16 h-16 mx-auto bg-status-success/10 rounded-full flex items-center justify-center">
              <Icon name="success" size="lg" className="text-status-success" />
            </div>

            {/* Message */}
            <div className="space-y-2">
              <h1 className="text-xl font-semibold text-text-primary">
                Password reset successful
              </h1>
              <p className="text-sm text-text-secondary">
                Your password has been updated. You can now log in with your new password.
              </p>
            </div>

            {/* Login Button */}
            <Link href="/login">
              <Button className="w-full">
                Go to login
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Invalid token state
  if (!token || error?.includes("Invalid reset link")) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-secondary px-4">
        <div className="w-full max-w-md space-y-8">
          <div className="bg-background-primary rounded-card shadow-card p-8 text-center space-y-6">
            {/* Error Icon */}
            <div className="w-16 h-16 mx-auto bg-status-error/10 rounded-full flex items-center justify-center">
              <Icon name="error" size="lg" className="text-status-error" />
            </div>

            {/* Message */}
            <div className="space-y-2">
              <h1 className="text-xl font-semibold text-text-primary">
                Invalid or expired link
              </h1>
              <p className="text-sm text-text-secondary">
                This password reset link is invalid or has expired. Please request a new one.
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Link href="/forgot-password">
                <Button className="w-full">
                  Request new reset link
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="ghost" className="w-full">
                  <Icon name="chevronLeft" size="sm" className="mr-2" />
                  Back to login
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Form state
  return (
    <div className="min-h-screen flex items-center justify-center bg-background-secondary px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-h1 text-brand-rose">Reset password</h1>
          <p className="text-body text-text-secondary">
            Enter your new password below
          </p>
        </div>

        {/* Form */}
        <div className="bg-background-primary rounded-card shadow-card p-8 space-y-6">
          {/* Error Message */}
          {error && !error.includes("Invalid reset link") && (
            <div className="bg-status-error/10 border border-status-error/30 rounded-lg p-4 text-sm text-status-error">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* New Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password">New password</Label>
              <div className="relative">
                <Icon name="locked" size="md" className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  className="pl-10 pr-10"
                  {...register("password")}
                  aria-invalid={errors.password ? "true" : "false"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-gentle"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <Icon name="eyeOff" size="md" /> : <Icon name="eye" size="md" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-status-error">{errors.password.message}</p>
              )}
              {/* Password Strength Indicator */}
              {password && <PasswordStrength password={password} />}
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm new password</Label>
              <div className="relative">
                <Icon name="locked" size="md" className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm new password"
                  className="pl-10 pr-10"
                  {...register("confirmPassword")}
                  aria-invalid={errors.confirmPassword ? "true" : "false"}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-gentle"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <Icon name="eyeOff" size="md" /> : <Icon name="eye" size="md" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-status-error">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <Button type="submit" className="w-full" loading={isLoading}>
              Reset password
            </Button>
          </form>

          {/* Back Link */}
          <div className="text-center">
            <Link
              href="/login"
              className="text-sm text-brand-rose hover:text-brand-clay transition-gentle inline-flex items-center gap-1"
            >
              <Icon name="chevronLeft" size="sm" />
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// Wrap with Suspense for useSearchParams
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background-secondary">
        <div className="animate-pulse text-text-secondary">Loading...</div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
