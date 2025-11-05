import { test, expect } from "@playwright/test"

test.describe("Responsive Design", () => {
  test("should work on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto("/")

    // Check that UI is visible and functional
    await expect(page.getByPlaceholder(/type a message/i)).toBeVisible()
    await expect(page.getByRole("button", { name: /send/i })).toBeVisible()
  })

  test("should work on tablet viewport", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto("/")

    await expect(page.getByPlaceholder(/type a message/i)).toBeVisible()
    await expect(page.getByRole("heading", { name: /nura/i })).toBeVisible()
  })

  test("should work on desktop viewport", async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.goto("/")

    await expect(page.getByPlaceholder(/type a message/i)).toBeVisible()
    await expect(page.getByRole("heading", { name: /nura/i })).toBeVisible()
  })

  test("should adapt layout on resize", async ({ page }) => {
    await page.goto("/")

    // Start with desktop
    await page.setViewportSize({ width: 1920, height: 1080 })
    const desktopLayout = await page.locator("main").boundingBox()

    // Resize to mobile
    await page.setViewportSize({ width: 375, height: 667 })
    const mobileLayout = await page.locator("main").boundingBox()

    // Layouts should be different
    expect(desktopLayout?.width).not.toEqual(mobileLayout?.width)
  })
})
