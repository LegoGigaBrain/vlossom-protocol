/**
 * Button component - Brand-aligned button styles
 */

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-button text-button font-medium transition-gentle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-rose focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-brand-rose text-white hover:bg-brand-clay",
        secondary: "bg-background-tertiary text-text-primary hover:bg-border-default",
        outline: "border-2 border-brand-rose text-brand-rose hover:bg-brand-rose hover:text-white",
        ghost: "hover:bg-background-tertiary hover:text-text-primary",
      },
      size: {
        default: "h-11 px-6 py-2.5",
        sm: "h-9 px-4 py-2 text-sm",
        lg: "h-12 px-8 py-3",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
