import type { TelemetryEvent } from "./types"

class EventBus {
  private listeners: Map<string, Set<(data: unknown) => void>> = new Map()
  private events: TelemetryEvent[] = []
  private maxEvents = 120

  on(type: string, callback: (data: unknown) => void) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set())
    }
    this.listeners.get(type)!.add(callback)
  }

  off(type: string, callback: (data: unknown) => void) {
    this.listeners.get(type)?.delete(callback)
  }

  emit(type: string, data: unknown) {
    const event: TelemetryEvent = {
      type,
      data,
      timestamp: Date.now(),
    }

    this.events.push(event)
    if (this.events.length > this.maxEvents) {
      this.events.shift()
    }

    this.listeners.get(type)?.forEach((callback) => callback(data))
    this.listeners.get("*")?.forEach((callback) => callback(event))
  }

  getEvents(): TelemetryEvent[] {
    return [...this.events]
  }

  clear() {
    this.events = []
  }
}

export const eventBus = new EventBus()

export function formatEvent(event: TelemetryEvent): string {
  const time = new Date(event.timestamp).toLocaleTimeString()
  const data = JSON.stringify(event.data, null, 2)
  return `[${time}] ${event.type}\n${data}`
}
