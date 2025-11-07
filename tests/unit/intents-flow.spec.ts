import { describe, expect, it } from "vitest"
import { createIntentSession } from "@nura/intents"

describe("createIntentSession", () => {
  it("ejecuta flujo Intent → Approval → Execute", async () => {
    const session = createIntentSession({
      validator: () => ({ approved: false, reason: "manual" }),
      executor: async (payload) => ({ ok: true, intent: payload.intent }),
    })
    const events: string[] = []
    session.on((event) => {
      events.push(event.type)
    })

    await session.start({ intent: "create_order", parameters: { id: 1 } })
    await session.approve({ approvedBy: "test" })

    expect(events).toContain("intent-received")
    expect(events).toContain("approval-required")
    expect(events).toContain("executed")
    expect(session.getState().status).toBe("done")
    expect(session.getState().result).toMatchObject({ ok: true })
  })
})
