"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plug, Unplug } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { mcpClient, loadMcpUrl, saveMcpUrl } from "@/lib/mcp"
import type { McpResource, McpTool } from "@/lib/types"

export default function McpPanel() {
  const [url, setUrl] = useState(loadMcpUrl())
  const [connected, setConnected] = useState(false)
  const [resources, setResources] = useState<McpResource[]>([])
  const [tools, setTools] = useState<McpTool[]>([])
  const { toast } = useToast()

  const handleConnect = async () => {
    try {
      await mcpClient.connect(url)
      saveMcpUrl(url)
      setConnected(true)
      toast({
        title: "Connected",
        description: "Successfully connected to MCP gateway",
      })
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      })
    }
  }

  const handleDisconnect = () => {
    mcpClient.disconnect()
    setConnected(false)
    setResources([])
    setTools([])
    toast({
      title: "Disconnected",
      description: "Disconnected from MCP gateway",
    })
  }

  const handleListResources = async () => {
    try {
      const result = await mcpClient.listResources()
      setResources(result)
      toast({
        title: "Resources Listed",
        description: `Found ${result.length} resources`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to list resources",
        variant: "destructive",
      })
    }
  }

  const handleListTools = async () => {
    try {
      const result = await mcpClient.listTools()
      setTools(result)
      toast({
        title: "Tools Listed",
        description: `Found ${result.length} tools`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to list tools",
        variant: "destructive",
      })
    }
  }

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
            <Button onClick={handleDisconnect} variant="destructive" size="icon">
              <Unplug className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleConnect} size="icon">
              <Plug className="h-4 w-4" />
            </Button>
          )}
        </div>

        {connected && (
          <div className="flex gap-2">
            <Button onClick={handleListResources} variant="outline" size="sm" className="flex-1 bg-transparent">
              List Resources
            </Button>
            <Button onClick={handleListTools} variant="outline" size="sm" className="flex-1 bg-transparent">
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
