import { expect, test } from "@playwright/test"
import {
  createLocaleContextManager,
  demoContextConfirmation,
  demoNormalizeSynonym,
  demoParseNumeral,
} from "@/labs/localeDemo"

test("parsea numerales y confirma contexto", () => {
  expect(demoParseNumeral("quince", "es")).toBe(15)
  const synonym = demoNormalizeSynonym("pedidos", "es")
  expect(synonym.normalized).toBe("órdenes")
  const confirmation = demoContextConfirmation(createLocaleContextManager(), "sí, elimínala")
  expect(confirmation.confirmed).toBe(true)
})
