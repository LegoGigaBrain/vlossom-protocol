"use client";

import { Card, CardContent } from "@/components/ui/card";
import { StarRating } from "./star-rating";
import Image from "next/image";

interface Review {
  id: string;
  reviewerName: string;
  reviewerAvatar?: string | null;
  overallRating: number; // 10-50 scale stored, displayed as 1-5
  comment: string | null;
  createdAt: string;
  reviewType: string;
}

interface ReviewListProps {
  reviews: Review[];
  emptyMessage?: string;
}

export function ReviewList({
  reviews,
  emptyMessage = "No reviews yet",
}: ReviewListProps) {
  if (reviews.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="w-12 h-12 mx-auto mb-4 bg-vlossom-neutral-100 rounded-full flex items-center justify-center">
            <svg
              className="w-6 h-6 text-vlossom-neutral-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <p className="text-vlossom-neutral-500">{emptyMessage}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <Card key={review.id}>
          <CardContent className="pt-4">
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="w-10 h-10 bg-vlossom-neutral-200 rounded-full flex items-center justify-center text-vlossom-neutral-500 font-medium shrink-0">
                {review.reviewerAvatar ? (
                  <Image
                    src={review.reviewerAvatar}
                    alt={review.reviewerName}
                    className="w-10 h-10 rounded-full object-cover"
                    width={40}
                    height={40}
                  />
                ) : (
                  review.reviewerName.charAt(0)
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-vlossom-neutral-900">
                    {review.reviewerName}
                  </span>
                  <span className="text-xs text-vlossom-neutral-400">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </div>

                {/* Rating */}
                <div className="mt-1">
                  <StarRating
                    value={review.overallRating / 10}
                    readonly
                    size="sm"
                    showValue
                  />
                </div>

                {/* Comment */}
                {review.comment && (
                  <p className="mt-2 text-sm text-vlossom-neutral-600">
                    {review.comment}
                  </p>
                )}

                {/* Review type badge */}
                <div className="mt-2">
                  <span className="text-xs text-vlossom-neutral-400">
                    {review.reviewType === "CUSTOMER_TO_STYLIST"
                      ? "Customer Review"
                      : review.reviewType === "STYLIST_TO_CUSTOMER"
                      ? "Stylist Review"
                      : review.reviewType.replace(/_/g, " ")}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
