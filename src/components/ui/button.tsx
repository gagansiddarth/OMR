import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/utils/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 relative overflow-hidden",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-primary to-primary-hover text-primary-foreground shadow-premium hover:shadow-glow hover:scale-[1.02] hover:-translate-y-0.5 transition-all duration-300",
        
        destructive: "bg-gradient-to-r from-destructive to-red-500 text-destructive-foreground shadow-premium hover:shadow-[0_0_20px_hsl(var(--destructive)/0.2)] hover:scale-[1.02] hover:-translate-y-0.5",
        
        outline: "glass border-2 border-primary/40 text-primary hover:bg-primary/5 hover:border-primary/60 hover:shadow-premium hover:scale-[1.02] backdrop-blur-premium",
        
        secondary: "bg-gradient-to-r from-secondary to-orange-300 text-secondary-foreground shadow-premium hover:shadow-[0_0_20px_hsl(var(--secondary)/0.15)] hover:scale-[1.02] hover:-translate-y-0.5",
        
        ghost: "glass text-foreground hover:bg-primary/5 hover:text-primary hover:shadow-inner hover:scale-[1.02] backdrop-blur-premium",
        
        link: "text-primary underline-offset-4 hover:underline hover:text-primary-hover transition-colors duration-300",
        
        premium: "bg-gradient-to-br from-primary via-accent/80 to-secondary text-primary-foreground shadow-premium hover:shadow-[0_10px_30px_-5px_hsl(var(--primary)/0.2)] hover:scale-105 hover:-translate-y-1 before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:-skew-x-12 before:-translate-x-full hover:before:translate-x-full before:transition-transform before:duration-700",
        
        glass: "glass backdrop-blur-premium border border-border/50 text-foreground hover:bg-primary/5 hover:border-primary/30 hover:shadow-premium hover:scale-[1.02] hover:-translate-y-0.5",
        
        elegant: "bg-card border border-border text-card-foreground shadow-premium hover:shadow-[0_15px_35px_-5px_rgba(0,0,0,0.1)] hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300",
        
        soft: "bg-gradient-to-r from-muted to-muted/80 text-muted-foreground hover:from-primary/10 hover:to-primary/5 hover:text-primary border border-border/30 hover:border-primary/20 hover:scale-[1.02] transition-all duration-300",
      },
      size: {
        default: "h-11 px-6 py-3",
        sm: "h-9 rounded-lg px-4 text-xs",
        lg: "h-13 rounded-2xl px-8 text-base font-bold",
        icon: "h-11 w-11 rounded-xl",
        fab: "h-14 w-14 rounded-full shadow-premium hover:scale-110",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
