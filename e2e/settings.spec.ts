import { test, expect } from "@playwright/test"

test.describe("Settings Panel", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
  })

  test("should open settings panel", async ({ page }) => {
    const settingsButton = page.getByRole("button", { name: /settings/i })
    await settingsButton.click()

    await expect(page.getByRole("heading", { name: /settings/i })).toBeVisible()
  })

  test("should toggle explain mode", async ({ page }) => {
    // Open settings
    await page.getByRole("button", { name: /settings/i }).click()

    // Toggle explain mode
    const explainToggle = page.getByRole("switch", { name: /explain mode/i })
    await explainToggle.click()

    // Verify it's enabled
    await expect(explainToggle).toBeChecked()
  })

  test("should change voice settings", async ({ page }) => {
    // Open settings
    await page.getByRole("button", { name: /settings/i }).click()

    // Change voice
    const voiceSelect = page.getByLabel(/voice/i)
    await voiceSelect.selectOption("alloy")

    // Verify selection
    await expect(voiceSelect).toHaveValue("alloy")
  })

  test("should adjust speech rate", async ({ page }) => {
    // Open settings
    await page.getByRole("button", { name: /settings/i }).click()

    // Adjust rate slider
    const rateSlider = page.getByLabel(/speech rate/i)
    await rateSlider.fill("1.5")

    // Verify value
    await expect(rateSlider).toHaveValue("1.5")
  })

  test("should toggle telemetry", async ({ page }) => {
    // Open settings
    await page.getByRole("button", { name: /settings/i }).click()

    // Toggle telemetry
    const telemetryToggle = page.getByRole("switch", { name: /telemetry/i })
    const initialState = await telemetryToggle.isChecked()
    await telemetryToggle.click()

    // Verify it changed
    await expect(telemetryToggle).toBeChecked({ checked: !initialState })
  })
})
