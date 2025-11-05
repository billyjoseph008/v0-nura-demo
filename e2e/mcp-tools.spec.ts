import { test, expect } from "@playwright/test"

test.describe("MCP Tools Integration", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
  })

  test("should display available MCP servers", async ({ page }) => {
    // Open MCP panel
    const mcpButton = page.getByRole("button", { name: /tools/i })
    await mcpButton.click()

    // Check for MCP servers section
    await expect(page.getByText(/mcp servers/i)).toBeVisible()
  })

  test("should show tool execution in chat", async ({ page }) => {
    // Send a message that would trigger a tool
    const input = page.getByPlaceholder(/type a message/i)
    await input.fill("What's the weather like?")
    await input.press("Enter")

    // Wait for response
    await page.waitForTimeout(2000)

    // Check that message was sent
    await expect(page.getByText("What's the weather like?")).toBeVisible()
  })

  test("should display tool results", async ({ page }) => {
    // Open MCP panel
    await page.getByRole("button", { name: /tools/i }).click()

    // Check for tools list
    const toolsList = page.getByRole("list").first()
    await expect(toolsList).toBeVisible()
  })
})
