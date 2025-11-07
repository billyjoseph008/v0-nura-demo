export interface IntentPayload {
  intent: string
  parameters?: Record<string, unknown>
  locale?: string
  metadata?: Record<string, unknown>
}

export interface IntentApproval {
  approved: boolean
  reason?: string
  metadata?: Record<string, unknown>
}

export interface IntentSessionState {
  status: "idle" | "pending" | "approval" | "executing" | "done" | "rejected" | "error"
  intent: IntentPayload | null
  approval: IntentApproval | null
  result: unknown
  error: unknown
}

export interface IntentEvent {
  type:
    | "intent-received"
    | "approval-required"
    | "approval-granted"
    | "execution-started"
    | "executed"
    | "rejected"
    | "error"
  timestamp: number
  payload: unknown
  state: IntentSessionState
}

export interface IntentSessionOptions {
  validator?: (payload: IntentPayload) => Promise<IntentApproval | boolean> | IntentApproval | boolean
  executor?: (payload: IntentPayload, metadata?: Record<string, unknown>) => Promise<unknown> | unknown
}

export interface IntentSession {
  on(listener: (event: IntentEvent) => void): () => void
  getState(): IntentSessionState
  start(payload: IntentPayload): Promise<unknown>
  approve(metadata?: Record<string, unknown>): Promise<unknown>
  reject(reason?: string): { ok: false; reason: string }
}

export declare function createIntentSession(options?: IntentSessionOptions): IntentSession
