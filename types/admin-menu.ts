import type { VendorMenuItem } from "@/types/vendor-menu"

export type AdminMenuItemVendor = {
  id: string
  name: string | null
  email: string | null
  role: string | null
}

export type AdminMenuItemRestaurant = {
  _id: string
  name: string | null
  address: string | null
  phone: string | null
}

export type AdminMenuItem = VendorMenuItem & {
  vendor: AdminMenuItemVendor | null
  restaurant: AdminMenuItemRestaurant | null
}

export type AdminMenuResponse = {
  success: boolean
  count: number
  menuItems: AdminMenuItem[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export type AdminMenuMutationResponse = {
  success: boolean
  message: string
  menuItem: AdminMenuItem
}