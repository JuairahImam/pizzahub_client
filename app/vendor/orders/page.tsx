"use client"

import { Search } from "lucide-react"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"

import { EmptyState } from "@/components/empty-state"
import { ErrorState } from "@/components/error-state"
import { OrderStatusBadge } from "@/components/order-status-badge"
import { Price } from "@/components/price"
import { ProtectedRoute } from "@/components/protected-route"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { ApiError, apiGet, apiPatch } from "@/lib/api/client"
import { ENDPOINTS } from "@/lib/api/endpoints"

import type { Order, OrderStatus, VendorOrdersResponse } from "@/types/order"

type StatusFilter =
  | "ALL"
  | "PENDING"
  | "CONFIRMED"
  | "PREPARING"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "REJECTED"
  | "CANCELLED"

const STATUS_FILTERS: StatusFilter[] = [
  "ALL",
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "REJECTED",
  "CANCELLED",
]

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Date unavailable"
  return date.toLocaleString("en-BD", {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

function formatOrderId(value: string) {
  const shortId = value.length > 8 ? value.slice(-8) : value
  return shortId.toUpperCase()
}

function getNextStatus(status: OrderStatus): OrderStatus | null {
  if (status === "CONFIRMED") return "PREPARING"
  if (status === "PREPARING") return "OUT_FOR_DELIVERY"
  if (status === "OUT_FOR_DELIVERY") return "DELIVERED"
  return null
}

function getNextStatusLabel(status: OrderStatus) {
  const next = getNextStatus(status)
  if (next === "PREPARING") return "Start preparing"
  if (next === "OUT_FOR_DELIVERY") return "Out for delivery"
  if (next === "DELIVERED") return "Mark delivered"
  return null
}

export default function VendorOrdersPage() {
  return (
    <ProtectedRoute requiredRole="vendor">
      <VendorOrdersContent />
    </ProtectedRoute>
  )
}

function VendorOrdersContent() {
  const router = useRouter()
  const { loading: authLoading, isAuthenticated, accessToken } = useAuth()

  const [orders, setOrders] = useState<Order[]>([])
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL")
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<"loading" | "ready" | "error" | "forbidden">(
    "loading"
  )
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [forbiddenMessage, setForbiddenMessage] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [rejectingOrder, setRejectingOrder] = useState<Order | null>(null)
  const [rejectionReason, setRejectionReason] = useState("")
  const [rejectError, setRejectError] = useState<string | null>(null)

  const [actionOrderId, setActionOrderId] = useState<string | null>(null)
  const [actionType, setActionType] = useState<string | null>(null)

  const requestIdRef = useRef(0)

  const fetchOrders = useCallback(async () => {
    if (!accessToken) return

    const requestId = ++requestIdRef.current
    setStatus("loading")
    setErrorMessage(null)
    setForbiddenMessage(null)

    try {
      const response = await apiGet<VendorOrdersResponse>(
        ENDPOINTS.vendorOrders,
        undefined,
        accessToken
      )

      if (requestId !== requestIdRef.current) return

      setOrders(Array.isArray(response?.orders) ? response.orders : [])
      setStatus("ready")
    } catch (error) {
      if (requestId !== requestIdRef.current) return

      if (error instanceof ApiError) {
        if (error.status === 401) {
          router.replace("/login")
          return
        }

        if (error.status === 403) {
          setForbiddenMessage(error.message || null)
          setStatus("forbidden")
          return
        }

        setErrorMessage(error.message || "Failed to load orders.")
      } else {
        setErrorMessage("Failed to load orders. Please try again.")
      }

      setStatus("error")
    }
  }, [accessToken, router])

  useEffect(() => {
    if (authLoading || !isAuthenticated || !accessToken) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchOrders()
  }, [authLoading, isAuthenticated, accessToken, fetchOrders, reloadToken])

  const filteredOrders = orders.filter((order) => {
    if (statusFilter !== "ALL" && order.status !== statusFilter) return false

    if (search.trim()) {
      const query = search.trim().toLowerCase()
      const haystack = [
        order._id,
        order.customerName,
        order.customerEmail,
        order.contactPhone,
        order.deliveryAddress,
      ]
        .join(" ")
        .toLowerCase()

      if (!haystack.includes(query)) return false
    }

    return true
  })

  const counts = STATUS_FILTERS.reduce<Record<string, number>>((acc, value) => {
    if (value === "ALL") {
      acc[value] = orders.length
      return acc
    }

    acc[value] = orders.filter((order) => order.status === value).length
    return acc
  }, {})

  async function handleAccept(order: Order) {
    if (!accessToken || actionOrderId) return

    setActionOrderId(order._id)
    setActionType("accept")
    setNotice(null)

    try {
      const response = await apiPatch<{ success: boolean; message: string; order: Order }>(
        ENDPOINTS.vendorOrderAccept(order._id),
        undefined,
        accessToken
      )

      setOrders((current) =>
        current.map((entry) => (entry._id === order._id ? response.order : entry))
      )
      setNotice(response.message || "Order accepted successfully.")
    } catch (error) {
      setNotice(
        error instanceof ApiError
          ? error.message
          : "Failed to accept order."
      )
    } finally {
      setActionOrderId(null)
      setActionType(null)
    }
  }

  function openReject(order: Order) {
    setRejectingOrder(order)
    setRejectionReason("")
    setRejectError(null)
  }

  function closeReject() {
    if (actionOrderId) return
    setRejectingOrder(null)
    setRejectionReason("")
    setRejectError(null)
  }

  async function handleReject(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!accessToken || !rejectingOrder || actionOrderId) return

    const trimmedReason = rejectionReason.trim()

    if (trimmedReason.length < 3 || trimmedReason.length > 300) {
      setRejectError("Rejection reason must be between 3 and 300 characters.")
      return
    }

    setActionOrderId(rejectingOrder._id)
    setActionType("reject")
    setRejectError(null)

    try {
      const response = await apiPatch<{ success: boolean; message: string; order: Order }>(
        ENDPOINTS.vendorOrderReject(rejectingOrder._id),
        { rejectionReason: trimmedReason },
        accessToken
      )

      setOrders((current) =>
        current.map((entry) =>
          entry._id === rejectingOrder._id ? response.order : entry
        )
      )
      setNotice(response.message || "Order rejected successfully.")
      setRejectingOrder(null)
      setRejectionReason("")
    } catch (error) {
      setRejectError(
        error instanceof ApiError
          ? error.message
          : "Failed to reject order."
      )
    } finally {
      setActionOrderId(null)
      setActionType(null)
    }
  }

  async function handleStatusUpdate(order: Order, nextStatus: OrderStatus) {
    if (!accessToken || actionOrderId) return

    setActionOrderId(order._id)
    setActionType(nextStatus)

    try {
      const response = await apiPatch<{ success: boolean; message: string; order: Order }>(
        ENDPOINTS.vendorOrderStatus(order._id),
        { status: nextStatus },
        accessToken
      )

      setOrders((current) =>
        current.map((entry) => (entry._id === order._id ? response.order : entry))
      )
      setNotice(response.message || "Order status updated successfully.")
    } catch (error) {
      setNotice(
        error instanceof ApiError
          ? error.message
          : "Failed to update order status."
      )
    } finally {
      setActionOrderId(null)
      setActionType(null)
    }
  }

  const handleRetry = () => {
    setStatus("loading")
    setErrorMessage(null)
    setForbiddenMessage(null)
    setReloadToken((value) => value + 1)
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading vendor orders...</p>
      </div>
    )
  }

  if (!isAuthenticated || !accessToken) {
    return null
  }

  return (
    <div className="max-w-6xl space-y-6 sm:space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium tracking-[0.2em] text-primary uppercase">
            Vendor dashboard
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Orders
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Review and fulfill orders placed for your restaurant.
          </p>
        </div>
      </header>

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

      {status === "loading" ? (
        <div className="space-y-4" aria-busy="true" aria-live="polite">
          <span className="sr-only">Loading orders</span>
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-44 animate-pulse rounded-xl border border-border bg-card"
            />
          ))}
        </div>
      ) : null}

      {status === "forbidden" ? (
        <EmptyState
          title="Access denied"
          description={
            forbiddenMessage
              ? `${forbiddenMessage} If you believe this is a mistake, contact support.`
              : "Your account does not have permission to manage orders."
          }
        />
      ) : null}

      {status === "error" ? (
        <ErrorState
          title="Unable to load orders"
          description={errorMessage ?? "We couldn't load your orders. Please try again."}
          onRetry={handleRetry}
        />
      ) : null}

      {status === "ready" ? (
        <>
          <section className="rounded-xl border border-border bg-card p-4 sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap gap-2">
                {STATUS_FILTERS.map((value) => (
                  <Button
                    key={value}
                    type="button"
                    variant={statusFilter === value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter(value)}
                    className="h-9 rounded-[8px] px-3"
                  >
                    {value === "ALL" ? "All" : value.replace(/_/g, " ")}
                    <span className="ml-1.5 rounded-full bg-background/70 px-1.5 py-0.5 text-[10px] font-semibold text-foreground">
                      {counts[value] ?? 0}
                    </span>
                  </Button>
                ))}
              </div>

              <label className="relative w-full lg:w-72">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search customer, phone, or order ID"
                  className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
                />
              </label>
            </div>
          </section>

          {filteredOrders.length === 0 ? (
            <EmptyState
              title="No orders found"
              description="Orders for your restaurant will appear here when customers place them."
            />
          ) : (
            <ul className="space-y-4">
              {filteredOrders.map((order) => {
                const nextStatus = getNextStatus(order.status)
                const nextLabel = getNextStatusLabel(order.status)
                const isBusy = actionOrderId === order._id

                return (
                  <li
                    key={order._id}
                    className="overflow-hidden rounded-xl border border-border bg-card"
                  >
                    <div className="flex flex-col gap-4 border-b border-border p-4 sm:p-5 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-foreground">
                            Order #{formatOrderId(order._id)}
                          </p>
                          <OrderStatusBadge status={order.status} />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {order.customerName} · {order.customerEmail}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(order.createdAt)} · {order.items.length} item
                          {order.items.length === 1 ? "" : "s"}
                        </p>
                      </div>

                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedOrder(order)}
                          className="h-9 rounded-[8px] px-3"
                        >
                          View details
                        </Button>

                        {order.status === "PENDING" ? (
                          <>
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => handleAccept(order)}
                              disabled={isBusy}
                              className="h-9 rounded-[8px] px-3"
                            >
                              {isBusy && actionType === "accept"
                                ? "Accepting..."
                                : "Accept"}
                            </Button>
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => openReject(order)}
                              disabled={isBusy}
                              className="h-9 rounded-[8px] px-3"
                            >
                              Reject
                            </Button>
                          </>
                        ) : null}

                        {nextStatus && nextLabel ? (
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleStatusUpdate(order, nextStatus)}
                            disabled={isBusy}
                            className="h-9 rounded-[8px] px-3"
                          >
                            {isBusy && actionType === nextStatus
                              ? "Updating..."
                              : nextLabel}
                          </Button>
                        ) : null}
                      </div>
                    </div>

                    <div className="grid gap-4 p-4 text-sm sm:p-5 md:grid-cols-2">
                      <div>
                        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                          Delivery address
                        </p>
                        <p className="mt-1 leading-relaxed text-foreground">
                          {order.deliveryAddress}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                          Contact phone
                        </p>
                        <p className="mt-1 leading-relaxed text-foreground">
                          {order.contactPhone}
                        </p>
                      </div>
                      <div className="md:col-span-2">
                        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                          Items
                        </p>
                        <ul className="mt-2 divide-y divide-border rounded-lg border border-border">
                          {order.items.map((item, index) => (
                            <li
                              key={`${item.menuItemId}-${index}`}
                              className="flex items-center justify-between gap-3 px-3 py-2"
                            >
                              <span className="min-w-0 truncate text-foreground">
                                {item.name} × {item.quantity}
                              </span>
                              <Price value={item.subtotal} />
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="md:col-span-2 flex items-center justify-between border-t border-border pt-3">
                        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                          Total
                        </p>
                        <Price value={order.totalAmount} className="text-lg" />
                      </div>
                      {order.rejectionReason ? (
                        <div className="md:col-span-2">
                          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                            Rejection reason
                          </p>
                          <p className="mt-1 leading-relaxed text-foreground">
                            {order.rejectionReason}
                          </p>
                        </div>
                      ) : null}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </>
      ) : null}

      {selectedOrder ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="order-details-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-border bg-card p-5 shadow-xl sm:p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium tracking-[0.2em] text-primary uppercase">
                  Order details
                </p>
                <h2
                  id="order-details-title"
                  className="mt-1 text-xl font-semibold tracking-tight text-foreground"
                >
                  Order #{formatOrderId(selectedOrder._id)}
                </h2>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSelectedOrder(null)}
                className="h-9 rounded-[8px] px-3"
              >
                Close
              </Button>
            </div>

            <div className="mt-5 space-y-4 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <OrderStatusBadge status={selectedOrder.status} />
                <span className="text-xs text-muted-foreground">
                  {formatDate(selectedOrder.createdAt)}
                </span>
              </div>

              <dl className="grid gap-3">
                <div>
                  <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    Customer
                  </dt>
                  <dd className="mt-1 text-foreground">
                    {selectedOrder.customerName} ({selectedOrder.customerEmail})
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    Delivery address
                  </dt>
                  <dd className="mt-1 text-foreground">{selectedOrder.deliveryAddress}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    Contact phone
                  </dt>
                  <dd className="mt-1 text-foreground">{selectedOrder.contactPhone}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    Items
                  </dt>
                  <dd className="mt-1">
                    <ul className="divide-y divide-border rounded-lg border border-border">
                      {selectedOrder.items.map((item, index) => (
                        <li
                          key={`${item.menuItemId}-${index}`}
                          className="flex items-center justify-between gap-3 px-3 py-2"
                        >
                          <span className="text-foreground">
                            {item.name} × {item.quantity}
                          </span>
                          <Price value={item.subtotal} />
                        </li>
                      ))}
                    </ul>
                  </dd>
                </div>
                <div className="flex items-center justify-between border-t border-border pt-3">
                  <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    Total
                  </dt>
                  <dd>
                    <Price value={selectedOrder.totalAmount} className="text-lg" />
                  </dd>
                </div>
                {selectedOrder.rejectionReason ? (
                  <div>
                    <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                      Rejection reason
                    </dt>
                    <dd className="mt-1 text-foreground">
                      {selectedOrder.rejectionReason}
                    </dd>
                  </div>
                ) : null}
              </dl>
            </div>
          </div>
        </div>
        ) : null}

      {rejectingOrder ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="reject-order-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={closeReject}
        >
          <form
            className="w-full max-w-lg rounded-xl border border-border bg-card p-5 shadow-xl sm:p-6"
            onSubmit={handleReject}
            onClick={(event) => event.stopPropagation()}
          >
            <h2
              id="reject-order-title"
              className="text-lg font-semibold tracking-tight text-foreground"
            >
              Reject order
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Provide a reason for rejecting order #{formatOrderId(rejectingOrder._id)}.
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
                disabled={actionOrderId === rejectingOrder._id}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
                placeholder="Explain why this order cannot be fulfilled."
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
                disabled={actionOrderId === rejectingOrder._id}
                className="h-9 rounded-[8px] px-3"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={actionOrderId === rejectingOrder._id}
                className="h-9 rounded-[8px] px-3"
              >
                {actionOrderId === rejectingOrder._id ? "Rejecting..." : "Reject order"}
              </Button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  )
}
