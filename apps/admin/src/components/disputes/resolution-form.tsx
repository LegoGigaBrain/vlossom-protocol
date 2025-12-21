/**
 * Dispute Resolution Form (V7.0.0)
 *
 * Form for resolving disputes with 8 resolution types.
 */

"use client";

import { useState } from "react";
import {
  type DisputeResolution,
  RESOLUTION_LABELS,
} from "../../lib/disputes-client";

interface ResolutionFormProps {
  onSubmit: (data: {
    resolution: DisputeResolution;
    resolutionNotes: string;
    refundPercent?: number;
  }) => void;
  onCancel: () => void;
  isLoading: boolean;
}

const resolutions: DisputeResolution[] = [
  "FULL_REFUND_CUSTOMER",
  "PARTIAL_REFUND",
  "NO_REFUND",
  "SPLIT_FUNDS",
  "STYLIST_PENALTY",
  "CUSTOMER_WARNING",
  "MUTUAL_CANCELLATION",
  "ESCALATED_TO_LEGAL",
];

const resolutionDescriptions: Record<DisputeResolution, string> = {
  FULL_REFUND_CUSTOMER: "Customer receives full refund. Stylist receives nothing.",
  PARTIAL_REFUND: "Customer receives a percentage refund. Specify the refund amount.",
  NO_REFUND: "Stylist keeps all funds. Customer receives nothing.",
  SPLIT_FUNDS: "Funds are split 50/50 between customer and stylist.",
  STYLIST_PENALTY: "Stylist receives penalty. May affect their account standing.",
  CUSTOMER_WARNING: "Customer receives a warning. May affect their account standing.",
  MUTUAL_CANCELLATION: "Both parties agree to cancel. Funds returned to customer.",
  ESCALATED_TO_LEGAL: "Requires legal review. All funds are held until resolution.",
};

export function ResolutionForm({ onSubmit, onCancel, isLoading }: ResolutionFormProps) {
  const [resolution, setResolution] = useState<DisputeResolution | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [refundPercent, setRefundPercent] = useState(50);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolution || resolutionNotes.length < 10) return;

    onSubmit({
      resolution,
      resolutionNotes,
      refundPercent: resolution === "PARTIAL_REFUND" ? refundPercent : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Resolution Type Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-3">
          Resolution Type
        </label>
        <div className="grid grid-cols-1 gap-2">
          {resolutions.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setResolution(r)}
              className={`text-left p-3 rounded-lg border transition-all ${
                resolution === r
                  ? "border-purple-500 bg-purple-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900">
                  {RESOLUTION_LABELS[r]}
                </span>
                {resolution === r && (
                  <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {resolutionDescriptions[r]}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Refund Percent (for partial refunds) */}
      {resolution === "PARTIAL_REFUND" && (
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Refund Percentage
          </label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="10"
              max="90"
              step="10"
              value={refundPercent}
              onChange={(e) => setRefundPercent(parseInt(e.target.value))}
              className="flex-1"
            />
            <span className="text-lg font-semibold text-gray-900 w-16 text-right">
              {refundPercent}%
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Customer receives {refundPercent}% refund. Stylist receives {100 - refundPercent}%.
          </p>
        </div>
      )}

      {/* Resolution Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">
          Resolution Notes
        </label>
        <textarea
          value={resolutionNotes}
          onChange={(e) => setResolutionNotes(e.target.value)}
          placeholder="Explain the reasoning behind this resolution (min 10 characters)..."
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
        />
        <p className="text-sm text-gray-500 mt-1">
          {resolutionNotes.length}/2000 characters
        </p>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!resolution || resolutionNotes.length < 10 || isLoading}
          className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Resolving..." : "Resolve Dispute"}
        </button>
      </div>
    </form>
  );
}
