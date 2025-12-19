"use client";

import { useState } from "react";
import Image from "next/image";
import * as Dialog from "@radix-ui/react-dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Icon } from "@/components/icons";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { toast } from "../../hooks/use-toast";

const issueCategories = [
  { value: "no_show", label: "Stylist didn't show up" },
  { value: "late", label: "Stylist was significantly late" },
  { value: "quality", label: "Service quality issue" },
  { value: "unprofessional", label: "Unprofessional behavior" },
  { value: "safety", label: "Safety concern" },
  { value: "other", label: "Other issue" },
] as const;

const issueSchema = z.object({
  category: z.string().min(1, "Please select a category"),
  description: z
    .string()
    .min(20, "Please provide at least 20 characters")
    .max(1000, "Description must be less than 1000 characters"),
});

type IssueFormData = z.infer<typeof issueSchema>;

interface ReportIssueDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string;
  stylistName: string;
  onSuccess?: () => void;
  onEscalate?: () => void;
}

export function ReportIssueDialog({
  open,
  onOpenChange,
  bookingId,
  stylistName,
  onSuccess,
  onEscalate,
}: ReportIssueDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<IssueFormData>({
    resolver: zodResolver(issueSchema),
    defaultValues: {
      category: "",
      description: "",
    },
  });

  const selectedCategory = watch("category");
  const description = watch("description") || "";

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + images.length > 3) {
      toast.error("Too many images", "You can upload up to 3 images");
      return;
    }

    const validFiles = files.filter((file) => {
      if (!file.type.startsWith("image/")) {
        toast.error("Invalid file", "Please select image files only");
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File too large", "Images must be under 5MB");
        return false;
      }
      return true;
    });

    setImages((prev) => [...prev, ...validFiles]);

    // Generate previews
    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreviews((prev) => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClose = () => {
    reset();
    setImages([]);
    setImagePreviews([]);
    onOpenChange(false);
  };

  const onSubmit = async (data: IssueFormData) => {
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("vlossom_token");
      const formData = new FormData();
      formData.append("bookingId", bookingId);
      formData.append("category", data.category);
      formData.append("description", data.description);
      images.forEach((image) => {
        formData.append("images", image);
      });

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/issues`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to report issue");
      }

      toast.success(
        "Issue reported",
        "We'll review your report and get back to you within 24 hours."
      );

      onSuccess?.();
      handleClose();
    } catch (error) {
      toast.error(
        "Report failed",
        error instanceof Error ? error.message : "Please try again"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50 animate-fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-background-primary rounded-card shadow-elevated z-50 animate-slide-up max-h-[85vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border-default sticky top-0 bg-background-primary">
            <div className="flex items-center gap-2">
              <Icon name="calmError" size="sm" className="text-status-warning" />
              <Dialog.Title className="text-lg font-semibold text-text-primary">
                Report an Issue
              </Dialog.Title>
            </div>
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
            {/* Context */}
            <div className="bg-background-tertiary rounded-lg p-3">
              <p className="text-sm text-text-secondary">
                Reporting an issue with your booking with{" "}
                <span className="font-medium text-text-primary">
                  {stylistName}
                </span>
              </p>
            </div>

            {/* Category Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-text-primary">
                What went wrong?
              </label>
              <div className="grid grid-cols-2 gap-2">
                {issueCategories.map((category) => (
                  <button
                    key={category.value}
                    type="button"
                    onClick={() => setValue("category", category.value)}
                    className={cn(
                      "p-3 rounded-lg text-sm text-left transition-gentle",
                      selectedCategory === category.value
                        ? "bg-status-warning/10 border-2 border-status-warning text-text-primary"
                        : "bg-background-tertiary text-text-secondary hover:bg-background-secondary border-2 border-transparent"
                    )}
                  >
                    {category.label}
                  </button>
                ))}
              </div>
              {errors.category && (
                <p className="text-sm text-status-error">
                  {errors.category.message}
                </p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label
                htmlFor="description"
                className="block text-sm font-medium text-text-primary"
              >
                Describe what happened
              </label>
              <Textarea
                id="description"
                placeholder="Please provide details about the issue..."
                {...register("description")}
                rows={4}
                maxLength={1000}
              />
              <div className="flex justify-between text-xs">
                <span className="text-status-error">
                  {errors.description?.message}
                </span>
                <span className="text-text-muted">{description.length}/1000</span>
              </div>
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-text-primary">
                Add photos <span className="text-text-muted">(optional)</span>
              </label>

              <div className="flex gap-2 flex-wrap">
                {/* Preview images */}
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative w-20 h-20">
                    <Image
                      src={preview}
                      alt={`Upload ${index + 1}`}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-status-error text-white rounded-full flex items-center justify-center"
                    >
                      <Icon name="close" size="xs" />
                    </button>
                  </div>
                ))}

                {/* Upload button */}
                {images.length < 3 && (
                  <label className="w-20 h-20 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border-default cursor-pointer hover:border-brand-rose hover:bg-brand-rose/5 transition-gentle">
                    <Icon name="upload" size="sm" className="text-text-muted" />
                    <span className="text-xs text-text-muted mt-1">Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
              <p className="text-xs text-text-muted">Up to 3 images, max 5MB each</p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" loading={isSubmitting} className="flex-1">
                Submit Report
              </Button>
            </div>

            {/* Escalation Option */}
            {onEscalate && (
              <div className="pt-4 border-t border-border-default text-center">
                <p className="text-sm text-text-secondary mb-2">
                  Need immediate help?
                </p>
                <button
                  type="button"
                  onClick={onEscalate}
                  className="text-sm text-brand-rose hover:text-brand-clay transition-gentle"
                >
                  Escalate to Vlossom Support
                </button>
              </div>
            )}
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
