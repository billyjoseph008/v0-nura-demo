"use client"

import { useCallback, useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plug, Unplug } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { mcpClient, loadMcpUrl, saveMcpUrl } from "@/lib/mcp"
import type { McpResource, McpTool } from "@/lib/types"
import { eventBus } from "@/lib/telemetry"

export default function McpPanel() {
  const [url, setUrl] = useState(loadMcpUrl())
  const [connected, setConnected] = useState(false)
  const [resources, setResources] = useState<McpResource[]>([])
  const [tools, setTools] = useState<McpTool[]>([])
  const { toast } = useToast()

  const handleConnect = useCallback(async () => {
    try {
      await mcpClient.connect(url)
      saveMcpUrl(url)
      setConnected(true)
      toast({
        title: "Connected",
        description: "Successfully connected to MCP gateway",
      })
      eventBus.emit("mcp.connected.ui", { url })
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      })
      eventBus.emit("mcp.error", { error: error instanceof Error ? error.message : "Connection failed" })
    }
  }, [toast, url])

  const handleDisconnect = useCallback(() => {
    mcpClient.disconnect()
    setConnected(false)
    setResources([])
    setTools([])
    toast({
      title: "Disconnected",
      description: "Disconnected from MCP gateway",
    })
    eventBus.emit("mcp.disconnected.ui", {})
  }, [toast])

  const handleListResources = useCallback(async () => {
    try {
      const result = await mcpClient.listResources()
      setResources(result)
      toast({
        title: "Resources Listed",
        description: `Found ${result.length} resources`,
      })
      eventBus.emit("mcp.resources.listed", { count: result.length, resources: result })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to list resources",
        variant: "destructive",
      })
      eventBus.emit("mcp.error", { error: error instanceof Error ? error.message : "Failed to list resources" })
    }
  }, [toast])

  const handleListTools = useCallback(async () => {
    try {
      const result = await mcpClient.listTools()
      setTools(result)
      toast({
        title: "Tools Listed",
        description: `Found ${result.length} tools`,
      })
      eventBus.emit("mcp.tools.listed", { count: result.length, tools: result })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to list tools",
        variant: "destructive",
      })
      eventBus.emit("mcp.error", { error: error instanceof Error ? error.message : "Failed to list tools" })
    }
  }, [toast])

  useEffect(() => {
    const handleConnectRequest = () => {
      if (connected) {
        toast({ title: "Already connected", description: "MCP gateway already active" })
        return
      }
      void handleConnect()
    }
    const handleListResourcesRequest = () => {
      if (!connected) {
        toast({
          title: "Not connected",
          description: "Connect to MCP before listing resources",
          variant: "destructive",
        })
        return
      }
      void handleListResources()
    }
    const handleListToolsRequest = () => {
      if (!connected) {
        toast({
          title: "Not connected",
          description: "Connect to MCP before listing tools",
          variant: "destructive",
        })
        return
      }
      void handleListTools()
    }

    eventBus.on("mcp.request.connect", handleConnectRequest)
    eventBus.on("mcp.request.listResources", handleListResourcesRequest)
    eventBus.on("mcp.request.listTools", handleListToolsRequest)

    return () => {
      eventBus.off("mcp.request.connect", handleConnectRequest)
      eventBus.off("mcp.request.listResources", handleListResourcesRequest)
      eventBus.off("mcp.request.listTools", handleListToolsRequest)
    }
  }, [connected, handleConnect, handleListResources, handleListTools, toast])

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>MCP Integration</CardTitle>
            <CardDescription>Model Context Protocol gateway</CardDescription>
          </div>
          {connected && (
            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
              Connected
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="ws://localhost:8787/mcp"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={connected}
          />
          {connected ? (
            <Button onClick={handleDisconnect} variant="destructive" size="icon" data-testid="mcp-disconnect">
              <Unplug className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleConnect} size="icon" data-testid="mcp-connect">
              <Plug className="h-4 w-4" />
            </Button>
          )}
        </div>

        {connected && (
          <div className="flex gap-2">
            <Button
              onClick={handleListResources}
              variant="outline"
              size="sm"
              className="flex-1 bg-transparent"
              data-testid="mcp-list-resources"
            >
              List Resources
            </Button>
            <Button
              onClick={handleListTools}
              variant="outline"
              size="sm"
              className="flex-1 bg-transparent"
              data-testid="mcp-list-tools"
            >
              List Tools
            </Button>
          </div>
        )}

        {(resources.length > 0 || tools.length > 0) && (
          <div className="max-h-64 overflow-auto rounded-lg border bg-muted/50 p-4">
            <pre className="font-mono text-xs text-foreground">{JSON.stringify({ resources, tools }, null, 2)}</pre>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
