"use client"

import { CreditCard, Loader2 } from "lucide-react"
import { useState } from "react"

import { ErrorState } from "@/components/error-state"
import { ProtectedRoute } from "@/components/protected-route"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { ApiError, apiPost } from "@/lib/api/client"
import { ENDPOINTS } from "@/lib/api/endpoints"


function formatDate(value: string | null) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleString("en-BD", {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

function isPremiumEntitled(user: {
  isPremium: boolean
  subscriptionStatus: string
  premiumExpiresAt: string | null
}) {
  if (!user.isPremium || user.subscriptionStatus !== "ACTIVE") return false
  if (user.premiumExpiresAt) {
    const expiresAt = new Date(user.premiumExpiresAt)
    if (Number.isNaN(expiresAt.getTime()) || expiresAt <= new Date()) return false
  }
  return true
}

export default function VendorPremiumPage() {
  return (
    <ProtectedRoute requiredRole="vendor">
      <VendorPremiumContent />
    </ProtectedRoute>
  )
}

function VendorPremiumContent() {
  const { loading: authLoading, isAuthenticated, accessToken, user, refreshSession } = useAuth()

  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const premium = user ? isPremiumEntitled(user) : false

  async function handleCheckout() {
    if (!accessToken || checkoutLoading) return

    setCheckoutLoading(true)
    setError(null)

    try {
      const response = await apiPost<{
        success: boolean
        message: string
        data: { sessionId: string; checkoutUrl: string }
      }>(ENDPOINTS.vendorPremiumCheckout, undefined, accessToken)

      if (!response?.data?.checkoutUrl) {
        setError("Received an unexpected response from the server.")
        return
      }

      window.location.href = response.data.checkoutUrl
    } catch (error) {
      setError(
        error instanceof ApiError
          ? error.message
          : "Failed to create Premium checkout session."
      )
    } finally {
      setCheckoutLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading subscription...</p>
      </div>
    )
  }

  if (!isAuthenticated || !accessToken || !user) {
    return null
  }

  const expiryLabel = formatDate(user.premiumExpiresAt)

  return (
    <div className="max-w-5xl space-y-6 sm:space-y-8">
      <header>
        <p className="text-xs font-medium tracking-[0.2em] text-primary uppercase">
          Vendor dashboard
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Premium Subscription
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Manage your PizzaHub vendor plan. Premium status is confirmed by the
          backend after Stripe processes your payment.
        </p>
      </header>

      {error ? (
        <ErrorState
          title="Unable to start checkout"
          description={error}
          onRetry={() => void refreshSession()}
        />
      ) : null}

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5 sm:p-6">
          <p className="text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase">
            Current plan
          </p>
          <div className="mt-3 flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-xl bg-secondary text-primary">
              <CreditCard className="size-5" aria-hidden />
            </span>
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-foreground">
                {premium ? "Premium" : "Free"}
              </h2>
              <p className="text-sm text-muted-foreground">
                Status: {user.subscriptionStatus}
              </p>
            </div>
          </div>

          {premium && expiryLabel ? (
            <p className="mt-4 text-sm text-muted-foreground">
              Premium expires: {expiryLabel}
            </p>
          ) : null}

          {premium && !expiryLabel ? (
            <p className="mt-4 text-sm text-muted-foreground">
              Premium entitlement has no expiry date.
            </p>
          ) : null}

          {!premium ? (
            <Button
              type="button"
              size="lg"
              onClick={handleCheckout}
              disabled={checkoutLoading}
              className="mt-6 h-11 w-full rounded-[10px] px-5 sm:w-auto"
            >
              {checkoutLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Redirecting...
                </>
              ) : (
                "Upgrade to Premium"
              )}
            </Button>
          ) : (
            <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
              You already have an active Premium subscription.
            </p>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-5 sm:p-6">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            Plan comparison
          </h2>
          <div className="mt-4 space-y-4">
            <div className="rounded-lg border border-border bg-background p-4">
              <h3 className="font-semibold text-foreground">Free</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Maximum 3 active menu items.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-background p-4">
              <h3 className="font-semibold text-foreground">Premium</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Unlimited active menu items, according to backend entitlement rules.
              </p>
            </div>
          </div>
          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
            Pricing and billing details are handled securely by Stripe Checkout.
          </p>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          Important
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Premium status is not activated by visiting a success page. The backend
          Stripe webhook is authoritative and updates your subscription after
          payment processing.
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void refreshSession()}
          className="mt-4 h-9 rounded-[8px] px-3"
        >
          Refresh subscription status
        </Button>
      </section>
    </div>
  )
}
