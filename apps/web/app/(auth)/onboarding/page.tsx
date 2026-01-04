"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "../../../hooks/use-auth";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { PasswordStrength } from "../../../components/ui/password-strength";
import { VlossomLogo } from "../../../components/ui/vlossom-logo";
import Link from "next/link";
import { validationSchemas, INPUT_LIMITS } from "../../../lib/input-validation";

// V8.0.0: Added max length limits for security
const signupSchema = z.object({
  email: validationSchemas.email,
  password: validationSchemas.password,
  confirmPassword: z.string().max(INPUT_LIMITS.PASSWORD),
  role: z.enum(["CUSTOMER", "STYLIST"]),
  displayName: validationSchemas.displayName.optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type SignupForm = z.infer<typeof signupSchema>;

export default function OnboardingPage() {
  const { signup } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      role: "CUSTOMER",
    },
  });

  const selectedRole = watch("role");
  const passwordValue = watch("password");

  const onSubmit = async (data: SignupForm) => {
    setIsLoading(true);
    setError(null);

    try {
      await signup({
        email: data.email,
        password: data.password,
        role: data.role,
        displayName: data.displayName,
      });
      // Redirect handled by useAuth hook
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed. Please try again.");
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
            <h1 className="text-h1 text-brand-rose">Welcome to Vlossom</h1>
            <p className="text-body text-text-secondary">
              Where you blossom. Create your account to get started.
            </p>
          </div>
        </div>

        {/* Signup Form */}
        <div className="bg-background-primary rounded-card shadow-vlossom p-8 space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Role Selection */}
            <div className="space-y-3">
              <Label>I am a...</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => register("role").onChange({ target: { value: "CUSTOMER" } })}
                  className={`h-11 px-4 rounded-button border-2 transition-gentle ${
                    selectedRole === "CUSTOMER"
                      ? "border-brand-rose bg-brand-rose text-white"
                      : "border-border-default bg-background-primary text-text-primary hover:border-brand-rose"
                  }`}
                >
                  Customer
                </button>
                <button
                  type="button"
                  onClick={() => register("role").onChange({ target: { value: "STYLIST" } })}
                  className={`h-11 px-4 rounded-button border-2 transition-gentle ${
                    selectedRole === "STYLIST"
                      ? "border-brand-rose bg-brand-rose text-white"
                      : "border-border-default bg-background-primary text-text-primary hover:border-brand-rose"
                  }`}
                >
                  Stylist
                </button>
              </div>
              <input type="hidden" {...register("role")} />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                maxLength={INPUT_LIMITS.EMAIL}
                aria-describedby={errors.email ? "email-error" : undefined}
                {...register("email")}
                disabled={isLoading}
              />
              {errors.email && (
                <p id="email-error" className="text-sm text-status-error" role="alert">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Display Name (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="displayName">
                Display name <span className="text-text-tertiary text-sm">(optional)</span>
              </Label>
              <Input
                id="displayName"
                type="text"
                placeholder="How you'd like to be called"
                autoComplete="name"
                maxLength={INPUT_LIMITS.DISPLAY_NAME}
                {...register("displayName")}
                disabled={isLoading}
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="At least 8 characters"
                autoComplete="new-password"
                maxLength={INPUT_LIMITS.PASSWORD}
                aria-describedby={errors.password ? "password-error" : "password-strength"}
                {...register("password")}
                disabled={isLoading}
              />
              <PasswordStrength password={passwordValue || ""} />
              {errors.password && (
                <p id="password-error" className="text-sm text-status-error" role="alert">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Re-enter your password"
                autoComplete="new-password"
                maxLength={INPUT_LIMITS.PASSWORD}
                aria-describedby={errors.confirmPassword ? "confirm-password-error" : undefined}
                {...register("confirmPassword")}
                disabled={isLoading}
              />
              {errors.confirmPassword && (
                <p id="confirm-password-error" className="text-sm text-status-error" role="alert">
                  {errors.confirmPassword.message}
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
              {isLoading ? "Creating your account..." : "Get Started"}
            </Button>
          </form>

          {/* Login Link */}
          <div className="text-center pt-4 border-t border-border-subtle">
            <p className="text-sm text-text-secondary">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-brand-rose hover:text-brand-clay transition-gentle font-medium"
              >
                Log in
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-caption text-text-tertiary">
          By creating an account, you agree to our terms and privacy policy.
        </p>
      </div>
    </div>
  );
}
