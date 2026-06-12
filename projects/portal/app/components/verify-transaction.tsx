import { ArrowRight } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { AlgoXEvmSdk } from "algo-x-evm-sdk"
import { decodeTransactions, decodeTxnGroup, TransactionReview } from "@d13co/algo-x-evm-ui"
import "@txnlab/use-wallet-ui-react/dist/style.css"

const queryClient = new QueryClient()

/** Read the transaction payload from the URL hash. */
function readHashPayload(): string {
  if (typeof window === "undefined") return ""
  const hash = window.location.hash
  return hash.startsWith("#") ? hash.slice(1) : hash
}

export default function VerifyTransactionPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <VerifyPageContent />
    </QueryClientProvider>
  )
}

function VerifyPageContent() {
  const [payload, setPayload] = useState(() => readHashPayload())
  const [origin] = useState<string | undefined>(() => {
    try {
      return document.referrer ? new URL(document.referrer).origin : undefined
    } catch {
      return undefined // origin is nice2have
    }
  })

  useEffect(() => {
    const onHashChange = () => setPayload(readHashPayload())
    window.addEventListener("hashchange", onHashChange)
    return () => window.removeEventListener("hashchange", onHashChange)
  }, [])

  // Core decoding logic: decode transactions from URL payload, then compute the EIP-712 sign message.
  const decoded = useMemo(() => {
    if (!payload) return null

    const emptyResult = {
      decodedTransactions: null,
      dangerous: false as const,
      genesisHash: null,
      genesisID: null,
      message: "",
      error: "",
    }

    let decodeTransactionsResult: ReturnType<typeof decodeTransactions>
    try {
      const txnBytes = decodeTxnGroup(payload)
      decodeTransactionsResult = decodeTransactions(txnBytes)
    } catch (err) {
      console.error("Failed to decode transaction payload:", err)
      return {
        ...emptyResult,
        error: "Invalid transaction payload",
      }
    }

    const { decodedTransactions, transactions, dangerous, genesisHash, genesisID } = decodeTransactionsResult
    try {
      // Compute the sign payload independently — this is the key verification:
      // the 0x… the portal shows must match what the wallet asks the user to sign.
      const payloadBytes = AlgoXEvmSdk.getSignPayload(transactions)
      const messageToSign = `0x${Buffer.from(payloadBytes).toString("hex")}`
      if (!decodedTransactions.length) throw new Error("No transactions decoded")
      return { decodedTransactions, dangerous, genesisHash, genesisID, message: messageToSign, error: null }
    } catch (err) {
      console.error("Failed to compute sign payload:", err)
      return {
        ...emptyResult,
        genesisID, // assigning this to determine error message below
        error: "Invalid transaction payload",
      }
    }
  }, [payload])

  if (!payload) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center">
        <p className="text-lg font-medium mb-2">No transaction payload provided</p>
        <p className="text-sm text-muted-foreground">
          This page verifies pending Algorand xChain EVM transactions before signing. Open it via the Verify button from
          the transaction review dialog of your app.{" "}
          <Link
            className="underline"
            to="/docs/$slug"
            params={{ slug: "verifying-transactions" }}
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn more
            <ArrowRight size={12} className="inline-block ml-0.5 -mt-0.5" />
          </Link>
        </p>
      </div>
    )
  }

  if (!decoded || !decoded.decodedTransactions || decoded.error) {
    return (
      <div className="rounded-lg border border-destructive bg-destructive/10 p-8 text-center">
        <p className="text-lg font-medium text-destructive mb-2">Invalid transaction payload</p>
        <p className="text-sm text-destructive/80">
          {decoded?.genesisID
            ? "Sign payload could not be computed from the transaction data."
            : "The transaction data in the URL could not be decoded."}{" "}
          {"Try opening this page again via the Verify button from the transaction review dialog. "}
          <Link
            className="underline"
            to="/docs/$slug"
            params={{ slug: "verifying-transactions" }}
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn more
            <ArrowRight size={12} className="inline-block ml-0.5 -mt-0.5" />
          </Link>
        </p>
      </div>
    )
  }

  const txCount = decoded.decodedTransactions.length

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Verify Transaction{txCount > 1 ? "s" : ""}</h1>
      <p className="text-sm text-muted-foreground mb-6">
        This is an independent view of the transaction{txCount > 1 ? " group" : ""} an app is asking you to sign.
        <strong> Before signing:</strong> confirm the details below match what you intend to do, and that the ID matches
        what your wallet shows.{" "}
        <Link
          className="underline"
          to="/docs/$slug"
          params={{ slug: "verifying-transactions" }}
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn more
          <ArrowRight size={12} className="inline-block ml-0.5 -mt-0.5" />
        </Link>
      </p>
      <div data-wallet-theme data-wallet-ui>
        <div className="rounded-3xl border border-[var(--wui-color-border)]">
          <TransactionReview
            verifyDisplayMode
            transactions={decoded.decodedTransactions}
            message={decoded.message}
            dangerous={decoded.dangerous}
            genesisHash={decoded.genesisHash}
            genesisID={decoded.genesisID}
            origin={origin}
            onApprove={() => {}}
            onReject={() => {}}
          />
        </div>
      </div>
    </div>
  )
}
