"use client"

import { XCircle } from "lucide-react"
import Link from "next/link"

import { ProtectedRoute } from "@/components/protected-route"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default function VendorPremiumCancelPage() {
  return (
    <ProtectedRoute requiredRole="vendor">
      <div className="mx-auto max-w-2xl space-y-6 px-4 py-10 sm:px-6">
        <div className="rounded-xl border border-border bg-card p-6 text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
            <XCircle className="size-6" aria-hidden />
          </span>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground">
            Checkout cancelled
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Your checkout was cancelled. No subscription changes were made.
          </p>
          <div className="mt-6">
            <Link
              href="/vendor/premium"
              className={cn(
                buttonVariants({ variant: "default", size: "lg" }),
                "h-11 rounded-[10px] px-5"
              )}
            >
              Back to subscription
            </Link>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
