"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { X } from "lucide-react"

import type { TelemetryEvent } from "@/lib/types"
import { eventBus } from "@/lib/telemetry"

interface FriendlyEvent {
  id: string
  type: string
  title: string
  description: string
}

const EVENT_LIMIT = 4
const AUTO_DISMISS_MS = 5500

function createFriendlyEvent(event: TelemetryEvent): FriendlyEvent | null {
  const data = (event.data ?? {}) as Record<string, unknown>

  switch (event.type) {
    case "ui.menu.open":
      return {
        id: `${event.type}-${event.timestamp}`,
        type: event.type,
        title: "Menú abierto",
        description: "Abrí el menú de órdenes para que sigas explorando.",
      }
    case "ui.menu.quick-open":
      return {
        id: `${event.type}-${event.timestamp}`,
        type: event.type,
        title: "Menú listo",
        description: "Te acerqué el menú de órdenes al instante.",
      }
    case "order.deleted": {
      const id = data?.id ?? "la orden"
      return {
        id: `${event.type}-${event.timestamp}-${id}`,
        type: event.type,
        title: "Orden eliminada",
        description: `Quité ${typeof id === "number" ? `la orden ${id}` : id.toString()} como pediste.`,
      }
    }
    case "ui.order.manualDeleted": {
      const id = data?.id ?? "la orden"
      return {
        id: `${event.type}-${event.timestamp}-${id}`,
        type: event.type,
        title: "Orden fuera",
        description: `Listo, ${typeof id === "number" ? `la orden ${id}` : id.toString()} ya no aparece en la lista.`,
      }
    }
    case "order.voice.add": {
      const name = typeof data?.name === "string" ? data.name : "tu orden"
      return {
        id: `${event.type}-${event.timestamp}-${name}`,
        type: event.type,
        title: "Nueva orden",
        description: `Sumé ${name} sin perder detalle.`,
      }
    }
    case "order.voice.update":
      return {
        id: `${event.type}-${event.timestamp}`,
        type: event.type,
        title: "Orden actualizada",
        description: "Ajusté los detalles como me pediste.",
      }
    case "ui.capabilities.open":
    case "ui.capabilities.manual":
      return {
        id: `${event.type}-${event.timestamp}`,
        type: event.type,
        title: "Capacidades a la vista",
        description: "Te mostré todo lo que Nura puede hacer por ti.",
      }
    case "mcp.connected":
    case "mcp.connected.ui": {
      const url = typeof data?.url === "string" ? data.url : null
      return {
        id: `${event.type}-${event.timestamp}`,
        type: event.type,
        title: "Conectado a MCP",
        description: url ? `Enlazada con ${url}.` : "La conexión está viva y lista.",
      }
    }
    case "mcp.disconnected":
    case "mcp.disconnected.ui":
      return {
        id: `${event.type}-${event.timestamp}`,
        type: event.type,
        title: "MCP desconectado",
        description: "Cerré la conexión con el proveedor MCP.",
      }
    case "mcp.error": {
      const message = typeof data?.error === "string" ? data.error : "Algo no salió bien"
      return {
        id: `${event.type}-${event.timestamp}`,
        type: event.type,
        title: "Algo salió raro",
        description: message,
      }
    }
    case "mcp.request.connect":
    case "ui.mcp.connect.manual":
      return {
        id: `${event.type}-${event.timestamp}`,
        type: event.type,
        title: "Conectando a MCP",
        description: "Estoy abriendo el puente con tu servidor MCP.",
      }
    case "action.pending":
      return {
        id: `${event.type}-${event.timestamp}`,
        type: event.type,
        title: "Necesito tu confirmación",
        description: "Confírmame si quieres que continúe con esa acción.",
      }
    case "action.cancelled":
      return {
        id: `${event.type}-${event.timestamp}`,
        type: event.type,
        title: "Acción cancelada",
        description: "Perfecto, no haré ese cambio.",
      }
    case "context.confirmation":
      return {
        id: `${event.type}-${event.timestamp}`,
        type: event.type,
        title: "Confirmación recibida",
        description: "Gracias por la señal, seguí adelante.",
      }
    case "ui.telemetry.open":
      return {
        id: `${event.type}-${event.timestamp}`,
        type: event.type,
        title: "Abrí los indicadores",
        description: "Mostré los detalles técnicos para que los revises.",
      }
    case "ui.examples.prefill":
      return {
        id: `${event.type}-${event.timestamp}`,
        type: event.type,
        title: "Frase sugerida",
        description: "Cargué una frase lista para ejecutar en la consola.",
      }
    default:
      return null
  }
}

export default function EventDock() {
  const [events, setEvents] = useState<FriendlyEvent[]>([])
  const timersRef = useRef<Map<string, number>>(new Map())

  const removeEvent = useCallback((id: string) => {
    setEvents((previous) => previous.filter((item) => item.id !== id))
    const timer = timersRef.current.get(id)
    if (timer) {
      window.clearTimeout(timer)
      timersRef.current.delete(id)
    }
  }, [])

  useEffect(() => {
    const handler = (event: TelemetryEvent) => {
      const friendly = createFriendlyEvent(event)
      if (!friendly) return

      setEvents((previous) => {
        const existing = previous.filter((item) => item.id !== friendly.id)
        const next = [friendly, ...existing]
        return next.slice(0, EVENT_LIMIT)
      })

      const timeout = window.setTimeout(() => removeEvent(friendly.id), AUTO_DISMISS_MS)
      timersRef.current.set(friendly.id, timeout)
    }

    eventBus.on("*", handler)
    return () => {
      eventBus.off("*", handler)
      timersRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId))
      timersRef.current.clear()
    }
  }, [removeEvent])

  if (events.length === 0) {
    return null
  }

  return (
    <div
      data-testid="event-dock"
      className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-[min(92vw,22rem)] flex-col items-end gap-2"
      aria-live="polite"
    >
      {events.map((event) => (
        <div
          key={event.id}
          data-testid="event-item"
          className="pointer-events-auto w-full overflow-hidden rounded-2xl border border-[hsl(var(--border))/70] bg-[hsl(var(--card))/0.88] p-4 shadow-[0_20px_60px_rgba(15,118,110,0.35)] backdrop-blur-md transition-all duration-500 animate-in fade-in slide-in-from-bottom-2"
          role="status"
        >
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <p className="text-sm font-semibold text-[hsl(var(--foreground))]">{event.title}</p>
              <p className="mt-1 text-xs text-[hsl(var(--foreground))/0.75]">{event.description}</p>
            </div>
            <button
              type="button"
              onClick={() => removeEvent(event.id)}
              className="rounded-full p-1 text-[hsl(var(--foreground))/0.6] transition-colors hover:bg-[hsl(var(--muted))/0.4] hover:text-[hsl(var(--foreground))]"
              aria-label="Cerrar aviso"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
