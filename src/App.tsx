"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Link2, Sparkles, Trash2, Wand2 } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { Toaster } from "@/components/ui/toaster"
import Header from "@/components/Header"
import Badges from "@/components/Badges"
import CommandConsole from "@/components/CommandConsole"
import Examples from "@/components/Examples"
import Telemetry from "@/components/Telemetry"
import McpPanel from "@/components/McpPanel"
import Checklist from "@/components/Checklist"
import VoiceJourney from "@/components/VoiceJourney"
import Footer from "@/components/Footer"
import OrdersPanel, { type OrderItem } from "@/components/OrdersPanel"
import CapabilitiesModal, { type CapabilitiesQuickAction } from "@/components/CapabilitiesModal"
import TelemetryModal from "@/components/TelemetryModal"
import EventDock from "@/components/EventDock"
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
import { useNuraGlobalListener } from "@/hooks/useNuraGlobalListener"
import { eventBus } from "@/lib/telemetry"
import { nuraClient } from "@/lib/nuraClient"
import type { NuraResult } from "@/lib/types"
import {
  createInitialVoiceState,
  voiceStepOrder,
  type VoiceMessage,
  type VoiceStepId,
  type VoiceStepStatusMap,
} from "@/lib/voiceJourney"

interface PendingActionState {
  intent: string
  description: string
  payload?: Record<string, unknown>
  onConfirm?: () => void
  onCancel?: () => void
  source?: "voice" | "ui"
}

const guidedExamples = [
  {
    title: "Abre el menú de órdenes",
    description: "Descubre cómo navego por los pedidos con tu voz.",
    utterance: "ok nura abre el menú de órdenes",
  },
  {
    title: "Elimina una orden",
    description: "Prueba un flujo con confirmación automática.",
    utterance: "ok nura elimina la orden quince",
  },
  {
    title: "Confirma la acción",
    description: "Usa el sí que activa el modo de confirmación.",
    utterance: "sí, elimínala",
  },
  {
    title: "Muéstrame capacidades",
    description: "Abre el panel de ayuda y atajos.",
    utterance: "ok nura muestra capacidades",
  },
]

