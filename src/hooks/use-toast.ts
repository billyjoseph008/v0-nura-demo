"use client"

import * as React from "react"
import { TOAST_EVENT, type ToastOptions } from "@/components/ui/toaster"

type UseToastReturn = {
  toast: (options: ToastOptions) => void
}

export function useToast(): UseToastReturn {
  const toast = React.useCallback((options: ToastOptions) => {
    if (typeof window === "undefined") return
    const event = new CustomEvent<ToastOptions>(TOAST_EVENT, {
      detail: options,
    })
    window.dispatchEvent(event)
  }, [])

  return { toast }
}
