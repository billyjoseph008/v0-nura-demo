import { describe, expect, it } from "vitest"
import { parseNumeral } from "@nura/core"

describe("parseNumeral", () => {
  it("convierte número en español", () => {
    expect(parseNumeral("quince", "es")).toBe(15)
  })

  it("convierte número en inglés", () => {
    expect(parseNumeral("twenty-one", "en")).toBe(21)
  })

  it("acepta dígitos directos", () => {
    expect(parseNumeral("42", "es")).toBe(42)
  })
})
