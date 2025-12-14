/**
 * Service Dialog Component
 * Reference: docs/specs/stylist-dashboard/F3.3-services-management.md
 */

"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { ServiceForm } from "./service-form";
import type { StylistService, CreateServiceInput } from "../../lib/dashboard-client";

// Service Form Dialog
interface ServiceFormDialogProps {
  service?: StylistService | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateServiceInput) => void;
  isLoading?: boolean;
}

export function ServiceFormDialog({
  service,
  open,
  onOpenChange,
  onSubmit,
  isLoading,
}: ServiceFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {service ? "Edit Service" : "Add Service"}
          </DialogTitle>
          <DialogDescription>
            {service
              ? "Update the details of your service."
              : "Create a new service for customers to book."}
          </DialogDescription>
        </DialogHeader>

        <ServiceForm
          service={service}
          onSubmit={onSubmit}
          onCancel={() => onOpenChange(false)}
          isLoading={isLoading}
        />
      </DialogContent>
    </Dialog>
  );
}

// Delete Confirmation Dialog
interface DeleteServiceDialogProps {
  service: StylistService | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isLoading?: boolean;
  hasActiveBookings?: boolean;
}

export function DeleteServiceDialog({
  service,
  open,
  onOpenChange,
  onConfirm,
  isLoading,
  hasActiveBookings = false,
}: DeleteServiceDialogProps) {
  if (!service) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete Service?</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-body text-text-secondary">
            Are you sure you want to delete "{service.name}"?
          </p>
          <p className="text-body-small text-text-tertiary">
            This action cannot be undone.
          </p>

          {hasActiveBookings && (
            <div className="p-3 bg-status-warning/10 border border-status-warning rounded-lg">
              <p className="text-body-small text-status-warning">
                This service has upcoming bookings. Please complete or cancel them before deleting.
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              variant="ghost"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              className="flex-1 bg-status-error hover:bg-status-error/90"
              onClick={onConfirm}
              disabled={isLoading || hasActiveBookings}
            >
              {isLoading ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
