"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { toast } from "../../hooks/use-toast";
import { getErrorMessage } from "../../lib/error-utils";
import { authFetch } from "../../lib/auth-client";
import { validationSchemas, INPUT_LIMITS } from "../../lib/input-validation";

// V8.0.0: Added max length limits for security
const profileSchema = z.object({
  displayName: validationSchemas.displayName,
  email: validationSchemas.email.optional().or(z.literal("")),
  phone: validationSchemas.phone.or(z.literal("")),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface ProfileFormProps {
  user: {
    id: string;
    displayName: string;
    email?: string | null;
    phone?: string | null;
  };
  onSuccess?: () => void;
}

export function ProfileForm({ user, onSuccess }: ProfileFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: user.displayName,
      email: user.email || "",
      phone: user.phone || "",
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    setIsLoading(true);

    try {
      // V8.0.0: Uses httpOnly cookie auth via authFetch
      const response = await authFetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/me`,
        {
          method: "PATCH",
          body: JSON.stringify({
            displayName: data.displayName,
            email: data.email || null,
            phone: data.phone || null,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update profile");
      }

      onSuccess?.();
    } catch (error) {
      toast.error("Update failed", getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Display Name */}
      <div className="space-y-2">
        <Label htmlFor="displayName">Display name</Label>
        <Input
          id="displayName"
          placeholder="Your name"
          maxLength={INPUT_LIMITS.DISPLAY_NAME}
          {...register("displayName")}
          aria-invalid={errors.displayName ? "true" : "false"}
        />
        {errors.displayName && (
          <p className="text-sm text-status-error">{errors.displayName.message}</p>
        )}
      </div>

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="email">Email address</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          maxLength={INPUT_LIMITS.EMAIL}
          {...register("email")}
          aria-invalid={errors.email ? "true" : "false"}
        />
        {errors.email && (
          <p className="text-sm text-status-error">{errors.email.message}</p>
        )}
        <p className="text-xs text-text-muted">
          Used for account recovery and notifications
        </p>
      </div>

      {/* Phone */}
      <div className="space-y-2">
        <Label htmlFor="phone">Phone number</Label>
        <Input
          id="phone"
          type="tel"
          placeholder="+27 12 345 6789"
          maxLength={INPUT_LIMITS.PHONE}
          {...register("phone")}
          aria-invalid={errors.phone ? "true" : "false"}
        />
        {errors.phone && (
          <p className="text-sm text-status-error">{errors.phone.message}</p>
        )}
        <p className="text-xs text-text-muted">
          Used for booking confirmations via SMS
        </p>
      </div>

      {/* Submit */}
      <div className="pt-4">
        <Button
          type="submit"
          loading={isLoading}
          disabled={!isDirty || isLoading}
        >
          Save changes
        </Button>
      </div>
    </form>
  );
}
