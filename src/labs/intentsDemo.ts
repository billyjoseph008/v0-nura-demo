import { createIntentSession, type IntentEvent, type IntentPayload } from "@nura/intents"

export const defaultIntent: IntentPayload = {
  intent: "create_order",
  parameters: { productId: 42, quantity: 3 },
  locale: "en-US",
}

export function createIntentDemoSession() {
  return createIntentSession({
    validator: async (payload) => ({
      approved: false,
      reason: "manual-approval",
      metadata: {
        summary: `Crear orden del producto ${payload.parameters?.productId ?? "?"}`,
      },
    }),
    executor: async (payload, metadata) => ({
      ok: true,
      id: Date.now(),
      approvedBy: metadata?.approvedBy ?? "operator",
      payload,
    }),
  })
}

export async function runIntentFlowDemo(payload: IntentPayload = defaultIntent) {
  const session = createIntentDemoSession()
  const events: IntentEvent[] = []
  session.on((event) => {
    events.push(event)
  })
  await session.start(payload)
  await session.approve({ approvedBy: "demo" })
  return events
}
