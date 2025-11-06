"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

type SliderProps = {
  value?: number[]
  defaultValue?: number[]
  onValueChange?: (value: number[]) => void
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "defaultValue" | "onChange" | "type">

export function Slider({
  value,
  defaultValue = [0],
  onValueChange,
  className,
  min = 0,
  max = 100,
  step = 1,
  ...props
}: SliderProps) {
  const [internalValue, setInternalValue] = React.useState(defaultValue)
  const currentValue = value ?? internalValue

  React.useEffect(() => {
    if (value) {
      setInternalValue(value)
    }
  }, [value?.[0]])

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const next = [event.target.valueAsNumber]
    if (value === undefined) {
      setInternalValue(next)
    }
    onValueChange?.(next)
  }

  return (
    <div className={cn("flex w-full items-center", className)}>
      <input
        type="range"
        className={cn(
          "h-2 w-full appearance-none rounded-full bg-[hsl(var(--muted))]",
          "accent-[hsl(var(--primary))]",
        )}
        min={min}
        max={max}
        step={step}
        value={currentValue[0] ?? min}
        onChange={handleChange}
        {...props}
      />
    </div>
  )
}
