import * as React from "react";
import { cn } from "@/utils/utils";

export interface StatusIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {
  status: "success" | "warning" | "error" | "processing" | "idle";
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  label?: string;
}

const StatusIndicator = React.forwardRef<HTMLDivElement, StatusIndicatorProps>(
  ({ className, status, size = "md", showLabel = false, label, ...props }, ref) => {
    const statusConfig = {
      success: {
        color: "bg-success",
        glow: "shadow-[0_0_10px_hsl(var(--success)/0.5)]",
        textColor: "text-success",
        defaultLabel: "Success"
      },
      warning: {
        color: "bg-warning",
        glow: "shadow-[0_0_10px_hsl(var(--warning)/0.5)]",
        textColor: "text-warning",
        defaultLabel: "Warning"
      },
      error: {
        color: "bg-destructive",
        glow: "shadow-[0_0_10px_hsl(var(--destructive)/0.5)]",
        textColor: "text-destructive",
        defaultLabel: "Error"
      },
      processing: {
        color: "bg-primary",
        glow: "shadow-[0_0_10px_hsl(var(--primary)/0.5)] animate-pulse",
        textColor: "text-primary",
        defaultLabel: "Processing"
      },
      idle: {
        color: "bg-muted-foreground",
        glow: "",
        textColor: "text-muted-foreground",
        defaultLabel: "Idle"
      }
    };

    const sizeConfig = {
      sm: "w-2 h-2",
      md: "w-3 h-3",
      lg: "w-4 h-4"
    };

    const config = statusConfig[status];
    const displayLabel = label || config.defaultLabel;

    return (
      <div
        ref={ref}
        className={cn("flex items-center gap-2", className)}
        {...props}
      >
        <div
          className={cn(
            "rounded-full",
            sizeConfig[size],
            config.color,
            config.glow
          )}
        />
        {showLabel && (
          <span className={cn("text-sm font-medium", config.textColor)}>
            {displayLabel}
          </span>
        )}
      </div>
    );
  }
);
StatusIndicator.displayName = "StatusIndicator";

export { StatusIndicator };