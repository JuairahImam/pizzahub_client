"use client"

import {
  CheckCircle2,
  ChefHat,
  MapPin,
  Pencil,
  Phone,
  Plus,
  X,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"

import { EmptyState } from "@/components/empty-state"
import { ErrorState } from "@/components/error-state"
import { ProtectedRoute } from "@/components/protected-route"
import { Button, buttonVariants } from "@/components/ui/button"
import { RestaurantForm } from "@/components/vendor/restaurant-form"
import { useAuth } from "@/hooks/use-auth"
import { ApiError, apiGet, apiPatch, apiPost } from "@/lib/api/client"
import { cn } from "@/lib/utils"
import type {
  Restaurant,
  RestaurantInput,
  RestaurantMutationResponse,
  RestaurantResponse,
} from "@/types/restaurant"

type PageStatus = "loading" | "ready" | "empty" | "forbidden" | "error"
type ViewMode = "view" | "create" | "edit"

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Date unavailable"

  return date.toLocaleString("en-BD", {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

export default function VendorRestaurantPage() {
  return (
    <ProtectedRoute requiredRole="vendor">
      <VendorRestaurantContent />
    </ProtectedRoute>
  )
}

function VendorRestaurantContent() {
  const router = useRouter()
  const {
    loading: authLoading,
    isAuthenticated,
    accessToken,
    refreshSession,
  } = useAuth()

  const [status, setStatus] = useState<PageStatus>("loading")
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [forbiddenMessage, setForbiddenMessage] = useState<string | null>(null)
  const [mode, setMode] = useState<ViewMode>("view")
  const [notice, setNotice] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)
  const returnFocusIdRef = useRef<string | null>(null)

  const sessionUnavailable =
    !authLoading && isAuthenticated && accessToken === null
  const visibleStatus: PageStatus = sessionUnavailable ? "error" : status
  const visibleErrorMessage = sessionUnavailable
    ? "We couldn't verify your session. Please sign in again."
    : errorMessage

  useEffect(() => {
    if (authLoading || !isAuthenticated || !accessToken) return

    let active = true

    apiGet<RestaurantResponse>("/api/vendor/restaurant", undefined, accessToken)
      .then((response) => {
        if (!active) return

        if (!response?.restaurant) {
          setErrorMessage("Received an unexpected response from the server.")
          setStatus("error")
          return
        }

        setRestaurant(response.restaurant)
        setMode("view")
        setStatus("ready")
      })
      .catch((error) => {
        if (!active) return

        if (error instanceof ApiError) {
          if (error.status === 401) {
            router.replace("/login")
            return
          }

          if (error.status === 403) {
            setForbiddenMessage(error.message || null)
            setStatus("forbidden")
            return
          }

          if (error.status === 404) {
            setRestaurant(null)
            setMode("view")
            setStatus("empty")
            return
          }

          setErrorMessage(error.message || "Failed to load restaurant profile.")
          setStatus("error")
          return
        }

        setErrorMessage("Failed to load restaurant profile. Please try again.")
        setStatus("error")
      })

    return () => {
      active = false
    }
  }, [authLoading, isAuthenticated, accessToken, reloadToken, router])

  useEffect(() => {
    if (mode !== "view") return
    if (status !== "ready" && status !== "empty") return

    const targetId = returnFocusIdRef.current
    if (!targetId) return

    returnFocusIdRef.current = null
    document.getElementById(targetId)?.focus()
  }, [mode, status])

  function handleRetry() {
    setStatus("loading")
    setErrorMessage(null)
    setForbiddenMessage(null)

    if (!accessToken) {
      void refreshSession()
    }

    setReloadToken((value) => value + 1)
  }

  function startEdit() {
    setNotice(null)
    setMode("edit")
  }

  function startCreate() {
    setNotice(null)
    setMode("create")
  }

  function cancelForm() {
    returnFocusIdRef.current =
      restaurant && status === "ready"
        ? "restaurant-edit-action"
        : "restaurant-create-action"
    setMode("view")
  }

  function getMutationErrorMessage(error: unknown, fallback: string) {
    if (error instanceof ApiError) {
      if (error.status === 401) {
        router.replace("/login")
        return error.message || "Your session expired. Please sign in again."
      }

      if (error.status === 403) {
        return (
          error.message ||
          "You don't have permission to manage this restaurant."
        )
      }

      return error.message || fallback
    }

    return `${fallback} Please check your connection and try again.`
  }

  async function handleCreate(values: RestaurantInput) {
    if (!accessToken) {
      return "We couldn't verify your session. Please sign in again."
    }

    try {
      const response = await apiPost<RestaurantMutationResponse>(
        "/api/vendor/restaurant",
        values,
        accessToken
      )

      if (!response?.restaurant) {
        return "Received an unexpected response from the server."
      }

      setRestaurant(response.restaurant)
      setStatus("ready")
      setMode("view")
      setNotice(response.message || "Restaurant created successfully.")
      returnFocusIdRef.current = "restaurant-edit-action"
      return null
    } catch (error) {
      return getMutationErrorMessage(error, "Failed to create restaurant.")
    }
  }

  async function handleUpdate(values: RestaurantInput) {
    if (!accessToken) {
      return "We couldn't verify your session. Please sign in again."
    }

    try {
      const response = await apiPatch<RestaurantMutationResponse>(
        "/api/vendor/restaurant",
        values,
        accessToken
      )

      if (!response?.restaurant) {
        return "Received an unexpected response from the server."
      }

      setRestaurant(response.restaurant)
      setStatus("ready")
      setMode("view")
      setNotice(response.message || "Restaurant updated successfully.")
      returnFocusIdRef.current = "restaurant-edit-action"
      return null
    } catch (error) {
      return getMutationErrorMessage(error, "Failed to update restaurant.")
    }
  }

  return (
    <div className="max-w-4xl space-y-6 sm:space-y-8">
      <header>
        <p className="text-xs font-medium tracking-[0.2em] text-primary uppercase">
          Vendor dashboard
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Restaurant
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Create and manage the restaurant profile linked to your vendor
          account.
        </p>
      </header>

      {notice ? (
        <SuccessNotice message={notice} onDismiss={() => setNotice(null)} />
      ) : null}

      {visibleStatus === "loading" ? <RestaurantSkeleton /> : null}

      {visibleStatus === "forbidden" ? (
        <div className="space-y-4">
          <EmptyState
            title="Access denied"
            description={
              forbiddenMessage
                ? `${forbiddenMessage} If you believe this is a mistake, contact support.`
                : "Your account does not have permission to manage a restaurant. Sign in with a vendor account or contact support if you believe this is a mistake."
            }
          />
          <div className="flex justify-center">
            <Link
              href="/"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "h-11 rounded-[10px] px-6"
              )}
            >
              Back to PizzaHub
            </Link>
          </div>
        </div>
      ) : null}

      {visibleStatus === "error" ? (
        <ErrorState
          title="Unable to load restaurant profile"
          description={
            visibleErrorMessage ??
            "We couldn't load your restaurant profile. Please try again."
          }
          onRetry={handleRetry}
        />
      ) : null}

      {visibleStatus === "empty" && mode === "view" ? (
        <EmptyRestaurantState onCreate={startCreate} />
      ) : null}

      {visibleStatus === "empty" && mode === "create" ? (
        <RestaurantFormCard
          mode="create"
          onSubmit={handleCreate}
          onCancel={cancelForm}
        />
      ) : null}

      {visibleStatus === "ready" && mode === "view" && restaurant ? (
        <RestaurantProfile restaurant={restaurant} onEdit={startEdit} />
      ) : null}

      {visibleStatus === "ready" && mode === "edit" && restaurant ? (
        <RestaurantFormCard
          mode="edit"
          initialValues={{
            name: restaurant.name,
            description: restaurant.description,
            address: restaurant.address,
            phone: restaurant.phone,
          }}
          onSubmit={handleUpdate}
          onCancel={cancelForm}
        />
      ) : null}
    </div>
  )
}

