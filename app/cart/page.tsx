"use client"

import Image from "next/image"
import Link from "next/link"
import { Minus, Plus, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"

import { EmptyState } from "@/components/empty-state"
import { PageContainer } from "@/components/page-container"
import { Price } from "@/components/price"
import { Button } from "@/components/ui/button"
import { useCart } from "@/hooks/use-cart"

const FALLBACK_IMAGE = "/images/hero-pizza.jpg"

export default function CartPage() {
  const router = useRouter()
  const {
    items,
    totalItems,
    subtotal,
    updateQuantity,
    removeItem,
    clearCart,
    isLoaded,
  } = useCart()

  if (!isLoaded) {
    return (
      <main className="outline-none">
        <PageContainer className="py-12 sm:py-16">
          <div className="h-64 animate-pulse rounded-2xl bg-muted" />
        </PageContainer>
      </main>
    )
  }

  if (items.length === 0) {
    return (
      <main className="outline-none">
        <PageContainer className="py-12 sm:py-16">
          <EmptyState
            title="Your cart is empty"
            description="Add some pizzas, sides, or drinks from the menu to get started."
          />
          <div className="mt-6 flex justify-center">
            <Link
              href="/menu"
              className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
            >
              Browse menu
            </Link>
          </div>
        </PageContainer>
      </main>
    )
  }

  return (
    <main className="outline-none">
      <PageContainer className="py-10 sm:py-12 lg:py-16">
        <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-medium tracking-[0.2em] text-primary uppercase">
              Your order
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Cart
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {totalItems} item{totalItems === 1 ? "" : "s"} from{" "}
              {items[0]?.restaurantName}
            </p>
          </div>
          <button
            type="button"
            onClick={clearCart}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            <Trash2 className="size-4" aria-hidden="true" />
            Clear cart
          </button>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
          <ul className="space-y-4">
            {items.map((item) => (
              <li
                key={item.menuItemId}
                className="flex gap-4 rounded-xl border border-border bg-card p-4"
              >
                <div className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-muted sm:size-24">
                  <Image
                    src={item.imageUrl || FALLBACK_IMAGE}
                    alt={item.name}
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                </div>

                <div className="flex min-w-0 flex-1 flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate text-base font-semibold tracking-tight text-foreground">
                        {item.name}
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        {item.category}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(item.menuItemId)}
                      aria-label={`Remove ${item.name}`}
                      className="grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <div className="inline-flex items-center rounded-lg border border-border">
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(item.menuItemId, item.quantity - 1)
                        }
                        aria-label={`Decrease ${item.name} quantity`}
                        className="grid size-9 place-items-center text-foreground transition-colors hover:bg-muted"
                      >
                        <Minus className="size-4" aria-hidden="true" />
                      </button>
                      <span className="min-w-8 text-center text-sm font-medium text-foreground">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(item.menuItemId, item.quantity + 1)
                        }
                        disabled={item.quantity >= 20}
                        aria-label={`Increase ${item.name} quantity`}
                        className="grid size-9 place-items-center text-foreground transition-colors hover:bg-muted disabled:opacity-40"
                      >
                        <Plus className="size-4" aria-hidden="true" />
                      </button>
                    </div>

                    <Price value={item.price * item.quantity} />
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <aside className="h-fit rounded-xl border border-border bg-card p-6">
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              Order summary
            </h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Items</dt>
                <dd className="font-medium text-foreground">{totalItems}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd className="font-medium text-foreground">
                  <Price value={subtotal} />
                </dd>
              </div>
            </dl>
            <p className="mt-3 text-xs text-muted-foreground">
              Final prices and totals are confirmed by the server at checkout.
            </p>
            <Button
              type="button"
              size="lg"
              className="mt-6 w-full"
              onClick={() => router.push("/checkout")}
            >
              Proceed to checkout
            </Button>
            <Link
              href="/menu"
              className="mt-3 block text-center text-sm font-medium text-primary hover:text-primary-hover"
            >
              Continue shopping
            </Link>
          </aside>
        </div>
      </PageContainer>
    </main>
  )
}