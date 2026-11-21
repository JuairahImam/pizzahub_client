"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"

import type { CartCandidate, CartItem, CartState } from "@/types/cart"

const STORAGE_KEY = "pizzahub-cart"
const MAX_QUANTITY = 20

type CartContextValue = {
  items: CartItem[]
  restaurantId: string | null
  restaurantName: string | null
  totalItems: number
  subtotal: number
  isLoaded: boolean
  addItem: (candidate: CartCandidate) => "added" | "needs_confirmation"
  updateQuantity: (menuItemId: string, quantity: number) => void
  removeItem: (menuItemId: string) => void
  clearCart: () => void
  confirmReplaceCart: () => void
  cancelReplaceCart: () => void
  pendingReplacement: CartCandidate | null
}

const CartContext = createContext<CartContextValue | null>(null)

function isValidCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== "object") return false
  const item = value as Record<string, unknown>

  return (
    typeof item.menuItemId === "string" &&
    typeof item.name === "string" &&
    typeof item.price === "number" &&
    Number.isFinite(item.price) &&
    typeof item.quantity === "number" &&
    Number.isInteger(item.quantity) &&
    item.quantity >= 1 &&
    item.quantity <= MAX_QUANTITY &&
    typeof item.imageUrl === "string" &&
    typeof item.category === "string" &&
    typeof item.restaurantId === "string" &&
    typeof item.restaurantName === "string"
  )
}

