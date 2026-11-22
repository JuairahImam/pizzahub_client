export type Restaurant = {
  _id: string
  vendorId: string
  name: string
  description: string
  address: string
  phone: string
  createdAt: string
  updatedAt: string
}

export type RestaurantInput = {
  name: string
  description: string
  address: string
  phone: string
}

export type RestaurantResponse = {
  success: boolean
  restaurant: Restaurant
}

export type RestaurantMutationResponse = RestaurantResponse & {
  message: string
}
