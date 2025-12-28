/**
 * Property Owner Chairs Management Page
 * Reference: docs/vlossom/17-property-owner-module.md
 */

"use client";

import * as React from "react";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  useMyProperties,
  useCreateChair,
  useUpdateChair,
  useDeleteChair,
  type Property,
  type Chair,
  type ChairStatus,
  type CreateChairRequest,
  type UpdateChairRequest,
} from "../../../hooks/use-properties";
import { Button } from "../../../components/ui/button";
import { Icon } from "../../../components/icons";
import { ChairFormDialog } from "../../../components/property-owner/chair-form-dialog";
import { cn } from "../../../lib/utils";
import { toast } from "../../../hooks/use-toast";

// Chair type display names
const CHAIR_TYPE_LABELS: Record<string, string> = {
  BRAID_CHAIR: "Braid Chair",
  BARBER_CHAIR: "Barber Chair",
  STYLING_STATION: "Styling Station",
  NAIL_STATION: "Nail Station",
  LASH_BED: "Lash Bed",
  FACIAL_BED: "Facial Bed",
  GENERAL: "General",
};

// Chair status colors
const CHAIR_STATUS_STYLES: Record<ChairStatus, { bg: string; text: string; label: string }> = {
  AVAILABLE: { bg: "bg-status-success/10", text: "text-status-success", label: "Available" },
  OCCUPIED: { bg: "bg-status-warning/10", text: "text-status-warning", label: "Occupied" },
  MAINTENANCE: { bg: "bg-status-error/10", text: "text-status-error", label: "Maintenance" },
  BLOCKED: { bg: "bg-text-muted/10", text: "text-text-muted", label: "Blocked" },
};

// Format cents to ZAR
function formatPrice(cents: number | null): string {
  if (cents === null) return "—";
  return `R ${(cents / 100).toFixed(2)}`;
}

interface ChairCardProps {
  chair: Chair;
  propertyName: string;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (status: ChairStatus) => void;
}

