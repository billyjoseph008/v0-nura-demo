import type { McpResource, McpTool } from "./types"
import { eventBus } from "./telemetry"

export class McpClient {
  private ws: WebSocket | null = null
  private connected = false
  private url = ""

  isConnected(): boolean {
    return this.connected
  }

  getUrl(): string {
    return this.url
  }

  async connect(url: string): Promise<void> {
    if (this.ws) {
      this.ws.close()
    }

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(url)
        this.url = url

        this.ws.onopen = () => {
          this.connected = true
          eventBus.emit("mcp.connected", { url })
          resolve()
        }

        this.ws.onerror = (error) => {
          this.connected = false
          eventBus.emit("mcp.error", { error: "Connection failed" })
          reject(new Error("WebSocket connection failed"))
        }

        this.ws.onclose = () => {
          this.connected = false
          eventBus.emit("mcp.disconnected", {})
        }

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data)
            eventBus.emit("mcp.message", message)
          } catch (e) {
            console.error("[v0] Failed to parse MCP message:", e)
          }
        }
      } catch (error) {
        reject(error)
      }
    })
  }

  disconnect() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
      this.connected = false
      this.url = ""
    }
  }

  async listResources(): Promise<McpResource[]> {
    if (!this.connected || !this.ws) {
      throw new Error("Not connected to MCP gateway")
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Request timeout"))
      }, 5000)

      const handler = (data: unknown) => {
        clearTimeout(timeout)
        eventBus.off("mcp.message", handler)

        const message = data as { type: string; resources?: McpResource[] }
        if (message.type === "resources") {
          resolve(message.resources || [])
        } else {
          reject(new Error("Invalid response"))
        }
      }

      eventBus.on("mcp.message", handler)

      this.ws!.send(JSON.stringify({ type: "list_resources" }))
    })
  }

  async listTools(): Promise<McpTool[]> {
    if (!this.connected || !this.ws) {
      throw new Error("Not connected to MCP gateway")
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Request timeout"))
      }, 5000)

      const handler = (data: unknown) => {
        clearTimeout(timeout)
        eventBus.off("mcp.message", handler)

        const message = data as { type: string; tools?: McpTool[] }
        if (message.type === "tools") {
          resolve(message.tools || [])
        } else {
          reject(new Error("Invalid response"))
        }
      }

      eventBus.on("mcp.message", handler)

      this.ws!.send(JSON.stringify({ type: "list_tools" }))
    })
  }

  async callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
    if (!this.connected || !this.ws) {
      throw new Error("Not connected to MCP gateway")
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Request timeout"))
      }, 5000)

      const handler = (data: unknown) => {
        clearTimeout(timeout)
        eventBus.off("mcp.message", handler)

        const message = data as { type: string; result?: unknown; error?: string }
        if (message.type === "tool_result") {
          if (message.error) {
            reject(new Error(message.error))
          } else {
            resolve(message.result)
          }
        } else {
          reject(new Error("Invalid response"))
        }
      }

      eventBus.on("mcp.message", handler)

      this.ws!.send(JSON.stringify({ type: "call_tool", name, arguments: args }))
      eventBus.emit("mcp.tool_call", { name, args })
    })
  }
}

export const mcpClient = new McpClient()

// LocalStorage helpers
const MCP_URL_KEY = "nura_mcp_url"

export function saveMcpUrl(url: string) {
  localStorage.setItem(MCP_URL_KEY, url)
}

export function loadMcpUrl(): string {
  return localStorage.getItem(MCP_URL_KEY) || "ws://localhost:8787/mcp"
}
