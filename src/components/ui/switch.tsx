"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

type SwitchProps = {
  checked?: boolean
  defaultChecked?: boolean
  onCheckedChange?: (checked: boolean) => void
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange" | "type">

export const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  (
    { checked, defaultChecked, onCheckedChange, className, disabled, ...props },
    ref,
  ) => {
    const [internalChecked, setInternalChecked] = React.useState(Boolean(defaultChecked))
    const isControlled = checked !== undefined
    const isOn = isControlled ? checked : internalChecked

    const toggle = () => {
      if (disabled) return
      const next = !isOn
      if (!isControlled) {
        setInternalChecked(next)
      }
      onCheckedChange?.(next)
    }

    React.useEffect(() => {
      if (isControlled) {
        setInternalChecked(checked ?? false)
      }
    }, [checked, isControlled])

    return (
      <button
        ref={ref}
        type="button"
        role="switch"
        aria-checked={isOn}
        disabled={disabled}
        onClick={toggle}
        className={cn(
          "relative inline-flex h-6 w-11 items-center rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--muted))] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--background))] disabled:cursor-not-allowed disabled:opacity-50",
          isOn && "bg-[hsl(var(--primary))]",
          className,
        )}
        {...props}
      >
        <span
          className={cn(
            "pointer-events-none inline-block h-5 w-5 translate-x-1 rounded-full bg-[hsl(var(--background))] shadow transition-transform",
            isOn && "translate-x-5",
          )}
        />
      </button>
    )
  },
)
Switch.displayName = "Switch"
