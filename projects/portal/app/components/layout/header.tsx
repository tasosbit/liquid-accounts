import type { ReactNode } from "react"
import { Link, useRouterState } from "@tanstack/react-router"
import { ArrowUpRight, BookOpen } from "lucide-react"
import { Logo } from "~/components/logo"
import { ThemeToggle } from "~/components/theme-toggle"
import { Button } from "~/components/ui/button"

const navItems = [{ icon: <BookOpen size="16" />, label: "Docs", to: "/docs" as const }]

interface HeaderProps {
  /** Extra controls injected on the right (e.g. network switcher). */
  extra?: ReactNode
}

export function Header({ extra }: HeaderProps = {}) {
  const routerState = useRouterState()
  const isApp = routerState.location.pathname.startsWith("/app")
  const isDocs = routerState.location.pathname.startsWith("/docs")

  return (
    <header className="sticky top-0 z-50 bg-algo-blue-10/80 dark:bg-algo-black-80/80 backdrop-blur-sm">
      <div className="relative mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        {/* Centered status badge */}
        <div className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 sm:flex items-center gap-2 rounded-full bg-background dark:bg-algo-black-90 px-3 py-1 text-xs text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-yellow-500 animate-pulse" />
          Experimental
        </div>
        <Link to="/" aria-label="xChain home" className="flex items-center">
          <Logo className="h-8 w-auto" />
        </Link>

        <div className="flex items-center gap-2">
          <nav className="flex items-center gap-2">
            {navItems
              .filter((item) => !(isDocs && item.to === "/docs"))
              .map((item) => (
                <Button key={item.to} variant="ghost" size="icon" className="h-9 w-9" aria-label={item.label} asChild>
                  <Link to={item.to}>{item.icon ? item.icon : item.label}</Link>
                </Button>
              ))}
          </nav>
          <ThemeToggle />
          {!isApp && (
            <Link
              to="/app"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 dark:bg-algo-blue-40 dark:text-algo-black-90 dark:hover:bg-algo-blue-40/90"
            >
              Launch
              <ArrowUpRight size={16} />
            </Link>
          )}
          {extra}
        </div>
      </div>
    </header>
  )
}
