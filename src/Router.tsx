import type { MouseEvent, ReactNode } from "react"
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import App from "./App"
import LabsIndex from "./labs"
import IntentsLab from "./labs/IntentsLab"
import TransportLab from "./labs/TransportLab"
import ClientLab from "./labs/ClientLab"
import VoiceLab from "./labs/VoiceLab"
import LocaleLab from "./labs/LocaleLab"

export interface RouteConfig {
  path: string
  element: ReactNode
  exact?: boolean
}

export interface RouterContextValue {
  navigate: (to: string) => void
  currentPath: string
  labsEnabled: boolean
}

const RouterContext = createContext<RouterContextValue | null>(null)

function isTruthy(value: unknown): boolean {
  if (typeof value === "string") {
    return value.toLowerCase() === "true"
  }
  return Boolean(value)
}

function readLabsFlag(): boolean {
  const metaEnv = typeof import.meta !== "undefined" ? (import.meta as any).env ?? {} : {}
  const candidate =
    metaEnv?.VITE_NURA_DEMO_PLUS ??
    metaEnv?.NURA_DEMO_PLUS ??
    (typeof process !== "undefined" ? process.env.NURA_DEMO_PLUS : undefined) ??
    (typeof process !== "undefined" ? process.env.VITE_NURA_DEMO_PLUS : undefined)
  return isTruthy(candidate)
}

const labsEnabled = readLabsFlag()

const labsRoutes: RouteConfig[] = [
  { path: "/labs", element: <LabsIndex /> },
  { path: "/labs/intents", element: <IntentsLab /> },
  { path: "/labs/transport", element: <TransportLab /> },
  { path: "/labs/client", element: <ClientLab /> },
  { path: "/labs/voice", element: <VoiceLab /> },
  { path: "/labs/locale", element: <LocaleLab /> },
]

const baseRoutes: RouteConfig[] = [{ path: "/", element: <App /> }]

function normalizePath(pathname: string): string {
  if (!pathname) return "/"
  const trimmed = pathname.replace(/\/+$/, "")
  return trimmed.length === 0 ? "/" : trimmed
}

function findRoute(pathname: string, availableRoutes: RouteConfig[]): RouteConfig {
  const normalized = normalizePath(pathname)
  const match = availableRoutes.find((route) => {
    if (route.exact === false) {
      return normalized.startsWith(route.path)
    }
    return route.path === normalized
  })
  return match ?? availableRoutes[0]
}

export function RouterLink({
  to,
  children,
  className,
  "data-testid": dataTestId,
}: {
  to: string
  children: ReactNode
  className?: string
  "data-testid"?: string
}) {
  const router = useAppRouter()
  const handleClick = useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault()
      router.navigate(to)
    },
    [router, to],
  )

  return (
    <a href={to} className={className} onClick={handleClick} data-testid={dataTestId}>
      {children}
    </a>
  )
}

export function useAppRouter(): RouterContextValue {
  const context = useContext(RouterContext)
  if (!context) {
    throw new Error("useAppRouter must be used within RouterProvider")
  }
  return context
}

export function RouterProvider() {
  const [currentPath, setCurrentPath] = useState(() => {
    if (typeof window === "undefined") return "/"
    return normalizePath(window.location.pathname)
  })

  useEffect(() => {
    if (typeof window === "undefined") return
    const handlePop = () => {
      setCurrentPath(normalizePath(window.location.pathname))
    }
    window.addEventListener("popstate", handlePop)
    return () => {
      window.removeEventListener("popstate", handlePop)
    }
  }, [])

  const navigate = useCallback((to: string) => {
    if (typeof window === "undefined") return
    const normalized = normalizePath(to)
    if (normalizePath(window.location.pathname) === normalized) return
    window.history.pushState({}, "", normalized)
    window.dispatchEvent(new PopStateEvent("popstate"))
  }, [])

  useEffect(() => {
    if (!labsEnabled && currentPath.startsWith("/labs")) {
      navigate("/")
    }
  }, [currentPath, navigate])

  const routes = useMemo(() => {
    if (!labsEnabled) return baseRoutes
    return [...baseRoutes, ...labsRoutes]
  }, [])

  const activeRoute = useMemo(() => findRoute(currentPath, routes), [currentPath, routes])

  const value = useMemo(
    () => ({ navigate, currentPath, labsEnabled }),
    [navigate, currentPath],
  )

  return <RouterContext.Provider value={value}>{activeRoute.element}</RouterContext.Provider>
}

export function isLabsEnabled(): boolean {
  return labsEnabled
}

export function getLabRoutes(): RouteConfig[] {
  return labsRoutes
}

