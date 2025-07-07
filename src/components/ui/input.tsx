import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps extends React.ComponentProps<"input"> {
  variant?: "default" | "premium" | "glass";
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant = "default", ...props }, ref) => {
    const baseStyles = "flex h-12 w-full rounded-xl border text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm transition-all duration-300";
    
    const variants = {
      default: "border-input bg-background px-4 py-3 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      premium: "border-glass-border bg-glass backdrop-blur-xl px-4 py-3 shadow-soft hover:shadow-medium focus:shadow-large focus:border-primary/30 focus:bg-background/80 placeholder:text-muted-foreground/70",
      glass: "border-glass-border bg-glass/50 backdrop-blur-xl px-4 py-3 shadow-soft hover:shadow-medium focus:shadow-luxury focus:border-primary/40 focus:bg-glass/80 placeholder:text-muted-foreground/60"
    };
    
    return (
      <input
        type={type}
        className={cn(
          baseStyles,
          variants[variant],
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
