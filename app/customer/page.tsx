"use client"

import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { useEffect, useState } from "react"

import { EmptyState } from "@/components/empty-state"
import { ErrorState } from "@/components/error-state"
import { LoadingSkeleton } from "@/components/loading-skeleton"
import { OrderStatusBadge } from "@/components/order-status-badge"
import { PageContainer } from "@/components/page-container"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/hooks/use-auth"
import { ApiError, apiGet } from "@/lib/api/client"
import { ENDPOINTS } from "@/lib/api/endpoints"
import type { Order } from "@/types/order"

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString()
}

function formatOrderId(value: string) {
  return value.length > 8 ? value.slice(-8).toUpperCase() : value.toUpperCase()
}

function StatCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground tabular-nums">
        {value}
      </p>
    </div>
  )
}

function RecentOrderCard({ order }: { order: Order }) {
  return (
    <Link
      href={`/orders/${order._id}`}
      className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-secondary"
    >
      <div className="min-w-0 space-y-1">
        <p className="truncate text-sm font-semibold text-foreground">
          Order #{formatOrderId(order._id)}
        </p>
        <p className="text-xs text-muted-foreground">
          {order.restaurantName} · {formatDate(order.createdAt)}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <OrderStatusBadge status={order.status} />
        <ArrowUpRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      </div>
    </Link>
  )
}

export default function CustomerDashboardPage() {
  return (
    <ProtectedRoute requiredRole="customer">
      <CustomerDashboardContent />
    </ProtectedRoute>
  )
}

function CustomerDashboardContent() {
  const { loading: authLoading, isAuthenticated, accessToken } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [forbidden, setForbidden] = useState(false)
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    if (authLoading || !isAuthenticated || !accessToken) return

    let active = true
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    setError(null)
    setForbidden(false)

    apiGet<{ success: boolean; count: number; orders: Order[] }>(
      ENDPOINTS.ordersMy,
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
            setError("Your session has expired. Please sign in again.")
            return
          }
          if (err.status === 403) {
            setForbidden(true)
            return
          }
          setError(err.message || "Failed to load dashboard data.")
        } else {
          setError("Failed to load dashboard data. Please try again.")
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [authLoading, isAuthenticated, accessToken, reloadToken])

  const inProgressStatuses = new Set(["CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY"])
  const counts = {
    total: orders.length,
    pending: orders.filter((order) => order.status === "PENDING").length,
    accepted: orders.filter((order) => order.status === "CONFIRMED").length,
    inProgress: orders.filter((order) => inProgressStatuses.has(order.status)).length,
    delivered: orders.filter((order) => order.status === "DELIVERED").length,
    rejected: orders.filter((order) => order.status === "REJECTED").length,
    cancelled: orders.filter((order) => order.status === "CANCELLED").length,
  }

  const sortedOrders = [...orders].sort((a, b) => {
    const at = new Date(a.createdAt).getTime()
    const bt = new Date(b.createdAt).getTime()
    return bt - at
  })
  const recentOrders = sortedOrders.slice(0, 5)

  return (
    <main id="main-content" className="outline-none">
      <PageContainer className="py-8 sm:py-10 lg:py-12">
        <header className="space-y-2">
          <p className="text-xs font-medium tracking-[0.2em] text-primary uppercase">
            Customer dashboard
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Your orders at a glance
          </h1>
          <p className="max-w-xl text-sm leading-relaxed text-pretty text-muted-foreground">
            Track your order progress and jump to your order history.
          </p>
        </header>

        {loading ? <LoadingSkeleton count={8} /> : null}

        {!loading && forbidden ? (
          <EmptyState
            title="Access denied"
            description="You do not have permission to view the customer dashboard."
          />
        ) : null}

        {!loading && error ? (
          <ErrorState
            title="Unable to load dashboard"
            description={error}
            onRetry={() => setReloadToken((value) => value + 1)}
          />
        ) : null}

        {!loading && !forbidden && !error ? (
          <div className="space-y-6">
            <section className="grid gap-4 sm:grid-cols-3 xl:grid-cols-6">
              <StatCard label="Total orders" value={counts.total} />
              <StatCard label="Pending" value={counts.pending} />
              <StatCard label="Accepted" value={counts.accepted} />
              <StatCard label="Delivered" value={counts.delivered} />
              <StatCard label="Rejected" value={counts.rejected} />
              <StatCard label="Cancelled" value={counts.cancelled} />
            </section>

            <section aria-labelledby="recent-orders-heading" className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 id="recent-orders-heading" className="text-lg font-semibold tracking-tight text-foreground">
                  Recent orders
                </h2>
                <Link
                  href="/orders"
                  className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary-hover"
                >
                  View all orders
                  <ArrowUpRight className="size-4" aria-hidden="true" />
                </Link>
              </div>

              {recentOrders.length === 0 ? (
                <EmptyState
                  title="No orders yet"
                  description="You haven't placed any orders. Start by browsing our menu."
                />
              ) : (
                <div className="divide-y divide-border rounded-xl border border-border bg-card">
                  {recentOrders.map((order) => (
                    <RecentOrderCard key={order._id} order={order} />
                  ))}
                </div>
              )}
            </section>
          </div>
        ) : null}
      </PageContainer>
    </main>
  )
}
