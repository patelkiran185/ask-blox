import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "outline" | "solid"
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "solid", ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          variant === "outline"
            ? "border border-current bg-transparent"
            : "bg-blue-600 text-white",
          className
        )}
        {...props}
      />
    )
  }
)
Badge.displayName = "Badge" 