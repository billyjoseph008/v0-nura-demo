import { useEffect } from "react"
import { nuraClient } from "@/lib/nuraClient"
import type { NuraGlobalContext } from "@/lib/types"

interface UseNuraGlobalListenerOptions {
  orders: Array<{ id: number; name: string; notes?: string }>
  ordersOpen: boolean
  capabilitiesOpen: boolean
  telemetryOpen: boolean
  pendingAction: { intent: string; description: string; payload?: Record<string, unknown> } | null
  confirmActionTestId?: string
  cancelActionTestId?: string
}

export function useNuraGlobalListener({
  orders,
  ordersOpen,
  capabilitiesOpen,
  telemetryOpen,
  pendingAction,
  confirmActionTestId,
  cancelActionTestId,
}: UseNuraGlobalListenerOptions) {
  useEffect(() => {
    const context: NuraGlobalContext = {
      orders: orders.map((order) => ({ id: order.id, name: order.name, notes: order.notes })),
      modals: {
        capabilities: capabilitiesOpen,
        telemetry: telemetryOpen,
        orders: ordersOpen,
      },
      pendingAction: pendingAction
        ? {
            intent: pendingAction.intent,
            description: pendingAction.description,
            payload: pendingAction.payload,
          }
        : null,
      confirmDialog: pendingAction
        ? {
            intent: pendingAction.intent,
            description: pendingAction.description,
            confirmActionTestId,
            cancelActionTestId,
          }
        : null,
    }

    nuraClient.updateContext(context)
  }, [
    orders,
    ordersOpen,
    capabilitiesOpen,
    telemetryOpen,
    pendingAction,
    confirmActionTestId,
    cancelActionTestId,
  ])

  useEffect(() => {
    return () => {
      nuraClient.updateContext({
        orders: [],
        modals: { capabilities: false, telemetry: false, orders: false },
        pendingAction: null,
        confirmDialog: null,
      })
    }
  }, [])
}
