import { test, expect } from "@playwright/test"
import AxeBuilder from "@axe-core/playwright"

test.describe("Accessibility", () => {
  test("should not have any automatically detectable accessibility issues", async ({ page }) => {
    await page.goto("/")

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze()

    expect(accessibilityScanResults.violations).toEqual([])
  })

  test("should be keyboard navigable", async ({ page }) => {
    await page.goto("/")

    // Tab through interactive elements
    await page.keyboard.press("Tab")
    await expect(page.locator(":focus")).toBeVisible()

    await page.keyboard.press("Tab")
    await expect(page.locator(":focus")).toBeVisible()
  })

  test("should have proper ARIA labels", async ({ page }) => {
    await page.goto("/")

    // Check for ARIA labels on key elements
    await expect(page.getByRole("button", { name: /send/i })).toBeVisible()
    await expect(page.getByRole("textbox", { name: /message/i })).toBeVisible()
  })

  test("should support screen reader navigation", async ({ page }) => {
    await page.goto("/")

    // Check for landmarks
    await expect(page.getByRole("main")).toBeVisible()
    await expect(page.getByRole("navigation")).toBeVisible()
  })
})
