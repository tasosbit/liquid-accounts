// We can't rely on WalletManager's built-in persistence: the portal's vite
// config pins @tanstack/store to 0.9.2 (required by react-router), which
// dropped the `onUpdate` constructor option that WalletManager uses to write
// state changes back to localStorage. As a result the manager only ever
// persists once at construction, so post-construction network changes never
// survive a reload. We keep our own key and feed it back as `defaultNetwork`.
//
// Upstream fix: @txnlab/use-wallet@5.0.0-rc.1 depends on @tanstack/store 0.9.1
// and rewrote manager.ts to use `store.subscribe(() => savePersistedState())`
// instead of the dropped onUpdate option. When the vendored use-wallet
// workspace package is bumped to 5.x (note: also renames `resetNetwork` →
// `persistNetwork` with inverted default), this whole file and the
// loadStoredNetwork()/saveStoredNetwork() wiring in wallet-providers.tsx and
// network-switcher.tsx can be deleted.

export const NETWORK_STORAGE_KEY = "portal:active-network"
export const SUPPORTED_NETWORKS = ["mainnet", "testnet", "localnet"] as const
export type SupportedNetwork = (typeof SUPPORTED_NETWORKS)[number]

function isSupportedNetwork(value: string): value is SupportedNetwork {
  return (SUPPORTED_NETWORKS as readonly string[]).includes(value)
}

export function loadStoredNetwork(): SupportedNetwork {
  if (typeof window === "undefined") return "mainnet"
  try {
    const stored = localStorage.getItem(NETWORK_STORAGE_KEY)
    if (stored && isSupportedNetwork(stored)) return stored
  } catch {
    // ignore storage errors
  }
  return "mainnet"
}

export function saveStoredNetwork(network: string): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(NETWORK_STORAGE_KEY, network)
  } catch {
    // ignore storage errors
  }
}
