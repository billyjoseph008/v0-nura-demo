import { Badge } from "@/components/ui/badge"
import type { NuraResult } from "@/lib/types"
import { mcpClient } from "@/lib/mcp"

interface BadgesProps {
  result: NuraResult
}

export default function Badges({ result }: BadgesProps) {
  const getViaColor = (via: string) => {
    switch (via) {
      case "exact":
        return "bg-green-500/10 text-green-500 border-green-500/20"
      case "phonetic":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
      case "global":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getMatchedByColor = (matchedBy: string) => {
    switch (matchedBy) {
      case "plugin":
        return "bg-primary/10 text-primary border-primary/20"
      case "fallback":
        return "bg-orange-500/10 text-orange-500 border-orange-500/20"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Badge variant="outline" className={getViaColor(result.via)}>
        via: {result.via}
      </Badge>

      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
        confidence: {result.confidence.toFixed(2)}
      </Badge>

      <Badge variant="outline" className={getMatchedByColor(result.matchedBy)}>
        matchedBy: {result.matchedBy}
      </Badge>

      <Badge variant="outline" className="bg-accent text-accent-foreground">
        locale: {result.locale}
      </Badge>

      {mcpClient.isConnected() && (
        <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
          MCP Connected
        </Badge>
      )}
    </div>
  )
}
