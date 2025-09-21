import * as React from "react";
import { cn } from "@/utils/utils";

export interface FloatingPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "glass" | "solid" | "premium";
}

const FloatingPanel = React.forwardRef<HTMLDivElement, FloatingPanelProps>(
  ({ className, variant = "glass", ...props }, ref) => {
    const variants = {
      glass: "glass backdrop-blur-premium border border-white/10",
      solid: "bg-card border border-border shadow-premium",
      premium: "bg-gradient-to-br from-card via-card/80 to-card/60 border border-primary/20 shadow-premium backdrop-blur-premium"
    };

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-2xl p-6 transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1",
          variants[variant],
          className
        )}
        {...props}
      />
    );
  }
);
FloatingPanel.displayName = "FloatingPanel";

export { FloatingPanel };