"use client"

import { CheckCircle2, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import { ProtectedRoute } from "@/components/protected-route"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"


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

export default function VendorPremiumSuccessPage() {
  return (
    <ProtectedRoute requiredRole="vendor">
      <VendorPremiumSuccessContent />
    </ProtectedRoute>
  )
}

function VendorPremiumSuccessContent() {
  const router = useRouter()
  const { loading: authLoading, user, refreshSession } = useAuth()
  const [refreshing, setRefreshing] = useState(true)

  useEffect(() => {
    let active = true

    async function run() {
      try {
        await refreshSession()
      } finally {
        if (active) setRefreshing(false)
      }
    }

    void run()

    return () => {
      active = false
    }
  }, [refreshSession])

  if (authLoading || refreshing) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">Verifying subscription status...</p>
      </div>
    )
  }

  const premium = user ? isPremiumEntitled(user) : false

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-10 sm:px-6">
      <div className="rounded-xl border border-border bg-card p-6 text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-200">
          <CheckCircle2 className="size-6" aria-hidden />
        </span>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground">
          Checkout completed
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Your payment has returned successfully. Subscription activation is
          confirmed only after backend verification by the Stripe webhook.
        </p>

        {premium ? (
          <p className="mt-4 text-sm font-medium text-green-800 dark:text-green-200">
            Your Premium subscription is active.
          </p>
        ) : (
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Your subscription is still being verified. Please refresh this page
            or return to subscription management in a moment.
          </p>
        )}

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button
            type="button"
            onClick={() => router.push("/vendor/premium")}
            className="h-10 rounded-[10px] px-5"
          >
            Back to subscription
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => void refreshSession()}
            disabled={refreshing}
            className="h-10 rounded-[10px] px-5"
          >
            {refreshing ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Refreshing...
              </>
            ) : (
              "Refresh status"
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
