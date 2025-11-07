import { expect, test } from "@playwright/test"
import { runIntentFlowDemo } from "@/labs/intentsDemo"

test("flujo de intents completo", async () => {
  const events = await runIntentFlowDemo()
  const types = events.map((event) => event.type)
  expect(types).toContain("intent-received")
  expect(types).toContain("approval-granted")
  expect(types).toContain("executed")
})
