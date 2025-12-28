"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import * as Dialog from "@radix-ui/react-dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Icon } from "@/components/icons";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { toast } from "../../hooks/use-toast";

const profileSchema = z.object({
  displayName: z.string().min(2, "Name must be at least 2 characters"),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface ProfileEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentName: string;
  currentAvatarUrl?: string | null;
  onSuccess?: () => void;
}

export function ProfileEditDialog({
  open,
  onOpenChange,
  currentName,
  currentAvatarUrl,
  onSuccess,
}: ProfileEditDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    currentAvatarUrl || null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: currentName,
    },
  });

  const initials = currentName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Invalid file", "Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File too large", "Image must be under 5MB");
      return;
    }

    // Show preview immediately
    const reader = new FileReader();
    reader.onload = (e) => {
      setAvatarPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload
    setIsUploading(true);
    try {
      const token = localStorage.getItem("vlossom_token");
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/upload/avatar`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      toast.success("Photo updated", "Your profile photo has been changed");
    } catch (error) {
      setAvatarPreview(currentAvatarUrl || null);
      toast.error("Upload failed", "Please try again");
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    setIsSubmitting(true);

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
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      toast.success("Profile updated", "Your changes have been saved");
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      toast.error("Update failed", "Please try again");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50 animate-fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-background-primary rounded-card shadow-elevated z-50 animate-slide-up">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border-default">
            <Dialog.Title className="text-lg font-semibold text-text-primary">
              Edit Profile
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                className="p-1 rounded-full hover:bg-background-tertiary transition-gentle"
                aria-label="Close"
              >
                <Icon name="close" size="sm" className="text-text-secondary" />
              </button>
            </Dialog.Close>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-6">
            {/* Avatar */}
            <div className="flex justify-center">
              <div className="relative">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-background-tertiary border-2 border-border-default">
                  {avatarPreview ? (
                    <Image
                      src={avatarPreview}
                      alt="Profile"
                      className="w-full h-full object-cover"
                      width={96}
                      height={96}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl font-semibold text-text-secondary">
                      {initials || <Icon name="profile" size="lg" />}
                    </div>
                  )}
                  {isUploading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full">
                      <Icon name="timer" size="md" className="text-white" />
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-brand-rose text-white flex items-center justify-center hover:bg-brand-clay transition-gentle disabled:opacity-50"
                  aria-label="Change photo"
                >
                  <Icon name="camera" size="sm" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </div>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="displayName">Display name</Label>
              <Input
                id="displayName"
                placeholder="Your name"
                {...register("displayName")}
                aria-invalid={errors.displayName ? "true" : "false"}
              />
              {errors.displayName && (
                <p className="text-sm text-status-error">
                  {errors.displayName.message}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" loading={isSubmitting} className="flex-1">
                Save
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
