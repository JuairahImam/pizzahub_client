"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

import { EmptyState } from "@/components/empty-state"
import { PageContainer } from "@/components/page-container"
import { Price } from "@/components/price"
import { ProtectedRoute } from "@/components/protected-route"
import { Button } from "@/components/ui/button"
import { useCart } from "@/hooks/use-cart"
import { ApiError, apiPost } from "@/lib/api/client"
import { cn } from "@/lib/utils"
import type { CreateOrderResponse } from "@/types/order"

const inputClassName =
  "h-11 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"

function validatePhone(value: string) {
  return /^[0-9+\-\s()]{7,20}$/.test(value.trim())
}

export default function CheckoutPage() {
  const router = useRouter()
  const { items, subtotal, clearCart, isLoaded } = useCart()

  const [address, setAddress] = useState("")
  const [phone, setPhone] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const trimmedAddress = address.trim()
  const trimmedPhone = phone.trim()

  const addressError =
    trimmedAddress.length > 0 &&
    (trimmedAddress.length < 5 || trimmedAddress.length > 300)
      ? "Delivery address must be between 5 and 300 characters."
      : null

  const phoneError =
    trimmedPhone.length > 0 && !validatePhone(trimmedPhone)
      ? "Please provide a valid contact phone number (7–20 characters)."
      : null

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (trimmedAddress.length < 5 || trimmedAddress.length > 300) {
      setError("Delivery address must be between 5 and 300 characters.")
      return
    }

    if (!validatePhone(trimmedPhone)) {
      setError("Please provide a valid contact phone number.")
      return
    }

    setLoading(true)

    try {
      const response = await apiPost<CreateOrderResponse>("/api/orders", {
        items: items.map((item) => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
        })),
        deliveryAddress: trimmedAddress,
        contactPhone: trimmedPhone,
      })

      if (!response.success || !response.order?._id) {
        setError(response.message || "Unable to create order.")
        return
      }

      clearCart()
      router.push(`/orders/${response.order._id}`)
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          setError("Your session has expired. Please sign in again.")
          router.push("/login")
          return
        }

        if (err.status === 403) {
          setError("You are not allowed to place orders.")
          return
        }

        setError(err.message)
      } else {
        setError("Failed to create order. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <ProtectedRoute requiredRole="customer">
      <main className="outline-none">
        <PageContainer className="py-10 sm:py-12 lg:py-16">
          {!isLoaded ? (
            <div className="h-64 animate-pulse rounded-2xl bg-muted" />
          ) : items.length === 0 ? (
            <EmptyState
              title="Your cart is empty"
              description="Add some pizzas, sides, or drinks before checking out."
            />
          ) : (
            <div className="grid gap-8 lg:grid-cols-[1fr_24rem]">
              <section className="space-y-6">
                <div>
                  <p className="text-xs font-medium tracking-[0.2em] text-primary uppercase">
                    Checkout
                  </p>
                  <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                    Delivery details
                  </h1>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Payment is collected on delivery. No online payment is
                    required.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                  <div className="space-y-2">
                    <label
                      htmlFor="address"
                      className="text-sm font-medium text-foreground"
                    >
                      Delivery address
                    </label>
                    <textarea
                      id="address"
                      required
                      rows={3}
                      value={address}
                      onChange={(event) => setAddress(event.target.value)}
                      placeholder="House, road, area, city"
                      className={cn(inputClassName, "h-auto py-3")}
                    />
                    {addressError ? (
                      <p className="text-xs text-destructive">{addressError}</p>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="phone"
                      className="text-sm font-medium text-foreground"
                    >
                      Contact phone
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      required
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      placeholder="+8801700000001"
                      className={inputClassName}
                    />
                    {phoneError ? (
                      <p className="text-xs text-destructive">{phoneError}</p>
                    ) : null}
                  </div>

                  {error ? (
                    <p
                      role="alert"
                      className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                    >
                      {error}
                    </p>
                  ) : null}

                  <Button
                    type="submit"
                    size="lg"
                    disabled={loading}
                    className="w-full"
                  >
                    {loading ? "Placing order..." : "Place order"}
                  </Button>
                </form>
              </section>

              <aside className="h-fit rounded-xl border border-border bg-card p-6">
                <h2 className="text-lg font-semibold tracking-tight text-foreground">
                  Order summary
                </h2>
                <ul className="mt-4 space-y-3">
                  {items.map((item) => (
                    <li
                      key={item.menuItemId}
                      className="flex items-center justify-between gap-3 text-sm"
                    >
                      <span className="min-w-0 truncate text-foreground">
                        {item.name}{" "}
                        <span className="text-muted-foreground">
                          × {item.quantity}
                        </span>
                      </span>
                      <Price value={item.price * item.quantity} />
                    </li>
                  ))}
                </ul>
                <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                  <span className="text-sm font-medium text-foreground">
                    Subtotal
                  </span>
                  <Price value={subtotal} />
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  Final prices and totals are confirmed by the server.
                </p>
              </aside>
            </div>
          )}
        </PageContainer>
      </main>
    </ProtectedRoute>
  )
}