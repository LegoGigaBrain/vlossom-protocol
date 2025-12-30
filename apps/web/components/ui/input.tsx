/**
 * Input component - Brand-aligned input styles
 */

import * as React from "react";
import { cn } from "../../lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-input border border-border-default bg-background-primary px-4 py-2.5 text-body text-text-primary placeholder:text-text-muted transition-gentle",
          "focus:outline-none focus:ring-2 focus:ring-brand-rose focus:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
