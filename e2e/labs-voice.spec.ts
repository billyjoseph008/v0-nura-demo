import { expect, test } from "@playwright/test"
import { analyzeWakePhrase } from "@/labs/voiceDemo"

test("wake word activa el panel de órdenes", () => {
  const result = analyzeWakePhrase("ok nora abrir órdenes")
  expect(result.matched).toBe(true)
  expect(result.command.toLowerCase()).toContain("abrir")
})
