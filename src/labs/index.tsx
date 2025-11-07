import { getLabRoutes, RouterLink } from "@/Router"

const labsNavigation = [
  { path: "/labs/intents", title: "Intents", description: "Flujo Intent → Approval → Execute con validación" },
  { path: "/labs/transport", title: "Transport", description: "Endpoint seguro con rate-limit simulado" },
  { path: "/labs/client", title: "Client", description: "Dispatcher y listeners on/dispatch" },
  { path: "/labs/voice", title: "Voice", description: "Wake word y acciones contextuales" },
  { path: "/labs/locale", title: "Locale", description: "Numerales, sinónimos y confirmaciones" },
]

export default function LabsIndex() {
  const routes = getLabRoutes()
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 p-6">
      <header className="space-y-2">
        <p className="text-sm font-semibold text-primary">Labs</p>
        <h1 className="text-3xl font-bold tracking-tight">Showcase de capacidades Nura</h1>
        <p className="max-w-3xl text-muted-foreground">
          Explora la versión experimental de la demo con experiencias guiadas para intents, transporte seguro,
          dispatcher cliente, voz y locales. Cada laboratorio incluye pasos reproducibles y logs para entender cómo
          se comporta el SDK de Nura integrado en la aplicación.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        {labsNavigation.map((item) => (
          <article
            key={item.path}
            className="group rounded-2xl border border-border/80 bg-background/80 p-5 shadow-sm transition hover:border-primary/40 hover:shadow-lg"
            data-testid={`lab-card-${item.title.toLowerCase()}`}
          >
            <RouterLink to={item.path} className="flex h-full flex-col gap-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold group-hover:text-primary transition">{item.title}</h2>
                <span className="text-xs uppercase tracking-wide text-primary/80">Explorar</span>
              </div>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </RouterLink>
          </article>
        ))}
      </section>

      <footer className="rounded-xl border border-dashed border-primary/40 bg-primary/5 p-4 text-sm text-primary">
        Recuerda: el acceso a /labs está protegido por la variable de entorno <code className="font-semibold">NURA_DEMO_PLUS</code>.
        Usa <code className="font-semibold">npm run dev:labs</code> para habilitarlo durante el desarrollo local.
      </footer>

      <nav aria-label="Atajos de labs" className="flex flex-wrap gap-2 text-xs text-muted-foreground">
        {routes
          .filter((route) => route.path !== "/labs")
          .map((route) => (
            <RouterLink
              key={route.path}
              to={route.path}
              className="rounded-full border border-border px-3 py-1 transition hover:border-primary/50 hover:text-primary"
            >
              {route.path.replace("/labs/", "Labs → ")}
            </RouterLink>
          ))}
      </nav>
    </div>
  )
}

