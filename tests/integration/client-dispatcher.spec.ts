import { describe, expect, it } from "vitest"
import { runClientDemoSequence } from "@/labs/clientDemo"

describe("Client dispatcher integration", () => {
  it("registra intents en el orden correcto", () => {
    const events = runClientDemoSequence(["open_dashboard", "open_orders", "close_panel"])
    expect(events).toHaveLength(3)
    expect(events[0].command).toBe("open_dashboard")
    expect(events[2].command).toBe("close_panel")
  })
})
