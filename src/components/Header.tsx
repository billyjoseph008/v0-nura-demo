import { Sparkles } from "lucide-react"
import { RouterLink, useAppRouter } from "@/Router"

export default function Header() {
  const { labsEnabled } = useAppRouter()
  return (
    <header className="mb-8">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
          <Sparkles className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nura Starter</h1>
          <p className="text-sm text-muted-foreground">Interactive Command Lab — Voice, Intents & Context</p>
        </div>
        {labsEnabled ? (
          <RouterLink
            to="/labs"
            className="ml-auto inline-flex items-center rounded-full border border-primary/40 px-4 py-1 text-sm font-medium text-primary transition hover:bg-primary/10"
            data-testid="labs-entry-link"
          >
            Explorar Labs
          </RouterLink>
        ) : null}
      </div>
    </header>
  )
}
