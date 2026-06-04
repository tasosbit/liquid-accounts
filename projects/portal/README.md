# portal

Information and documentation portal for **xChain Accounts** (`algo-x-evm-portal`). TanStack Start app deployed to Cloudflare.

## Contents

- Landing page (`app/routes/index.tsx`)
- Docs site rendered from Markdown in `app/content/docs/` via `react-markdown` (`app/routes/docs/`)
- Terms of Service page sourced from `app/content/terms-of-service.md`

## Stack

- TanStack Start + TanStack Router + React 19
- Vite with the Cloudflare Vite plugin
- Tailwind CSS + Tailwind Typography
- RainbowKit / wagmi / viem for EVM wallet connection (shared layout components)
- `algo-x-evm-sdk` and the forked `@txnlab/use-wallet*` packages (workspace)

## Develop

```bash
pnpm dev        # vite dev
pnpm build      # production build (raises Node heap to 8 GB for SSR)
pnpm preview    # serve the production build
pnpm deploy     # build + wrangler deploy to Cloudflare
```

The portal depends on workspace packages — run the workspace build (`algokit project run build` from the repo root, or at minimum build `evm-sdk` / `use-wallet*`) before `pnpm dev` if any of them changed.

### Sentry

For local Sentry testing/debug, set `VITE_SENTRY_DSN` and `VITE_SENTRY_LOCAL_DEV=true` at `projects/portal/.env` or inline when starting the dev server:

```bash
VITE_SENTRY_DSN=<dsn> VITE_SENTRY_LOCAL_DEV=true pnpm dev
```

> DSN can be found at portal-production GitHub environment or via Sentry portal.

## Authoring docs

Add a Markdown file under `app/content/docs/` and register the route in `app/routes/docs/`. GFM and raw HTML are enabled (`remark-gfm`, `rehype-raw`).
