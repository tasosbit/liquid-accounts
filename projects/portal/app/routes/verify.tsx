import { Buffer } from "buffer"
import { createFileRoute, ClientOnly } from "@tanstack/react-router"
import { lazy, Suspense } from "react"
import { Header } from "~/components/layout/header"
import { Footer } from "~/components/layout/footer"

// Set before the lazy import so it's ready when the verify bundle loads -
// this route opens standalone, without wallet-providers.tsx's polyfill.
if (typeof window !== "undefined") {
  ;(globalThis as Record<string, unknown>).Buffer = Buffer
}

// Lazy-load + ClientOnly: verify-transaction depends on browser-only wallet/decoder UI behavior.
const VerifyTransactionPage = lazy(() => import("~/components/verify-transaction"))

// The "/verify" path is part of the verify-link contract: @d13co/algo-x-evm-ui's
// VERIFY_PORTAL_URL / buildVerifyUrl build links pointing here. Keep in sync.
export const Route = createFileRoute("/verify")({
  component: VerifyRoute,
  head: () => ({
    meta: [{ title: "Verify Transaction — xChain EVM" }],
  }),
})

function VerifyRoute() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <ClientOnly fallback={<VerifySpinner />}>
          <Suspense fallback={<VerifySpinner />}>
            <VerifyTransactionPage />
          </Suspense>
        </ClientOnly>
      </main>
      <Footer />
    </div>
  )
}

function VerifySpinner() {
  return (
    <div className="flex justify-center py-12">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-primary" />
    </div>
  )
}
