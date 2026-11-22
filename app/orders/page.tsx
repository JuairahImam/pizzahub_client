"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import { EmptyState } from "@/components/empty-state"
import { ErrorState } from "@/components/error-state"
import { OrderStatusBadge } from "@/components/order-status-badge"
import { PageContainer } from "@/components/page-container"
import { Price } from "@/components/price"
import { ProtectedRoute } from "@/components/protected-route"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { useToastContext } from "@/lib/toast/context"
import { ApiError, apiGet, apiPatch } from "@/lib/api/client"
import type { Order } from "@/types/order"

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString()
}

export default function OrdersPage() {
  const router = useRouter()
  const { loading: authLoading, isAuthenticated, accessToken } = useAuth()
  const toast = useToastContext()

  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [forbidden, setForbidden] = useState(false)
  const [reloadToken, setReloadToken] = useState(0)

  const [cancelTarget, setCancelTarget] = useState<Order | null>(null)
  const [cancelling, setCancelling] = useState(false)
  const [cancelError, setCancelError] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading || !isAuthenticated || !accessToken) return

    let active = true
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    setError(null)
    setForbidden(false)

    apiGet<{ success: boolean; count: number; orders: Order[] }>(
      "/api/orders/my",
      undefined,
      accessToken
    )
      .then((response) => {
        if (!active) return
        setOrders(response.orders ?? [])
      })
      .catch((err) => {
        if (!active) return
        if (err instanceof ApiError) {
          if (err.status === 401) {
            router.push("/login")
            return
          }
          if (err.status === 403) {
            setForbidden(true)
            return
          }
          setError(err.message)
        } else {
          setError("Failed to load your orders.")
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [authLoading, isAuthenticated, accessToken, reloadToken, router])

  async function handleConfirmCancel() {
    if (!cancelTarget) return

    setCancelling(true)
    setCancelError(null)

    try {
      const response = await apiPatch<{
        success: boolean
        message: string
        order: Order
      }>(`/api/orders/${cancelTarget._id}/cancel`, undefined, accessToken)

      if (response?.order?._id) {
        setOrders((current) =>
          current.map((order) =>
            order._id === response.order._id ? response.order : order
          )
        )
      } else {
        setReloadToken((value) => value + 1)
      }

      toast.success("Order cancelled.")
      setCancelTarget(null)
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          router.push("/login")
          return
        }
        if (err.status === 403) {
          setCancelError("You are not allowed to cancel this order.")
          return
        }
        if (err.status === 404) {
          setCancelError("This order is no longer available.")
          setReloadToken((value) => value + 1)
          return
        }
        if (err.status === 409) {
          setCancelError(
            "This order can no longer be cancelled. The list has been refreshed."
          )
          setReloadToken((value) => value + 1)
          return
        }
        setCancelError(err.message)
      } else {
        setCancelError("Failed to cancel the order. Please try again.")
      }
    } finally {
      setCancelling(false)
    }
  }

  return (
    <ProtectedRoute requiredRole="customer">
      <main className="outline-none">
        <PageContainer className="py-10 sm:py-12 lg:py-16">
          <div className="mb-8">
            <p className="text-xs font-medium tracking-[0.2em] text-primary uppercase">
              Your orders
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              My Orders
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Track your recent orders and manage pending cancellations.
            </p>
          </div>

          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="h-32 animate-pulse rounded-xl bg-muted"
                />
              ))}
            </div>
          ) : null}

          {!loading && forbidden ? (
            <EmptyState
              title="Access denied"
              description="You do not have permission to view these orders."
            />
          ) : null}

          {!loading && !forbidden && error ? (
            <ErrorState
              title="Unable to load orders"
              description={error}
              onRetry={() => setReloadToken((value) => value + 1)}
            />
          ) : null}

          {!loading && !forbidden && !error && orders.length === 0 ? (
            <EmptyState
              title="No orders yet"
              description="You haven't placed any orders. Start by exploring our menu."
            />
          ) : null}

          {!loading && !forbidden && !error && orders.length > 0 ? (
            <>
              {cancelError ? (
                <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {cancelError}
                </div>
              ) : null}

              <ul className="space-y-4">
                {orders.map((order) => (
                  <li
                    key={order._id}
                    className="rounded-xl border border-border bg-card p-5 sm:p-6"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 space-y-1">
                        <p className="text-xs text-muted-foreground">
                          {formatDate(order.createdAt)}
                        </p>
                        <h2 className="truncate text-lg font-semibold tracking-tight text-foreground">
                          {order.restaurantName}
                        </h2>
                        <p className="text-xs text-muted-foreground">
                          {order.items.length} item
                          {order.items.length === 1 ? "" : "s"} ·{" "}
                          <Price value={order.totalAmount} />
                        </p>
                        <p className="break-all text-xs text-muted-foreground">
                          Order ID: {order._id}
                        </p>
                      </div>

                      <div className="flex flex-col items-start gap-3 sm:items-end">
                        <OrderStatusBadge status={order.status} />
                        <Link
                          href={`/orders/${order._id}`}
                          className="text-sm font-medium text-primary hover:text-primary-hover"
                        >
                          View details
                        </Link>
                        {order.status === "PENDING" ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={cancelling && cancelTarget?._id === order._id}
                            onClick={() => {
                              setCancelError(null)
                              setCancelTarget(order)
                            }}
                          >
                            Cancel order
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          ) : null}

          {!loading && !forbidden && !error && orders.length === 0 ? (
            <div className="mt-6 flex justify-center">
              <Link
                href="/menu"
                className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
              >
                Browse menu
              </Link>
            </div>
          ) : null}

          {cancelTarget ? (
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="cancel-order-title"
              className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 px-4"
            >
              <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-lg">
                <h2
                  id="cancel-order-title"
                  className="text-lg font-semibold tracking-tight text-foreground"
                >
                  Cancel this order?
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  You can only cancel orders that are still pending. This action
                  cannot be undone.
                </p>
                <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    disabled={cancelling}
                    onClick={() => {
                      if (!cancelling) setCancelTarget(null)
                    }}
                    className="inline-flex h-11 items-center justify-center rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
                  >
                    Keep order
                  </button>
                  <button
                    type="button"
                    disabled={cancelling}
                    onClick={handleConfirmCancel}
                    className="inline-flex h-11 items-center justify-center rounded-lg bg-destructive px-4 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90 disabled:opacity-50"
                  >
                    {cancelling ? "Cancelling..." : "Cancel order"}
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </PageContainer>
      </main>
    </ProtectedRoute>
  )
}