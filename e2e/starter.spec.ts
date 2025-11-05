import { test, expect } from "@playwright/test"

test.describe("Nura Starter E2E", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
  })

  test("should load the app", async ({ page }) => {
    await expect(page.locator("h1")).toContainText("Nura Starter")
  })

  test("should process phonetic wake word", async ({ page }) => {
    const input = page.locator('input[placeholder*="ok nura"]')
    const runButton = page
      .locator("button")
      .filter({ has: page.locator("svg") })
      .nth(1)

    await input.fill("ok nora abre el menú de órdenes")
    await runButton.click()

    await expect(page.locator("text=via: phonetic")).toBeVisible({ timeout: 2000 })
  })

  test("should extract numerals from Spanish", async ({ page }) => {
    const input = page.locator('input[placeholder*="ok nura"]')

    await input.fill("ok nura borra la orden quince")
    await input.press("Enter")

    await expect(page.locator("text=Executed: delete::order")).toBeVisible({ timeout: 2000 })
  })

  test("should handle context confirmation", async ({ page }) => {
    const input = page.locator('input[placeholder*="ok nura"]')

    await input.fill("elimina la orden 15")
    await input.press("Enter")
    await page.waitForTimeout(500)

    await input.fill("sí, elimínala")
    await input.press("Enter")

    await expect(page.locator("text=Executed: delete::order")).toBeVisible({ timeout: 2000 })
  })

  test("should show ranking in explain mode", async ({ page }) => {
    const explainSwitch = page.locator("#explain")
    const input = page.locator('input[placeholder*="ok nura"]')

    await explainSwitch.click()
    await input.fill("abre menú")
    await input.press("Enter")

    await page.locator("text=Ranking").click()
    await expect(page.locator("pre").first()).toContainText("intent")
  })

  test("should test quick examples", async ({ page }) => {
    const exampleButton = page.locator('button:has-text("ok nura abre el menú de órdenes")').first()
    await exampleButton.click()

    await expect(page.locator("text=Last command:")).toBeVisible({ timeout: 2000 })
  })
})
