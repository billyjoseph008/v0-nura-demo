function ensureIntentPayload(payload) {
  if (!payload || typeof payload.intent !== "string" || payload.intent.trim() === "") {
    throw new Error("Intent payload must include a non-empty intent string")
  }
  return {
    intent: payload.intent,
    parameters: payload.parameters ?? {},
    locale: payload.locale ?? "en-US",
    metadata: payload.metadata ?? {},
  }
}

function asPromise(result) {
  if (result instanceof Promise) return result
  return Promise.resolve(result)
}

export function createIntentSession(options = {}) {
  const listeners = new Set()
  let currentState = {
    status: "idle",
    intent: null,
    approval: null,
    result: null,
    error: null,
  }

  function emit(type, payload) {
    const event = {
      type,
      timestamp: Date.now(),
      payload,
      state: currentState,
    }
    listeners.forEach((listener) => {
      try {
        listener(event)
      } catch (error) {
        console.error("Intent session listener failed", error)
      }
    })
    return event
  }

  async function evaluateApproval(intentPayload) {
    if (typeof options.validator !== "function") {
      currentState = { ...currentState, status: "approval", approval: { required: true } }
      emit("approval-required", { intent: intentPayload })
      return { approved: false, reason: "manual" }
    }

    const result = await asPromise(options.validator(intentPayload))
    if (typeof result === "boolean") {
      return { approved: result }
    }
    return result ?? { approved: false }
  }

  async function runExecution(intentPayload, metadata = {}) {
    currentState = { ...currentState, status: "executing" }
    emit("execution-started", { intent: intentPayload, metadata })
    try {
      const executor = options.executor ?? (() => ({ ok: true }))
      const result = await asPromise(executor(intentPayload, metadata))
      currentState = { ...currentState, status: "done", result }
      emit("executed", { intent: intentPayload, result })
      return result
    } catch (error) {
      currentState = { ...currentState, status: "error", error }
      emit("error", { intent: intentPayload, error })
      throw error
    }
  }

  return {
    on(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    getState() {
      return currentState
    },
    async start(payload) {
      const intentPayload = ensureIntentPayload(payload)
      currentState = { status: "pending", intent: intentPayload, approval: null, result: null, error: null }
      emit("intent-received", { intent: intentPayload })

      const approval = await evaluateApproval(intentPayload)
      currentState = { ...currentState, approval }

      if (approval.approved) {
        emit("approval-granted", { intent: intentPayload, approval })
        return runExecution(intentPayload, { approval })
      }

      emit("approval-required", { intent: intentPayload, approval })
      return approval
    },
    async approve(metadata = {}) {
      if (!currentState.intent) {
        throw new Error("No intent to approve")
      }
      currentState = { ...currentState, approval: { approved: true, metadata } }
      emit("approval-granted", { intent: currentState.intent, metadata })
      return runExecution(currentState.intent, metadata)
    },
    reject(reason = "rejected-by-user") {
      if (!currentState.intent) {
        throw new Error("No intent to reject")
      }
      currentState = { ...currentState, status: "rejected", approval: { approved: false, reason } }
      emit("rejected", { intent: currentState.intent, reason })
      return { ok: false, reason }
    },
  }
}
