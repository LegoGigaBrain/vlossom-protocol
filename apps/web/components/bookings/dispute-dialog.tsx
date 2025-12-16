"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Shield, AlertCircle, Upload, X as XIcon, DollarSign } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Input } from "../ui/input";
import { toast } from "../../hooks/use-toast";

const resolutionOptions = [
  { value: "full_refund", label: "Full refund", description: "Request a complete refund" },
  { value: "partial_refund", label: "Partial refund", description: "Request a partial amount back" },
  { value: "redo_service", label: "Redo service", description: "Have the service redone by another stylist" },
  { value: "other", label: "Other", description: "Propose a different resolution" },
] as const;

const disputeSchema = z.object({
  reason: z
    .string()
    .min(50, "Please provide at least 50 characters explaining the issue")
    .max(2000, "Description must be less than 2000 characters"),
  desiredResolution: z.string().min(1, "Please select a resolution"),
  refundAmount: z.string().optional(),
});

type DisputeFormData = z.infer<typeof disputeSchema>;

interface DisputeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string;
  stylistName: string;
  totalAmount: string;
  issueId?: string;
  onSuccess?: () => void;
}

export function DisputeDialog({
  open,
  onOpenChange,
  bookingId,
  stylistName,
  totalAmount,
  issueId,
  onSuccess,
}: DisputeDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<"info" | "form">("info");
  const [evidence, setEvidence] = useState<File[]>([]);
  const [evidencePreviews, setEvidencePreviews] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<DisputeFormData>({
    resolver: zodResolver(disputeSchema),
    defaultValues: {
      reason: "",
      desiredResolution: "",
      refundAmount: "",
    },
  });

  const selectedResolution = watch("desiredResolution");
  const reason = watch("reason") || "";

  const handleEvidenceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + evidence.length > 5) {
      toast.error("Too many files", "You can upload up to 5 files");
      return;
    }

    const validFiles = files.filter((file) => {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File too large", "Files must be under 10MB");
        return false;
      }
      return true;
    });

    setEvidence((prev) => [...prev, ...validFiles]);

    // Generate previews for images
    validFiles.forEach((file) => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setEvidencePreviews((prev) => [...prev, e.target?.result as string]);
        };
        reader.readAsDataURL(file);
      } else {
        setEvidencePreviews((prev) => [...prev, ""]);
      }
    });
  };

  const removeEvidence = (index: number) => {
    setEvidence((prev) => prev.filter((_, i) => i !== index));
    setEvidencePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClose = () => {
    reset();
    setStep("info");
    setEvidence([]);
    setEvidencePreviews([]);
    onOpenChange(false);
  };

  const onSubmit = async (data: DisputeFormData) => {
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("vlossom_token");
      const formData = new FormData();
      formData.append("bookingId", bookingId);
      formData.append("reason", data.reason);
      formData.append("desiredResolution", data.desiredResolution);
      if (issueId) {
        formData.append("issueId", issueId);
      }
      if (data.desiredResolution === "partial_refund" && data.refundAmount) {
        formData.append("refundAmount", data.refundAmount);
      }
      evidence.forEach((file) => {
        formData.append("evidence", file);
      });

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/disputes`,
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
        throw new Error(errorData.message || "Failed to file dispute");
      }

      toast.success(
        "Dispute filed",
        "Our team will review your case within 24-48 hours. Funds will be held in escrow until resolved."
      );

      onSuccess?.();
      handleClose();
    } catch (error) {
      toast.error(
        "Dispute failed",
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
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-background-primary rounded-card shadow-elevated z-50 animate-slide-up max-h-[85vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border-default sticky top-0 bg-background-primary">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-status-error" />
              <Dialog.Title className="text-lg font-semibold text-text-primary">
                Open a Dispute
              </Dialog.Title>
            </div>
            <Dialog.Close asChild>
              <button
                className="p-1 rounded-full hover:bg-background-tertiary transition-gentle"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-text-secondary" />
              </button>
            </Dialog.Close>
          </div>

          {step === "info" ? (
            /* Info Step */
            <div className="p-4 space-y-6">
              <div className="bg-status-warning/10 rounded-lg p-4">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-status-warning shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-text-primary">
                      Before you continue
                    </h3>
                    <p className="text-sm text-text-secondary mt-1">
                      Filing a dispute is a serious action. Please ensure you've
                      already tried to resolve the issue directly with the stylist.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium text-text-primary">
                  What happens when you file a dispute?
                </h3>
                <ul className="space-y-3 text-sm text-text-secondary">
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-brand-rose/10 flex items-center justify-center text-xs font-medium text-brand-rose shrink-0 mt-0.5">
                      1
                    </span>
                    <span>
                      <strong>Funds held:</strong> Your payment will be held in
                      escrow until the dispute is resolved.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-brand-rose/10 flex items-center justify-center text-xs font-medium text-brand-rose shrink-0 mt-0.5">
                      2
                    </span>
                    <span>
                      <strong>Both parties notified:</strong> The stylist will be
                      informed and can respond with their side.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-brand-rose/10 flex items-center justify-center text-xs font-medium text-brand-rose shrink-0 mt-0.5">
                      3
                    </span>
                    <span>
                      <strong>Vlossom reviews:</strong> Our team will review all
                      evidence and make a binding decision within 24-48 hours.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-brand-rose/10 flex items-center justify-center text-xs font-medium text-brand-rose shrink-0 mt-0.5">
                      4
                    </span>
                    <span>
                      <strong>Resolution:</strong> Funds will be released
                      according to the decision (full refund, partial, or to
                      stylist).
                    </span>
                  </li>
                </ul>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={handleClose} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={() => setStep("form")} className="flex-1">
                  Continue
                </Button>
              </div>
            </div>
          ) : (
            /* Form Step */
            <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-6">
              {/* Booking Info */}
              <div className="bg-background-tertiary rounded-lg p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-secondary">
                    Dispute with{" "}
                    <span className="font-medium text-text-primary">
                      {stylistName}
                    </span>
                  </p>
                </div>
                <p className="font-medium text-text-primary">${totalAmount}</p>
              </div>

              {/* Resolution Selection */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-text-primary">
                  What resolution are you seeking?
                </label>
                <div className="space-y-2">
                  {resolutionOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setValue("desiredResolution", option.value)}
                      className={cn(
                        "w-full p-3 rounded-lg text-left transition-gentle flex items-start gap-3",
                        selectedResolution === option.value
                          ? "bg-brand-rose/10 border-2 border-brand-rose"
                          : "bg-background-tertiary border-2 border-transparent hover:bg-background-secondary"
                      )}
                    >
                      <div
                        className={cn(
                          "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5",
                          selectedResolution === option.value
                            ? "border-brand-rose"
                            : "border-border-default"
                        )}
                      >
                        {selectedResolution === option.value && (
                          <div className="w-2.5 h-2.5 rounded-full bg-brand-rose" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-text-primary">
                          {option.label}
                        </p>
                        <p className="text-sm text-text-secondary">
                          {option.description}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
                {errors.desiredResolution && (
                  <p className="text-sm text-status-error">
                    {errors.desiredResolution.message}
                  </p>
                )}
              </div>

              {/* Partial Refund Amount */}
              {selectedResolution === "partial_refund" && (
                <div className="space-y-2">
                  <label
                    htmlFor="refundAmount"
                    className="block text-sm font-medium text-text-primary"
                  >
                    Requested refund amount
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                    <Input
                      id="refundAmount"
                      type="number"
                      step="0.01"
                      max={totalAmount}
                      placeholder="0.00"
                      {...register("refundAmount")}
                      className="pl-8"
                    />
                  </div>
                  <p className="text-xs text-text-muted">
                    Maximum: ${totalAmount}
                  </p>
                </div>
              )}

              {/* Reason */}
              <div className="space-y-2">
                <label
                  htmlFor="reason"
                  className="block text-sm font-medium text-text-primary"
                >
                  Explain your case in detail
                </label>
                <Textarea
                  id="reason"
                  placeholder="Please provide a detailed explanation of what happened and why you're requesting this resolution..."
                  {...register("reason")}
                  rows={5}
                  maxLength={2000}
                />
                <div className="flex justify-between text-xs">
                  <span className="text-status-error">
                    {errors.reason?.message}
                  </span>
                  <span className="text-text-muted">{reason.length}/2000</span>
                </div>
              </div>

              {/* Evidence Upload */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-text-primary">
                  Upload evidence{" "}
                  <span className="text-text-muted">(optional but recommended)</span>
                </label>

                <div className="flex gap-2 flex-wrap">
                  {evidence.map((file, index) => (
                    <div
                      key={index}
                      className="relative w-20 h-20 rounded-lg overflow-hidden bg-background-tertiary"
                    >
                      {evidencePreviews[index] ? (
                        <img
                          src={evidencePreviews[index]}
                          alt={`Evidence ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-text-muted p-2 text-center">
                          {file.name.slice(0, 15)}...
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => removeEvidence(index)}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-status-error text-white rounded-full flex items-center justify-center"
                      >
                        <XIcon className="w-3 h-3" />
                      </button>
                    </div>
                  ))}

                  {evidence.length < 5 && (
                    <label className="w-20 h-20 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border-default cursor-pointer hover:border-brand-rose hover:bg-brand-rose/5 transition-gentle">
                      <Upload className="w-5 h-5 text-text-muted" />
                      <span className="text-xs text-text-muted mt-1">Upload</span>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        multiple
                        onChange={handleEvidenceUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
                <p className="text-xs text-text-muted">
                  Photos, screenshots, or PDFs. Up to 5 files, max 10MB each.
                </p>
              </div>

              {/* Warning */}
              <div className="bg-status-error/10 rounded-lg p-3 flex gap-2">
                <AlertCircle className="w-4 h-4 text-status-error shrink-0 mt-0.5" />
                <p className="text-xs text-text-secondary">
                  False or frivolous disputes may result in account restrictions.
                  Please only file a dispute if you have a legitimate concern.
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep("info")}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  loading={isSubmitting}
                  className="flex-1"
                >
                  File Dispute
                </Button>
              </div>
            </form>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
