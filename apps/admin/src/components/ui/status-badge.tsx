/**
 * Status Badge Component (V7.0.0)
 *
 * Badge for displaying status indicators.
 */

export type BadgeVariant =
  | "default"
  | "success"
  | "warning"
  | "error"
  | "info"
  | "purple";

export interface StatusBadgeProps {
  label: string;
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-gray-100 text-gray-700",
  success: "bg-green-100 text-green-700",
  warning: "bg-amber-100 text-amber-700",
  error: "bg-red-100 text-red-700",
  info: "bg-blue-100 text-blue-700",
  purple: "bg-purple-100 text-purple-700",
};

export function StatusBadge({ label, variant = "default" }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variantClasses[variant]}`}
    >
      {label}
    </span>
  );
}

// Preset status mappings for common use cases
export const bookingStatusVariant: Record<string, BadgeVariant> = {
  PENDING: "warning",
  CONFIRMED: "info",
  IN_PROGRESS: "purple",
  COMPLETED: "success",
  CANCELLED: "error",
  DISPUTED: "error",
};

export const userStatusVariant: Record<string, BadgeVariant> = {
  ACTIVE: "success",
  INACTIVE: "default",
  FROZEN: "error",
  WARNED: "warning",
};

export const disputeStatusVariant: Record<string, BadgeVariant> = {
  OPEN: "warning",
  UNDER_REVIEW: "info",
  RESOLVED: "success",
  ESCALATED: "error",
  CLOSED: "default",
};