function RestaurantProfile({
  restaurant,
  onEdit,
}: {
  restaurant: Restaurant
  onEdit: () => void
}) {
  return (
    <section
      aria-labelledby="restaurant-profile-heading"
      className="overflow-hidden rounded-xl border border-border bg-card"
    >
      <div className="flex flex-col gap-4 border-b border-border p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-secondary text-primary">
            <ChefHat className="size-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <h2
              id="restaurant-profile-heading"
              className="text-xl font-semibold tracking-tight break-words text-foreground"
            >
              {restaurant.name}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Restaurant profile
            </p>
          </div>
        </div>

        <Button
          id="restaurant-edit-action"
          type="button"
          variant="outline"
          size="lg"
          onClick={onEdit}
          className="h-10 w-full rounded-[10px] px-4 sm:w-auto"
        >
          <Pencil className="size-4" aria-hidden />
          Edit restaurant
        </Button>
      </div>

      <dl className="grid gap-6 p-5 sm:grid-cols-2 sm:p-6">
        <div className="sm:col-span-2">
          <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Description
          </dt>
          <dd className="mt-1.5 text-sm leading-relaxed break-words whitespace-pre-line text-foreground">
            {restaurant.description}
          </dd>
        </div>

        <div>
          <dt className="flex items-center gap-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            <MapPin className="size-3.5" aria-hidden />
            Address
          </dt>
          <dd className="mt-1.5 text-sm leading-relaxed break-words text-foreground">
            {restaurant.address}
          </dd>
        </div>

        <div>
          <dt className="flex items-center gap-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            <Phone className="size-3.5" aria-hidden />
            Phone
          </dt>
          <dd className="mt-1.5 text-sm leading-relaxed break-words text-foreground">
            {restaurant.phone}
          </dd>
        </div>
      </dl>

      <div className="border-t border-border bg-secondary/40 px-5 py-3 text-xs text-muted-foreground sm:px-6">
        Last updated {formatDate(restaurant.updatedAt)}
      </div>
    </section>
  )
}

