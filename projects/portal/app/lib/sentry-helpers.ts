import type { ErrorEvent } from "@sentry/tanstackstart-react"

/** Returns true if the error originated from a browser extension rather than our app. */
export function isExtensionError(event: ErrorEvent): boolean {
  const msg = event.message ?? ""
  const url = event.request?.url ?? ""
  const stacktrace = JSON.stringify(event.exception) ?? ""
  return (
    msg.includes("chrome-extension://") ||
    msg.includes("moz-extension://") ||
    msg.includes("safari-extension://") ||
    url.includes("chrome-extension://") ||
    url.includes("moz-extension://") ||
    url.includes("safari-extension://") ||
    stacktrace.includes("chrome-extension://") ||
    stacktrace.includes("moz-extension://") ||
    stacktrace.includes("safari-extension://") ||
    stacktrace.includes("app:///scripts/")
  )
}

/** Returns true if the error is an intentional wallet rejection (user clicked "Reject" in their wallet popup). */
export function isUserRejection(event: ErrorEvent): boolean {
  return (
    event.exception?.values?.some((ex) => {
      const code = (ex.value && /4001/.test(ex.value)) || (ex.type && /UserRejected/.test(ex.type))
      const message = ex.value?.toLowerCase() ?? ""
      return (
        code ||
        message.includes("user rejected") ||
        message.includes("user denied") ||
        message.includes("rejected by user") ||
        message.includes("user cancelled")
      )
    }) ?? false
  )
}

// EVM address: 0x + 40 hex chars. Negative lookahead prevents matching the first 40 chars of a 64-char tx hash.
const EVM_ADDRESS_RE = /0x[a-fA-F0-9]{40}(?![a-fA-F0-9])/g
// Algorand address: 58-char base32 (A-Z, 2-7). Tx IDs are 52 chars, so this won't match them.
const ALGO_ADDRESS_RE = /\b[A-Z2-7]{58}\b/g

/** Replaces EVM and Algorand wallet addresses in a string with safe placeholders. */
export function redactAddresses(value: string): string {
  return value.replace(EVM_ADDRESS_RE, "[evm-address]").replace(ALGO_ADDRESS_RE, "[algo-address]")
}

/** Recursively redacts wallet addresses from any JSON-serialisable value. */
export function redactRecursive(value: unknown): unknown {
  if (typeof value === "string") return redactAddresses(value)
  if (Array.isArray(value)) return value.map(redactRecursive)
  if (value !== null && typeof value === "object") {
    const out: Record<string, unknown> = {}
    for (const key of Object.keys(value as Record<string, unknown>)) {
      out[key] = redactRecursive((value as Record<string, unknown>)[key])
    }
    return out
  }
  return value
}
