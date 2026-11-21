"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import { EmptyState } from "@/components/empty-state"
import { ErrorState } from "@/components/error-state"
import { OrderStatusBadge } from "@/components/order-status-badge"
import { Price } from "@/components/price"
import { ProtectedRoute } from "@/components/protected-route"
import { Button, buttonVariants } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { ApiError, apiGet } from "@/lib/api/client"
import { cn } from "@/lib/utils"
import type { Order, OrderStatus, VendorOrdersResponse } from "@/types/order"

const STATUS_ORDER: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "REJECTED",
  "CANCELLED",
]

const RECENT_ORDER_LIMIT = 5

function getCreatedAtTime(value: string) {
  const time = new Date(value).getTime()
  return Number.isNaN(time) ? 0 : time
}

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

export default function VendorOverviewPage() {
  return (
    <ProtectedRoute requiredRole="vendor">
      <VendorOverviewContent />
    </ProtectedRoute>
  )
}

function VendorOverviewContent() {
  const router = useRouter()
  const {
    loading: authLoading,
    isAuthenticated,
    accessToken,
    refreshSession,
  } = useAuth()

  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [forbidden, setForbidden] = useState(false)
  const [forbiddenMessage, setForbiddenMessage] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    if (authLoading || !isAuthenticated) return

    if (!accessToken) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false)
      setError("We couldn't verify your session. Please sign in again.")
      return
    }

    let active = true
    setLoading(true)
    setError(null)
    setForbidden(false)
    setForbiddenMessage(null)

    apiGet<VendorOrdersResponse>("/api/vendor/orders", undefined, accessToken)
      .then((response) => {
        if (!active) return
        setOrders(Array.isArray(response?.orders) ? response.orders : [])
      })
      .catch((err) => {
        if (!active) return

        if (err instanceof ApiError) {
          if (err.status === 401) {
            router.replace("/login")
            return
          }

          if (err.status === 403) {
            setForbiddenMessage(err.message || null)
            setForbidden(true)
            return
          }

          setError(err.message || "Failed to load dashboard data.")
          return
        }

        setError("Failed to load dashboard data. Please try again.")
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [authLoading, isAuthenticated, accessToken, reloadToken, router])

  function handleRetry() {
    if (!accessToken) {
      void refreshSession()
    }

    setReloadToken((value) => value + 1)
  }

  const sortedOrders = [...orders].sort(
    (a, b) => getCreatedAtTime(b.createdAt) - getCreatedAtTime(a.createdAt)
  )
  const recentOrders = sortedOrders.slice(0, RECENT_ORDER_LIMIT)

  const statusCounts = STATUS_ORDER.map((status) => ({
    status,
    count: orders.filter((order) => order.status === status).length,
  }))

  const pendingOrders =
    statusCounts.find(({ status }) => status === "PENDING")?.count ?? 0
  const deliveredOrders =
    statusCounts.find(({ status }) => status === "DELIVERED")?.count ?? 0
  const revenue = orders.reduce(
    (total, order) =>
      order.status === "DELIVERED" && Number.isFinite(order.totalAmount)
        ? total + order.totalAmount
        : total,
    0
  )

  return (
    <div className="space-y-6 sm:space-y-8">
      <header>
        <p className="text-xs font-medium tracking-[0.2em] text-primary uppercase">
          Vendor dashboard
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Overview
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Orders and delivered revenue for your restaurant, based on your live
          vendor order feed.
        </p>
      </header>

      {loading ? <DashboardSkeleton /> : null}

      {!loading && forbidden ? (
        <div className="space-y-4">
          <EmptyState
            title="Access denied"
            description={
              forbiddenMessage
                ? `${forbiddenMessage} If you believe this is a mistake, contact support.`
                : "Your account does not have permission to view the vendor dashboard. Sign in with a vendor account or contact support if you believe this is a mistake."
            }
          />
          <div className="flex justify-center">
            <Link
              href="/"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "h-11 rounded-[10px] px-6"
              )}
            >
              Back to PizzaHub
            </Link>
          </div>
        </div>
      ) : null}

      {!loading && !forbidden && error ? (
        <ErrorState
          title="Unable to load dashboard"
          description={error}
          onRetry={handleRetry}
        />
      ) : null}

      {!loading && !forbidden && !error ? (
        <div className="space-y-6 sm:space-y-8">
          <section
            aria-label="Order metrics"
            className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
          >
            <MetricCard
              label="Total orders"
              value={String(orders.length)}
              hint="All orders for your restaurant"
            />
            <MetricCard
              label="Pending orders"
              value={String(pendingOrders)}
              hint="Awaiting your response"
            />
            <MetricCard
              label="Delivered orders"
              value={String(deliveredOrders)}
              hint="Completed orders"
            />
            <MetricCard
              label="Revenue (delivered)"
              value={
                <Price
                  value={revenue}
                  className="text-2xl font-semibold tracking-tight"
                />
              }
              hint="Delivered orders only"
            />
          </section>

          <section
            aria-labelledby="order-status-heading"
            className="rounded-xl border border-border bg-card p-5 sm:p-6"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2
                id="order-status-heading"
                className="text-lg font-semibold tracking-tight text-foreground"
              >
                Order status
              </h2>
              <p className="text-xs text-muted-foreground">
                {orders.length} order{orders.length === 1 ? "" : "s"} total
              </p>
            </div>

            <ul className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
              {statusCounts.map(({ status, count }) => (
                <li
                  key={status}
                  className="rounded-lg border border-border bg-background p-3"
                >
                  <OrderStatusBadge
                    status={status}
                    className="px-2 py-0.5 text-[11px] whitespace-nowrap"
                  />
                  <p className="mt-2 text-xl font-semibold tracking-tight text-foreground tabular-nums">
                    {count}
                  </p>
                </li>
              ))}
            </ul>
          </section>

          <section
            aria-labelledby="recent-orders-heading"
            className="space-y-3"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2
                  id="recent-orders-heading"
                  className="text-lg font-semibold tracking-tight text-foreground"
                >
                  Recent orders
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Newest first, from your live order feed.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  Order management is coming soon.
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled
                  className="h-9 rounded-[10px] px-3"
                >
                  View all orders
                </Button>
              </div>
            </div>

            {recentOrders.length === 0 ? (
              <EmptyState
                title="No orders yet"
                description="Orders from your restaurant will appear here as customers place them."
              />
            ) : (
              <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
                {recentOrders.map((order) => (
                  <li
                    key={order._id}
                    className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {order.restaurantName}
                        </p>
                        <OrderStatusBadge status={order.status} />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Order #{formatOrderId(order._id)} · {order.customerName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(order.createdAt)} · {order.items.length}{" "}
                        item
                        {order.items.length === 1 ? "" : "s"}
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
                      <Price value={order.totalAmount} />
                      <p className="text-[11px] tracking-wide text-muted-foreground uppercase">
                        Total
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      ) : null}
    </div>
  )
}

function MetricCard({
  label,
  value,
  hint,
}: {
  label: string
  value: React.ReactNode
  hint?: string
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground tabular-nums">
        {value}
      </p>
      {hint ? (
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 sm:space-y-8" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading dashboard data</span>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-28 animate-pulse rounded-xl border border-border bg-card"
          />
        ))}
      </div>

      <div className="h-44 animate-pulse rounded-xl border border-border bg-card" />

      <div className="space-y-3">
        <div className="h-6 w-40 animate-pulse rounded bg-muted" />
        <div className="h-64 animate-pulse rounded-xl border border-border bg-card" />
      </div>
    </div>
  )
}