function EmptyRestaurantState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="space-y-4">
      <EmptyState
        title="No restaurant profile yet"
        description="Create your restaurant profile to add your restaurant's name, description, address, and phone number."
      />
      <div className="flex justify-center">
        <Button
          id="restaurant-create-action"
          type="button"
          size="lg"
          onClick={onCreate}
          className="h-11 rounded-[10px] px-5"
        >
          <Plus className="size-4" aria-hidden />
          Create restaurant
        </Button>
      </div>
    </div>
  )
}

function RestaurantFormCard({
  mode,
  initialValues,
  onSubmit,
  onCancel,
}: {
  mode: "create" | "edit"
  initialValues?: RestaurantInput
  onSubmit: (values: RestaurantInput) => Promise<string | null>
  onCancel: () => void
}) {
  return (
    <section
      aria-labelledby="restaurant-form-heading"
      className="rounded-xl border border-border bg-card p-5 sm:p-6"
    >
      <div className="mb-6">
        <h2
          id="restaurant-form-heading"
          className="text-lg font-semibold tracking-tight text-foreground sm:text-xl"
        >
          {mode === "edit"
            ? "Edit restaurant profile"
            : "Create restaurant profile"}
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          {mode === "edit"
            ? "Update the details below, then save your changes."
            : "Add your restaurant details below. All fields are required."}
        </p>
      </div>

      <RestaurantForm
        mode={mode}
        initialValues={initialValues}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    </section>
  )
}

function SuccessNotice({
  message,
  onDismiss,
}: {
  message: string
  onDismiss: () => void
}) {
  return (
    <div
      role="status"
      className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-green-900 dark:border-green-900/40 dark:bg-green-950/30 dark:text-green-100"
    >
      <CheckCircle2 className="mt-0.5 size-5 shrink-0" aria-hidden />
      <p className="flex-1 text-sm leading-relaxed">{message}</p>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss success message"
        className="-m-1 inline-flex size-7 shrink-0 items-center justify-center rounded-md text-green-800 transition-colors hover:bg-green-100 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none dark:text-green-200 dark:hover:bg-green-900/50"
      >
        <X className="size-4" aria-hidden />
      </button>
    </div>
  )
}

function RestaurantSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading restaurant profile</span>
      <div className="h-40 animate-pulse rounded-xl border border-border bg-card" />
      <div className="h-64 animate-pulse rounded-xl border border-border bg-card" />
    </div>
  )
}
