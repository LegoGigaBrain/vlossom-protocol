"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Icon } from "@/components/icons";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { StarRating } from "./star-rating";
import { toast } from "../../hooks/use-toast";

const reviewSchema = z.object({
  rating: z.number().min(1, "Please select a rating").max(5),
  comment: z
    .string()
    .max(500, "Comment must be less than 500 characters")
    .optional(),
});

type ReviewFormData = z.infer<typeof reviewSchema>;

interface ReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string;
  stylistName: string;
  serviceName?: string;
  onSuccess?: () => void;
}

export function ReviewDialog({
  open,
  onOpenChange,
  bookingId,
  stylistName,
  serviceName,
  onSuccess,
}: ReviewDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    setValue,
    watch,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: 0,
      comment: "",
    },
  });

  const rating = watch("rating");
  const comment = watch("comment") || "";

  const ratingLabels = [
    "",
    "Poor",
    "Fair",
    "Good",
    "Very Good",
    "Excellent",
  ];

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  const onSubmit = async (data: ReviewFormData) => {
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("vlossom_token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/reviews`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            bookingId,
            rating: data.rating,
            comment: data.comment || undefined,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to submit review");
      }

      toast.success(
        "Review submitted",
        "Thank you for your feedback!"
      );
      onSuccess?.();
      handleClose();
    } catch (error) {
      toast.error(
        "Review failed",
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
          <div className="flex items-center justify-between p-4 border-b border-border-default">
            <Dialog.Title className="text-lg font-semibold text-text-primary">
              Leave a Review
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
            {/* Service Info */}
            <div className="text-center">
              <p className="text-sm text-text-secondary">
                How was your experience with
              </p>
              <p className="text-lg font-medium text-text-primary">
                {stylistName}
              </p>
              {serviceName && (
                <p className="text-sm text-text-muted mt-1">{serviceName}</p>
              )}
            </div>

            {/* Rating */}
            <div className="space-y-3">
              <div className="flex justify-center">
                <StarRating
                  value={rating}
                  onChange={(value) => setValue("rating", value)}
                  size="lg"
                />
              </div>
              {rating > 0 && (
                <p className="text-center text-sm font-medium text-brand-rose">
                  {ratingLabels[rating]}
                </p>
              )}
              {errors.rating && (
                <p className="text-center text-sm text-status-error">
                  {errors.rating.message}
                </p>
              )}
            </div>

            {/* Comment */}
            <div className="space-y-2">
              <label
                htmlFor="comment"
                className="block text-sm font-medium text-text-primary"
              >
                Share your experience{" "}
                <span className="text-text-muted">(optional)</span>
              </label>
              <Textarea
                id="comment"
                placeholder="Tell others about your experience..."
                value={comment}
                onChange={(e) => setValue("comment", e.target.value)}
                rows={4}
                maxLength={500}
              />
              <div className="flex justify-between text-xs text-text-muted">
                <span>
                  {errors.comment?.message}
                </span>
                <span>{comment.length}/500</span>
              </div>
            </div>

            {/* Tips */}
            <div className="bg-background-tertiary rounded-lg p-3">
              <p className="text-xs font-medium text-text-secondary mb-2">
                Tips for a helpful review:
              </p>
              <ul className="text-xs text-text-muted space-y-1">
                <li>• Be specific about what you liked or didn&apos;t like</li>
                <li>• Mention the quality of service and professionalism</li>
                <li>• Share if you&apos;d recommend this stylist to others</li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="flex-1"
              >
                Skip
              </Button>
              <Button
                type="submit"
                className="flex-1"
                loading={isSubmitting}
                disabled={rating === 0}
              >
                Submit Review
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
