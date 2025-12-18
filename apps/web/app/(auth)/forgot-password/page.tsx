"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Icon } from "@/components/icons";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordForm) => {
    setIsLoading(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/forgot-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: data.email }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to send reset email");
      }

      setSubmittedEmail(data.email);
      setIsSubmitted(true);
    } catch (err) {
      // Even on error, show success to prevent email enumeration
      setSubmittedEmail(data.email);
      setIsSubmitted(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Success state
  if (isSubmitted) {
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
                Check your email
              </h1>
              <p className="text-sm text-text-secondary">
                If an account exists for{" "}
                <span className="font-medium text-text-primary">
                  {submittedEmail}
                </span>
                , we&apos;ve sent password reset instructions.
              </p>
            </div>

            {/* Info */}
            <div className="bg-background-tertiary rounded-lg p-4 text-left">
              <p className="text-sm text-text-secondary">
                <strong className="text-text-primary">Didn&apos;t receive the email?</strong>
                <br />
                Check your spam folder, or make sure you entered the correct email address.
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setIsSubmitted(false);
                  setSubmittedEmail("");
                }}
              >
                Try a different email
              </Button>
              <Link href="/login" className="block">
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
          <h1 className="text-h1 text-brand-rose">Forgot password?</h1>
          <p className="text-body text-text-secondary">
            Enter your email and we&apos;ll send you a reset link
          </p>
        </div>

        {/* Form */}
        <div className="bg-background-primary rounded-card shadow-card p-8 space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <div className="relative">
                <Icon name="email" size="md" className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  className="pl-10"
                  {...register("email")}
                  aria-invalid={errors.email ? "true" : "false"}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-status-error">{errors.email.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <Button type="submit" className="w-full" loading={isLoading}>
              Send reset link
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
