import { useCallback, useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Check, ChevronDown, Globe2, Loader2 } from "lucide-react"
import { NetworkId, useNetwork, type NetworkConfig } from "@txnlab/use-wallet-react"
import { cn } from "~/lib/utils"
import { saveStoredNetwork } from "./network-storage"

interface NetworkOption {
  id: string
  label: string
  dotClass: string
}

const NETWORK_OPTIONS: NetworkOption[] = [
  { id: NetworkId.MAINNET, label: "MainNet", dotClass: "bg-green-500" },
  { id: NetworkId.TESTNET, label: "TestNet", dotClass: "bg-yellow-500" },
  { id: NetworkId.LOCALNET, label: "LocalNet", dotClass: "bg-blue-500" },
]

const LOCALNET_HEALTH_TIMEOUT_MS = 1500

function buildAlgodHealthUrl(config: NetworkConfig): string {
  const base = config.algod.baseServer.replace(/\/+$/, "")
  const port = config.algod.port
  const portSuffix = port !== undefined && port !== "" ? `:${port}` : ""
  return `${base}${portSuffix}/health`
}

// setActiveNetwork on a network whose algod isn't reachable hangs the UI
// because the wallet manager waits on algod metadata. Probe /health first so
// we can fail fast with a user-visible error instead.
async function isAlgodReachable(config: NetworkConfig): Promise<boolean> {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), LOCALNET_HEALTH_TIMEOUT_MS)
  try {
    // /health is unauthenticated and returns 200 with an empty body when up.
    // Any HTTP response means the server answered; only network/timeout
    // errors indicate algod isn't running.
    await fetch(buildAlgodHealthUrl(config), { signal: controller.signal, cache: "no-store" })
    return true
  } catch {
    return false
  } finally {
    window.clearTimeout(timeout)
  }
}

interface NetworkErrorState {
  title: string
  message: string
  detail?: string
}

export function NetworkSwitcher() {
  const { activeNetwork, setActiveNetwork, networkConfig } = useNetwork()
  const [open, setOpen] = useState(false)
  const [checkingId, setCheckingId] = useState<string | null>(null)
  const [error, setError] = useState<NetworkErrorState | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false)
    }
    window.addEventListener("mousedown", handleClick)
    window.addEventListener("keydown", handleKey)
    return () => {
      window.removeEventListener("mousedown", handleClick)
      window.removeEventListener("keydown", handleKey)
    }
  }, [open])

  const options = NETWORK_OPTIONS.filter((n) => networkConfig[n.id])
  const current = options.find((n) => n.id === activeNetwork) ?? {
    id: activeNetwork,
    label: activeNetwork,
    dotClass: "bg-muted-foreground",
  }

  const handleSelect = useCallback(
    async (id: string) => {
      if (id === activeNetwork) {
        setOpen(false)
        return
      }
      if (id === NetworkId.LOCALNET) {
        const config = networkConfig[id]
        if (config) {
          setCheckingId(id)
          const reachable = await isAlgodReachable(config)
          setCheckingId(null)
          if (!reachable) {
            setOpen(false)
            setError({
              title: "LocalNet is not reachable",
              message:
                "No algod node responded at the configured LocalNet URL. Start LocalNet (for example, `algokit localnet start`) and try again.",
              detail: buildAlgodHealthUrl(config),
            })
            return
          }
        }
      }
      setOpen(false)
      try {
        await setActiveNetwork(id)
        saveStoredNetwork(id)
      } catch (err) {
        setError({
          title: "Network switch failed",
          message: (err as Error).message || "An unknown error occurred while switching networks.",
        })
      }
    },
    [activeNetwork, networkConfig, setActiveNetwork],
  )

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Network: ${current.label}`}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex h-9 items-center gap-1.5 rounded-md border border-input bg-background px-2.5 text-sm",
          "transition-colors hover:bg-accent hover:text-accent-foreground",
        )}
        title={`Network: ${current.label}`}
      >
        <Globe2 size={14} className="opacity-70" />
        <span className={cn("h-1.5 w-1.5 rounded-full", current.dotClass)} aria-hidden />
        <span className="hidden sm:inline">{current.label}</span>
        <ChevronDown size={14} className="opacity-70" />
      </button>
      {open && (
        <div
          role="listbox"
          className="absolute right-0 top-full z-50 mt-1 min-w-[160px] rounded-md border bg-background p-1 shadow-md"
        >
          {options.map((opt) => {
            const isActive = opt.id === activeNetwork
            const isChecking = checkingId === opt.id
            return (
              <button
                key={opt.id}
                type="button"
                role="option"
                aria-selected={isActive}
                disabled={checkingId !== null}
                onClick={() => handleSelect(opt.id)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm",
                  "transition-colors hover:bg-accent hover:text-accent-foreground",
                  "disabled:cursor-not-allowed disabled:opacity-60",
                  isActive && "font-medium",
                )}
              >
                <span className={cn("h-1.5 w-1.5 rounded-full", opt.dotClass)} aria-hidden />
                <span className="flex-1">{opt.label}</span>
                {isChecking ? (
                  <Loader2 size={14} className="animate-spin opacity-70" />
                ) : isActive ? (
                  <Check size={14} className="opacity-70" />
                ) : null}
              </button>
            )
          })}
        </div>
      )}
      {error && <NetworkErrorDialog error={error} onClose={() => setError(null)} />}
    </div>
  )
}

function NetworkErrorDialog({ error, onClose }: { error: NetworkErrorState; onClose: () => void }) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [onClose])

  if (typeof document === "undefined") return null

  // Portal to document.body so the dialog escapes ancestor containing blocks
  // (the page header uses backdrop-filter, which would otherwise clip the
  // fixed-position overlay to the header bounds).
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="network-error-title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden />
      <div className="relative w-full max-w-md rounded-md border bg-background p-5 shadow-lg">
        <h2 id="network-error-title" className="text-base font-semibold">
          {error.title}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        {error.detail && (
          <p className="mt-3 break-all rounded-sm bg-muted px-2 py-1.5 font-mono text-xs">{error.detail}</p>
        )}
        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className={cn(
              "inline-flex h-9 items-center rounded-md border border-input bg-background px-3 text-sm",
              "transition-colors hover:bg-accent hover:text-accent-foreground",
            )}
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
