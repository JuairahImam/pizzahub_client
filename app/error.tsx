"use client"

import { AlertTriangle } from "lucide-react"
import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 text-center shadow-sm sm:p-8">
        <span className="mx-auto grid size-12 place-items-center rounded-xl bg-destructive/10 text-destructive">
          <AlertTriangle className="size-6" aria-hidden="true" />
        </span>
        <h1 className="mt-5 text-2xl font-semibold tracking-tight text-foreground">
          Something went wrong
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {error.message || "We couldn't load this page. Please try again."}
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={reset}
            className={buttonVariants({ size: "lg" })}
          >
            Try again
          </button>
          <Link href="/" className={buttonVariants({ variant: "outline", size: "lg" })}>
            Back home
          </Link>
        </div>
      </div>
    </div>
  )
}
