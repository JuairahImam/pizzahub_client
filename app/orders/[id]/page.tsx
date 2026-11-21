"use client"

import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import { EmptyState } from "@/components/empty-state"
import { ErrorState } from "@/components/error-state"
import { OrderStatusBadge } from "@/components/order-status-badge"
import { PageContainer } from "@/components/page-container"
import { useAuth } from "@/hooks/use-auth"
import { Price } from "@/components/price"
import { ProtectedRoute } from "@/components/protected-route"

import { ApiError, apiGet } from "@/lib/api/client"
import type { Order } from "@/types/order"

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString()
}

export default function OrderDetailsPage() {
  const router = useRouter()
  const { loading: authLoading, isAuthenticated, accessToken } = useAuth()
  const params = useParams()
  const rawId = params?.id
  const orderId = Array.isArray(rawId) ? rawId[0] : rawId

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [forbidden, setForbidden] = useState(false)
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    if (authLoading || !accessToken) return

    if (!isAuthenticated) {
      return
    }

    if (!orderId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false)
      setNotFound(true)
      return
    }

    let active = true
    setLoading(true)
    setError(null)
    setNotFound(false)
    setForbidden(false)

    apiGet<{ success: boolean; order: Order }>(
      `/api/orders/${orderId}`,
      undefined,
      accessToken
    )
      .then((response) => {
        if (!active) return
        if (response?.order) {
          setOrder(response.order)
        } else {
          setNotFound(true)
        }
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
          if (err.status === 404 || err.status === 400) {
            setNotFound(true)
            return
          }
          setError(err.message)
        } else {
          setError("Failed to load order details.")
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [orderId, reloadToken, router, authLoading, isAuthenticated, accessToken])

  return (
    <ProtectedRoute requiredRole="customer">
      <main className="outline-none">
        <PageContainer className="py-10 sm:py-12 lg:py-16">
          {loading ? (
            <div className="space-y-4">
              <div className="h-8 w-48 animate-pulse rounded bg-muted" />
              <div className="h-64 animate-pulse rounded-2xl bg-muted" />
            </div>
          ) : null}

          {!loading && forbidden ? (
            <EmptyState
              title="Access denied"
              description="You do not have permission to view this order."
            />
          ) : null}

          {!loading && notFound ? (
            <EmptyState
              title="Order not found"
              description="This order may not exist or may not be available to your account."
            />
          ) : null}

          {!loading && error ? (
            <ErrorState
              title="Unable to load order"
              description={error}
              onRetry={() => setReloadToken((value) => value + 1)}
            />
          ) : null}

          {!loading && order ? (
            <div className="space-y-8">
              {order.status === "PENDING" ? (
                <div className="rounded-2xl border border-primary/20 bg-secondary p-6">
                  <p className="text-xs font-medium tracking-[0.2em] text-primary uppercase">
                    Order confirmed
                  </p>
                  <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                    Your order has been placed!
                  </h1>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    We&apos;ve received your order and it&apos;s waiting to be
                    accepted by the restaurant.
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-xs font-medium tracking-[0.2em] text-primary uppercase">
                    Order details
                  </p>
                  <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                    Order #{order._id}
                  </h1>
                </div>
              )}

              <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
                <div className="space-y-6">
                  <section className="rounded-xl border border-border bg-card p-6">
                    <h2 className="text-lg font-semibold tracking-tight text-foreground">
                      Items
                    </h2>
                    <ul className="mt-4 divide-y divide-border">
                      {order.items.map((item, index) => (
                        <li
                          key={`${item.menuItemId}-${index}`}
                          className="flex items-center justify-between gap-4 py-3"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-foreground">
                              {item.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {item.quantity} × ৳{item.price.toLocaleString("en-BD")}
                            </p>
                          </div>
                          <Price value={item.subtotal} />
                        </li>
                      ))}
                    </ul>
                  </section>

                  <section className="rounded-xl border border-border bg-card p-6">
                    <h2 className="text-lg font-semibold tracking-tight text-foreground">
                      Delivery details
                    </h2>
                    <dl className="mt-4 space-y-3 text-sm">
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                        <dt className="text-muted-foreground">Address</dt>
                        <dd className="font-medium text-foreground sm:text-right">
                          {order.deliveryAddress}
                        </dd>
                      </div>
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <dt className="text-muted-foreground">Phone</dt>
                        <dd className="font-medium text-foreground">
                          {order.contactPhone}
                        </dd>
                      </div>
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <dt className="text-muted-foreground">Restaurant</dt>
                        <dd className="font-medium text-foreground">
                          {order.restaurantName}
                        </dd>
                      </div>
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <dt className="text-muted-foreground">Order date</dt>
                        <dd className="font-medium text-foreground">
                          {formatDate(order.createdAt)}
                        </dd>
                      </div>
                    </dl>

                    {order.rejectionReason ? (
                      <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                        <span className="font-medium">Rejection reason:</span>{" "}
                        {order.rejectionReason}
                      </div>
                    ) : null}
                  </section>
                </div>

                <aside className="h-fit rounded-xl border border-border bg-card p-6">
                  <h2 className="text-lg font-semibold tracking-tight text-foreground">
                    Summary
                  </h2>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <OrderStatusBadge status={order.status} />
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total</span>
                    <Price value={order.totalAmount} />
                  </div>
                  <p className="mt-2 break-all text-xs text-muted-foreground">
                    Order ID: {order._id}
                  </p>

                  <div className="mt-6 space-y-2">
                    <Link
                      href="/orders"
                      className="block text-center text-sm font-medium text-primary hover:text-primary-hover"
                    >
                      View all orders
                    </Link>
                    <Link
                      href="/menu"
                      className="block text-center text-sm font-medium text-muted-foreground hover:text-foreground"
                    >
                      Explore menu
                    </Link>
                  </div>
                </aside>
              </div>
            </div>
          ) : null}
        </PageContainer>
      </main>
    </ProtectedRoute>
  )
}