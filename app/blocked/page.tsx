"use client"

import { ShieldAlert } from "lucide-react"
import Link from "next/link"

import { AuthCard } from "@/components/auth-card"
import { useAuth } from "@/hooks/use-auth"

export default function BlockedPage() {
  const { user, logout } = useAuth()

  return (
    <AuthCard
      title="Account blocked"
      description="Your account cannot access protected PizzaHub features."
      footer={
        <Link href="/" className="font-medium text-primary hover:text-primary-hover">
          Back to PizzaHub home
        </Link>
      }
    >
      <div className="space-y-4">
        <p className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-3 text-sm leading-relaxed text-destructive">
          <ShieldAlert className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          <span>
            {user?.email
              ? `The account ${user.email}`
              : "Your account"}{" "}
            has been blocked by an administrator. Please contact support if you
            believe this is a mistake.
          </span>
        </p>
        <button
          type="button"
          onClick={() => void logout()}
          className="w-full rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          Sign out
        </button>
      </div>
    </AuthCard>
  )
}
