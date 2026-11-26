export type MenuItemRestaurant = {
  _id: string
  name: string
  description?: string
  address?: string
  phone?: string
  createdAt?: string
  updatedAt?: string
}

export type MenuItem = {
  _id: string
  restaurantId: string
  name: string
  description: string
  category: string
  price: number
  imageUrl: string
  images?: string[]
  isAvailable: boolean
  createdAt: string
  updatedAt: string
  restaurant: MenuItemRestaurant | null
}

export type MenuPagination = {
  total: number
  page: number
  limit: number
  totalPages: number
}

export type MenuListResponse = {
  success: boolean
  menuItems: MenuItem[]
  pagination: MenuPagination
}

export type CategoryListResponse = {
  success: boolean
  count: number
  categories: string[]
}