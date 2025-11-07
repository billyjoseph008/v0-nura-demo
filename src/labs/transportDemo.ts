import {
  createSecureIntentFetch,
  handleSecureIntent,
  resetSecureIntentRateLimiter,
  type SecureIntentRequest,
} from "@/api/labs/secure-intent"
import { createHttpTransport } from "@nura/transport-http"

export const defaultSecureIntent: SecureIntentRequest = {
  intent: "secure_intent",
  parameters: { action: "status", scope: "orders" },
  locale: "es-MX",
  token: "demo-labs-token",
}

export async function probeSecureIntent(
  request: SecureIntentRequest = defaultSecureIntent,
  options: { reset?: boolean } = {},
) {
  if (options.reset !== false) {
    resetSecureIntentRateLimiter()
  }
  return handleSecureIntent(request)
}

export function createSecureTransport() {
  const fetchImpl = createSecureIntentFetch()
  return createHttpTransport({ baseUrl: "/api/labs", fetchImpl })
}

export { resetSecureIntentRateLimiter }
