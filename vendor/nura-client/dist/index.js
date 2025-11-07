function createHandlerMap() {
  return new Map()
}

export class NuraClient {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl ?? ""
    this.transport = options.transport ?? null
    this.handlers = createHandlerMap()
  }

  on(event, handler) {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set())
    }
    const listeners = this.handlers.get(event)
    listeners.add(handler)
    return () => {
      listeners.delete(handler)
      if (listeners.size === 0) {
        this.handlers.delete(event)
      }
    }
  }

  once(event, handler) {
    const dispose = this.on(event, (payload) => {
      dispose()
      handler(payload)
    })
    return dispose
  }

  emit(event, payload) {
    const listeners = this.handlers.get(event)
    if (!listeners) return
    listeners.forEach((listener) => {
      try {
        listener(payload)
      } catch (error) {
        console.error("NuraClient listener error", error)
      }
    })
  }

  async dispatch(event, payload = {}) {
    const envelope = {
      event,
      payload,
      timestamp: Date.now(),
    }

    this.emit(event, envelope)

    if (this.transport && typeof this.transport.dispatch === "function") {
      return this.transport.dispatch(envelope)
    }

    if (this.transport && typeof this.transport.sendIntent === "function" && event === "intent") {
      return this.transport.sendIntent(envelope)
    }

    return envelope
  }
}

export function createNuraClient(options) {
  return new NuraClient(options)
}

