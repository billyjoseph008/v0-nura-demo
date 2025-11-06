"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Toaster } from "@/components/ui/toaster"
import Header from "@/components/Header"
import Badges from "@/components/Badges"
import CommandConsole from "@/components/CommandConsole"
import Examples from "@/components/Examples"
import Telemetry from "@/components/Telemetry"
import McpPanel from "@/components/McpPanel"
import Checklist from "@/components/Checklist"
import Footer from "@/components/Footer"
import OrdersPanel, { type OrderItem } from "@/components/OrdersPanel"
import CapabilitiesModal, { type CapabilitiesQuickAction } from "@/components/CapabilitiesModal"
import TelemetryModal from "@/components/TelemetryModal"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { eventBus } from "@/lib/telemetry"
import { nuraClient } from "@/lib/nuraClient"
import type { NuraResult } from "@/lib/types"

interface PendingActionState {
  intent: string
  description: string
  payload?: Record<string, unknown>
}

export default function App() {
  const [lastResult, setLastResult] = useState<NuraResult | null>(null)
  const [capabilitiesOpen, setCapabilitiesOpen] = useState(false)
  const [telemetryModalOpen, setTelemetryModalOpen] = useState(false)
  const [telemetryHighlight, setTelemetryHighlight] = useState(false)
  const [explainMode, setExplainMode] = useState(false)
  const [pendingAction, setPendingAction] = useState<PendingActionState | null>(null)
  const [actionSummary, setActionSummary] = useState<string | null>(null)
  const [ordersPanelOpen, setOrdersPanelOpen] = useState(false)
  const [orders, setOrders] = useState<OrderItem[]>([
    { id: 1, name: "Latte vainilla", notes: "Sin azúcar" },
    { id: 2, name: "Sandwich vegano", notes: "Agregar aderezo ligero" },
  ])
  const highlightTimeout = useRef<number | null>(null)
  const { toast } = useToast()

  const clearHighlight = useCallback(() => {
    if (highlightTimeout.current) {
      window.clearTimeout(highlightTimeout.current)
      highlightTimeout.current = null
    }
    setTelemetryHighlight(false)
  }, [])

  const highlightTelemetryCard = useCallback(() => {
    if (highlightTimeout.current) {
      window.clearTimeout(highlightTimeout.current)
    }
    setTelemetryHighlight(true)
    highlightTimeout.current = window.setTimeout(() => {
      setTelemetryHighlight(false)
      highlightTimeout.current = null
    }, 2400)
  }, [])

  const openCapabilities = useCallback(
    (source: "ui" | "voice" | "keyboard" = "ui") => {
      setCapabilitiesOpen(true)
      setActionSummary("Capabilities modal opened.")
      toast({
        title: "Help panel",
        description:
          source === "voice"
            ? "Opened via voice intent"
            : source === "keyboard"
              ? "Opened via keyboard shortcut"
              : "Interactive capabilities modal opened",
        variant: "info",
      })
    },
    [toast],
  )

  const openTelemetry = useCallback(
    (source: "ui" | "voice" | "keyboard" = "ui") => {
      setTelemetryModalOpen(true)
      highlightTelemetryCard()
      setActionSummary("Telemetry modal opened with live ranking.")
      toast({
        title: "Telemetry spotlight",
        description:
          source === "voice"
            ? "Opened via voice intent"
            : source === "keyboard"
              ? "Opened via keyboard shortcut"
              : "Telemetry modal opened",
        variant: "info",
      })
    },
    [highlightTelemetryCard, toast],
  )

  const toggleTelemetry = useCallback(() => {
    setTelemetryModalOpen((prev) => {
      if (prev) {
        toast({ title: "Telemetry", description: "Telemetry modal closed" })
        clearHighlight()
        setActionSummary("Telemetry modal closed.")
        return false
      }
      openTelemetry("keyboard")
      return true
    })
  }, [clearHighlight, openTelemetry, toast])

  const applyExplainMode = useCallback(
    (enabled: boolean, source: "ui" | "voice" | "keyboard" = "ui") => {
      setExplainMode((previous) => {
        if (previous === enabled) return previous
        setActionSummary(
          enabled
            ? "Explain mode is active. Commands will not execute."
            : "Explain mode disabled. Commands will execute normally.",
        )
        toast({
          title: enabled ? "Explain mode enabled" : "Explain mode disabled",
          description:
            source === "voice"
              ? "Updated via voice intent"
              : source === "keyboard"
                ? "Updated via keyboard shortcut"
                : "Updated via UI control",
          variant: enabled ? "info" : "default",
        })
        return enabled
      })
    },
    [toast],
  )

  useEffect(() => {
    nuraClient.setExplainMode(explainMode)
  }, [explainMode])

  useEffect(
    () => () => {
      if (highlightTimeout.current) {
        window.clearTimeout(highlightTimeout.current)
      }
    },
    [],
  )

  useEffect(() => {
    const handleCapabilities = () => openCapabilities("voice")
    const handleTelemetry = () => openTelemetry("voice")
    const handleExplainToggle = (data: { enabled: boolean }) => applyExplainMode(data.enabled, "voice")
    const handleVoiceWake = (data: { wake: string; canonical: string; confidence: number }) => {
      toast({
        title: "Phonetic wake detected",
        description: `Alias "${data.wake}" matched (${Math.round(data.confidence * 100)}%)`,
        variant: "info",
      })
    }
    const handleMenuOpen = () => {
      setOrdersPanelOpen(true)
      setActionSummary("Interactive orders menu ready.")
      toast({ title: "Orders", description: "Orders menu opened", variant: "success" })
    }
    const handlePending = (data: PendingActionState) => {
      setPendingAction(data)
      setActionSummary(`Confirmation required: ${data.description}`)
      toast({
        title: "Confirmation required",
        description: data.description,
        variant: "destructive",
      })
    }
    const handleCancelled = (data: PendingActionState) => {
      setPendingAction(null)
      toast({ title: "Action cancelled", description: data.description })
    }
    const handleDeleted = (data: { id?: unknown }) => {
      setPendingAction(null)
      const id = data.id ?? "(unknown)"
      setActionSummary(`Order ${id} deleted.`)
      toast({ title: "Order deleted", description: `Order ${id} deleted successfully`, variant: "success" })
      const numericId = typeof id === "number" ? id : Number.parseInt(String(id), 10)
      if (!Number.isNaN(numericId)) {
        setOrders((previous) => previous.filter((order) => order.id !== numericId))
      }
    }
    const handleContextConfirm = (data: { previous: PendingActionState }) => {
      const desc = data.previous.description || data.previous.intent
      setActionSummary(`Confirmed: ${desc}`)
      toast({ title: "Confirmed", description: desc, variant: "success" })
    }
    const handleMcpConnected = (data: { url?: string }) => {
      setActionSummary(`MCP connected${data.url ? `: ${data.url}` : ""}.`)
    }
    const handleMcpDisconnected = () => {
      setActionSummary("MCP disconnected.")
    }
    const handleMcpResources = (data: { count?: number }) => {
      setActionSummary(`Resources listed (${data.count ?? 0}).`)
    }
    const handleMcpTools = (data: { count?: number }) => {
      setActionSummary(`Tools listed (${data.count ?? 0}).`)
    }
    const handleMcpError = (data: { error?: string }) => {
      toast({ title: "MCP error", description: data.error ?? "MCP operation failed", variant: "destructive" })
    }

    eventBus.on("ui.capabilities.open", handleCapabilities)
    eventBus.on("ui.telemetry.open", handleTelemetry)
    eventBus.on("ui.explain.toggle", handleExplainToggle)
    eventBus.on("voice.wake.fuzzy", handleVoiceWake)
    eventBus.on("ui.menu.open", handleMenuOpen)
    eventBus.on("action.pending", handlePending)
    eventBus.on("action.cancelled", handleCancelled)
    eventBus.on("order.deleted", handleDeleted)
    eventBus.on("context.confirmation", handleContextConfirm)
    eventBus.on("mcp.connected", handleMcpConnected)
    eventBus.on("mcp.connected.ui", handleMcpConnected)
    eventBus.on("mcp.disconnected", handleMcpDisconnected)
    eventBus.on("mcp.disconnected.ui", handleMcpDisconnected)
    eventBus.on("mcp.resources.listed", handleMcpResources)
    eventBus.on("mcp.tools.listed", handleMcpTools)
    eventBus.on("mcp.error", handleMcpError)

    return () => {
      eventBus.off("ui.capabilities.open", handleCapabilities)
      eventBus.off("ui.telemetry.open", handleTelemetry)
      eventBus.off("ui.explain.toggle", handleExplainToggle)
      eventBus.off("voice.wake.fuzzy", handleVoiceWake)
      eventBus.off("ui.menu.open", handleMenuOpen)
      eventBus.off("action.pending", handlePending)
      eventBus.off("action.cancelled", handleCancelled)
      eventBus.off("order.deleted", handleDeleted)
      eventBus.off("context.confirmation", handleContextConfirm)
      eventBus.off("mcp.connected", handleMcpConnected)
      eventBus.off("mcp.connected.ui", handleMcpConnected)
      eventBus.off("mcp.disconnected", handleMcpDisconnected)
      eventBus.off("mcp.disconnected.ui", handleMcpDisconnected)
      eventBus.off("mcp.resources.listed", handleMcpResources)
      eventBus.off("mcp.tools.listed", handleMcpTools)
      eventBus.off("mcp.error", handleMcpError)
    }
  }, [applyExplainMode, openCapabilities, openTelemetry, toast])

  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      if ((event.target as HTMLElement)?.tagName?.match(/input|textarea|select/i)) {
        return
      }
      if (event.key === "?" && event.shiftKey) {
        event.preventDefault()
        openCapabilities("keyboard")
      }
      if (event.key.toLowerCase() === "t") {
        event.preventDefault()
        toggleTelemetry()
      }
      if (event.key.toLowerCase() === "e") {
        event.preventDefault()
        applyExplainMode(!explainMode, "keyboard")
      }
    }

    window.addEventListener("keydown", handleKeydown)
    return () => window.removeEventListener("keydown", handleKeydown)
  }, [applyExplainMode, explainMode, openCapabilities, toggleTelemetry])

  const handleCapabilitiesQuickAction = useCallback(
    (action: CapabilitiesQuickAction) => {
      switch (action) {
        case "telemetry.open":
          openTelemetry("ui")
          break
        case "explain.on":
          applyExplainMode(true, "ui")
          break
        case "explain.off":
          applyExplainMode(false, "ui")
          break
        case "mcp.connect":
          eventBus.emit("mcp.request.connect", { source: "modal" })
          break
        case "mcp.list.resources":
          eventBus.emit("mcp.request.listResources", { source: "modal" })
          break
        case "mcp.list.tools":
          eventBus.emit("mcp.request.listTools", { source: "modal" })
          break
      }
    },
    [applyExplainMode, openTelemetry],
  )

  const handleConfirm = useCallback(() => {
    if (!pendingAction) {
      toast({ title: "Nothing to confirm", description: "No pending action", variant: "destructive" })
      return
    }
    const success = nuraClient.confirmPendingAction()
    if (!success) {
      toast({ title: "Unable to confirm", description: "No action executed", variant: "destructive" })
    }
    setPendingAction(null)
  }, [pendingAction, toast])

  const handleCancel = useCallback(() => {
    if (pendingAction) {
      nuraClient.cancelPendingAction()
      setPendingAction(null)
    }
  }, [pendingAction])

  const handleAddOrder = useCallback(
    (order: { name: string; notes?: string }) => {
      const newOrder: OrderItem = {
        id: Date.now(),
        name: order.name,
        notes: order.notes,
      }
      setOrders((previous) => [...previous, newOrder])
      setOrdersPanelOpen(true)
      setActionSummary(`Order added: ${newOrder.name}.`)
      toast({
        title: "Order added",
        description: order.notes ? `${order.name} · ${order.notes}` : order.name,
        variant: "success",
      })
    },
    [toast],
  )

  const handleDeleteOrder = useCallback(
    (id: number) => {
      const target = orders.find((order) => order.id === id)
      setOrders((previous) => previous.filter((order) => order.id !== id))
      if (target) {
        setActionSummary(`Order removed: ${target.name}.`)
        toast({
          title: "Order removed",
          description: target.notes ? `${target.name} · ${target.notes}` : target.name,
        })
      }
    },
    [orders, toast],
  )

  const handleCommandExecuted = useCallback(
    (command: string, source: "manual" | "voice") => {
      if (source === "voice") {
        const normalized = command.toLowerCase()
        if (normalized.includes("menú") || normalized.includes("menu")) {
          setOrdersPanelOpen(true)
          setActionSummary("Orders panel opened automatically from your voice command.")
        }
      }
    },
    [],
  )

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Header />

        {lastResult && (
          <div className="mb-6 space-y-4">
            <Badges result={lastResult} />
            {actionSummary && (
              <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))/0.3] p-4 text-sm" data-testid="action-summary">
                {actionSummary}
              </div>
            )}
          </div>
        )}

        {!lastResult && actionSummary && (
          <div className="mb-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))/0.3] p-4 text-sm" data-testid="action-summary">
            {actionSummary}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <CommandConsole
              onResult={setLastResult}
              explainMode={explainMode}
              onExplainModeChange={(value) => applyExplainMode(value, "ui")}
              onOpenCapabilities={() => openCapabilities("ui")}
              onCommandExecuted={handleCommandExecuted}
            />
            <Examples onResult={setLastResult} />
            <Checklist />
          </div>

          <div className="space-y-6">
            <OrdersPanel
              open={ordersPanelOpen}
              onOpenChange={setOrdersPanelOpen}
              orders={orders}
              onAddOrder={handleAddOrder}
              onDeleteOrder={handleDeleteOrder}
            />
            <Telemetry lastResult={lastResult} highlight={telemetryHighlight} onOpenModal={() => openTelemetry("ui")} />
            <McpPanel />
          </div>
        </div>

        <Footer />
      </div>

      <CapabilitiesModal
        open={capabilitiesOpen}
        onOpenChange={setCapabilitiesOpen}
        onQuickAction={handleCapabilitiesQuickAction}
      />

      <TelemetryModal
        open={telemetryModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setTelemetryModalOpen(false)
            clearHighlight()
          }
        }}
      />

      <Dialog open={Boolean(pendingAction)} onOpenChange={(open) => (!open ? handleCancel() : null)}>
        <DialogContent>
          <div data-testid="confirm-dialog" className="space-y-4">
            <DialogHeader>
              <DialogTitle>Confirm action</DialogTitle>
              <DialogDescription>
                {pendingAction?.description ?? "Are you sure you want to proceed?"}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="ghost" onClick={handleCancel} data-testid="confirm-no">
                Cancel
              </Button>
              <Button onClick={handleConfirm} data-testid="confirm-yes">
                Confirm
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <Toaster />
    </div>
  )
}