function ChairCard({ chair, propertyName, onEdit, onDelete, onStatusChange }: ChairCardProps) {
  const [showActions, setShowActions] = React.useState(false);
  const statusStyle = CHAIR_STATUS_STYLES[chair.status];

  return (
    <div className="bg-background-primary rounded-card shadow-vlossom overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border-default">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-body font-medium text-text-primary">{chair.name}</h3>
              <span
                className={cn(
                  "px-2 py-0.5 text-caption font-medium rounded-full",
                  statusStyle.bg,
                  statusStyle.text
                )}
              >
                {statusStyle.label}
              </span>
            </div>
            <p className="text-caption text-text-tertiary">
              {CHAIR_TYPE_LABELS[chair.type] || chair.type} • {propertyName}
            </p>
          </div>
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowActions(!showActions)}
              aria-label="Chair actions"
            >
              <Icon name="settings" size="md" />
            </Button>

            {/* Dropdown Actions */}
            {showActions && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowActions(false)}
                />
                <div className="absolute right-0 top-full mt-1 w-48 bg-background-primary rounded-card shadow-lg border border-border-default z-20 py-1">
                  <button
                    onClick={() => {
                      onEdit();
                      setShowActions(false);
                    }}
                    className="w-full px-4 py-2 text-left text-body text-text-primary hover:bg-background-secondary flex items-center gap-2"
                  >
                    <Icon name="settings" size="sm" />
                    Edit Chair
                  </button>

                  {/* Status toggle options */}
                  {chair.status !== "AVAILABLE" && (
                    <button
                      onClick={() => {
                        onStatusChange("AVAILABLE");
                        setShowActions(false);
                      }}
                      className="w-full px-4 py-2 text-left text-body text-status-success hover:bg-background-secondary flex items-center gap-2"
                    >
                      <Icon name="check" size="sm" />
                      Mark Available
                    </button>
                  )}
                  {chair.status !== "MAINTENANCE" && (
                    <button
                      onClick={() => {
                        onStatusChange("MAINTENANCE");
                        setShowActions(false);
                      }}
                      className="w-full px-4 py-2 text-left text-body text-status-error hover:bg-background-secondary flex items-center gap-2"
                    >
                      <Icon name="calmError" size="sm" />
                      Mark Maintenance
                    </button>
                  )}
                  {chair.status !== "BLOCKED" && (
                    <button
                      onClick={() => {
                        onStatusChange("BLOCKED");
                        setShowActions(false);
                      }}
                      className="w-full px-4 py-2 text-left text-body text-text-muted hover:bg-background-secondary flex items-center gap-2"
                    >
                      <Icon name="close" size="sm" />
                      Block Chair
                    </button>
                  )}

                  <div className="border-t border-border-default my-1" />
                  <button
                    onClick={() => {
                      onDelete();
                      setShowActions(false);
                    }}
                    className="w-full px-4 py-2 text-left text-body text-status-error hover:bg-status-error/10 flex items-center gap-2"
                  >
                    <Icon name="close" size="sm" />
                    Delete Chair
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="p-4 border-b border-border-default">
        <p className="text-caption text-text-secondary mb-2">Pricing</p>
        <div className="grid grid-cols-2 gap-2 text-caption">
          {chair.rentalModesEnabled.includes("PER_BOOKING") && (
            <div>
              <span className="text-text-tertiary">Per Booking:</span>{" "}
              <span className="text-text-primary font-medium">
                {formatPrice(chair.perBookingFeeCents)}
              </span>
            </div>
          )}
          {chair.rentalModesEnabled.includes("PER_HOUR") && (
            <div>
              <span className="text-text-tertiary">Hourly:</span>{" "}
              <span className="text-text-primary font-medium">
                {formatPrice(chair.hourlyRateCents)}
              </span>
            </div>
          )}
          {chair.rentalModesEnabled.includes("PER_DAY") && (
            <div>
              <span className="text-text-tertiary">Daily:</span>{" "}
              <span className="text-text-primary font-medium">
                {formatPrice(chair.dailyRateCents)}
              </span>
            </div>
          )}
          {chair.rentalModesEnabled.includes("PER_WEEK") && (
            <div>
              <span className="text-text-tertiary">Weekly:</span>{" "}
              <span className="text-text-primary font-medium">
                {formatPrice(chair.weeklyRateCents)}
              </span>
            </div>
          )}
          {chair.rentalModesEnabled.includes("PER_MONTH") && (
            <div>
              <span className="text-text-tertiary">Monthly:</span>{" "}
              <span className="text-text-primary font-medium">
                {formatPrice(chair.monthlyRateCents)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Amenities */}
      {chair.amenities.length > 0 && (
        <div className="p-4">
          <p className="text-caption text-text-secondary mb-2">Amenities</p>
          <div className="flex flex-wrap gap-1.5">
            {chair.amenities.slice(0, 4).map((amenity) => (
              <span
                key={amenity}
                className="px-2 py-1 bg-background-tertiary text-caption text-text-secondary rounded"
              >
                {amenity}
              </span>
            ))}
            {chair.amenities.length > 4 && (
              <span className="px-2 py-1 bg-background-tertiary text-caption text-text-muted rounded">
                +{chair.amenities.length - 4} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ChairCardSkeleton() {
  return (
    <div className="bg-background-primary rounded-card shadow-vlossom overflow-hidden">
      <div className="p-4 border-b border-border-default">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-5 skeleton-shimmer rounded w-32" />
          <div className="h-5 skeleton-shimmer rounded w-16" />
        </div>
        <div className="h-4 skeleton-shimmer rounded w-24" />
      </div>
      <div className="p-4 border-b border-border-default">
        <div className="h-4 skeleton-shimmer rounded w-12 mb-2" />
        <div className="grid grid-cols-2 gap-2">
          <div className="h-4 skeleton-shimmer rounded w-20" />
          <div className="h-4 skeleton-shimmer rounded w-20" />
        </div>
      </div>
      <div className="p-4">
        <div className="flex gap-1.5">
          <div className="h-6 skeleton-shimmer rounded w-16" />
          <div className="h-6 skeleton-shimmer rounded w-16" />
        </div>
      </div>
    </div>
  );
}

function PropertyOwnerChairsContent() {
  const searchParams = useSearchParams();
  const selectedPropertyId = searchParams.get("property");

  const { data, isLoading, error } = useMyProperties();
  const properties = data?.properties || [];

  // State
  const [filterPropertyId, setFilterPropertyId] = React.useState<string | "all">(
    selectedPropertyId || "all"
  );
  const [filterStatus, setFilterStatus] = React.useState<ChairStatus | "all">("all");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingChair, setEditingChair] = React.useState<{
    chair: Chair;
    propertyId: string;
  } | null>(null);
  const [addToPropertyId, setAddToPropertyId] = React.useState<string | null>(null);

  // Get the property ID for mutations
  const activePropertyId = editingChair?.propertyId || addToPropertyId || "";

  // Mutations
  const createChairMutation = useCreateChair(activePropertyId);
  const updateChairMutation = useUpdateChair(activePropertyId);
  const deleteChairMutation = useDeleteChair(activePropertyId);

  // Get all chairs across properties with property info
  const allChairs = React.useMemo(() => {
    return properties.flatMap((property) =>
      (property.chairs || []).map((chair) => ({
        ...chair,
        propertyId: property.id,
        propertyName: property.name,
      }))
    );
  }, [properties]);

  // Filter chairs
  const filteredChairs = React.useMemo(() => {
    return allChairs.filter((chair) => {
      if (filterPropertyId !== "all" && chair.propertyId !== filterPropertyId) {
        return false;
      }
      if (filterStatus !== "all" && chair.status !== filterStatus) {
        return false;
      }
      return true;
    });
  }, [allChairs, filterPropertyId, filterStatus]);

  // Handlers
  const handleAddChair = (propertyId: string) => {
    setAddToPropertyId(propertyId);
    setEditingChair(null);
    setDialogOpen(true);
  };

  const handleEditChair = (chair: Chair & { propertyId: string }) => {
    setEditingChair({ chair, propertyId: chair.propertyId });
    setAddToPropertyId(null);
    setDialogOpen(true);
  };

  const handleDeleteChair = async (chair: Chair & { propertyId: string }) => {
    if (!confirm(`Are you sure you want to delete "${chair.name}"?`)) {
      return;
    }

    try {
      await deleteChairMutation.mutateAsync(chair.id);
      toast.success("Chair deleted", `${chair.name} has been removed.`);
    } catch {
      toast.error("Failed to delete chair", "Please try again.");
    }
  };

  const handleStatusChange = async (
    chair: Chair & { propertyId: string },
    newStatus: ChairStatus
  ) => {
    try {
      await updateChairMutation.mutateAsync({
        chairId: chair.id,
        data: { status: newStatus },
      });
      toast.success("Status updated", `${chair.name} is now ${CHAIR_STATUS_STYLES[newStatus].label.toLowerCase()}.`);
    } catch {
      toast.error("Failed to update status", "Please try again.");
    }
  };

  const handleDialogSubmit = async (data: CreateChairRequest | UpdateChairRequest) => {
    try {
      if (editingChair) {
        await updateChairMutation.mutateAsync({
          chairId: editingChair.chair.id,
          data: data as UpdateChairRequest,
        });
        toast.success("Chair updated", "Your changes have been saved.");
      } else {
        await createChairMutation.mutateAsync(data as CreateChairRequest);
        toast.success("Chair added", "The new chair has been created.");
      }
      setDialogOpen(false);
      setEditingChair(null);
      setAddToPropertyId(null);
    } catch {
      toast.error(
        editingChair ? "Failed to update chair" : "Failed to add chair",
        "Please try again."
      );
    }
  };

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-h2 text-text-primary">Chairs</h1>
        <div className="bg-status-error/10 border border-status-error rounded-card p-6 text-center">
          <Icon name="calmError" size="xl" className="text-status-error mx-auto mb-2" />
          <p className="text-body text-status-error">Failed to load chairs</p>
          <p className="text-caption text-text-secondary mt-1">Please try refreshing the page</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-h2 text-text-primary">Chairs</h1>
          <p className="text-body text-text-secondary">
            Manage chairs across all your properties
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Property Filter */}
        <div className="flex items-center gap-2">
          <label className="text-caption text-text-secondary">Property:</label>
          <select
            value={filterPropertyId}
            onChange={(e) => setFilterPropertyId(e.target.value)}
            className="px-3 py-1.5 text-body border border-border-default rounded-lg bg-background-primary focus:outline-none focus:ring-2 focus:ring-brand-rose"
          >
            <option value="all">All Properties</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <label className="text-caption text-text-secondary">Status:</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as ChairStatus | "all")}
            className="px-3 py-1.5 text-body border border-border-default rounded-lg bg-background-primary focus:outline-none focus:ring-2 focus:ring-brand-rose"
          >
            <option value="all">All Statuses</option>
            <option value="AVAILABLE">Available</option>
            <option value="OCCUPIED">Occupied</option>
            <option value="MAINTENANCE">Maintenance</option>
            <option value="BLOCKED">Blocked</option>
          </select>
        </div>

        {/* Add Chair Button */}
        {properties.length > 0 && (
          <div className="ml-auto flex items-center gap-2">
            <label className="text-caption text-text-secondary">Add to:</label>
            <select
              id="add-to-property"
              className="px-3 py-1.5 text-body border border-border-default rounded-lg bg-background-primary focus:outline-none focus:ring-2 focus:ring-brand-rose"
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) {
                  handleAddChair(e.target.value);
                  e.target.value = "";
                }
              }}
            >
              <option value="" disabled>
                Select property
              </option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <Button
              size="sm"
              disabled={properties.length === 0}
              onClick={() => properties.length > 0 && handleAddChair(properties[0].id)}
            >
              <Icon name="add" size="sm" className="mr-1.5" />
              Add Chair
            </Button>
          </div>
        )}
      </div>

      {/* Chairs Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <ChairCardSkeleton />
          <ChairCardSkeleton />
          <ChairCardSkeleton />
          <ChairCardSkeleton />
          <ChairCardSkeleton />
          <ChairCardSkeleton />
        </div>
      ) : properties.length === 0 ? (
        // No properties empty state
        <div className="bg-background-primary rounded-card shadow-vlossom p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-background-tertiary flex items-center justify-center">
            <Icon name="home" size="2xl" className="text-text-muted" />
          </div>
          <h3 className="text-body font-medium text-text-primary mb-2">
            Add a property first
          </h3>
          <p className="text-caption text-text-secondary mb-4 max-w-md mx-auto">
            You need to create a property before you can add chairs to it.
          </p>
          <a href="/property-owner/add-property">
            <Button>
              <Icon name="add" size="sm" className="mr-1.5" />
              Add Property
            </Button>
          </a>
        </div>
      ) : filteredChairs.length === 0 ? (
        // No chairs empty state
        <div className="bg-background-primary rounded-card shadow-vlossom p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-background-tertiary flex items-center justify-center">
            <Icon name="settings" size="2xl" className="text-text-muted" />
          </div>
          <h3 className="text-body font-medium text-text-primary mb-2">
            {filterPropertyId !== "all" || filterStatus !== "all"
              ? "No chairs match your filters"
              : "No chairs yet"}
          </h3>
          <p className="text-caption text-text-secondary mb-4 max-w-md mx-auto">
            {filterPropertyId !== "all" || filterStatus !== "all"
              ? "Try adjusting your filters to see more chairs."
              : "Add chairs to your properties so stylists can book them."}
          </p>
          {filterPropertyId === "all" && filterStatus === "all" && (
            <Button onClick={() => handleAddChair(properties[0].id)}>
              <Icon name="add" size="sm" className="mr-1.5" />
              Add Your First Chair
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredChairs.map((chair) => (
            <ChairCard
              key={chair.id}
              chair={chair}
              propertyName={chair.propertyName}
              onEdit={() => handleEditChair(chair)}
              onDelete={() => handleDeleteChair(chair)}
              onStatusChange={(status) => handleStatusChange(chair, status)}
            />
          ))}
        </div>
      )}

      {/* Chair Form Dialog */}
      <ChairFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleDialogSubmit}
        initialData={
          editingChair
            ? {
                name: editingChair.chair.name,
                type: editingChair.chair.type,
                amenities: editingChair.chair.amenities,
                hourlyRateCents: editingChair.chair.hourlyRateCents ?? undefined,
                dailyRateCents: editingChair.chair.dailyRateCents ?? undefined,
                weeklyRateCents: editingChair.chair.weeklyRateCents ?? undefined,
                monthlyRateCents: editingChair.chair.monthlyRateCents ?? undefined,
                perBookingFeeCents: editingChair.chair.perBookingFeeCents ?? undefined,
                rentalModesEnabled: editingChair.chair.rentalModesEnabled,
              }
            : undefined
        }
        isEditing={!!editingChair}
        isLoading={createChairMutation.isPending || updateChairMutation.isPending}
      />
    </div>
  );
}

export default function PropertyOwnerChairsPage() {
  return (
    <Suspense fallback={<div className="space-y-6"><h1 className="text-h2 text-text-primary">Chairs</h1><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"><ChairCardSkeleton /><ChairCardSkeleton /><ChairCardSkeleton /></div></div>}>
      <PropertyOwnerChairsContent />
    </Suspense>
  );
}
