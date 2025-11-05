import { test, expect } from "@playwright/test"

test.describe("Chat Interface", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
  })

  test("should display chat interface", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /nura/i })).toBeVisible()
    await expect(page.getByPlaceholder(/type a message/i)).toBeVisible()
  })

  test("should send a text message", async ({ page }) => {
    const input = page.getByPlaceholder(/type a message/i)
    await input.fill("Hello, Nura!")
    await input.press("Enter")

    // Check that message appears in chat
    await expect(page.getByText("Hello, Nura!")).toBeVisible()
  })

  test("should toggle voice input", async ({ page }) => {
    const voiceButton = page.getByRole("button", { name: /voice/i })
    await voiceButton.click()

    // Voice input should be active
    await expect(voiceButton).toHaveAttribute("data-active", "true")
  })

  test("should display message history", async ({ page }) => {
    // Send multiple messages
    const input = page.getByPlaceholder(/type a message/i)

    await input.fill("First message")
    await input.press("Enter")

    await input.fill("Second message")
    await input.press("Enter")

    // Both messages should be visible
    await expect(page.getByText("First message")).toBeVisible()
    await expect(page.getByText("Second message")).toBeVisible()
  })

  test("should clear chat history", async ({ page }) => {
    // Send a message
    const input = page.getByPlaceholder(/type a message/i)
    await input.fill("Test message")
    await input.press("Enter")

    // Clear chat
    const clearButton = page.getByRole("button", { name: /clear/i })
    await clearButton.click()

    // Message should be gone
    await expect(page.getByText("Test message")).not.toBeVisible()
  })
})
