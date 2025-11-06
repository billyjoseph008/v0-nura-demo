"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

type SelectContextValue = {
  open: boolean
  setOpen: (open: boolean) => void
  value: string | undefined
  selectValue: (value: string, label: string) => void
  selectedLabel?: string
  setSelectedLabel: (label: string | undefined) => void
}

const SelectContext = React.createContext<SelectContextValue | null>(null)

type SelectProps = {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
} & React.HTMLAttributes<HTMLDivElement>

export function Select({
  value,
  defaultValue,
  onValueChange,
  className,
  children,
  ...props
}: SelectProps) {
  const [open, setOpen] = React.useState(false)
  const [internalValue, setInternalValue] = React.useState(defaultValue)
  const [selectedLabel, setSelectedLabel] = React.useState<string | undefined>(undefined)
  const isControlled = value !== undefined
  const currentValue = isControlled ? value : internalValue

  const selectValue = React.useCallback(
    (nextValue: string, label: string) => {
      if (!isControlled) {
        setInternalValue(nextValue)
      }
      setSelectedLabel(label)
      onValueChange?.(nextValue)
      setOpen(false)
    },
    [isControlled, onValueChange],
  )

  React.useEffect(() => {
    if (isControlled) {
      setSelectedLabel(undefined)
    }
  }, [value, isControlled])

  const contextValue = React.useMemo(
    () => ({ open, setOpen, value: currentValue, selectValue, selectedLabel, setSelectedLabel }),
    [open, currentValue, selectValue, selectedLabel],
  )

  return (
    <SelectContext.Provider value={contextValue}>
      <div className={cn("relative inline-block text-left", className)} {...props}>
        {children}
      </div>
    </SelectContext.Provider>
  )
}

type SelectTriggerProps = React.ButtonHTMLAttributes<HTMLButtonElement>

export const SelectTrigger = React.forwardRef<HTMLButtonElement, SelectTriggerProps>(
  ({ className, children, ...props }, ref) => {
    const context = React.useContext(SelectContext)
    if (!context) {
      throw new Error("SelectTrigger must be used within Select")
    }
    return (
      <button
        ref={ref}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={context.open}
        onClick={() => context.setOpen(!context.open)}
        className={cn(
          "flex w-full items-center justify-between rounded-md border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))] shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--background))]",
          className,
        )}
        {...props}
      >
        {children}
        <span aria-hidden className="ml-2 inline-flex h-2 w-2 rotate-45 border-b border-r border-[hsl(var(--muted-foreground))]" />
      </button>
    )
  },
)
SelectTrigger.displayName = "SelectTrigger"

type SelectValueProps = {
  placeholder?: string
  children?: React.ReactNode
}

export function SelectValue({ placeholder = "Select...", children }: SelectValueProps) {
  const context = React.useContext(SelectContext)
  if (!context) {
    throw new Error("SelectValue must be used within Select")
  }
  const content =
    children ?? context.selectedLabel ?? (context.value ? context.value : placeholder)
  return <span className="truncate text-left">{content}</span>
}

type SelectContentProps = React.HTMLAttributes<HTMLDivElement>

export const SelectContent = React.forwardRef<HTMLDivElement, SelectContentProps>(
  ({ className, children, ...props }, ref) => {
    const context = React.useContext(SelectContext)
    if (!context) {
      throw new Error("SelectContent must be used within Select")
    }
    if (!context.open) return null
    return (
      <div
        ref={ref}
        role="listbox"
        tabIndex={-1}
        className={cn(
          "absolute z-50 mt-2 max-h-64 w-full overflow-auto rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--popover))] p-1 shadow-lg",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    )
  },
)
SelectContent.displayName = "SelectContent"

type SelectItemProps = {
  value: string
} & React.ButtonHTMLAttributes<HTMLButtonElement>

export const SelectItem = React.forwardRef<HTMLButtonElement, SelectItemProps>(
  ({ className, value, children, disabled, ...props }, ref) => {
    const context = React.useContext(SelectContext)
    if (!context) {
      throw new Error("SelectItem must be used within Select")
    }
    const label = React.useMemo(() => {
      if (typeof children === "string" || typeof children === "number") {
        return String(children)
      }
      const parts = React.Children.map(children, (child) => {
        if (typeof child === "string" || typeof child === "number") {
          return String(child)
        }
        return ""
      }) ?? []
      const text = parts.join(" ").trim()
      return text.length > 0 ? text : value
    }, [children, value])
    const isSelected = context.value === value

    React.useEffect(() => {
      if (isSelected && !context.selectedLabel) {
        context.setSelectedLabel(label)
      }
    }, [isSelected, label, context])

    return (
      <button
        ref={ref}
        type="button"
        role="option"
        aria-selected={isSelected}
        disabled={disabled}
        onClick={() => context.selectValue(value, label)}
        className={cn(
          "flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm text-[hsl(var(--foreground))] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--background))] disabled:cursor-not-allowed disabled:opacity-50",
          isSelected && "bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]",
          !isSelected && "hover:bg-[hsl(var(--muted))]",
          className,
        )}
        {...props}
      >
        {children}
      </button>
    )
  },
)
SelectItem.displayName = "SelectItem"
