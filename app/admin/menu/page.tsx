"use client"

import { Search, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react"

import { EmptyState } from "@/components/empty-state"
import { ErrorState } from "@/components/error-state"
import { Price } from "@/components/price"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { ApiError, apiDelete, apiGet, apiPatch } from "@/lib/api/client"
import { ENDPOINTS } from "@/lib/api/endpoints"
import { cn } from "@/lib/utils"
import type {
  AdminMenuItem,
  AdminMenuMutationResponse,
  AdminMenuResponse,
} from "@/types/admin-menu"

type StatusFilter = "ALL" | "PENDING" | "APPROVED" | "REJECTED"

function formatDate(value: string | null) {
  if (!value) return "Not reviewed"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Date unavailable"
  return date.toLocaleString("en-BD", {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

function getApprovalClassName(status: AdminMenuItem["approvalStatus"]) {
  if (status === "APPROVED") {
    return "bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-200"
  }

  if (status === "REJECTED") {
    return "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-200"
  }

  return "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-200"
}

export default function AdminMenuModerationPage() {
  const router = useRouter()
  const { loading: authLoading, isAuthenticated, accessToken, user } = useAuth()

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("PENDING")
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [category, setCategory] = useState("")
  const [page, setPage] = useState(1)
  const limit = 10

  const [items, setItems] = useState<AdminMenuItem[]>([])
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit,
    totalPages: 1,
  })
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const [selectedItem, setSelectedItem] = useState<AdminMenuItem | null>(null)
  const [detailsLoading, setDetailsLoading] = useState(false)

  const [approvingId, setApprovingId] = useState<string | null>(null)
  const [rejectingItem, setRejectingItem] = useState<AdminMenuItem | null>(null)
  const [rejectionReason, setRejectionReason] = useState("")
  const [rejectError, setRejectError] = useState<string | null>(null)
  const [rejecting, setRejecting] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<AdminMenuItem | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const requestIdRef = useRef(0)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 400)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(1)
  }, [statusFilter, debouncedSearch, category])

  const fetchItems = useCallback(async () => {
    if (!accessToken) return

    const requestId = ++requestIdRef.current
    setStatus("loading")
    setErrorMessage(null)

    try {
      const response = await apiGet<AdminMenuResponse>(
        ENDPOINTS.adminMenuItems,
        {
          status: statusFilter === "ALL" ? undefined : statusFilter,
          q: debouncedSearch || undefined,
          category: category.trim() || undefined,
          page,
          limit,
        },
        accessToken
      )

      if (requestId !== requestIdRef.current) return

      setItems(response.menuItems)
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

        setErrorMessage(error.message || "Failed to load menu items.")
      } else {
        setErrorMessage("Failed to load menu items. Please try again.")
      }

      setStatus("error")
    }
  }, [accessToken, statusFilter, debouncedSearch, category, page, limit, router])

  useEffect(() => {
    if (authLoading || !isAuthenticated || !accessToken) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchItems()
  }, [authLoading, isAuthenticated, accessToken, fetchItems])

  async function handleApprove(item: AdminMenuItem) {
    if (!accessToken || approvingId) return

    setApprovingId(item._id)
    setNotice(null)

    try {
      const response = await apiPatch<AdminMenuMutationResponse>(
        ENDPOINTS.adminApproveMenuItem(item._id),
        undefined,
        accessToken
      )

      setItems((current) =>
        current.map((entry) =>
          entry._id === item._id ? response.menuItem : entry
        )
      )
      setNotice(response.message || "Menu item approved successfully.")
    } catch (error) {
      setNotice(
        error instanceof ApiError
          ? error.message
          : "Failed to approve menu item."
      )
    } finally {
      setApprovingId(null)
    }
  }

  function openDelete(item: AdminMenuItem) {
    setDeleteTarget(item)
    setDeleteError(null)
  }

  function closeDelete() {
    if (deleting) return
    setDeleteTarget(null)
    setDeleteError(null)
  }

  async function handleDelete(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!accessToken || !deleteTarget || deleting) return

    setDeleting(true)
    setDeleteError(null)

    try {
      await apiDelete<AdminMenuMutationResponse>(
        ENDPOINTS.adminMenuItem(deleteTarget._id),
        accessToken
      )
      setNotice("Menu item deleted successfully.")
      setDeleteTarget(null)
      await fetchItems()
    } catch (error) {
      setDeleteError(
        error instanceof ApiError
          ? error.message
          : "Failed to delete menu item."
      )
    } finally {
      setDeleting(false)
    }
  }

  function openReject(item: AdminMenuItem) {
    setRejectingItem(item)
    setRejectionReason("")
    setRejectError(null)
  }

  function closeReject() {
    if (rejecting) return
    setRejectingItem(null)
    setRejectionReason("")
    setRejectError(null)
  }

  async function handleReject(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!accessToken || !rejectingItem || rejecting) return

    const trimmedReason = rejectionReason.trim()

    if (trimmedReason.length < 3) {
      setRejectError("Rejection reason must be at least 3 characters.")
      return
    }

    if (trimmedReason.length > 300) {
      setRejectError("Rejection reason must be 300 characters or fewer.")
      return
    }

    setRejecting(true)
    setRejectError(null)

    try {
      const response = await apiPatch<AdminMenuMutationResponse>(
        ENDPOINTS.adminRejectMenuItem(rejectingItem._id),
        { rejectionReason: trimmedReason },
        accessToken
      )

      setItems((current) =>
        current.map((entry) =>
          entry._id === rejectingItem._id ? response.menuItem : entry
        )
      )
      setNotice(response.message || "Menu item rejected successfully.")
      setRejectingItem(null)
      setRejectionReason("")
    } catch (error) {
      setRejectError(
        error instanceof ApiError
          ? error.message
          : "Failed to reject menu item."
      )
    } finally {
      setRejecting(false)
    }
  }

  async function openDetails(item: AdminMenuItem) {
    if (!accessToken) return

    setSelectedItem(item)
    setDetailsLoading(true)

    try {
      const response = await apiGet<{ success: boolean; menuItem: AdminMenuItem }>(
        ENDPOINTS.adminMenuItem(item._id),
        undefined,
        accessToken
      )

      setSelectedItem(response.menuItem)
    } catch {
      // Keep the list item if details fail.
    } finally {
      setDetailsLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading admin dashboard...</p>
      </div>
    )
  }

  if (!isAuthenticated || !accessToken || user?.role !== "admin") {
    return null
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
              Menu Moderation
            </h1>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => router.push("/")}
            className="h-9 rounded-[8px] px-3"
          >
            Back to storefront
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
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
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
                    {value === "ALL" ? "All" : value.charAt(0) + value.slice(1).toLowerCase()}
                  </Button>
                )
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:w-[32rem]">
              <label className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search name or description"
                  className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
                />
              </label>
              <input
                type="text"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                placeholder="Category filter"
                className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
              />
            </div>
          </div>
        </section>

        {status === "loading" ? (
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-56 animate-pulse rounded-xl border border-border bg-card"
              />
            ))}
          </div>
        ) : null}

        {status === "error" ? (
          <ErrorState description={errorMessage ?? undefined} onRetry={fetchItems} />
        ) : null}

        {status === "ready" && items.length === 0 ? (
          <EmptyState
            title="No menu items found"
            description="Try changing the status, search, or category filters."
          />
        ) : null}

        {status === "ready" && items.length > 0 ? (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              {items.map((item) => (
                <article
                  key={item._id}
                  className="overflow-hidden rounded-xl border border-border bg-card"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="h-full w-full object-cover"
                      onError={(event) => {
                        event.currentTarget.src = "/images/hero-pizza.jpg"
                      }}
                    />
                    <span
                      className={cn(
                        "absolute top-3 left-3 rounded-full px-2.5 py-1 text-xs font-medium",
                        getApprovalClassName(item.approvalStatus)
                      )}
                    >
                      {item.approvalStatus}
                    </span>
                    <span className="absolute top-3 right-3 rounded-full bg-card/90 px-2.5 py-1 text-xs font-medium text-foreground backdrop-blur">
                      {item.isAvailable ? "Available" : "Unavailable"}
                    </span>
                  </div>

                  <div className="space-y-3 p-4">
                    <div>
                      <h2 className="text-lg font-semibold tracking-tight text-foreground">
                        {item.name}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        {item.category} · <Price value={item.price} />
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Vendor: {item.vendor?.name ?? "Unknown"} ·{" "}
                        {item.vendor?.email ?? "No email"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Restaurant: {item.restaurant?.name ?? "Unknown"}
                      </p>
                    </div>

                    {item.rejectionReason ? (
                      <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs leading-relaxed text-red-900 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-100">
                        {item.rejectionReason}
                      </p>
                    ) : null}

                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => openDetails(item)}
                        className="h-9 rounded-[8px] px-3"
                      >
                        Details
                      </Button>
                      <Button
                        type="button"
                        variant="default"
                        size="sm"
                        onClick={() => handleApprove(item)}
                        disabled={approvingId === item._id}
                        className="h-9 rounded-[8px] px-3"
                      >
                        {approvingId === item._id ? "Approving..." : "Approve"}
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => openReject(item)}
                        className="h-9 rounded-[8px] px-3"
                      >
                        Reject
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => openDelete(item)}
                        className="h-9 rounded-[8px] px-3 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
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

        {selectedItem ? (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-item-details-title"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setSelectedItem(null)}
          >
            <div
              className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-border bg-card p-5 shadow-xl sm:p-6"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-medium tracking-[0.2em] text-primary uppercase">
                    Menu item details
                  </p>
                  <h2
                    id="admin-item-details-title"
                    className="mt-1 text-xl font-semibold tracking-tight text-foreground"
                  >
                    {selectedItem.name}
                  </h2>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedItem(null)}
                  className="h-9 rounded-[8px] px-3"
                >
                  Close
                </Button>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-[160px_1fr]">
                <div className="relative aspect-square overflow-hidden rounded-xl border border-border bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedItem.imageUrl}
                    alt={selectedItem.name}
                    className="h-full w-full object-cover"
                    onError={(event) => {
                      event.currentTarget.src = "/images/hero-pizza.jpg"
                    }}
                  />
                </div>
                <div className="space-y-3 text-sm">
                  <p className="text-muted-foreground">{selectedItem.description}</p>
                  <dl className="grid gap-2">
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted-foreground">Category</dt>
                      <dd className="font-medium text-foreground">{selectedItem.category}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted-foreground">Price</dt>
                      <dd className="font-medium text-foreground">
                        <Price value={selectedItem.price} />
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted-foreground">Availability</dt>
                      <dd className="font-medium text-foreground">
                        {selectedItem.isAvailable ? "Available" : "Unavailable"}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted-foreground">Approval</dt>
                      <dd className="font-medium text-foreground">{selectedItem.approvalStatus}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted-foreground">Vendor</dt>
                      <dd className="font-medium text-foreground">
                        {selectedItem.vendor?.name ?? "Unknown"}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted-foreground">Restaurant</dt>
                      <dd className="font-medium text-foreground">
                        {selectedItem.restaurant?.name ?? "Unknown"}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted-foreground">Reviewed at</dt>
                      <dd className="font-medium text-foreground">
                        {formatDate(selectedItem.reviewedAt)}
                      </dd>
                    </div>
                  </dl>
                  {selectedItem.rejectionReason ? (
                    <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm leading-relaxed text-red-900 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-100">
                      {selectedItem.rejectionReason}
                    </p>
                  ) : null}
                </div>
              </div>

              {detailsLoading ? (
                <p className="mt-4 text-xs text-muted-foreground">Refreshing details...</p>
              ) : null}
            </div>
          </div>
        ) : null}

        {deleteTarget ? (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-item-title"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={closeDelete}
          >
            <form
              className="w-full max-w-lg rounded-xl border border-border bg-card p-5 shadow-xl sm:p-6"
              onSubmit={handleDelete}
              onClick={(event) => event.stopPropagation()}
            >
              <h2 id="delete-item-title" className="text-lg font-semibold tracking-tight text-foreground">
                Delete menu item
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Are you sure you want to delete {deleteTarget.name}? This cannot be undone. Existing orders keep their saved item details.
              </p>
              {deleteError ? (
                <p role="alert" className="mt-3 text-sm text-destructive">
                  {deleteError}
                </p>
              ) : null}
              <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" onClick={closeDelete} disabled={deleting} className="h-9 rounded-[8px] px-3">
                  Cancel
                </Button>
                <Button type="submit" variant="destructive" disabled={deleting} className="h-9 rounded-[8px] px-3">
                  {deleting ? "Deleting..." : "Delete item"}
                </Button>
              </div>
            </form>
          </div>
        ) : null}

        {rejectingItem ? (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="reject-reason-title"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={closeReject}
          >
            <form
              className="w-full max-w-lg rounded-xl border border-border bg-card p-5 shadow-xl sm:p-6"
              onSubmit={handleReject}
              onClick={(event) => event.stopPropagation()}
            >
              <h2
                id="reject-reason-title"
                className="text-lg font-semibold tracking-tight text-foreground"
              >
                Reject menu item
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Provide a clear reason for rejecting “{rejectingItem.name}”.
              </p>

              <div className="mt-4 space-y-2">
                <label
                  htmlFor="rejection-reason"
                  className="text-sm font-medium text-foreground"
                >
                  Rejection reason
                </label>
                <textarea
                  id="rejection-reason"
                  value={rejectionReason}
                  onChange={(event) => setRejectionReason(event.target.value)}
                  rows={4}
                  minLength={3}
                  maxLength={300}
                  disabled={rejecting}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
                  placeholder="Explain why this item cannot be approved."
                />
                <p className="text-xs text-muted-foreground">
                  {rejectionReason.trim().length}/300 characters
                </p>
                {rejectError ? (
                  <p role="alert" className="text-sm text-destructive">
                    {rejectError}
                  </p>
                ) : null}
              </div>

              <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeReject}
                  disabled={rejecting}
                  className="h-9 rounded-[8px] px-3"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={rejecting}
                  className="h-9 rounded-[8px] px-3"
                >
                  {rejecting ? "Rejecting..." : "Reject item"}
                </Button>
              </div>
            </form>
          </div>
        ) : null}
      </main>
    </div>
  )
}
