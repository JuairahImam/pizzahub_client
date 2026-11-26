"use client"

import { CheckCircle2, Clock3, XCircle } from "lucide-react"
import Link from "next/link"
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"

import { AuthCard } from "@/components/auth-card"
import { ButtonLink } from "@/components/button-link"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { ApiError, apiGet, apiPost } from "@/lib/api/client"
import { ENDPOINTS } from "@/lib/api/endpoints"
import { useToastContext } from "@/lib/toast/context"
import { cn } from "@/lib/utils"
import type {
  CreateVendorRequestResponse,
  VendorRequest,
  VendorRequestResponse,
} from "@/types/vendor-request"

const inputClassName =
  "h-11 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"

const textareaClassName =
  "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Date unavailable"
  return date.toLocaleString("en-BD", {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

function StatusNotice({ request }: { request: VendorRequest }) {
  if (request.status === "PENDING") {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-950 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <Clock3 className="size-4" aria-hidden="true" />
          Request pending review
        </p>
        <p className="mt-2 text-sm leading-relaxed">
          Your application for <strong>{request.restaurantName}</strong> was
          submitted on {formatDate(request.createdAt)}. We&apos;ll enable your
          vendor dashboard after an admin reviews it.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-green-900 dark:border-green-900/40 dark:bg-green-950/30 dark:text-green-100">
      <p className="flex items-center gap-2 text-sm font-semibold">
        <CheckCircle2 className="size-4" aria-hidden="true" />
        You&apos;re a vendor
      </p>
      <p className="mt-2 text-sm leading-relaxed">
        Your request for <strong>{request.restaurantName}</strong> was approved.
        You can now set up your restaurant and start adding menu items.
      </p>
      <ButtonLink
        href="/vendor"
        size="sm"
        className="mt-4 h-9 w-full rounded-[8px]"
      >
        Go to vendor dashboard
      </ButtonLink>
    </div>
  )
}

export default function BecomeVendorPage() {
  const { user, accessToken, loading: authLoading, refreshSession } = useAuth()
  const toast = useToastContext()

  const [request, setRequest] = useState<VendorRequest | null>(null)
  const [loadingRequest, setLoadingRequest] = useState(false)
  const [requestError, setRequestError] = useState<string | null>(null)
  const [restaurantName, setRestaurantName] = useState("")
  const [message, setMessage] = useState("")
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const refreshStartedRef = useRef(false)

  const loadRequest = useCallback(async () => {
    if (!accessToken) return

    setLoadingRequest(true)
    setRequestError(null)

    try {
      const response = await apiGet<VendorRequestResponse>(
        ENDPOINTS.vendorRequestMe,
        undefined,
        accessToken
      )
      setRequest(response.request)
    } catch (error) {
      setRequestError(
        error instanceof ApiError
          ? error.message
          : "Failed to load your vendor request."
      )
    } finally {
      setLoadingRequest(false)
    }
  }, [accessToken])

  useEffect(() => {
    if (authLoading || !user || !accessToken) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadRequest()
  }, [authLoading, user, accessToken, loadRequest])

  // Approval changes the role in the database. Refresh the cached session so
  // the header and route guards see the new role without a manual sign-in.
  useEffect(() => {
    if (
      request?.status === "APPROVED" &&
      user?.role !== "vendor" &&
      !refreshStartedRef.current
    ) {
      refreshStartedRef.current = true
      void refreshSession()
    }
  }, [request, user?.role, refreshSession])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)

    const trimmedName = restaurantName.trim()

    if (trimmedName.length < 2 || trimmedName.length > 120) {
      setFormError("Restaurant name must be between 2 and 120 characters.")
      return
    }

    if (message.trim().length > 500) {
      setFormError("Message must be 500 characters or fewer.")
      return
    }

    if (!accessToken) {
      setFormError("Your session expired. Please sign in again.")
      return
    }

    setSubmitting(true)

    try {
      const response = await apiPost<CreateVendorRequestResponse>(
        ENDPOINTS.vendorRequests,
        { restaurantName: trimmedName, message: message.trim() },
        accessToken
      )

      setRequest(response.request)
      setRestaurantName("")
      setMessage("")
      toast.success("Request submitted. We'll review it shortly.")
    } catch (error) {
      const text =
        error instanceof ApiError
          ? error.message
          : "Failed to submit your request. Please try again."

      setFormError(text)
      toast.error(text)
    } finally {
      setSubmitting(false)
    }
  }

  let body: ReactNode

  if (authLoading) {
    body = (
      <div className="space-y-3" aria-busy="true" aria-live="polite">
        <span className="sr-only">Loading your account</span>
        <div className="h-11 animate-pulse rounded-lg bg-muted" />
        <div className="h-24 animate-pulse rounded-lg bg-muted" />
      </div>
    )
  } else if (!user) {
    body = (
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-muted-foreground">
          Sign in with your PizzaHub account to apply. If you&apos;re new here,
          create an account first — it only takes a moment.
        </p>
        <ButtonLink href="/login?next=/become-a-vendor" size="lg" className="h-11 w-full rounded-[10px]">
          Sign in to apply
        </ButtonLink>
        <ButtonLink
          href="/register?next=/become-a-vendor"
          variant="outline"
          size="lg"
          className="h-11 w-full rounded-[10px]"
        >
          Create an account
        </ButtonLink>
      </div>
    )
  } else if (user.role === "vendor") {
    body = (
      <div className="space-y-4">
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-green-900 dark:border-green-900/40 dark:bg-green-950/30 dark:text-green-100">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <CheckCircle2 className="size-4" aria-hidden="true" />
            You already have a vendor account
          </p>
          <p className="mt-2 text-sm leading-relaxed">
            Head to your dashboard to manage your restaurant and menu.
          </p>
        </div>
        <ButtonLink href="/vendor" size="lg" className="h-11 w-full rounded-[10px]">
          Open vendor dashboard
        </ButtonLink>
      </div>
    )
  } else if (user.role === "admin") {
    body = (
      <p className="text-sm leading-relaxed text-muted-foreground">
        Admin accounts are not converted into vendor accounts. Review incoming
        applications from the{" "}
        <Link href="/admin/vendor-requests" className="font-medium text-primary hover:text-primary-hover">
          admin vendor requests
        </Link>{" "}
        page instead.
      </p>
    )
  } else if (!accessToken) {
    body = (
      <p className="text-sm leading-relaxed text-muted-foreground">
        We couldn&apos;t verify your session. Please sign out and sign in again
        before applying.
      </p>
    )
  } else if (loadingRequest) {
    body = (
      <div className="space-y-3" aria-busy="true" aria-live="polite">
        <span className="sr-only">Loading your vendor request</span>
        <div className="h-11 animate-pulse rounded-lg bg-muted" />
        <div className="h-24 animate-pulse rounded-lg bg-muted" />
      </div>
    )
  } else if (requestError) {
    body = (
      <div className="space-y-4">
        <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {requestError}
        </p>
        <Button type="button" variant="outline" onClick={() => void loadRequest()}>
          Retry
        </Button>
      </div>
    )
  } else if (request && (request.status === "PENDING" || request.status === "APPROVED")) {
    body = <StatusNotice request={request} />
  } else {
    body = (
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {request?.status === "REJECTED" ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            <p className="flex items-center gap-2 font-semibold">
              <XCircle className="size-4" aria-hidden="true" />
              Previous request not approved
            </p>
            <p className="mt-2 leading-relaxed">
              {request.rejectionReason ?? "No reason was provided."}
            </p>
            <p className="mt-2 leading-relaxed opacity-90">
              You can update your details and apply again below.
            </p>
          </div>
        ) : null}

        <div className="space-y-2">
          <label htmlFor="restaurantName" className="text-sm font-medium text-foreground">
            Restaurant name
          </label>
          <input
            id="restaurantName"
            type="text"
            required
            value={restaurantName}
            onChange={(event) => setRestaurantName(event.target.value)}
            placeholder="Your restaurant's name"
            className={inputClassName}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="message" className="text-sm font-medium text-foreground">
            Tell us about your restaurant <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <textarea
            id="message"
            rows={4}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="What do you make, and where are you based?"
            className={cn(textareaClassName, "resize-y")}
          />
          <p className="text-xs text-muted-foreground">{message.length}/500</p>
        </div>

        {formError ? (
          <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {formError}
          </p>
        ) : null}

        <Button type="submit" size="lg" disabled={submitting} className="h-11 w-full rounded-[10px]">
          {submitting ? "Submitting..." : "Submit application"}
        </Button>
      </form>
    )
  }

  const footer =
    user && user.role !== "admin" ? (
      <>
        Just here to eat?{" "}
        <Link href="/menu" className="font-medium text-primary hover:text-primary-hover">
          Explore the menu
        </Link>
      </>
    ) : (
      <>
        Back to{" "}
        <Link href="/" className="font-medium text-primary hover:text-primary-hover">
          PizzaHub home
        </Link>
      </>
    )

  return (
    <AuthCard
      title="Become a vendor"
      description="Sell your pizza on PizzaHub. Send us a short application and we'll enable your vendor dashboard once it's approved."
      footer={footer}
    >
      {body}
    </AuthCard>
  )
}