export default function App() {
  const [lastResult, setLastResult] = useState<NuraResult | null>(null)
  const [capabilitiesOpen, setCapabilitiesOpen] = useState(false)
  const [telemetryModalOpen, setTelemetryModalOpen] = useState(false)
  const [telemetryHighlight, setTelemetryHighlight] = useState(false)
  const [explainMode, setExplainMode] = useState(false)
  const [pendingAction, setPendingAction] = useState<PendingActionState | null>(null)
  const [actionSummary, setActionSummary] = useState<string | null>(null)
  const [ordersPanelOpen, setOrdersPanelOpen] = useState(true)
  const [orders, setOrders] = useState<OrderItem[]>([
    { id: 1, name: "Latte vainilla", notes: "Sin azúcar" },
    { id: 2, name: "Sandwich vegano", notes: "Agregar aderezo ligero" },
  ])
  const ordersRef = useRef<OrderItem[]>(orders)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [consoleUtterance, setConsoleUtterance] = useState("")
  const [voiceSteps, setVoiceSteps] = useState<VoiceStepStatusMap>(() => createInitialVoiceState())
  const [voiceMessages, setVoiceMessages] = useState<VoiceMessage[]>([])
  const [highlightedOrderId, setHighlightedOrderId] = useState<number | null>(null)
  const highlightTimeout = useRef<number | null>(null)
  const orderHighlightTimeout = useRef<number | null>(null)
  const timeFormatter = useMemo(() => new Intl.DateTimeFormat("es-MX", { hour: "2-digit", minute: "2-digit" }), [])
  const { toast } = useToast()

  useEffect(() => {
    const root = document.documentElement
    root.classList.add("dark")
    return () => {
      root.classList.remove("dark")
    }
  }, [])

  const appendVoiceMessage = useCallback(
    (message: { role: VoiceMessage["role"]; content: string }) => {
      const timestamp = timeFormatter.format(new Date())
      setVoiceMessages((previous) => [
        ...previous.slice(-9),
        {
          id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
          role: message.role,
          content: message.content,
          timestamp,
        },
      ])
    },
    [timeFormatter],
  )

  const markStepCompleted = useCallback((step: VoiceStepId) => {
    setVoiceSteps((previous) => {
      if (previous[step] === "completed") return previous
      const nextState: VoiceStepStatusMap = { ...previous, [step]: "completed" }
      const currentIndex = voiceStepOrder.indexOf(step)
      const nextStep = voiceStepOrder[currentIndex + 1]
      if (nextStep && nextState[nextStep] === "pending") {
        nextState[nextStep] = "active"
      }
      return nextState
    })
  }, [])

  const resetVoiceJourney = useCallback(() => {
    setVoiceSteps(createInitialVoiceState())
    setVoiceMessages([])
    setHighlightedOrderId(null)
  }, [])

  const flashOrderHighlight = useCallback((id: number) => {
    setHighlightedOrderId(id)
    if (orderHighlightTimeout.current) {
      window.clearTimeout(orderHighlightTimeout.current)
    }
    orderHighlightTimeout.current = window.setTimeout(() => {
      setHighlightedOrderId(null)
      orderHighlightTimeout.current = null
    }, 3200)
  }, [])

  const resolveOrderId = useCallback((value: unknown): number | null => {
    if (typeof value === "number" && !Number.isNaN(value)) {
      return value
    }
    if (typeof value === "string" && value.trim()) {
      const parsed = Number.parseInt(value, 10)
      return Number.isNaN(parsed) ? null : parsed
    }
    return null
  }, [])

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

  const handleExamplePrefill = useCallback(
    (exampleUtterance: string) => {
      setConsoleUtterance(exampleUtterance)
      setActionSummary(`Frase lista: "${exampleUtterance}".`)
    },
    [setActionSummary, setConsoleUtterance],
  )

  const openCapabilities = useCallback(
    (source: "ui" | "voice" | "keyboard" = "ui") => {
      setCapabilitiesOpen(true)
      setActionSummary("Te muestro todo lo que Nura puede hacer.")
      toast({
        title: "Guía rápida",
        description:
          source === "voice"
            ? "Lo abriste con tu voz."
            : source === "keyboard"
              ? "Atajo de teclado activado."
              : "Abrí el panel de capacidades para ti.",
        variant: "info",
      })
    },
    [toast],
  )

  const openTelemetry = useCallback(
    (source: "ui" | "voice" | "keyboard" = "ui") => {
      setTelemetryModalOpen(true)
      highlightTelemetryCard()
      setActionSummary("Mostré los indicadores en detalle.")
      toast({
        title: "Indicadores abiertos",
        description:
          source === "voice"
            ? "Llegaste aquí con tu voz."
            : source === "keyboard"
              ? "Atajo de teclado activado."
              : "Abrí la vista de indicadores para que explores.",
        variant: "info",
      })
    },
    [highlightTelemetryCard, toast],
  )

  const toggleTelemetry = useCallback(() => {
    setTelemetryModalOpen((prev) => {
      if (prev) {
        toast({ title: "Indicadores", description: "Cerré la vista avanzada" })
        clearHighlight()
        setActionSummary("Cerré los indicadores avanzados.")
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
            ? "Modo explicación encendido: solo te cuento qué haría."
            : "Modo explicación desactivado: vuelvo a ejecutar las acciones.",
        )
        toast({
          title: enabled ? "Modo explicación activado" : "Modo explicación desactivado",
          description:
            source === "voice"
              ? "Lo cambiaste con tu voz."
              : source === "keyboard"
                ? "Atajo de teclado activado."
                : "Actualicé el modo desde la interfaz.",
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

  useEffect(
    () => () => {
      if (orderHighlightTimeout.current) {
        window.clearTimeout(orderHighlightTimeout.current)
      }
    },
    [],
  )

  useEffect(() => {
    ordersRef.current = orders
  }, [orders])

  const handleAddOrder = useCallback(
    (order: { name: string; notes?: string }, source: "ui" | "voice" = "ui") => {
      const newOrder: OrderItem = {
        id: Date.now(),
        name: order.name,
        notes: order.notes,
      }
      setOrders((previous) => [...previous, newOrder])
      ordersRef.current = [...ordersRef.current, newOrder]
      setOrdersPanelOpen(true)
      setActionSummary(`Agregué ${newOrder.name} a la lista.`)
      toast({
        title: "Orden agregada",
        description: order.notes ? `${order.name} · ${order.notes}` : order.name,
        variant: "success",
      })
      flashOrderHighlight(newOrder.id)
      if (source === "voice") {
        markStepCompleted("addOrder")
        appendVoiceMessage({
          role: "nura",
          content: `Agregué la orden ${newOrder.name}${order.notes ? ` (${order.notes})` : ""}.`,
        })
      }
    },
    [appendVoiceMessage, flashOrderHighlight, markStepCompleted, toast],
  )

  const handleUpdateOrder = useCallback(
    (update: { id: number; name?: string; notes?: string }, source: "ui" | "voice" = "ui") => {
      let updatedOrder: OrderItem | null = null
      setOrders((previous) => {
        const exists = previous.find((order) => order.id === update.id)
        if (!exists) {
          return previous
        }
        updatedOrder = {
          ...exists,
          name: update.name?.trim() ? update.name : exists.name,
          notes: update.notes?.trim() ? update.notes : exists.notes,
        }
        return previous.map((order) => (order.id === update.id ? updatedOrder! : order))
      })

      if (!updatedOrder) {
        toast({
          title: "No encontré la orden",
          description: "Necesito una orden existente para actualizarla",
          variant: "destructive",
        })
        return
      }

      ordersRef.current = ordersRef.current.map((order) => (order.id === updatedOrder!.id ? updatedOrder! : order))
      setOrdersPanelOpen(true)
      setActionSummary(`Actualicé ${updatedOrder.name} tal como querías.`)
      toast({
        title: "Orden actualizada",
        description: updatedOrder.notes ? `${updatedOrder.name} · ${updatedOrder.notes}` : updatedOrder.name,
        variant: source === "voice" ? "success" : "default",
      })
      flashOrderHighlight(updatedOrder.id)
      if (source === "voice") {
        markStepCompleted("updateOrder")
        appendVoiceMessage({
          role: "nura",
          content: `Actualicé la orden ${updatedOrder.name}${updatedOrder.notes ? ` · ${updatedOrder.notes}` : ""}.`,
        })
      }
    },
    [appendVoiceMessage, flashOrderHighlight, markStepCompleted, toast],
  )

  const handleDeleteOrder = useCallback(
    (id: number) => {
      const target = orders.find((order) => order.id === id)
      setOrders((previous) => previous.filter((order) => order.id !== id))
      ordersRef.current = ordersRef.current.filter((order) => order.id !== id)
      if (target) {
        setActionSummary(`Eliminé ${target.name} de la lista.`)
        toast({
          title: "Orden eliminada",
          description: target.notes ? `${target.name} · ${target.notes}` : target.name,
        })
      }
    },
    [orders, toast],
  )

  const handleVoiceAdd = useCallback(
    (data: { name?: string; notes?: string }) => {
      const voiceName = data.name && data.name.trim() ? data.name : "Orden sorpresa"
      handleAddOrder({ name: voiceName, notes: data.notes?.trim() ? data.notes : undefined }, "voice")
    },
    [handleAddOrder],
  )

  const handleVoiceUpdate = useCallback(
    (data: { id?: unknown; name?: string; notes?: string }) => {
      const resolved = resolveOrderId(data.id)
      const lastOrderId = ordersRef.current.length ? ordersRef.current[ordersRef.current.length - 1].id : null
      const fallbackId = resolved ?? lastOrderId
      if (fallbackId === null) {
        toast({
          title: "Aún no hay órdenes",
          description: "Primero agrega una orden y luego la actualizamos",
          variant: "destructive",
        })
        return
      }
      handleUpdateOrder(
        {
          id: fallbackId,
          name: data.name?.trim() ? data.name : undefined,
          notes: data.notes?.trim() ? data.notes : undefined,
        },
        "voice",
      )
    },
    [handleUpdateOrder, resolveOrderId, toast],
  )

  const handleConfirm = useCallback(() => {
    if (!pendingAction) {
      toast({ title: "Sin acciones pendientes", description: "No hay nada que confirmar", variant: "destructive" })
      return
    }

    if (pendingAction.onConfirm) {
      pendingAction.onConfirm()
      setPendingAction(null)
      return
    }

    const success = nuraClient.confirmPendingAction()
    if (!success) {
      toast({ title: "No pude confirmar", description: "No había nada en espera", variant: "destructive" })
    }
    // This is the key: stop listening for confirmation once the action is done.
    setIsListeningForConfirmation(false)
    setPendingAction(null)
  }, [pendingAction, resolveOrderId, handleDeleteOrder, markStepCompleted, appendVoiceMessage, toast])

  const handleCancel = useCallback(() => {
    if (!pendingAction) return
    pendingAction.onCancel?.()
    if (!pendingAction.onConfirm) {
      nuraClient.cancelPendingAction()
    }
    setPendingAction(null)
  }, [pendingAction])

  const guidedExamples = useMemo(
    () => [
      {
        title: "Pedir un latte cremoso",
        utterance: "ok nura agrega una orden de latte vainilla sin azúcar",
        description: "Ideal para probar cómo capto nuevas órdenes.",
      },
      {
        title: "Revisar tus pedidos",
        utterance: "ok nura abre el menú de órdenes",
        description: "Abro el panel para que veas todo.",
      },
      {
        title: "Explorar habilidades",
        utterance: "ok nura muestra tus capacidades",
        description: "Te cuento lo que puedo hacer por ti.",
      },
    ],
    [],
  )

  const handleExamplePrefill = useCallback((phrase: string) => {
    setConsoleUtterance(phrase)
    setActionSummary("Frase lista en la consola, ejecútala cuando quieras.")
    eventBus.emit("ui.examples.prefill", { utterance: phrase })
  }, [])

  const handleDeleteOrderPrompt = useCallback(() => {
    setPendingAction({
      intent: "delete::order",
      description: "¿Eliminamos la orden 15?",
      payload: { id: 15 },
      source: "ui",
      onConfirm: () => {
        handleDeleteOrder(15)
        eventBus.emit("ui.order.manualDeleted", { id: 15 })
      },
    })
    setActionSummary("Puedo borrar la orden 15 cuando me lo confirmes.")
  }, [handleDeleteOrder])

  const handleCapabilitiesClick = useCallback(() => {
    openCapabilities("ui")
    eventBus.emit("ui.capabilities.manual", { source: "menu" })
  }, [openCapabilities])

  const handleMcpConnectClick = useCallback(() => {
    setShowAdvanced(true)
    setActionSummary("Abriendo el puente con MCP…")
    eventBus.emit("ui.mcp.connect.manual", { source: "menu" })
    eventBus.emit("mcp.request.connect", { source: "menu" })
  }, [])

  const menuActions = useMemo(
    () =>
      [
        {
          label: "Abrir menú de órdenes",
          hint: "Gestiona pedidos con un toque mágico.",
          onClick: () => {
            setOrdersPanelOpen(true)
            setActionSummary("Abrí el menú de órdenes para seguir contigo.")
            eventBus.emit("ui.menu.quick-open", { source: "menu" })
          },
          testId: "btn-open-orders",
          variant: "primary" as const,
          icon: Sparkles,
        },
        {
          label: "Eliminar orden 15",
          hint: "Te pido confirmación antes de limpiar la lista.",
          onClick: handleDeleteOrderPrompt,
          testId: "btn-delete-15",
          variant: "destructive" as const,
          icon: Trash2,
        },
        {
          label: "Capacidades de Nura",
          hint: "Descubre todo lo que puedo hacer contigo.",
          onClick: handleCapabilitiesClick,
          testId: "btn-show-capabilities",
          variant: "secondary" as const,
          icon: Wand2,
        },
        {
          label: "Conectar MCP",
          hint: "Enlazo el puente con tus herramientas externas.",
          onClick: handleMcpConnectClick,
          testId: "btn-mcp-connect",
          variant: "secondary" as const,
          icon: Link2,
        },
      ] satisfies Array<{
        label: string
        hint: string
        onClick: () => void
        testId: string
        variant: "primary" | "secondary" | "destructive"
        icon: LucideIcon
      }>,
    [handleCapabilitiesClick, handleDeleteOrderPrompt, handleMcpConnectClick],
  )

  useEffect(() => {
    const handleCapabilities = () => openCapabilities("voice")
    const handleTelemetry = () => openTelemetry("voice")
    const handleExplainToggle = (data: { enabled: boolean }) => applyExplainMode(data.enabled, "voice")
    const handleVoiceWake = (data: { wake: string; canonical: string; confidence: number }) => {
      toast({
        title: "Te escuché",
        description: `Reconocí "${data.wake}" con un ${Math.round(data.confidence * 100)}% de coincidencia.`,
        variant: "info",
      })
    }
    const handleMenuOpen = () => {
      setOrdersPanelOpen(true)
      setActionSummary("Abrí el menú de órdenes para seguir contigo.")
      markStepCompleted("openMenu")
      appendVoiceMessage({ role: "nura", content: "Abrí el menú de órdenes, listo para crear o ajustar pedidos." })
      toast({ title: "Órdenes", description: "El menú ya está abierto", variant: "success" })
    }
    const handlePending = (data: PendingActionState) => {
      setPendingAction({ ...data, source: "voice" })
      setActionSummary(data.description ? `Necesito tu confirmación: ${data.description}` : "Necesito tu confirmación.")
      toast({
        title: "¿Seguimos?",
        description: data.description,
        variant: "destructive",
      })
      appendVoiceMessage({
        role: "nura",
        content: `${data.description}. Solo confirma y me encargo.`,
      })
      // This is the magic: automatically start listening for the "yes" or "no".
      setIsListeningForConfirmation(true)
    }
    const handleCancelled = (data: PendingActionState) => {
      setPendingAction(null)
      setActionSummary("Cancelé la acción, nada cambió.")
      toast({ title: "Acción cancelada", description: data.description })
      appendVoiceMessage({ role: "nura", content: `Perfecto, cancelé: ${data.description}.` })
    }
    const handleDeleted = (data: { id?: unknown }) => {
      setPendingAction(null)
      const id = data.id ?? "(unknown)"
      const numericId = resolveOrderId(id)
      setActionSummary(`Listo, la orden ${numericId ?? id} ya no está.`)
      toast({ title: "Orden eliminada", description: `Quité la orden ${id}`, variant: "success" })
      if (numericId !== null) {
        setOrders((previous) => previous.filter((order) => order.id !== numericId))
        ordersRef.current = ordersRef.current.filter((order) => order.id !== numericId)
        if (highlightedOrderId === numericId) {
          setHighlightedOrderId(null)
        }
      }
      markStepCompleted("deleteOrder")
      appendVoiceMessage({
        role: "nura",
        content: `Orden ${numericId ?? id} eliminada. Checklist completo.`,
      })
    }
    const handleContextConfirm = (data: { previous: PendingActionState }) => {
      const desc = data.previous.description || data.previous.intent
      setActionSummary(desc ? `Confirmado: ${desc}` : "Confirmación recibida.")
      toast({ title: "Confirmado", description: desc, variant: "success" })
    }
    const handleMcpConnected = (data: { url?: string }) => {
      setActionSummary(`Conecté MCP${data.url ? ` a ${data.url}` : ""}.`)
    }
    const handleMcpDisconnected = () => {
      setActionSummary("Desconecté MCP.")
    }
    const handleMcpResources = (data: { count?: number }) => {
      setActionSummary(`Listé ${data.count ?? 0} recursos de MCP.`)
    }
    const handleMcpTools = (data: { count?: number }) => {
      setActionSummary(`Listé ${data.count ?? 0} herramientas de MCP.`)
    }
    const handleMcpError = (data: { error?: string }) => {
      toast({ title: "Algo falló con MCP", description: data.error ?? "No pude completar la acción", variant: "destructive" })
    }
    const handleDialogConfirmEvent = () => {
      handleConfirm()
    }
    const handleDialogCancelEvent = () => {
      handleCancel()
    }

    eventBus.on("ui.capabilities.open", handleCapabilities)
    eventBus.on("ui.telemetry.open", handleTelemetry)
    eventBus.on("ui.explain.toggle", handleExplainToggle)
    eventBus.on("voice.wake.fuzzy", handleVoiceWake)
    eventBus.on("ui.menu.open", handleMenuOpen)
    eventBus.on("action.cancelled", handleCancelled)
    eventBus.on("order.voice.add", handleVoiceAdd)
    eventBus.on("order.voice.update", handleVoiceUpdate)
    eventBus.on("context.confirmation", handleContextConfirm)
    eventBus.on("mcp.connected", handleMcpConnected)
    eventBus.on("mcp.connected.ui", handleMcpConnected)
    eventBus.on("mcp.disconnected", handleMcpDisconnected)
    eventBus.on("mcp.disconnected.ui", handleMcpDisconnected)
    eventBus.on("mcp.resources.listed", handleMcpResources)
    eventBus.on("mcp.tools.listed", handleMcpTools)
    eventBus.on("mcp.error", handleMcpError)
    eventBus.on("ui.dialog.confirm", handleDialogConfirmEvent)
    eventBus.on("ui.dialog.cancel", handleDialogCancelEvent)
    // The action.pending event is the single source of truth to open the dialog
    eventBus.on("action.pending", handlePending)

    return () => {
      eventBus.off("ui.capabilities.open", handleCapabilities)
      eventBus.off("ui.telemetry.open", handleTelemetry)
      eventBus.off("ui.explain.toggle", handleExplainToggle)
      eventBus.off("voice.wake.fuzzy", handleVoiceWake)
      eventBus.off("ui.menu.open", handleMenuOpen)
      eventBus.off("action.cancelled", handleCancelled)
      eventBus.off("order.voice.add", handleVoiceAdd)
      eventBus.off("order.voice.update", handleVoiceUpdate)
      eventBus.off("context.confirmation", handleContextConfirm)
      eventBus.off("mcp.connected", handleMcpConnected)
      eventBus.off("mcp.connected.ui", handleMcpConnected)
      eventBus.off("mcp.disconnected", handleMcpDisconnected)
      eventBus.off("mcp.disconnected.ui", handleMcpDisconnected)
      eventBus.off("mcp.resources.listed", handleMcpResources)
      eventBus.off("mcp.tools.listed", handleMcpTools)
      eventBus.off("mcp.error", handleMcpError)
      eventBus.off("ui.dialog.confirm", handleDialogConfirmEvent)
      eventBus.off("ui.dialog.cancel", handleDialogCancelEvent)
      eventBus.off("action.pending", handlePending)
    }
  }, [
    appendVoiceMessage,
    applyExplainMode,
    handleAddOrder,
    handleCancel,
    handleConfirm,
    handleVoiceAdd,
    handleVoiceUpdate,
    highlightedOrderId,
    markStepCompleted,
    openCapabilities,
    openTelemetry,
    resolveOrderId,
    toast,
  ])

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

  const handleCommandExecuted = useCallback(
    (command: string, source: "manual" | "voice") => {
      if (source === "voice") {
        const normalized = command.toLowerCase()
        appendVoiceMessage({ role: "user", content: command })
        if (normalized.includes("menú") || normalized.includes("menu")) {
          setOrdersPanelOpen(true)
          setShowAdvanced(true)
          setActionSummary("Abrí el menú de órdenes gracias a tu voz.")
          markStepCompleted("openMenu")
        }
      }
    },
    [appendVoiceMessage, markStepCompleted],
  )

  useNuraGlobalListener({
    orders,
    ordersOpen: ordersPanelOpen,
    capabilitiesOpen,
    telemetryOpen: telemetryModalOpen,
    pendingAction,
    confirmActionTestId: "confirm-yes",
    cancelActionTestId: "confirm-no",
  })

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.25),_transparent_65%),_radial-gradient(circle_at_bottom,_rgba(52,211,153,0.2),_transparent_70%)] text-[hsl(var(--foreground))]">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.25),_transparent_60%),radial-gradient(circle_at_bottom_right,_rgba(6,182,212,0.18),_transparent_70%)]" />
      <main className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 pb-36 pt-16 sm:px-6 lg:px-10">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
          <section
            data-testid="guided-demo"
            className="relative overflow-hidden rounded-3xl border border-[hsl(var(--border))/60] bg-[hsl(var(--card))/0.65] p-8 shadow-[0_25px_80px_rgba(99,102,241,0.25)] backdrop-blur-xl transition-all duration-500"
          >
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(129,140,248,0.15),_transparent_55%)]" />
            <div className="flex items-center gap-3 text-sm font-medium text-primary">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/15 shadow-[0_0_20px_rgba(129,140,248,0.45)]">
                <Sparkles className="h-4 w-4" />
              </span>
              Demo guiada por voz
            </div>
            <h1 className="mt-6 text-3xl font-semibold leading-tight text-[hsl(var(--foreground))] sm:text-4xl">
              Explora Nura sin tecnicismos
            </h1>
            <p className="mt-4 max-w-xl text-base text-[hsl(var(--foreground))/0.75]">
              Prueba frases cotidianas, mira cómo reacciono y descubre nuevas formas de colaborar solo con tu voz.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {guidedExamples.map((example) => (
                <button
                  key={example.utterance}
                  type="button"
                  onClick={() => handleExamplePrefill(example.utterance)}
                  className="group relative overflow-hidden rounded-2xl border border-[hsl(var(--border))/50] bg-[hsl(var(--muted))/0.3] px-4 py-3 text-left transition-all duration-500 hover:scale-[1.01] hover:border-primary/60 hover:bg-primary/10"
                >
                  <div className="text-sm font-semibold text-[hsl(var(--foreground))]">{example.title}</div>
                  <p className="mt-1 text-xs text-[hsl(var(--foreground))/0.7]">{example.description}</p>
                  <span className="absolute -right-8 top-1/2 h-20 w-20 -translate-y-1/2 rounded-full bg-primary/20 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />
                </button>
              ))}
            </div>

          </section>

          <section className="relative h-full space-y-8">
            <div className="rounded-3xl border border-[hsl(var(--border))/60] bg-[hsl(var(--card))/0.6] p-6 shadow-[0_20px_60px_rgba(59,130,246,0.25)] backdrop-blur-xl">
              <h2 className="text-lg font-semibold text-[hsl(var(--foreground))]">Menú interactivo</h2>
              <p className="mt-2 text-sm text-[hsl(var(--foreground))/0.75]">
                Accede rápido a las acciones más usadas o lánzalas con tu voz cuando quieras.
              </p>
              <div className="mt-6 grid gap-3 md:grid-cols-2">
                {menuActions.map((action) => {
                  const Icon = action.icon
                  return (
                    <button
                      key={action.testId}
                      type="button"
                      data-testid={action.testId}
                      onClick={action.onClick}
                      className={`group flex flex-col gap-1 rounded-2xl border px-4 py-4 text-left transition-all duration-500 hover:scale-[1.01] hover:shadow-[0_25px_60px_rgba(129,140,248,0.35)] ${
                        action.variant === "primary"
                          ? "border-primary/60 bg-primary/20 text-[hsl(var(--foreground))]"
                          : action.variant === "destructive"
                            ? "border-rose-500/40 bg-rose-500/15 text-[hsl(var(--foreground))] hover:border-rose-400/60"
                            : "border-[hsl(var(--border))/60] bg-[hsl(var(--muted))/0.3]"
                      }`}
                    >
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        <Icon className="h-4 w-4" />
                        {action.label}
                      </div>
                      <p className="text-xs text-[hsl(var(--foreground))/0.7]">{action.hint}</p>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="rounded-3xl border border-[hsl(var(--border))/60] bg-[hsl(var(--card))/0.6] p-6 shadow-[0_20px_60px_rgba(15,118,110,0.25)] backdrop-blur-xl">
              <h2 className="sr-only">Interactive Orders</h2>
              <OrdersPanel
                open={ordersPanelOpen}
                onOpenChange={setOrdersPanelOpen}
                orders={orders}
                onAddOrder={(order) => handleAddOrder(order, "ui")}
                onDeleteOrder={handleDeleteOrder}
                onUpdateOrder={(update) => handleUpdateOrder(update, "ui")}
                highlightedOrderId={highlightedOrderId}
              />
            </div>
          </section>
        </div>

        {actionSummary && (
          <div className="mt-12">
            <div
              className="rounded-3xl border border-[hsl(var(--border))/50] bg-[hsl(var(--card))/0.6] px-6 py-4 text-sm text-[hsl(var(--foreground))] shadow-[0_20px_60px_rgba(14,165,233,0.25)] backdrop-blur-xl"
              data-testid="action-summary"
            >
              {actionSummary}
            </div>
          </div>
        )}

        <div className="mt-10 flex items-center justify-center">
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowAdvanced((previous) => !previous)}
            data-testid="btn-advanced-toggle"
            aria-expanded={showAdvanced}
            aria-controls="advanced"
            className="rounded-2xl border-[hsl(var(--border))/60] bg-[hsl(var(--card))/0.5] px-6 py-3 text-sm font-medium text-[hsl(var(--foreground))] shadow-[0_10px_40px_rgba(129,140,248,0.25)] backdrop-blur-lg transition-all duration-300 hover:scale-[1.02] hover:border-primary/60 hover:bg-primary/20"
          >
            {showAdvanced ? "Ocultar herramientas avanzadas" : "Mostrar herramientas avanzadas"}
          </Button>
        </div>

        <div
          id="advanced"
          className={`mt-8 overflow-hidden transition-all duration-500 ease-out ${
            showAdvanced ? "max-h-[4000px] opacity-100" : "max-h-0 opacity-0 pointer-events-none"
          }`}
        >
          <div className="space-y-10 rounded-3xl border border-[hsl(var(--border))/60] bg-[hsl(var(--card))/0.55] p-8 shadow-[0_30px_120px_rgba(99,102,241,0.35)] backdrop-blur-2xl">
            <Header />
            {lastResult && <Badges result={lastResult} />}
            <div className="grid gap-8 lg:grid-cols-2">
              <div className="space-y-6">
                <VoiceJourney steps={voiceSteps} messages={voiceMessages} onReset={resetVoiceJourney} />
                <Examples onResult={setLastResult} />
                <Checklist voiceStatuses={voiceSteps} />
              </div>
              <div className="space-y-6">
                <Telemetry lastResult={lastResult} highlight={telemetryHighlight} onOpenModal={() => openTelemetry("ui")} />
                <McpPanel />
              </div>
            </div>
          </div>
          <div className="mt-8">
            <Footer />
          </div>
        </div>
      </main>

      <CommandConsole
        utterance={consoleUtterance}
        onUtteranceChange={setConsoleUtterance}
        onResult={setLastResult}
        explainMode={explainMode}
        onCommandExecuted={handleCommandExecuted}
      />
      <EventDock />

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
              <DialogTitle>¿Lo confirmamos?</DialogTitle>
              <DialogDescription>
                {pendingAction?.description ?? "¿Quieres que continúe con esta acción?"}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="ghost" onClick={handleCancel} data-testid="confirm-no" nuraAction="cancel">
                No por ahora
              </Button>
              <Button onClick={handleConfirm} data-testid="confirm-yes" nuraAction="confirm">
                Sí, hazlo
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <Toaster />
    </div>
  )
}
