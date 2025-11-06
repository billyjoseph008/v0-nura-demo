"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"

const features = [
  {
    title: "Voice Wake Aliases",
    description: "Invoke Nura with ok/okay/okey + phonetic variants (nura, nora, lura, nula).",
  },
  {
    title: "Phonetic Matching",
    description: "Hybrid Damerau + metaphone scoring for close matches across ES/EN.",
  },
  {
    title: "Numeral Parsing",
    description: "Converts spoken numbers (quince, fifteen) into order identifiers automatically.",
  },
  {
    title: "Locale Auto/Force",
    description: "Auto-detect or force locales (auto, es, en, es-419) to guide fuzzy matching.",
  },
  {
    title: "MCP Gateway",
    description: "Connect to a Model Context Protocol host and enumerate tools/resources on demand.",
  },
  {
    title: "Explain Mode",
    description: "Toggles safe dry-run analysis with ranking output instead of execution.",
  },
  {
    title: "Telemetry & Ranking",
    description: "Live event stream + similarity ranking to validate every utterance.",
  },
  {
    title: "Threshold Controls",
    description: "Adjust acceptance threshold per utterance to fine-tune confidence sensitivity.",
  },
  {
    title: "Manual E2E Checklist",
    description: "Curated scenarios to replay when validating phonetic wake and safety.",
  },
]

const sampleCommands = [
  "ok nura muestra capacidades",
  "ok nura abre telemetría",
  "ok nora conecta mcp",
  "ok nura lista recursos",
  "ok nula activa modo explain",
  "ok nura elimina la orden quince",
]

const shortcuts = [
  { key: "?", description: "Open this help & capabilities modal" },
  { key: "t", description: "Toggle telemetry focus / modal" },
  { key: "e", description: "Toggle explain mode" },
]

type QuickAction =
  | "mcp.connect"
  | "mcp.list.resources"
  | "mcp.list.tools"
  | "telemetry.open"
  | "explain.on"
  | "explain.off"

interface CapabilitiesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onQuickAction: (action: QuickAction) => void
}

export default function CapabilitiesModal({ open, onOpenChange, onQuickAction }: CapabilitiesModalProps) {
  const { toast } = useToast()

  const handleCopy = React.useCallback(async () => {
    try {
      await navigator.clipboard.writeText(sampleCommands.join("\n"))
      toast({
        title: "Copied",
        description: "Sample commands copied to clipboard",
        variant: "success",
      })
    } catch (error) {
      toast({
        title: "Unable to copy",
        description: error instanceof Error ? error.message : "Clipboard is unavailable",
        variant: "destructive",
      })
    }
  }, [toast])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <div data-testid="capabilities-modal">
          <DialogHeader className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              <DialogTitle className="text-2xl">Nura Capabilities</DialogTitle>
              <DialogDescription>
                Explore the demo actions, wake words, and tooling available in this sandbox.
              </DialogDescription>
            </div>
            <Badge variant="outline" className="bg-blue-500/10 text-blue-500">
              Interactive
            </Badge>
          </div>
          </DialogHeader>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
          {features.map((feature) => (
            <div key={feature.title} className="rounded-xl border border-dashed border-[hsl(var(--border))] p-4">
              <h3 className="text-sm font-semibold text-[hsl(var(--foreground))]">{feature.title}</h3>
              <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">{feature.description}</p>
            </div>
          ))}
          </div>

          <div className="my-6 border-t border-dashed border-[hsl(var(--border))]" />

          <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Quick Actions</h4>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" data-testid="telemetry-open" onClick={() => onQuickAction("telemetry.open")}>
                Open Telemetry
              </Button>
              <Button size="sm" variant="outline" data-testid="explain-toggle-on" onClick={() => onQuickAction("explain.on")}> 
                Toggle Explain On
              </Button>
              <Button size="sm" variant="outline" data-testid="explain-toggle-off" onClick={() => onQuickAction("explain.off")}> 
                Toggle Explain Off
              </Button>
              <Button size="sm" variant="outline" data-testid="mcp-connect" onClick={() => onQuickAction("mcp.connect")}>
                Connect MCP
              </Button>
              <Button
                size="sm"
                variant="outline"
                data-testid="mcp-list-resources"
                onClick={() => onQuickAction("mcp.list.resources")}
              >
                List Resources
              </Button>
              <Button
                size="sm"
                variant="outline"
                data-testid="mcp-list-tools"
                onClick={() => onQuickAction("mcp.list.tools")}
              >
                List Tools
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Keyboard Shortcuts</h4>
            <ul className="space-y-2 text-sm text-[hsl(var(--muted-foreground))]">
              {shortcuts.map((item) => (
                <li key={item.key} className="flex items-center gap-3">
                  <kbd className="rounded-md border px-2 py-1 text-xs font-semibold uppercase">
                    {item.key}
                  </kbd>
                  <span>{item.description}</span>
                </li>
              ))}
            </ul>
          </div>
          </div>

          <div className="my-6 border-t border-dashed border-[hsl(var(--border))]" />

          <div className="space-y-3">
          <h4 className="text-sm font-semibold">Copy Sample Commands</h4>
          <div
            role="button"
            tabIndex={0}
            className="cursor-pointer rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))/0.4] p-4 text-left text-sm shadow-sm transition hover:bg-[hsl(var(--muted))/0.6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
            onClick={handleCopy}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault()
                handleCopy()
              }
            }}
            data-testid="capabilities-copy"
          >
            <pre className="whitespace-pre-wrap font-mono text-xs text-[hsl(var(--foreground))]">
              {sampleCommands.join("\n")}
            </pre>
          </div>
          </div>

          <DialogFooter className="mt-6">
            <DialogClose className="ml-auto">Close</DialogClose>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export type { QuickAction as CapabilitiesQuickAction }
