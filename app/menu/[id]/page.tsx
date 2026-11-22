"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Plus, ShoppingCart } from "lucide-react"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"

import { EmptyState } from "@/components/empty-state"
import { ErrorState } from "@/components/error-state"
import { PageContainer } from "@/components/page-container"
import { Price } from "@/components/price"
import { Button, buttonVariants } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { useCart } from "@/hooks/use-cart"
import { ApiError, apiGet } from "@/lib/api/client"
import { ENDPOINTS } from "@/lib/api/endpoints"
import type { MenuItem } from "@/types/menu"

const FALLBACK_IMAGE = "/images/hero-pizza.jpg"

function isValidObjectId(value: string) {
  return /^[0-9a-fA-F]{24}$/.test(value)
}

export default function MenuItemDetailsPage() {
  const params = useParams()
  const rawId = params?.id
  const id = Array.isArray(rawId) ? rawId[0] : rawId

  const { user } = useAuth()
  const { addItem, isLoaded: cartLoaded } = useCart()

  const [item, setItem] = useState<MenuItem | null>(null)
  const [status, setStatus] = useState<"loading" | "ready" | "not-found" | "error">(
    "loading"
  )
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)
  const [added, setAdded] = useState(false)

  useEffect(() => {
    if (!id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStatus("not-found")
      return
    }

    if (!isValidObjectId(id)) {
      setStatus("not-found")
      setErrorMessage("This menu item link is invalid.")
      return
    }

    let active = true
    setStatus("loading")
    setErrorMessage(null)

    apiGet<{ success: boolean; menuItem: MenuItem }>(ENDPOINTS.menuItem(id))
      .then((response) => {
        if (!active) return
        if (!response?.menuItem) {
          setStatus("not-found")
          return
        }
        setItem(response.menuItem)
        setStatus("ready")
      })
      .catch((error) => {
        if (!active) return
        if (error instanceof ApiError) {
          if (error.status === 404 || error.status === 400) {
            setStatus("not-found")
            setErrorMessage(
              error.status === 400
                ? "This menu item link is invalid."
                : "This menu item is no longer available."
            )
            return
          }
          setErrorMessage(error.message)
        } else {
          setErrorMessage("Failed to load this menu item. Please try again.")
        }
        setStatus("error")
      })

    return () => {
      active = false
    }
  }, [id, reloadToken])

  function handleAddToCart() {
    if (!item || !cartLoaded) return

    const result = addItem({
      menuItemId: item._id,
      name: item.name,
      price: item.price,
      imageUrl: item.imageUrl || FALLBACK_IMAGE,
      category: item.category,
      restaurantId: item.restaurantId,
      restaurantName: item.restaurant?.name ?? "PizzaHub",
    })

    if (result === "added") {
      setAdded(true)
      window.setTimeout(() => setAdded(false), 1500)
    }
  }

  const canOrder = user?.role === "customer"
  const orderDisabledReason = !user
    ? "Sign in to order"
    : user.role !== "customer"
      ? "Ordering is available to customer accounts only"
      : !item?.isAvailable
        ? "This item is currently unavailable"
        : null

  return (
    <main id="main-content" className="outline-none">
      <PageContainer className="py-8 sm:py-10 lg:py-12">
        <Link
          href="/menu"
          className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary-hover"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to menu
        </Link>

        {status === "loading" ? (
          <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            <div className="aspect-[4/3] animate-pulse rounded-2xl bg-muted" />
            <div className="space-y-4">
              <div className="h-8 w-2/3 animate-pulse rounded bg-muted" />
              <div className="h-5 w-1/3 animate-pulse rounded bg-muted" />
              <div className="h-24 animate-pulse rounded bg-muted" />
              <div className="h-12 w-40 animate-pulse rounded bg-muted" />
            </div>
          </div>
        ) : null}

        {status === "not-found" ? (
          <div className="mt-8">
            <EmptyState
              title="Menu item not found"
              description={
                errorMessage ??
                "This item may not exist, may be unavailable, or may no longer be approved."
              }
            />
            <div className="mt-6 flex justify-center">
              <Link
                href="/menu"
                className={buttonVariants({ size: "lg", className: "h-11 rounded-[10px] px-5" })}
              >
                Browse menu
              </Link>
            </div>
          </div>
        ) : null}

        {status === "error" ? (
          <div className="mt-8">
            <ErrorState
              title="Unable to load menu item"
              description={errorMessage ?? "We couldn't load this menu item."}
              onRetry={() => setReloadToken((value) => value + 1)}
            />
          </div>
        ) : null}

        {status === "ready" && item ? (
          <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            <section className="overflow-hidden rounded-2xl border border-border bg-card">
              <div className="relative aspect-[4/3] bg-muted">
                <Image
                  src={item.imageUrl || FALLBACK_IMAGE}
                  alt={`${item.name} from ${item.restaurant?.name ?? "PizzaHub"}`}
                  fill
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-cover"
                  priority
                  onError={(event) => {
                    event.currentTarget.src = FALLBACK_IMAGE
                  }}
                />
              </div>
            </section>

            <section className="space-y-6">
              <header className="space-y-3">
                <span className="inline-flex rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
                  {item.category}
                </span>
                <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                  {item.name}
                </h1>
                {item.restaurant?.name ? (
                  <p className="text-sm font-medium text-muted-foreground">
                    {item.restaurant.name}
                  </p>
                ) : null}
              </header>

              <p className="text-base leading-relaxed text-pretty text-muted-foreground">
                {item.description}
              </p>

              <div className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm font-medium text-muted-foreground">
                    Price
                  </span>
                  <Price value={item.price} className="text-2xl" />
                </div>

                {item.restaurant?.address ? (
                  <div className="mt-4 border-t border-border pt-4">
                    <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
                      Location
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-foreground">
                      {item.restaurant.address}
                    </p>
                  </div>
                ) : null}

                {item.restaurant?.phone ? (
                  <div className="mt-4 border-t border-border pt-4">
                    <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
                      Contact
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-foreground">
                      {item.restaurant.phone}
                    </p>
                  </div>
                ) : null}
              </div>

              <div className="space-y-3">
                {orderDisabledReason ? (
                  <div className="rounded-xl border border-border bg-muted/40 p-4">
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {orderDisabledReason}.{" "}
                      {!user ? (
                        <Link
                          href="/login"
                          className="font-medium text-primary hover:text-primary-hover"
                        >
                          Sign in
                        </Link>
                      ) : null}
                    </p>
                  </div>
                ) : null}

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button
                    type="button"
                    size="lg"
                    disabled={!canOrder || added || !cartLoaded}
                    onClick={handleAddToCart}
                    className="h-11 rounded-[10px] px-5"
                  >
                    {added ? (
                      <>
                        <ShoppingCart className="size-4" aria-hidden="true" />
                        Added to cart
                      </>
                    ) : (
                      <>
                        <Plus className="size-4" aria-hidden="true" />
                        Add to cart
                      </>
                    )}
                  </Button>

                  <Link
                    href="/cart"
                    className={buttonVariants({
                      variant: "outline",
                      size: "lg",
                      className: "h-11 rounded-[10px] px-5",
                    })}
                  >
                    View cart
                  </Link>
                </div>

                {!user ? (
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    You can browse menu details while signed out. Ordering requires
                    a customer account.
                  </p>
                ) : null}
              </div>
            </section>
          </div>
        ) : null}
      </PageContainer>
    </main>
  )
}
