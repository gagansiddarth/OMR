import * as React from "react";
import { cn } from "@/utils/utils";

export interface GradientTextProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "primary" | "secondary" | "accent" | "rainbow";
}

const GradientText = React.forwardRef<HTMLSpanElement, GradientTextProps>(
  ({ className, variant = "primary", children, ...props }, ref) => {
    const variants = {
      primary: "bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent",
      secondary: "bg-gradient-to-r from-secondary to-warning bg-clip-text text-transparent",
      accent: "bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent",
      rainbow: "bg-gradient-to-r from-primary via-secondary via-accent to-primary bg-clip-text text-transparent animate-gradient"
    };

    return (
      <span
        ref={ref}
        className={cn(
          "font-bold tracking-tight",
          variants[variant],
          className
        )}
        {...props}
      >
        {children}
      </span>
    );
  }
);
GradientText.displayName = "GradientText";

export { GradientText };