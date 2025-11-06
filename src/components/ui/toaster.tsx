"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export type ToastVariant = "default" | "success" | "info" | "destructive"

export type ToastOptions = {
  id?: string
  title?: string
  description?: string
  variant?: ToastVariant
  duration?: number
}

export const TOAST_EVENT = "nura:toast:add"

type ToastDetail = ToastOptions & { id: string }

const variantClasses: Record<ToastVariant, string> = {
  default:
    "border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--card-foreground))]",
  success: "border-green-500/40 bg-green-500/10 text-green-500",
  info: "border-blue-500/40 bg-blue-500/10 text-blue-500",
  destructive:
    "border-[hsl(var(--destructive))]/40 bg-[hsl(var(--destructive))]/10 text-[hsl(var(--destructive-foreground))]",
}

export function Toaster() {
  const [toasts, setToasts] = React.useState<ToastDetail[]>([])

  React.useEffect(() => {
    if (typeof window === "undefined") return

    const handler = (event: Event) => {
      const custom = event as CustomEvent<ToastOptions>
      const id = custom.detail.id ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`
      const duration = custom.detail.duration ?? 4000
      const variant = custom.detail.variant ?? "default"
      const toast: ToastDetail = { id, variant, ...custom.detail, duration }
      setToasts((current) => [...current, toast])
      window.setTimeout(() => {
        setToasts((current) => current.filter((item) => item.id !== id))
      }, duration)
    }

    window.addEventListener(TOAST_EVENT, handler as EventListener)
    return () => window.removeEventListener(TOAST_EVENT, handler as EventListener)
  }, [])

  const dismiss = (id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }

  if (toasts.length === 0) return null

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-80 flex-col gap-2">
      <div role="status" aria-live="polite" className="flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              "pointer-events-auto overflow-hidden rounded-lg border p-4 shadow-lg",
              variantClasses[toast.variant ?? "default"],
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1">
                {toast.title && <p className="text-sm font-semibold">{toast.title}</p>}
                {toast.description && (
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">{toast.description}</p>
                )}
              </div>
              <button
                type="button"
                className="ml-auto text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                onClick={() => dismiss(toast.id)}
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