function loadCart(): CartState {
  if (typeof window === "undefined") {
    return { items: [], restaurantId: null, restaurantName: null }
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return { items: [], restaurantId: null, restaurantName: null }
    }

    const parsed = JSON.parse(raw) as Partial<CartState>

    if (!parsed || !Array.isArray(parsed.items)) {
      return { items: [], restaurantId: null, restaurantName: null }
    }

    const items = parsed.items.filter(isValidCartItem)

    if (items.length === 0) {
      return { items: [], restaurantId: null, restaurantName: null }
    }

    const restaurantId =
      typeof parsed.restaurantId === "string" ? parsed.restaurantId : null
    const restaurantName =
      typeof parsed.restaurantName === "string" ? parsed.restaurantName : null

    return { items, restaurantId, restaurantName }
  } catch {
    return { items: [], restaurantId: null, restaurantName: null }
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [restaurantId, setRestaurantId] = useState<string | null>(null)
  const [restaurantName, setRestaurantName] = useState<string | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [pendingReplacement, setPendingReplacement] =
    useState<CartCandidate | null>(null)

  const pendingRef = useRef<CartCandidate | null>(null)

  // Restore from localStorage after mount to avoid hydration mismatch.
  useEffect(() => {
    const restored = loadCart()
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems(restored.items)
    setRestaurantId(restored.restaurantId)
    setRestaurantName(restored.restaurantName)
    setIsLoaded(true)
  }, [])

  // Persist whenever the cart changes after initial load.
  useEffect(() => {
    if (!isLoaded) return

    try {
      if (items.length === 0) {
        window.localStorage.removeItem(STORAGE_KEY)
      } else {
        const state: CartState = { items, restaurantId, restaurantName }
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
      }
    } catch {
      // Ignore storage errors.
    }
  }, [items, restaurantId, restaurantName, isLoaded])

  const addItem = useCallback((candidate: CartCandidate) => {
    if (restaurantId && restaurantId !== candidate.restaurantId) {
      pendingRef.current = candidate
      setPendingReplacement(candidate)
      return "needs_confirmation"
    }

    setItems((currentItems) => {
      const existing = currentItems.find(
        (item) => item.menuItemId === candidate.menuItemId
      )

      if (existing) {
        return currentItems.map((item) =>
          item.menuItemId === candidate.menuItemId
            ? {
                ...item,
                quantity: Math.min(MAX_QUANTITY, item.quantity + 1),
              }
            : item
        )
      }

      return [
        ...currentItems,
        {
          menuItemId: candidate.menuItemId,
          name: candidate.name,
          price: candidate.price,
          quantity: 1,
          imageUrl: candidate.imageUrl,
          category: candidate.category,
          restaurantId: candidate.restaurantId,
          restaurantName: candidate.restaurantName,
        },
      ]
    })

    setRestaurantId(candidate.restaurantId)
    setRestaurantName(candidate.restaurantName)

    return "added"
  }, [restaurantId])

  const updateQuantity = useCallback((menuItemId: string, quantity: number) => {
    setItems((currentItems) => {
      const nextQuantity = Math.max(0, Math.min(MAX_QUANTITY, quantity))

      if (nextQuantity === 0) {
        const filtered = currentItems.filter(
          (item) => item.menuItemId !== menuItemId
        )

        if (filtered.length === 0) {
          setRestaurantId(null)
          setRestaurantName(null)
        }

        return filtered
      }

      return currentItems.map((item) =>
        item.menuItemId === menuItemId
          ? { ...item, quantity: nextQuantity }
          : item
      )
    })
  }, [])

  const removeItem = useCallback((menuItemId: string) => {
    setItems((currentItems) => {
      const filtered = currentItems.filter(
        (item) => item.menuItemId !== menuItemId
      )

      if (filtered.length === 0) {
        setRestaurantId(null)
        setRestaurantName(null)
      }

      return filtered
    })
  }, [])

  const clearCart = useCallback(() => {
    setItems([])
    setRestaurantId(null)
    setRestaurantName(null)
  }, [])

  const confirmReplaceCart = useCallback(() => {
    const candidate = pendingRef.current
    if (!candidate) return

    setItems([
      {
        menuItemId: candidate.menuItemId,
        name: candidate.name,
        price: candidate.price,
        quantity: 1,
        imageUrl: candidate.imageUrl,
        category: candidate.category,
        restaurantId: candidate.restaurantId,
        restaurantName: candidate.restaurantName,
      },
    ])
    setRestaurantId(candidate.restaurantId)
    setRestaurantName(candidate.restaurantName)
    pendingRef.current = null
    setPendingReplacement(null)
  }, [])

  const cancelReplaceCart = useCallback(() => {
    pendingRef.current = null
    setPendingReplacement(null)
  }, [])

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  )

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      restaurantId,
      restaurantName,
      totalItems,
      subtotal,
      isLoaded,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      confirmReplaceCart,
      cancelReplaceCart,
      pendingReplacement,
    }),
    [
      items,
      restaurantId,
      restaurantName,
      totalItems,
      subtotal,
      isLoaded,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      confirmReplaceCart,
      cancelReplaceCart,
      pendingReplacement,
    ]
  )

  return (
    <CartContext.Provider value={value}>
      {children}

      {pendingReplacement ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="cart-replace-title"
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 px-4"
        >
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-lg">
            <h2
              id="cart-replace-title"
              className="text-lg font-semibold tracking-tight text-foreground"
            >
              Replace cart contents?
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Your cart contains items from{" "}
              <span className="font-medium text-foreground">
                {restaurantName}
              </span>
              . Adding{" "}
              <span className="font-medium text-foreground">
                {pendingReplacement.name}
              </span>{" "}
              from{" "}
              <span className="font-medium text-foreground">
                {pendingReplacement.restaurantName}
              </span>{" "}
              will replace your current cart. Orders can only include items from
              one restaurant.
            </p>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={cancelReplaceCart}
                className="inline-flex h-11 items-center justify-center rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                Keep current cart
              </button>
              <button
                type="button"
                onClick={confirmReplaceCart}
                className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
              >
                Replace cart
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </CartContext.Provider>
  )
}

export function useCartContext() {
  const context = useContext(CartContext)

  if (!context) {
    throw new Error("useCartContext must be used within a CartProvider")
  }

  return context
}