"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

type TabsContextValue = {
  value: string | undefined
  setValue: (value: string) => void
}

const TabsContext = React.createContext<TabsContextValue | null>(null)

type TabsProps = {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
} & React.HTMLAttributes<HTMLDivElement>

export function Tabs({
  value,
  defaultValue,
  onValueChange,
  className,
  children,
  ...props
}: TabsProps) {
  const [internalValue, setInternalValue] = React.useState(defaultValue)
  const isControlled = value !== undefined
  const currentValue = isControlled ? value : internalValue

  const setValue = React.useCallback(
    (next: string) => {
      if (!isControlled) {
        setInternalValue(next)
      }
      onValueChange?.(next)
    },
    [isControlled, onValueChange],
  )

  const contextValue = React.useMemo(
    () => ({ value: currentValue, setValue }),
    [currentValue, setValue],
  )

  return (
    <TabsContext.Provider value={contextValue}>
      <div className={cn("w-full", className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  )
}

type TabsListProps = React.HTMLAttributes<HTMLDivElement>

export function TabsList({ className, ...props }: TabsListProps) {
  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex items-center justify-center rounded-md bg-[hsl(var(--muted))] p-1 text-[hsl(var(--muted-foreground))]",
        className,
      )}
      {...props}
    />
  )
}

type TabsTriggerProps = {
  value: string
} & React.ButtonHTMLAttributes<HTMLButtonElement>

export const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ className, value, ...props }, ref) => {
    const context = React.useContext(TabsContext)
    if (!context) {
      throw new Error("TabsTrigger must be used within Tabs")
    }
    const isActive = context.value === value
    return (
      <button
        ref={ref}
        role="tab"
        type="button"
        aria-selected={isActive}
        onClick={() => context.setValue(value)}
        className={cn(
          "inline-flex min-w-[120px] items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--background))]",
          isActive
            ? "bg-[hsl(var(--background))] text-[hsl(var(--foreground))] shadow"
            : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]",
          className,
        )}
        {...props}
      />
    )
  },
)
TabsTrigger.displayName = "TabsTrigger"

type TabsContentProps = {
  value: string
} & React.HTMLAttributes<HTMLDivElement>

export const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(
  ({ className, value, hidden, ...props }, ref) => {
    const context = React.useContext(TabsContext)
    if (!context) {
      throw new Error("TabsContent must be used within Tabs")
    }
    const isActive = context.value === value
    return (
      <div
        ref={ref}
        role="tabpanel"
        hidden={!isActive && hidden !== false}
        className={cn(isActive ? "outline-none" : "hidden", className)}
        {...props}
      />
    )
  },
)
TabsContent.displayName = "TabsContent"
