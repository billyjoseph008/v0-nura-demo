import * as React from "react"
import { cn } from "@/lib/utils"

type BadgeVariant = "default" | "outline"

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant
}

const variantClasses: Record<BadgeVariant, string> = {
  default:
    "bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))]", 
  outline:
    "border border-[hsl(var(--border))] bg-transparent text-[hsl(var(--foreground))]",
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  )
}
