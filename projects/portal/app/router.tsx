import { createRouter as createTanStackRouter } from "@tanstack/react-router"
import * as Sentry from "@sentry/tanstackstart-react"
import { routeTree } from "./routeTree.gen"
import { isExtensionError, isUserRejection, redactIdentifiers, redactRecursive } from "~/lib/sentry-helpers"

const sentryLocalDev = import.meta.env.VITE_SENTRY_LOCAL_DEV === "true"

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
      // Scrub wallet addresses from breadcrumbs before they're collected in any event
      beforeBreadcrumb(breadcrumb) {
        if (typeof breadcrumb.message === "string") {
          breadcrumb.message = redactIdentifiers(breadcrumb.message)
        }
        if (breadcrumb.data) {
          breadcrumb.data = redactRecursive(breadcrumb.data) as Record<string, unknown>
        }
        return breadcrumb
      },

      // -- Error monitoring --
      // Send 100% of error events
      sampleRate: 1.0,
      // Custom event pre-processing before sending to Sentry
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
