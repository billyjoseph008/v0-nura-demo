import { describe, expect, it } from "vitest"
import { normalizeSynonyms } from "@nura/core"

describe("normalizeSynonyms", () => {
  it("normaliza pedidos a órdenes", () => {
    const result = normalizeSynonyms("pedidos", "es")
    expect(result.normalized).toBe("órdenes")
    expect(result.matched).toBe(true)
  })
})
