export type CartItem = {
  menuItemId: string
  name: string
  price: number
  quantity: number
  imageUrl: string
  category: string
  restaurantId: string
  restaurantName: string
}

export type CartCandidate = {
  menuItemId: string
  name: string
  price: number
  imageUrl: string
  category: string
  restaurantId: string
  restaurantName: string
}

export type CartState = {
  items: CartItem[]
  restaurantId: string | null
  restaurantName: string | null
}