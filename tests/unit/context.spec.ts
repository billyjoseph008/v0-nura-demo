import { describe, expect, it } from "vitest"
import { ContextManager } from "@nura/core"

describe("ContextManager", () => {
  it("almacena y confirma acciones", () => {
    const manager = new ContextManager()
    manager.saveAction("delete", { intent: "delete-order", description: "Eliminar orden" })
    const pending = manager.maybeConfirm("delete", "")
    expect(pending.confirmed).toBe(false)
    expect(pending.reason).toBe("empty-response")

    const confirmed = manager.maybeConfirm("delete", "sí")
    expect(confirmed.confirmed).toBe(true)
    expect(confirmed.action?.intent).toBe("delete-order")
  })
})
