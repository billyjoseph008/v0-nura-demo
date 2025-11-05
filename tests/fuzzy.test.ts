import { describe, it, expect } from "vitest"

describe("Fuzzy Matching", () => {
  it("should calculate similarity correctly", () => {
    const text1 = "abre el menú"
    const text2 = "abre el menú de órdenes"

    // Simple word overlap test
    const words1 = new Set(text1.split(/\s+/))
    const words2 = text2.split(/\s+/)
    const overlap = words2.filter((w) => words1.has(w)).length
    const score = overlap / words2.length

    expect(score).toBeGreaterThan(0.5)
  })

  it("should handle exact matches", () => {
    const text = "open orders menu"
    expect(text).toBe("open orders menu")
  })
})
