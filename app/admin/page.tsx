"use client"


import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"

import { BarChart } from "@/components/charts"
import { EmptyState } from "@/components/empty-state"
import { ErrorState } from "@/components/error-state"
import { Price } from "@/components/price"
import { ProtectedRoute } from "@/components/protected-route"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { ApiError, apiGet } from "@/lib/api/client"
import { ENDPOINTS } from "@/lib/api/endpoints"
import { cn } from "@/lib/utils"
import type { AdminDashboardOverview } from "@/types/admin-dashboard"

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Date unavailable"
  return date.toLocaleString("en-BD", {
    dateStyle: "medium",
    timeStyle: "short",
  })
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

function toChartBars(record: Record<string, number>) {
  return Object.entries(record)
    .filter(([, value]) => Number.isFinite(value))
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => a.label.localeCompare(b.label))
}

export default function AdminDashboardPage() {
  return (
    <ProtectedRoute requiredRole="admin">
      <AdminDashboardContent />
    </ProtectedRoute>
  )
}

function AdminDashboardContent() {
  const router = useRouter()
  const { loading: authLoading, isAuthenticated, accessToken } = useAuth()

  const [overview, setOverview] = useState<AdminDashboardOverview["overview"] | null>(null)
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)

  const requestIdRef = useRef(0)

  const fetchOverview = useCallback(async () => {
    if (!accessToken) return

    const requestId = ++requestIdRef.current
    setStatus("loading")
    setErrorMessage(null)

    try {
      const response = await apiGet<AdminDashboardOverview>(
        ENDPOINTS.adminDashboardOverview,
        undefined,
        accessToken
      )

      if (requestId !== requestIdRef.current) return

      setOverview(response.overview)
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

        setErrorMessage(error.message || "Failed to load dashboard overview.")
      } else {
        setErrorMessage("Failed to load dashboard overview. Please try again.")
      }

      setStatus("error")
    }
  }, [accessToken, router])

  useEffect(() => {
    if (authLoading || !isAuthenticated || !accessToken) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchOverview()
  }, [authLoading, isAuthenticated, accessToken, fetchOverview, reloadToken])

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading admin dashboard...</p>
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
              Overview
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
        <section>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            Welcome
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Real-time platform overview based on current database records.
          </p>
        </section>

        {status === "loading" ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="h-24 animate-pulse rounded-xl border border-border bg-card"
              />
            ))}
          </div>
        ) : null}

        {status === "error" ? (
          <ErrorState
            title="Unable to load dashboard"
            description={errorMessage ?? "We couldn't load the dashboard overview."}
            onRetry={() => setReloadToken((value) => value + 1)}
          />
        ) : null}

        {status === "ready" && overview ? (
          <>
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Total users" value={overview.users.total} />
              <StatCard label="Customers" value={overview.users.customers} />
              <StatCard label="Vendors" value={overview.users.vendors} />
              <StatCard label="Blocked users" value={overview.users.blocked} />
              <StatCard label="Total menu items" value={overview.menuItems.total} />
              <StatCard label="Pending approvals" value={overview.menuItems.pending} />
              <StatCard label="Approved items" value={overview.menuItems.approved} />
              <StatCard label="Rejected items" value={overview.menuItems.rejected} />
              <StatCard label="Total orders" value={overview.orders.total} />
              <StatCard label="Pending orders" value={overview.orders.pending} />
              <StatCard label="Delivered orders" value={overview.orders.delivered} />
              <StatCard
                label="Delivered order value"
                value={<Price value={overview.orders.deliveredOrderValue} />}
              />
              <StatCard
                label="Total transactions"
                value={overview.transactions.total}
              />
            </section>

            <section className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-border bg-card p-5 sm:p-6">
                <h2 className="text-lg font-semibold tracking-tight text-foreground">
                  Menu moderation summary
                </h2>
                <div className="mt-4 grid grid-cols-3 gap-3">
                  <StatCard label="Pending" value={overview.menuItems.pending} />
                  <StatCard label="Approved" value={overview.menuItems.approved} />
                  <StatCard label="Rejected" value={overview.menuItems.rejected} />
                </div>
                <div className="mt-4">
                  <Link
                    href="/admin/menu"
                    className={cn(
                      "inline-flex h-9 items-center rounded-[8px] border border-border px-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
                    )}
                  >
                    Manage menu moderation
                  </Link>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-5 sm:p-6">
                <h2 className="text-lg font-semibold tracking-tight text-foreground">
                  Order summary
                </h2>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <StatCard label="Pending" value={overview.orders.pending} />
                  <StatCard label="Confirmed" value={overview.orders.confirmed} />
                  <StatCard label="Preparing" value={overview.orders.preparing} />
                  <StatCard label="Out for delivery" value={overview.orders.outForDelivery} />
                  <StatCard label="Delivered" value={overview.orders.delivered} />
                  <StatCard label="Rejected" value={overview.orders.rejected} />
                  <StatCard label="Cancelled" value={overview.orders.cancelled} />
                </div>
              </div>
            </section>

            <section
              aria-labelledby="admin-analytics-heading"
              className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3"
            >
              <div>
                <h2 id="admin-analytics-heading" className="sr-only">Admin analytics</h2>
                <BarChart
                  data={[
                    { label: "Customers", value: overview.users.customers },
                    { label: "Vendors", value: overview.users.vendors },
                    { label: "Blocked users", value: overview.users.blocked },
                  ]}
                  title="Users by type"
                  description="Live user counts from admin overview."
                />
              </div>
              <div>
                <BarChart
                  data={toChartBars({
                    Pending: overview.menuItems.pending,
                    Approved: overview.menuItems.approved,
                    Rejected: overview.menuItems.rejected,
                    Total: overview.menuItems.total,
                  })}
                  title="Menu items by status"
                  description="Approval status counts from admin overview."
                />
              </div>
              <div>
                <BarChart
                  data={toChartBars({
                    Pending: overview.orders.pending,
                    Confirmed: overview.orders.confirmed,
                    Preparing: overview.orders.preparing,
                    "Out for delivery": overview.orders.outForDelivery,
                    Delivered: overview.orders.delivered,
                    Rejected: overview.orders.rejected,
                    Cancelled: overview.orders.cancelled,
                  })}
                  title="Orders by status"
                  description="Current order status distribution."
                />
              </div>
              <div>
                <BarChart
                  data={toChartBars(overview.transactions.byStatus)}
                  title="Transactions by status"
                  description={`${overview.transactions.total} transaction records.`}
                />
              </div>
              <div>
                <BarChart
                  data={toChartBars(overview.transactions.byType)}
                  title="Transactions by type"
                  description="Recorded transaction types."
                />
              </div>
              <div>
                <StatCard
                  label="Paid transaction value"
                  value={<Price value={overview.transactions.paidTotal} />}
                />
                <BarChart
                  data={[{ label: "PAID", value: overview.transactions.paidTotal, color: "bg-green-500 dark:bg-green-400" }]}
                  title="Paid transaction volume"
                  description="Value of PAID transaction records."
                />
              </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-border bg-card p-5 sm:p-6">
                <h2 className="text-lg font-semibold tracking-tight text-foreground">
                  Recent orders
                </h2>
                {overview.recentOrders.length === 0 ? (
                  <EmptyState
                    title="No orders yet"
                    description="Orders will appear here as customers place them."
                    className="mt-4"
                  />
                ) : (
                  <ul className="mt-4 divide-y divide-border">
                    {overview.recentOrders.map((order) => (
                      <li key={order.id} className="py-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="truncate text-sm font-medium text-foreground">
                            {order.customerName}
                          </p>
                          <Price value={order.totalAmount} />
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {order.restaurantName} · {order.status} · {formatDate(order.createdAt)}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="rounded-xl border border-border bg-card p-5 sm:p-6">
                <h2 className="text-lg font-semibold tracking-tight text-foreground">
                  Recent menu submissions
                </h2>
                {overview.recentMenuItems.length === 0 ? (
                  <EmptyState
                    title="No menu items yet"
                    description="Menu items will appear here as vendors create them."
                    className="mt-4"
                  />
                ) : (
                  <ul className="mt-4 divide-y divide-border">
                    {overview.recentMenuItems.map((item) => (
                      <li key={item.id} className="py-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="truncate text-sm font-medium text-foreground">
                            {item.name}
                          </p>
                          <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-foreground">
                            {item.approvalStatus}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {item.category} · {item.isAvailable ? "Available" : "Unavailable"} ·{" "}
                          {item.vendorName ?? "Unknown vendor"} · {formatDate(item.createdAt)}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>

            <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
              <h2 className="text-lg font-semibold tracking-tight text-foreground">
                Quick actions
              </h2>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href="/admin/menu"
                  className={cn(
                    "inline-flex h-9 items-center rounded-[8px] border border-border px-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
                  )}
                >
                  Manage menu moderation
                </Link>
              </div>
            </section>
          </>
        ) : null}
      </main>
    </div>
  )
}
