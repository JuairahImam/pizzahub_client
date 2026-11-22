"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"

import { EmptyState } from "@/components/empty-state"
import { ProtectedRoute } from "@/components/protected-route"
import { Button } from "@/components/ui/button"

export default function AdminTransactionsPage() {
  const router = useRouter()

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
            <div>
              <p className="text-xs font-medium tracking-[0.2em] text-primary uppercase">
                Admin dashboard
              </p>
              <h1 className="text-xl font-semibold tracking-tight text-foreground">
                Transactions
              </h1>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => router.push("/admin")}
              className="h-9 rounded-[8px] px-3"
            >
              Back to overview
            </Button>
          </div>
        </header>

        <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
          <EmptyState
            title="No payment transaction records available"
            description="PizzaHub does not currently store dedicated payment or transaction records. Customer orders store order totals, but those totals are not confirmed payments. Premium subscription payments are processed by Stripe, and the backend stores only subscription status and expiry information."
          />

          <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              Available related data
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Order totals and statuses are available through order records, but they
              are not payment confirmations. No transaction IDs, payment intents,
              invoices, or refunds are persisted in the current backend.
            </p>
            <div className="mt-4">
              <Link
                href="/admin"
                className="inline-flex h-9 items-center rounded-[8px] border border-border px-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
              >
                Return to dashboard overview
              </Link>
            </div>
          </section>
        </main>
      </div>
    </ProtectedRoute>
  )
}
