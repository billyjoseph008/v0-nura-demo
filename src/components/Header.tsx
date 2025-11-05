import { Sparkles } from "lucide-react"

export default function Header() {
  return (
    <header className="mb-8">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
          <Sparkles className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nura Starter</h1>
          <p className="text-sm text-muted-foreground">Interactive Command Lab — Voice, Intents & Context</p>
        </div>
      </div>
    </header>
  )
}
