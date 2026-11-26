"use client"

import { CheckCircle2, Eye, Search, XCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"

import { EmptyState } from "@/components/empty-state"
import { ErrorState } from "@/components/error-state"
import { ProtectedRoute } from "@/components/protected-route"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { ApiError, apiGet, apiPatch } from "@/lib/api/client"
import { ENDPOINTS } from "@/lib/api/endpoints"
import { cn } from "@/lib/utils"
import type {
  VendorRequest,
  VendorRequestDetailsResponse,
  VendorRequestsResponse,
  VendorRequestStatus,
} from "@/types/vendor-request"

type StatusFilter = "ALL" | VendorRequestStatus
type ReviewAction = {
  request: VendorRequest
  type: "approve" | "reject"
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Date unavailable"
  return date.toLocaleString("en-BD", {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

function getStatusClassName(status: VendorRequestStatus) {
  if (status === "APPROVED") {
    return "bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-200"
  }

  if (status === "REJECTED") {
    return "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-200"
  }

  return "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-200"
}

export default function AdminVendorRequestsPage() {
  return (
    <ProtectedRoute requiredRole="admin">
      <AdminVendorRequestsContent />
    </ProtectedRoute>
  )
}

function AdminVendorRequestsContent() {
  const router = useRouter()
  const { loading: authLoading, isAuthenticated, accessToken } = useAuth()

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL")
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [page, setPage] = useState(1)
  const limit = 10

  const [requests, setRequests] = useState<VendorRequest[]>([])
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit,
    totalPages: 1,
  })
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const [selected, setSelected] = useState<VendorRequest | null>(null)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [detailsError, setDetailsError] = useState<string | null>(null)

  const [action, setAction] = useState<ReviewAction | null>(null)
  const [rejectionReason, setRejectionReason] = useState("")
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const requestIdRef = useRef(0)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 400)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(1)
  }, [statusFilter, debouncedSearch])

  const fetchRequests = useCallback(async () => {
    if (!accessToken) return

    const requestId = ++requestIdRef.current
    setStatus("loading")
    setErrorMessage(null)

    try {
      const response = await apiGet<VendorRequestsResponse>(
        ENDPOINTS.adminVendorRequests,
        {
          status: statusFilter === "ALL" ? undefined : statusFilter,
          q: debouncedSearch || undefined,
          page,
          limit,
        },
        accessToken
      )

      if (requestId !== requestIdRef.current) return

      setRequests(response.requests)
      setPagination(response.pagination)
      setStatus("ready")
    } catch (error) {
      if (requestId !== requestIdRef.current) return

      if (error instanceof ApiError) {
        if (error.status === 401) {
          router.replace("/login")
          return
        }

        if (error.status === 403) {
          router.replace("/")
          return
        }

        setErrorMessage(error.message || "Failed to load vendor requests.")
      } else {
        setErrorMessage("Failed to load vendor requests. Please try again.")
      }

      setStatus("error")
    }
  }, [accessToken, statusFilter, debouncedSearch, page, limit, router])

  useEffect(() => {
    if (authLoading || !isAuthenticated || !accessToken) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchRequests()
  }, [authLoading, isAuthenticated, accessToken, fetchRequests])

  async function openDetails(target: VendorRequest) {
    if (!accessToken) return

    setSelected(null)
    setDetailsLoading(true)
    setDetailsError(null)

    try {
      const response = await apiGet<VendorRequestDetailsResponse>(
        ENDPOINTS.adminVendorRequest(target.id),
        undefined,
        accessToken
      )
      setSelected(response.request)
    } catch (error) {
      setDetailsError(
        error instanceof ApiError
          ? error.message
          : "Failed to load request details."
      )
    } finally {
      setDetailsLoading(false)
    }
  }

  async function handleReview() {
    if (!accessToken || !action || actionLoading) return

    const trimmedReason = rejectionReason.trim()

    if (action.type === "reject" && (trimmedReason.length < 3 || trimmedReason.length > 300)) {
      setActionError("Reason must be between 3 and 300 characters.")
      return
    }

    setActionLoading(true)
    setActionError(null)

    try {
      const endpoint =
        action.type === "approve"
          ? ENDPOINTS.adminVendorRequestApprove(action.request.id)
          : ENDPOINTS.adminVendorRequestReject(action.request.id)

      const response = await apiPatch<VendorRequestDetailsResponse>(
        endpoint,
        action.type === "reject" ? { rejectionReason: trimmedReason } : undefined,
        accessToken
      )

      setRequests((current) =>
        current.map((item) =>
          item.id === response.request.id ? response.request : item
        )
      )
      setSelected((current) =>
        current?.id === response.request.id ? response.request : current
      )
      setNotice(
        action.type === "approve"
          ? "Request approved. The applicant can now access the vendor dashboard."
          : "Request rejected. The applicant can apply again with updated details."
      )
      setAction(null)
      setRejectionReason("")
    } catch (error) {
      setActionError(
        error instanceof ApiError
          ? error.message
          : "Failed to update the request. Please try again."
      )
    } finally {
      setActionLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading requests...</p>
      </div>
    )
  }

  if (!isAuthenticated || !accessToken) return null

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div>
            <p className="text-xs font-medium tracking-[0.2em] text-primary uppercase">
              Admin dashboard
            </p>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              Vendor Requests
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
        {notice ? (
          <div
            role="status"
            className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-green-900 dark:border-green-900/40 dark:bg-green-950/30 dark:text-green-100"
          >
            <p className="flex-1 text-sm leading-relaxed">{notice}</p>
            <button
              type="button"
              onClick={() => setNotice(null)}
              aria-label="Dismiss success message"
              className="-m-1 inline-flex size-7 shrink-0 items-center justify-center rounded-md text-green-800 transition-colors hover:bg-green-100 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none dark:text-green-200 dark:hover:bg-green-900/50"
            >
              <span aria-hidden>×</span>
            </button>
          </div>
        ) : null}

        <section className="rounded-xl border border-border bg-card p-4 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {(["ALL", "PENDING", "APPROVED", "REJECTED"] as StatusFilter[]).map(
                (value) => (
                  <Button
                    key={value}
                    type="button"
                    variant={statusFilter === value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter(value)}
                    className="h-9 rounded-[8px] px-3"
                  >
                    {value === "ALL" ? "All requests" : value.charAt(0) + value.slice(1).toLowerCase()}
                  </Button>
                )
              )}
            </div>

            <label className="relative w-full lg:w-72">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search restaurant or applicant"
                className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
              />
            </label>
          </div>
        </section>

        {status === "loading" ? (
          <div className="space-y-3" aria-busy="true" aria-live="polite">
            <span className="sr-only">Loading vendor requests</span>
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="h-16 animate-pulse rounded-xl border border-border bg-card"
              />
            ))}
          </div>
        ) : null}

        {status === "error" ? (
          <ErrorState description={errorMessage ?? undefined} onRetry={fetchRequests} />
        ) : null}

        {status === "ready" && requests.length === 0 ? (
          <EmptyState
            title="No vendor requests found"
            description="Try changing the search or filter."
          />
        ) : null}

        {status === "ready" && requests.length > 0 ? (
          <>
            <div className="overflow-x-auto rounded-xl border border-border bg-card">
              <table className="min-w-full divide-y divide-border text-sm">
                <thead className="bg-secondary/50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Restaurant</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Applicant</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Submitted</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {requests.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3 font-medium text-foreground">
                        {item.restaurantName}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        <span className="block">{item.name}</span>
                        <span className="block text-xs">{item.email}</span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDate(item.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-1 text-xs font-medium",
                            getStatusClassName(item.status)
                          )}
                        >
                          {item.status.charAt(0) + item.status.slice(1).toLowerCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => void openDetails(item)}
                            className="h-9 rounded-[8px] px-3"
                          >
                            <Eye className="size-4" aria-hidden />
                            Details
                          </Button>
                          {item.status === "PENDING" ? (
                            <>
                              <Button
                                type="button"
                                variant="default"
                                size="sm"
                                onClick={() => {
                                  setAction({ request: item, type: "approve" })
                                  setActionError(null)
                                }}
                                className="h-9 rounded-[8px] px-3"
                              >
                                <CheckCircle2 className="size-4" aria-hidden />
                                Approve
                              </Button>
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  setAction({ request: item, type: "reject" })
                                  setRejectionReason("")
                                  setActionError(null)
                                }}
                                className="h-9 rounded-[8px] px-3"
                              >
                                <XCircle className="size-4" aria-hidden />
                                Reject
                              </Button>
                            </>
                          ) : null}
                        </div>
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

        {selected ? (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="request-details-title"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setSelected(null)}
          >
            <div
              className="w-full max-w-lg rounded-xl border border-border bg-card p-5 shadow-xl sm:p-6"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4">
                <h2
                  id="request-details-title"
                  className="text-lg font-semibold tracking-tight text-foreground"
                >
                  Vendor request details
                </h2>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelected(null)
                    setDetailsError(null)
                  }}
                  className="h-9 rounded-[8px] px-3"
                >
                  Close
                </Button>
              </div>

              {detailsLoading ? (
                <p className="mt-3 text-sm text-muted-foreground">Loading details...</p>
              ) : null}
              {detailsError ? (
                <p role="alert" className="mt-3 text-sm text-destructive">
                  {detailsError}
                </p>
              ) : null}

              <dl className="mt-5 grid gap-3 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Restaurant</dt>
                  <dd className="text-right font-medium text-foreground">
                    {selected.restaurantName}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Applicant</dt>
                  <dd className="text-right font-medium text-foreground">
                    {selected.name}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Email</dt>
                  <dd className="text-right font-medium text-foreground">
                    {selected.email}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Status</dt>
                  <dd className="text-right font-medium text-foreground">
                    {selected.status.charAt(0) + selected.status.slice(1).toLowerCase()}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Submitted</dt>
                  <dd className="text-right font-medium text-foreground">
                    {formatDate(selected.createdAt)}
                  </dd>
                </div>
                {selected.reviewedAt ? (
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">Reviewed</dt>
                    <dd className="text-right font-medium text-foreground">
                      {formatDate(selected.reviewedAt)}
                    </dd>
                  </div>
                ) : null}
                {selected.rejectionReason ? (
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">Rejection reason</dt>
                    <dd className="max-w-xs text-right font-medium text-foreground">
                      {selected.rejectionReason}
                    </dd>
                  </div>
                ) : null}
                <div className="border-t border-border pt-3">
                  <dt className="text-muted-foreground">Message</dt>
                  <dd className="mt-1 leading-relaxed text-foreground">
                    {selected.message || "No message provided."}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        ) : null}

        {action ? (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="review-action-title"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => {
              if (!actionLoading) {
                setAction(null)
                setActionError(null)
              }
            }}
          >
            <div
              className="w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-xl sm:p-6"
              onClick={(event) => event.stopPropagation()}
            >
              <h2
                id="review-action-title"
                className="text-lg font-semibold tracking-tight text-foreground"
              >
                {action.type === "approve"
                  ? "Approve vendor request"
                  : "Reject vendor request"}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {action.type === "approve"
                  ? `Approve ${action.request.name} (${action.request.email}) for ${action.request.restaurantName}? They will be able to access the vendor dashboard.`
                  : `Reject ${action.request.name}'s application for ${action.request.restaurantName}? Let them know why so they can apply again.`}
              </p>

              {action.type === "reject" ? (
                <div className="mt-4 space-y-2">
                  <label
                    htmlFor="rejection-reason"
                    className="text-sm font-medium text-foreground"
                  >
                    Reason for rejection
                  </label>
                  <textarea
                    id="rejection-reason"
                    rows={3}
                    value={rejectionReason}
                    onChange={(event) => setRejectionReason(event.target.value)}
                    placeholder="Explain what needs to change"
                    className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
                  />
                  <p className="text-xs text-muted-foreground">
                    {rejectionReason.trim().length}/300
                  </p>
                </div>
              ) : null}

              {actionError ? (
                <p role="alert" className="mt-3 text-sm text-destructive">
                  {actionError}
                </p>
              ) : null}

              <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setAction(null)
                    setRejectionReason("")
                    setActionError(null)
                  }}
                  disabled={actionLoading}
                  className="h-9 rounded-[8px] px-3"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant={action.type === "reject" ? "destructive" : "default"}
                  onClick={() => void handleReview()}
                  disabled={actionLoading}
                  className="h-9 rounded-[8px] px-3"
                >
                  {actionLoading
                    ? "Saving..."
                    : action.type === "approve"
                      ? "Approve request"
                      : "Reject request"}
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  )
}
