"use client"

import { Loader2, Search } from "lucide-react"
import { useRouter } from "next/navigation"
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react"

import { EmptyState } from "@/components/empty-state"
import { ErrorState } from "@/components/error-state"
import { ProtectedRoute } from "@/components/protected-route"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { ApiError, apiGet } from "@/lib/api/client"
import { ENDPOINTS } from "@/lib/api/endpoints"
import { cn } from "@/lib/utils"
import type {
  AdminTransaction,
  AdminTransactionListResponse,
} from "@/types/admin-transaction"

type StatusFilter = "ALL" | "PAID" | "FAILED"

type TypeFilter =
  | "ALL"
  | "SUBSCRIPTION_INITIAL"
  | "SUBSCRIPTION_RENEWAL"
  | "SUBSCRIPTION_UPDATE"
  | "SUBSCRIPTION_PAYMENT"

const PAGE_SIZE = 10

function formatAmount(value: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(value / 100)
  } catch {
    return `${value} ${currency.toUpperCase()}`
  }
}

function formatAmountLabel(status: AdminTransaction["status"], value: number, currency: string) {
  const formatted = formatAmount(value, currency)
  return status === "FAILED" ? `${formatted} (attempted)` : formatted
}

function formatDate(value: string | null) {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Date unavailable"
  return date.toLocaleString("en-BD", {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

function getStatusClassName(status: AdminTransaction["status"]) {
  if (status === "PAID") {
    return "bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-200"
  }
  if (status === "FAILED") {
    return "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-200"
  }
  return "bg-muted text-foreground"
}

export default function AdminTransactionsPage() {
  return (
    <ProtectedRoute requiredRole="admin">
      <AdminTransactionsContent />
    </ProtectedRoute>
  )
}

function AdminTransactionsContent() {
  const router = useRouter()
  const { loading: authLoading, isAuthenticated, accessToken } = useAuth()

  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL")
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("ALL")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [page, setPage] = useState(1)

  const [transactions, setTransactions] = useState<AdminTransaction[]>([])
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: PAGE_SIZE,
    totalPages: 1,
  })
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const [selectedTransaction, setSelectedTransaction] =
    useState<AdminTransaction | null>(null)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [detailsError, setDetailsError] = useState<string | null>(null)

  const requestIdRef = useRef(0)

  const fetchTransactions = useCallback(async () => {
    if (!accessToken) return

    const requestId = ++requestIdRef.current
    setStatus("loading")
    setErrorMessage(null)

    try {
      const response = await apiGet<AdminTransactionListResponse>(
        ENDPOINTS.adminTransactions,
        {
          q: debouncedSearch || undefined,
          status: statusFilter === "ALL" ? undefined : statusFilter,
          type: typeFilter === "ALL" ? undefined : typeFilter,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
          page,
          limit: PAGE_SIZE,
        },
        accessToken
      )

      if (requestId !== requestIdRef.current) return

      setTransactions(response.transactions)
      setPagination(response.pagination)
      setStatus("ready")
    } catch (error) {
      if (requestId !== requestIdRef.current) return

      if (error instanceof ApiError) {
        if (error.status === 401) {
          router.replace("/login")
          return
        }
        setErrorMessage(error.message || "Failed to load transactions.")
      } else {
        setErrorMessage("Failed to load transactions. Please try again.")
      }

      setStatus("error")
    }
  }, [
    accessToken,
    debouncedSearch,
    statusFilter,
    typeFilter,
    dateFrom,
    dateTo,
    page,
    router,
  ])

  useEffect(() => {
    if (authLoading || !isAuthenticated || !accessToken) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchTransactions()
  }, [authLoading, isAuthenticated, accessToken, fetchTransactions])

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim())
    }, 400)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(1)
  }, [statusFilter, typeFilter, dateFrom, dateTo, debouncedSearch])

  async function openDetails(id: string) {
    if (!accessToken) return

    setSelectedTransaction(null)
    setDetailsLoading(true)
    setDetailsError(null)

    try {
      const response = await apiGet<{
        success: boolean
        transaction: AdminTransaction
      }>(ENDPOINTS.adminTransaction(id), undefined, accessToken)

      setSelectedTransaction(response.transaction)
    } catch (error) {
      setDetailsError(
        error instanceof ApiError
          ? error.message
          : "Failed to load transaction details."
      )
    } finally {
      setDetailsLoading(false)
    }
  }

  const statusCounts = {
    ALL: transactions.length,
    PAID: transactions.filter((t) => t.status === "PAID").length,
    FAILED: transactions.filter((t) => t.status === "FAILED").length,
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div>
            <p className="text-xs font-medium tracking-[0.2em] text-primary uppercase">
              Admin dashboard
            </p>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              Transactions
            </h1>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => router.push("/admin")}
            className="h-9 rounded-[8px] px-3"
          >
            Back to overview
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
        <section className="rounded-xl border border-border bg-card p-4 sm:p-6">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:gap-4">
            <label className="relative w-full">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search email, vendor ID, invoice, subscription, or ID"
                className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
              />
            </label>

            <div className="flex flex-wrap gap-2 lg:justify-end">
              {(["ALL", "PAID", "FAILED"] as StatusFilter[]).map((value) => (
                <Button
                  key={`status-${value}`}
                  type="button"
                  variant={statusFilter === value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter(value)}
                  className="h-9 rounded-[8px] px-3"
                >
                  {value === "ALL" ? "All" : value}
                  <span className="ml-1.5 rounded-full bg-background/70 px-1.5 py-0.5 text-[10px] font-semibold text-foreground">
                    {statusCounts[value]}
                  </span>
                </Button>
              ))}

              <select
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value as TypeFilter)}
                className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
                aria-label="Filter by transaction type"
              >
                {(["ALL", "SUBSCRIPTION_INITIAL", "SUBSCRIPTION_RENEWAL", "SUBSCRIPTION_UPDATE", "SUBSCRIPTION_PAYMENT"] as TypeFilter[]).map((value) => (
                  <option key={value} value={value}>
                    {value === "ALL" ? "All types" : value.replace("SUBSCRIPTION_", "").replace("_", " ")}
                  </option>
                ))}
              </select>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-[120px_140px]">
                <label className="relative">
                  <span className="sr-only">Date from</span>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(event) => setDateFrom(event.target.value)}
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
                  />
                </label>
                <label className="relative">
                  <span className="sr-only">Date to</span>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(event) => setDateTo(event.target.value)}
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
                  />
                </label>
              </div>
            </div>
          </div>
        </section>

        {status === "loading" ? (
          <div className="overflow-x-auto rounded-xl border border-border bg-card">
            <div className="h-40 animate-pulse bg-muted" aria-busy="true" />
          </div>
        ) : null}

        {status === "error" ? (
          <ErrorState
            title="Unable to load transactions"
            description={errorMessage ?? undefined}
            onRetry={() => setPage((current) => Math.max(1, current - 1))}
          />
        ) : null}

        {status === "ready" && transactions.length === 0 ? (
          <EmptyState
            title="No transactions found"
            description="PizzaHub does not currently store dedicated payment transaction records."
          />
        ) : null}

        {status === "ready" && transactions.length > 0 ? (
          <>
            <div className="overflow-x-auto rounded-xl border border-border bg-card">
              <table className="min-w-full divide-y divide-border text-sm">
                <thead className="bg-secondary/50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Vendor</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Customer</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Amount</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Invoice / Payment</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-secondary/30">
                      <td className="px-4 py-3 text-foreground">
                        {transaction.vendorName ?? transaction.vendorId.slice(0, 8)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {transaction.customerEmail ?? "Not recorded"}
                      </td>
                      <td className="px-4 py-3 text-foreground">
                        {formatAmountLabel(transaction.status, transaction.amount, transaction.currency)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-1 text-xs font-medium",
                            getStatusClassName(transaction.status)
                          )}
                        >
                          {transaction.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {transaction.transactionType}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {formatDate(transaction.transactionDate)}
                      </td>
                      <td className="max-w-xs px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {transaction.stripeInvoiceId ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => void openDetails(transaction.id)}
                          className="h-9 rounded-[8px] px-3"
                        >
                          Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row">
              <p className="text-sm text-muted-foreground">
                Page {pagination.page} of {Math.max(pagination.totalPages, 1)} ·{" "}
                {pagination.total} total
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={pagination.page <= 1}
                  className="h-9 rounded-[8px] px-3"
                >
                  Previous
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPage((current) =>
                      Math.min(Math.max(pagination.totalPages, 1), current + 1)
                    )
                  }
                  disabled={pagination.page >= Math.max(pagination.totalPages, 1)}
                  className="h-9 rounded-[8px] px-3"
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        ) : null}

        {selectedTransaction ? (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="transaction-details-title"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setSelectedTransaction(null)}
          >
            <div
              className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl border border-border bg-card p-5 shadow-xl sm:p-6"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-medium tracking-[0.2em] text-primary uppercase">
                    Transaction details
                  </p>
                  <h2
                    id="transaction-details-title"
                    className="mt-1 text-xl font-semibold tracking-tight text-foreground"
                  >
                    Transaction {selectedTransaction.id}
                  </h2>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedTransaction(null)}
                  className="h-9 rounded-[8px] px-3"
                >
                  Close
                </Button>
              </div>

              {detailsLoading ? (
                <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Loading details...
                </div>
              ) : null}

              {detailsError ? (
                <p role="alert" className="mt-3 text-sm text-destructive">
                  {detailsError}
                </p>
              ) : null}

              <dl className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="flex justify-between gap-3 text-sm">
                  <dt className="text-muted-foreground">Vendor</dt>
                  <dd className="text-right font-medium text-foreground">
                    {selectedTransaction.vendorName ?? selectedTransaction.vendorId}
                  </dd>
                </div>
                <div className="flex justify-between gap-3 text-sm">
                  <dt className="text-muted-foreground">Customer</dt>
                  <dd className="text-right font-medium text-foreground">
                    {selectedTransaction.customerEmail ?? "Not recorded"}
                  </dd>
                </div>
                <div className="flex justify-between gap-3 text-sm">
                  <dt className="text-muted-foreground">Amount</dt>
                  <dd className="text-right font-medium text-foreground">
                    {formatAmountLabel(selectedTransaction.status, selectedTransaction.amount, selectedTransaction.currency)}
                  </dd>
                </div>
                <div className="flex justify-between gap-3 text-sm">
                  <dt className="text-muted-foreground">Status</dt>
                  <dd className="text-right font-medium text-foreground">
                    {selectedTransaction.status}
                  </dd>
                </div>
                <div className="flex justify-between gap-3 text-sm">
                  <dt className="text-muted-foreground">Type</dt>
                  <dd className="text-right font-medium text-foreground">
                    {selectedTransaction.transactionType}
                  </dd>
                </div>
                <div className="flex justify-between gap-3 text-sm">
                  <dt className="text-muted-foreground">Transaction date</dt>
                  <dd className="text-right font-medium text-foreground">
                    {formatDate(selectedTransaction.transactionDate)}
                  </dd>
                </div>
                <div className="flex justify-between gap-3 text-sm">
                  <dt className="text-muted-foreground">Invoice</dt>
                  <dd className="text-right font-medium text-foreground">
                    {selectedTransaction.stripeInvoiceId ?? "—"}
                  </dd>
                </div>
                <div className="flex justify-between gap-3 text-sm">
                  <dt className="text-muted-foreground">Payment intent</dt>
                  <dd className="text-right font-medium text-foreground">
                    {selectedTransaction.stripePaymentIntentId ?? "—"}
                  </dd>
                </div>
                <div className="flex justify-between gap-3 text-sm">
                  <dt className="text-muted-foreground">Subscription</dt>
                  <dd className="text-right font-medium text-foreground">
                    {selectedTransaction.stripeSubscriptionId ?? "—"}
                  </dd>
                </div>
              </dl>

              <p className="mt-5 text-sm text-muted-foreground">
                Amount {formatAmountLabel(selectedTransaction.status, selectedTransaction.amount, selectedTransaction.currency)} · {selectedTransaction.currency.toUpperCase()} · Created {formatDate(selectedTransaction.createdAt)}
              </p>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  )
}
