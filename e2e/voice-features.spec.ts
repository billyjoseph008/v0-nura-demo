import { test, expect } from "@playwright/test"

test.describe("Voice Features", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")

    // Grant microphone permissions
    await page.context().grantPermissions(["microphone"])
  })

  test("should enable voice input", async ({ page }) => {
    const voiceButton = page.getByRole("button", { name: /voice/i })
    await voiceButton.click()

    // Check that voice input is active
    await expect(voiceButton).toHaveAttribute("data-active", "true")
  })

  test("should disable voice input", async ({ page }) => {
    const voiceButton = page.getByRole("button", { name: /voice/i })

    // Enable voice
    await voiceButton.click()
    await expect(voiceButton).toHaveAttribute("data-active", "true")

    // Disable voice
    await voiceButton.click()
    await expect(voiceButton).toHaveAttribute("data-active", "false")
  })

  test("should show voice input indicator", async ({ page }) => {
    const voiceButton = page.getByRole("button", { name: /voice/i })
    await voiceButton.click()

    // Look for visual indicator
    const indicator = page.locator("[data-voice-active]")
    await expect(indicator).toBeVisible()
  })

  test("should toggle speech output", async ({ page }) => {
    // Open settings
    await page.getByRole("button", { name: /settings/i }).click()

    // Toggle speech output
    const speechToggle = page.getByRole("switch", { name: /speech output/i })
    await speechToggle.click()

    await expect(speechToggle).toBeChecked()
  })
})
