import type { IntentPayload } from "@nura/intents"

export interface SecureIntentRequest extends IntentPayload {
  token?: string
}

export interface SecureIntentResponse {
  status: number
  body: Record<string, unknown>
}

const RATE_LIMIT_WINDOW_MS = 5000
const RATE_LIMIT_MAX_REQUESTS = 3
const requestTimestamps: number[] = []

function pruneRateLimitWindow(now: number) {
  while (requestTimestamps.length > 0 && now - requestTimestamps[0] > RATE_LIMIT_WINDOW_MS) {
    requestTimestamps.shift()
  }
}

function validateRequest(body: SecureIntentRequest) {
  if (!body || typeof body.intent !== "string" || body.intent.trim() === "") {
    return { ok: false, reason: "INVALID_INTENT" }
  }
  if (body.token !== "demo-labs-token") {
    return { ok: false, reason: "INVALID_TOKEN" }
  }
  if (!body.parameters || typeof body.parameters !== "object") {
    return { ok: false, reason: "INVALID_PARAMETERS" }
  }
  return { ok: true }
}

export function resetSecureIntentRateLimiter() {
  requestTimestamps.length = 0
}

export async function handleSecureIntent(body: SecureIntentRequest): Promise<SecureIntentResponse> {
  const now = Date.now()
  pruneRateLimitWindow(now)
  if (requestTimestamps.length >= RATE_LIMIT_MAX_REQUESTS) {
    return {
      status: 429,
      body: {
        ok: false,
        reason: "RATE_LIMITED",
        retryInMs: RATE_LIMIT_WINDOW_MS,
      },
    }
  }

  const validation = validateRequest(body)
  if (!validation.ok) {
    return {
      status: validation.reason === "INVALID_TOKEN" ? 401 : 400,
      body: {
        ok: false,
        reason: validation.reason,
      },
    }
  }

  requestTimestamps.push(now)

  return {
    status: 200,
    body: {
      ok: true,
      approved: true,
      processedAt: now,
      intent: body.intent,
      parameters: body.parameters,
    },
  }
}

export function createSecureIntentFetch() {
  return async function secureIntentFetch(input: RequestInfo | URL, init?: RequestInit) {
    const url = typeof input === "string" ? input : input.toString()
    if (!url.endsWith("/secure-intent")) {
      throw new Error(`Unsupported labs endpoint: ${url}`)
    }
    const rawBody = typeof init?.body === "string" ? init.body : "{}"
    const parsedBody = JSON.parse(rawBody) as SecureIntentRequest
    const response = await handleSecureIntent(parsedBody)
    const headers = new Map([["content-type", "application/json"]])
    return {
      ok: response.status >= 200 && response.status < 300,
      status: response.status,
      headers: {
        get: (key: string) => headers.get(key.toLowerCase()) ?? null,
      },
      async json() {
        return response.body
      },
      async text() {
        return JSON.stringify(response.body)
      },
    }
  }
}

