import { createFileRoute, ClientOnly } from "@tanstack/react-router"
import { lazy, Suspense } from "react"
import { Header } from "~/components/layout/header"
import { Footer } from "~/components/layout/footer"

// Lazy-load delays the wallet app import until render
// ClientOnly prevents browser-only wallet code from rendering during SSR
const WalletApp = lazy(() => import("~/components/app/wallet-app"))

export const Route = createFileRoute("/app")({
  component: AppPage,
  head: () => ({
    meta: [{ title: "xChain EVM Portal" }],
  }),
})

function AppPage() {
  return (
    <ClientOnly fallback={<AppShellFallback />}>
      <Suspense fallback={<AppShellFallback />}>
        <WalletApp />
      </Suspense>
    </ClientOnly>
  )
}

// SSR-rendered shell shown until the client-only WalletApp (and its
// WalletProviders) mounts. Keeps header/footer in place for fast first paint.
function AppShellFallback() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
        <div className="flex justify-center py-12">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-primary" />
        </div>
      </main>
      <Footer />
    </div>
  )
}
