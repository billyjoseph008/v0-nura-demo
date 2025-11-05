import { test, expect } from "@playwright/test"

test.describe("Explain Mode", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
  })

  test("should enable explain mode", async ({ page }) => {
    // Open settings
    await page.getByRole("button", { name: /settings/i }).click()

    // Enable explain mode
    const explainToggle = page.getByRole("switch", { name: /explain mode/i })
    await explainToggle.click()

    await expect(explainToggle).toBeChecked()
  })

  test("should show explanations when enabled", async ({ page }) => {
    // Enable explain mode
    await page.getByRole("button", { name: /settings/i }).click()
    await page.getByRole("switch", { name: /explain mode/i }).click()

    // Close settings
    await page.keyboard.press("Escape")

    // Send a message
    const input = page.getByPlaceholder(/type a message/i)
    await input.fill("Hello")
    await input.press("Enter")

    // Wait for response
    await page.waitForTimeout(2000)

    // Check for explanation indicator
    const explanation = page.locator("[data-explanation]").first()
    await expect(explanation).toBeVisible()
  })

  test("should hide explanations when disabled", async ({ page }) => {
    // Ensure explain mode is off
    await page.getByRole("button", { name: /settings/i }).click()
    const explainToggle = page.getByRole("switch", { name: /explain mode/i })

    if (await explainToggle.isChecked()) {
      await explainToggle.click()
    }

    await page.keyboard.press("Escape")

    // Send a message
    const input = page.getByPlaceholder(/type a message/i)
    await input.fill("Hello")
    await input.press("Enter")

    // Wait for response
    await page.waitForTimeout(2000)

    // Explanations should not be visible
    const explanation = page.locator("[data-explanation]")
    await expect(explanation).not.toBeVisible()
  })
})
