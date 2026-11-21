import { useCartContext } from "@/lib/cart/cart-context"

export function useCart() {
  return useCartContext()
}