import { useCallback, useEffect, useRef, useState } from "react"
import { Check, ChevronDown, Globe2 } from "lucide-react"
import { NetworkId, useNetwork } from "@txnlab/use-wallet-react"
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

export function NetworkSwitcher() {
  const { activeNetwork, setActiveNetwork, networkConfig } = useNetwork()
  const [open, setOpen] = useState(false)
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
      setOpen(false)
      if (id === activeNetwork) return
      try {
        await setActiveNetwork(id)
        saveStoredNetwork(id)
      } catch (err) {
        console.warn("Network switch failed:", err)
      }
    },
    [activeNetwork, setActiveNetwork],
  )

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
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
            return (
              <button
                key={opt.id}
                type="button"
                role="option"
                aria-selected={isActive}
                onClick={() => handleSelect(opt.id)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm",
                  "transition-colors hover:bg-accent hover:text-accent-foreground",
                  isActive && "font-medium",
                )}
              >
                <span className={cn("h-1.5 w-1.5 rounded-full", opt.dotClass)} aria-hidden />
                <span className="flex-1">{opt.label}</span>
                {isActive && <Check size={14} className="opacity-70" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
