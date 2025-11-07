"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Sparkles, Wand2 } from "lucide-react"
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

export default function App() {
  const [lastResult, setLastResult] = useState<NuraResult | null>(null)
  const [capabilitiesOpen, setCapabilitiesOpen] = useState(false)
  const [telemetryModalOpen, setTelemetryModalOpen] = useState(false)
  const [telemetryHighlight, setTelemetryHighlight] = useState(false)
  const [explainMode, setExplainMode] = useState(false)
  const [pendingAction, setPendingAction] = useState<PendingActionState | null>(null)
  const [isListeningForConfirmation, setIsListeningForConfirmation] = useState(false)
  const [actionSummary, setActionSummary] = useState<string | null>(null)
  const [ordersPanelOpen, setOrdersPanelOpen] = useState(false)
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

  const resolveOrderId = useCallback(
    (value: unknown): number | null => {
      let numericValue: number | null = null
      if (typeof value === "number" && !Number.isNaN(value)) {
        numericValue = value
      } else if (typeof value === "string" && value.trim()) {
        const parsed = Number.parseInt(value, 10)
        if (!Number.isNaN(parsed)) {
          numericValue = parsed
        }
      }

      if (numericValue === null) return null

      // 1. Búsqueda por ID directo (prioridad alta)
      const directMatch = orders.find((order) => order.id === numericValue)
      if (directMatch) return directMatch.id

      // 2. Búsqueda por posición (fallback)
      const positionalIndex = numericValue - 1
      if (positionalIndex >= 0 && positionalIndex < orders.length) return orders[positionalIndex].id

      return null
    },
    [orders],
  )

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
      setActionSummary("Frase lista en la consola, ejecútala cuando quieras.")
      eventBus.emit("ui.examples.prefill", { utterance: exampleUtterance })
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
      setOrders((previous) => {
        const exists = previous.find((order) => order.id === update.id)
        if (!exists) {
          toast({
            title: "No encontré la orden",
            description: "Necesito una orden existente para actualizarla",
            variant: "destructive",
          })
          return previous
        }

        const updatedOrder: OrderItem = {
          ...exists,
          name: update.name?.trim() ? update.name : exists.name,
          notes: update.notes?.trim() ? update.notes : exists.notes,
        }

        // This logic now runs inside the state updater, where it's safe
        ordersRef.current = previous.map((order) => (order.id === updatedOrder.id ? updatedOrder : order))
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

        return ordersRef.current
      })
    },
    [appendVoiceMessage, flashOrderHighlight, markStepCompleted, toast], // Dependencies are correct without `orders` because we use the updater function form of `setOrders`
  )

  const handleDeleteOrder = useCallback(
    (id: number, source: "ui" | "voice" = "ui") => {
      const resolvedId = source === "voice" ? resolveOrderId(id) : id
      if (resolvedId === null) {
        toast({ title: "Orden no encontrada", description: `No encontré la orden número ${id}.`, variant: "destructive" })
        return
      }
      setOrders((previous) => {
        const target = previous.find((order) => order.id === resolvedId)
        if (!target) return previous

        const nextOrders = previous.filter((order) => order.id !== resolvedId)
        ordersRef.current = nextOrders

        setActionSummary(`Eliminé ${target.name} de la lista.`)
        toast({
          title: "Orden eliminada",
          description: target.notes ? `${target.name} · ${target.notes}` : target.name,
          variant: "success",
        })

        if (source === "voice") {
          markStepCompleted("deleteOrder")
          appendVoiceMessage({ role: "nura", content: `Listo, eliminé la orden ${target.name}.` })
        }
        return nextOrders
      })
    },
    [resolveOrderId, toast, markStepCompleted, appendVoiceMessage],
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
      const targetId = resolveOrderId(data.id)
      const fallbackId = targetId ?? (ordersRef.current.length > 0 ? ordersRef.current[ordersRef.current.length - 1].id : null)
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
      setPendingAction(null)
      return
    }

    const success = nuraClient.confirmPendingAction()
    if (!success) {
      toast({ title: "No pude confirmar", description: "No había nada en espera", variant: "destructive" })
    }

    setIsListeningForConfirmation(false)
    setPendingAction(null)
  }, [pendingAction, toast])

  const handleCancel = useCallback(() => {
    if (pendingAction) {
      nuraClient.cancelPendingAction()
    }
    setIsListeningForConfirmation(false)
    setPendingAction(null)
    toast({ title: "Action cancelled" })
  }, [pendingAction, toast])

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

  // This effect ensures that if the confirmation flow is aborted from outside
  // (e.g., by starting a new command), the microphone in CommandConsole stops.
  useEffect(() => {
    if (!isListeningForConfirmation) {
      eventBus.emit("voice.confirmation.cancel")
    }
  }, [isListeningForConfirmation])

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

  const nuraInfo = {
    title: "¿Qué es Nura?",
    description:
      "Interfaz de voz inteligente que transforma comandos naturales en acciones ejecutables. Diseñada para gestión de órdenes con IA conversacional.",
  }

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
      setPendingAction(data)
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
      setIsListeningForConfirmation(true)
    }
    const handleCancelled = (data: PendingActionState) => {
      setPendingAction(null)
      setIsListeningForConfirmation(false)
      setActionSummary("Cancelé la acción, nada cambió.")
      toast({ title: "Acción cancelada", description: data.description ?? "La operación fue cancelada." })
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
      toast({
        title: "Algo falló con MCP",
        description: data.error ?? "No pude completar la acción",
        variant: "destructive",
      })
    }
    const handleDialogConfirmEvent = () => {
      handleConfirm()
    }
    const handleDialogCancelEvent = () => {
      handleCancel()
    }
    const handleActionConfirmed = (data: { intent: string; payload?: Record<string, unknown> }) => {
      const rawId = data.payload?.id
      const orderId = resolveOrderId(rawId)

      if (orderId !== null) {
        handleDeleteOrder(orderId, "voice")
      } else if (rawId) {
        toast({ title: "Orden no encontrada", description: `No pude encontrar la orden ${rawId} para eliminarla.`, variant: "destructive" })
      }
    }

    eventBus.on("ui.capabilities.open", handleCapabilities)
    eventBus.on("ui.telemetry.open", handleTelemetry)
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
    eventBus.on("action.confirmed", handleActionConfirmed)
    eventBus.on("ui.explain.toggle", handleExplainToggle)
    eventBus.on("action.pending", handlePending)

    return () => {
      eventBus.off("ui.capabilities.open", handleCapabilities)
      eventBus.off("ui.telemetry.open", handleTelemetry)
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
      eventBus.off("action.confirmed", handleActionConfirmed)
      eventBus.off("ui.explain.toggle", handleExplainToggle)
      eventBus.off("action.pending", handlePending)
    }
  }, [
    appendVoiceMessage,
    applyExplainMode,
    handleAddOrder,
    handleCancel,
    handleConfirm,
    handleDeleteOrder,
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
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-black via-slate-950 to-purple-950/20">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.15),transparent_50%),radial-gradient(ellipse_at_bottom_right,rgba(139,92,246,0.15),transparent_50%)]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        {/* Sparkles flotantes */}
        <div className="absolute top-20 left-1/4 animate-float">
          <Sparkles className="w-4 h-4 text-blue-400/40" />
        </div>
        <div className="absolute top-40 right-1/3 animate-float animation-delay-2000">
          <Sparkles className="w-3 h-3 text-purple-400/40" />
        </div>
        <div className="absolute bottom-40 left-1/3 animate-float animation-delay-4000">
          <Sparkles className="w-5 h-5 text-cyan-400/40" />
        </div>
        <div className="absolute top-1/2 right-1/4 animate-float animation-delay-3000">
          <Sparkles className="w-4 h-4 text-indigo-400/40" />
        </div>
      </div>

      <main className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 pb-36 pt-16 sm:px-6 lg:px-10">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
          <section
            data-testid="guided-demo"
            className="relative overflow-hidden rounded-3xl border border-blue-500/20 bg-gradient-to-br from-slate-950/95 via-slate-900/90 to-purple-950/40 p-8 shadow-[0_0_80px_rgba(59,130,246,0.3)] backdrop-blur-2xl transition-all duration-700 hover:shadow-[0_0_100px_rgba(139,92,246,0.4)] hover:scale-[1.01]"
          >
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.1),transparent_70%)]" />
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />

            <div className="flex items-center gap-3 text-sm font-medium text-white">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/30 to-purple-500/30 shadow-[0_0_30px_rgba(59,130,246,0.5)] backdrop-blur-sm animate-pulse">
                <Sparkles className="h-5 w-5 text-cyan-200" />
              </span>
              Demo Guiada por Voz
            </div>

            <h1 className="mt-6 text-4xl font-bold leading-tight bg-gradient-to-r from-white via-white to-cyan-100 bg-clip-text text-transparent sm:text-5xl animate-gradient">
              Nura Voice Interface
            </h1>

            <p className="mt-4 max-w-xl text-base text-white leading-relaxed font-medium">
              Interfaz de voz inteligente que transforma comandos naturales en acciones ejecutables. Habla naturalmente
              y observa la magia.
            </p>

            <div className="mt-8">
              <VoiceJourney steps={voiceSteps} messages={voiceMessages} onReset={resetVoiceJourney} />
            </div>

            <div className="mt-8 space-y-3">
              <p className="text-sm font-semibold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Ejemplos para comenzar
              </p>
              <div className="grid gap-3 sm:grid-cols-1">
                {guidedExamples.map((example, idx) => (
                  <button
                    key={example.utterance}
                    type="button"
                    onClick={() => handleExamplePrefill(example.utterance)}
                    className="group relative overflow-hidden rounded-2xl border border-blue-500/30 bg-gradient-to-br from-slate-950/80 to-slate-950/80 px-5 py-4 text-left transition-all duration-500 hover:scale-[1.02] hover:border-blue-400/60 hover:shadow-[0_0_30px_rgba(59,130,246,0.4)] animate-fade-in-up backdrop-blur-sm"
                    style={{ animationDelay: `${idx * 100}ms` }}
                  >
                    <div className="text-sm font-semibold text-white">{example.title}</div>
                    <p className="mt-1 text-xs text-slate-100">{example.description}</p>
                    <span className="absolute -right-8 top-1/2 h-24 w-24 -translate-y-1/2 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />
                    <Sparkles className="absolute top-3 right-3 w-3 h-3 text-blue-400/0 group-hover:text-blue-400/60 transition-all duration-300" />
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-8 rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-950/40 to-slate-950/60 p-4 backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500/30 to-blue-500/30">
                    <Wand2 className="h-4 w-4 text-purple-200" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm text-white mb-1">{nuraInfo.title}</h4>
                  <p className="text-xs text-slate-100 leading-relaxed">{nuraInfo.description}</p>
                </div>
              </div>
            </div>
          </section>

          <section
            className={`relative h-full transition-all duration-700 ${ordersPanelOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}`}
          >
            {ordersPanelOpen && (
              <>
                <div className="absolute -top-4 -left-4 animate-sparkle-orbit">
                  <Sparkles className="w-6 h-6 text-cyan-400" />
                </div>
                <div className="absolute -top-2 -right-6 animate-sparkle-orbit animation-delay-1000">
                  <Sparkles className="w-5 h-5 text-blue-400" />
                </div>
                <div className="absolute top-1/4 -left-6 animate-sparkle-orbit animation-delay-2000">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                </div>
                <div className="absolute top-1/2 -right-8 animate-sparkle-orbit animation-delay-1500">
                  <Sparkles className="w-6 h-6 text-indigo-400" />
                </div>
                <div className="absolute bottom-1/4 -left-4 animate-sparkle-orbit animation-delay-3000">
                  <Sparkles className="w-5 h-5 text-cyan-300" />
                </div>
                <div className="absolute -bottom-4 -right-6 animate-sparkle-orbit animation-delay-500">
                  <Sparkles className="w-4 h-4 text-blue-300" />
                </div>
              </>
            )}
            <div
              className={`rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-cyan-900/30 p-6 shadow-[0_0_80px_rgba(6,182,212,0.3)] backdrop-blur-2xl ${ordersPanelOpen ? "animate-magical-appear" : ""}`}
            >
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
          <div className="mt-12 animate-fade-in-up">
            <div
              className="rounded-3xl border border-blue-500/30 bg-gradient-to-r from-slate-900/80 via-blue-900/20 to-purple-900/20 px-6 py-4 text-sm text-blue-100 shadow-[0_0_60px_rgba(59,130,246,0.3)] backdrop-blur-xl"
              data-testid="action-summary"
            >
              <Sparkles className="inline w-4 h-4 mr-2 text-blue-400" />
              {actionSummary}
            </div>
          </div>
        )}

        <div className="mt-16 flex items-center justify-center">
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowAdvanced((previous) => !previous)}
            data-testid="btn-advanced-toggle"
            aria-expanded={showAdvanced}
            aria-controls="advanced"
            className="group relative overflow-hidden rounded-2xl border-purple-500/30 bg-gradient-to-r from-slate-900/80 to-purple-900/40 px-8 py-4 text-sm font-medium text-purple-200 shadow-[0_0_40px_rgba(139,92,246,0.3)] backdrop-blur-lg transition-all duration-500 hover:scale-[1.05] hover:border-purple-400/60 hover:shadow-[0_0_60px_rgba(139,92,246,0.5)]"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-purple-500/20 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <Sparkles className="inline w-4 h-4 mr-2" />
            {showAdvanced ? "Ocultar herramientas técnicas" : "Mostrar herramientas técnicas"}
          </Button>
        </div>

        <div
          id="advanced"
          className={`mt-8 overflow-hidden transition-all duration-700 ease-out ${
            showAdvanced ? "max-h-[5000px] opacity-100" : "max-h-0 opacity-0 pointer-events-none"
          }`}
        >
          <div className="space-y-10 rounded-3xl border border-purple-500/20 bg-gradient-to-br from-slate-900/80 via-purple-900/10 to-slate-900/80 p-8 shadow-[0_0_120px_rgba(139,92,246,0.4)] backdrop-blur-2xl animate-fade-in-up">
            <Header />
            {lastResult && <Badges result={lastResult} />}

            <div className="grid gap-8 lg:grid-cols-2">
              <div className="space-y-6">
                <div className="rounded-2xl border border-blue-500/20 bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-6 backdrop-blur-sm">
                  <Telemetry
                    lastResult={lastResult}
                    highlight={telemetryHighlight}
                    onOpenModal={() => openTelemetry("ui")}
                  />
                </div>

                <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-6 backdrop-blur-sm">
                  <Examples onResult={setLastResult} />
                </div>

                <div className="rounded-2xl border border-purple-500/20 bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-6 backdrop-blur-sm">
                  <Checklist voiceStatuses={voiceSteps} />
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-6 backdrop-blur-sm">
                  <McpPanel />
                </div>
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
        listenForConfirmation={isListeningForConfirmation}
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
        <DialogContent className="border-purple-500/30 bg-gradient-to-br from-slate-900/95 to-purple-950/30 backdrop-blur-2xl">
          <div data-testid="confirm-dialog" className="space-y-4">
            <DialogHeader>
              <DialogTitle className="text-blue-100">¿Lo confirmamos?</DialogTitle>
              <DialogDescription className="text-slate-400">
                {pendingAction?.description ?? "¿Quieres que continúe con esta acción?"}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="ghost"
                onClick={handleCancel}
                data-testid="confirm-no"
                nuraAction="cancel"
                className="hover:bg-slate-800/50"
              >
                No por ahora
              </Button>
              <Button
                onClick={handleConfirm}
                data-testid="confirm-yes"
                nuraAction="confirm"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 shadow-[0_0_30px_rgba(59,130,246,0.4)]"
              >
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
