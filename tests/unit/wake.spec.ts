import { describe, expect, it } from "vitest"
import { stripWake } from "@nura/core"

describe("stripWake", () => {
  const config = {
    wakeWords: ["ok nura"],
    aliases: { "ok nura": ["ok nora", "oye nura"] },
    minConfidence: 0.7,
  }

  it("detecta wake word exacta con alta confianza", () => {
    const result = stripWake("ok nura abre dashboard", config)
    expect(result.matched).toBe(true)
    expect(result.command).toBe("abre dashboard")
    expect(result.confidence).toBe(1)
  })

  it("acepta alias con confianza suficiente", () => {
    const result = stripWake("ok nora abrir órdenes", config)
    expect(result.matched).toBe(true)
    expect(result.command).toContain("abrir")
    expect(result.confidence).toBeTruthy()
  })

  it("rechaza frase sin wake word", () => {
    const result = stripWake("hola nura dime el clima", config)
    expect(result.matched).toBe(false)
  })
})
