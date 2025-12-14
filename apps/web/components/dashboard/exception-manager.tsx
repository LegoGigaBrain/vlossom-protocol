/**
 * Exception Manager Component
 * Reference: docs/specs/stylist-dashboard/F3.4-availability-calendar.md
 */

"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { formatDate } from "../../lib/utils";
import type { DateException } from "../../lib/dashboard-client";

interface ExceptionManagerProps {
  exceptions: DateException[];
  isLoading?: boolean;
  onAdd: (exception: DateException) => void;
  onRemove: (date: string) => void;
}

interface AddExceptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (exception: DateException) => void;
  isLoading?: boolean;
}

function AddExceptionDialog({ open, onOpenChange, onAdd, isLoading }: AddExceptionDialogProps) {
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (!date) {
      setError("Please select a date");
      return;
    }

    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      setError("Cannot block dates in the past");
      return;
    }

    onAdd({
      date,
      blocked: true,
      note: note.trim() || undefined,
    });

    // Reset form
    setDate("");
    setNote("");
    setError("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Block a Date</DialogTitle>
          <DialogDescription>
            Customers won't be able to book on blocked dates.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="exception-date">Date *</Label>
            <Input
              id="exception-date"
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setError("");
              }}
              min={new Date().toISOString().split("T")[0]}
              className={error ? "border-status-error" : ""}
            />
            {error && (
              <p className="text-caption text-status-error mt-1">{error}</p>
            )}
          </div>

          <div>
            <Label htmlFor="exception-note">Note (optional)</Label>
            <Input
              id="exception-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g., Holiday, Personal day"
            />
          </div>

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
              className="flex-1"
              onClick={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? "Blocking..." : "Block Date"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ExceptionManager({
  exceptions,
  isLoading,
  onAdd,
  onRemove,
}: ExceptionManagerProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [removingDate, setRemovingDate] = useState<string | null>(null);

  const handleAdd = (exception: DateException) => {
    onAdd(exception);
    setDialogOpen(false);
  };

  const handleRemove = (date: string) => {
    setRemovingDate(date);
    onRemove(date);
  };

  // Sort exceptions by date
  const sortedExceptions = [...exceptions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Filter out past dates
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcomingExceptions = sortedExceptions.filter(
    (e) => new Date(e.date) >= today
  );

  return (
    <div className="bg-background-primary rounded-card shadow-vlossom p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-h4 text-text-primary">Blocked Dates</h3>
        <Button variant="outline" size="sm" onClick={() => setDialogOpen(true)}>
          + Block Date
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse flex items-center justify-between p-3 bg-background-secondary rounded-lg">
              <div className="h-4 bg-background-tertiary rounded w-40"></div>
              <div className="h-8 bg-background-tertiary rounded w-16"></div>
            </div>
          ))}
        </div>
      ) : upcomingExceptions.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-body text-text-secondary">No blocked dates</p>
          <p className="text-caption text-text-tertiary mt-1">
            Block specific dates when you're unavailable
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {upcomingExceptions.map((exception) => (
            <div
              key={exception.date}
              className="flex items-center justify-between p-3 bg-background-secondary rounded-lg"
            >
              <div>
                <p className="text-body text-text-primary">
                  {formatDate(exception.date)}
                </p>
                {exception.note && (
                  <p className="text-caption text-text-tertiary">{exception.note}</p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemove(exception.date)}
                disabled={removingDate === exception.date}
                className="text-status-error hover:bg-status-error/10"
              >
                {removingDate === exception.date ? "..." : "Remove"}
              </Button>
            </div>
          ))}
        </div>
      )}

      <AddExceptionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onAdd={handleAdd}
        isLoading={isLoading}
      />
    </div>
  );
}
