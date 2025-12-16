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

const profileSchema = z.object({
  displayName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email").optional().or(z.literal("")),
  phone: z
    .string()
    .regex(/^\+?[0-9]{10,15}$/, "Please enter a valid phone number")
    .optional()
    .or(z.literal("")),
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
      const token = localStorage.getItem("vlossom_token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/me`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
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
