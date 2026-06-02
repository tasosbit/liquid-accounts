import { createRouter as createTanStackRouter } from "@tanstack/react-router"
import * as Sentry from "@sentry/tanstackstart-react"
import { routeTree } from "./routeTree.gen"

const sentryLocalDev = import.meta.env.VITE_SENTRY_LOCAL_DEV === "true"

/** Returns true if the error originated from a browser extension rather than our app. */
function isExtensionError(event: Sentry.ErrorEvent): boolean {
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
function isUserRejection(event: Sentry.ErrorEvent): boolean {
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

export function getRouter() {
  const router = createTanStackRouter({
    routeTree,
    scrollRestoration: true,
  })

  if (typeof window !== "undefined") {
    Sentry.init({
      // -- Core --
      // Where to send the events
      dsn: import.meta.env.VITE_SENTRY_DSN,
      // Set this to true to print out useful debugging information about what the SDK is doing
      debug: sentryLocalDev,
      // We don't want any personally identifiable information (PII) in our error reports
      sendDefaultPii: false,
      // Trace route navigations as performance transactions
      integrations: [Sentry.tanstackRouterBrowserTracingIntegration(router)],

      // -- Error monitoring --
      // Send 100% of error events
      sampleRate: 1.0,
      // Event fine-grained pre-processing
      beforeSend(event) {
        if (isExtensionError(event)) return null
        if (isUserRejection(event)) return null
        if (sentryLocalDev) console.log("Event sent to Sentry:", event)
        return event
      },
      // Append request's hostname on fetch errors
      enhanceFetchErrorMessages: "always",
      // More error filtering: do not send strings or regex that match these patterns
      ignoreErrors: [
        // Browser layout engine quirk - fires in any app with dynamic sizing
        /ResizeObserver loop/,
      ],
      // Only capture errors that have at least one frame from our own bundle
      allowUrls: sentryLocalDev ? [/xchain\.algorand\.co/, /localhost/] : [/xchain\.algorand\.co/],

      // -- Tracing --
      // Capture 20% of page navigations as performance traces
      tracesSampleRate: 0.2,
      // Don't inject Sentry trace headers into outgoing requests
      tracePropagationTargets: [],

      // -- Logs --
      // Useful for seeing what was logged before an error
      enableLogs: true,
    })
  }

  return router
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
