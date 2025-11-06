import * as React from "react"
import { cn } from "@/lib/utils"

type ButtonVariant = "default" | "outline" | "ghost" | "destructive"
type ButtonSize = "default" | "sm" | "lg" | "icon"

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
  nuraAction?: string
}

const variantClasses: Record<ButtonVariant, string> = {
  default:
    "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--primary))]/90",
  outline:
    "border border-[hsl(var(--border))] bg-transparent text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))]/40",
  ghost: "text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))]/40",
  destructive:
    "bg-[hsl(var(--destructive))] text-[hsl(var(--destructive-foreground))] hover:bg-[hsl(var(--destructive))]/90",
}

const sizeClasses: Record<ButtonSize, string> = {
  default: "h-10 px-4 py-2",
  sm: "h-9 rounded-md px-3",
  lg: "h-11 rounded-md px-8",
  icon: "h-10 w-10",
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", type = "button", nuraAction, ...props }, ref) => {
    const { ["data-nura-action"]: dataAttrAction, ...rest } = props as React.ButtonHTMLAttributes<HTMLButtonElement> & {
      "data-nura-action"?: string
    }
    const resolvedNuraAction = nuraAction ?? dataAttrAction
    return (
      <button
        ref={ref}
        type={type}
        data-nura-action={resolvedNuraAction}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--background))] disabled:pointer-events-none disabled:opacity-50",
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...rest}
      />
    )
  },
)
Button.displayName = "Button"
