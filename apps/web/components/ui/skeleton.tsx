/**
 * Skeleton component - Loading placeholder with shimmer animation
 */

import { cn } from "../../lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Variant for common skeleton shapes
   */
  variant?: "text" | "circular" | "rectangular" | "rounded";
  /**
   * Width of the skeleton (CSS value)
   */
  width?: string | number;
  /**
   * Height of the skeleton (CSS value)
   */
  height?: string | number;
}

function Skeleton({
  className,
  variant = "rectangular",
  width,
  height,
  style,
  ...props
}: SkeletonProps) {
  const variantStyles = {
    text: "h-4 rounded",
    circular: "rounded-full",
    rectangular: "rounded-none",
    rounded: "rounded-card",
  };

  return (
    <div
      className={cn(
        "animate-pulse bg-background-tertiary",
        variantStyles[variant],
        className
      )}
      style={{
        width: typeof width === "number" ? `${width}px` : width,
        height: typeof height === "number" ? `${height}px` : height,
        ...style,
      }}
      {...props}
    />
  );
}

/**
 * Pre-built skeleton patterns for common use cases
 */
function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-card border border-border-default p-4 space-y-3", className)}>
      <Skeleton variant="rounded" className="h-40 w-full" />
      <Skeleton variant="text" className="h-5 w-3/4" />
      <Skeleton variant="text" className="h-4 w-1/2" />
      <div className="flex gap-2 pt-2">
        <Skeleton variant="text" className="h-4 w-16" />
        <Skeleton variant="text" className="h-4 w-20" />
      </div>
    </div>
  );
}

function SkeletonAvatar({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <Skeleton
      variant="circular"
      width={size}
      height={size}
      className={className}
    />
  );
}

function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          className={cn(
            "h-4",
            i === lines - 1 ? "w-3/4" : "w-full" // Last line shorter
          )}
        />
      ))}
    </div>
  );
}

function SkeletonButton({ className }: { className?: string }) {
  return <Skeleton className={cn("h-11 w-32 rounded-button", className)} />;
}

function SkeletonInput({ className }: { className?: string }) {
  return <Skeleton className={cn("h-11 w-full rounded-input", className)} />;
}

function SkeletonList({ count = 3, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("space-y-4", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <SkeletonAvatar size={48} />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" className="h-4 w-1/3" />
            <Skeleton variant="text" className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * V8.0 Additional Skeletons for Mobile Parity
 */

function SkeletonStylistCard({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-card border border-border-default p-4 space-y-3", className)}>
      <div className="flex gap-4">
        <SkeletonAvatar size={56} />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" className="h-[18px] w-[70%]" />
          <Skeleton variant="text" className="h-[14px] w-[50%]" />
          <Skeleton variant="text" className="h-[12px] w-[40%]" />
        </div>
      </div>
      <div className="flex gap-2">
        <Skeleton variant="rounded" className="h-7 w-20 rounded-full" />
        <Skeleton variant="rounded" className="h-7 w-24 rounded-full" />
        <Skeleton variant="rounded" className="h-7 w-16 rounded-full" />
      </div>
    </div>
  );
}

function SkeletonBookingCard({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-card border border-border-default p-4 space-y-3", className)}>
      <div className="flex items-center gap-4">
        <SkeletonAvatar size={48} />
        <div className="flex-1 space-y-1">
          <Skeleton variant="text" className="h-4 w-[60%]" />
          <Skeleton variant="text" className="h-[14px] w-[80%]" />
        </div>
        <Skeleton variant="rounded" className="h-6 w-[60px]" />
      </div>
      <div className="flex justify-between">
        <Skeleton variant="text" className="h-[14px] w-[45%]" />
        <Skeleton variant="text" className="h-[14px] w-[30%]" />
      </div>
    </div>
  );
}

function SkeletonTransaction({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-4 py-3 border-b border-border-default", className)}>
      <SkeletonAvatar size={40} />
      <div className="flex-1 space-y-1">
        <Skeleton variant="text" className="h-[14px] w-[50%]" />
        <Skeleton variant="text" className="h-[12px] w-[30%]" />
      </div>
      <div className="text-right space-y-1">
        <Skeleton variant="text" className="h-4 w-[60px]" />
        <Skeleton variant="text" className="h-[12px] w-10" />
      </div>
    </div>
  );
}

export {
  Skeleton,
  SkeletonCard,
  SkeletonAvatar,
  SkeletonText,
  SkeletonButton,
  SkeletonInput,
  SkeletonList,
  // V8.0 additions for mobile parity
  SkeletonStylistCard,
  SkeletonBookingCard,
  SkeletonTransaction,
};
