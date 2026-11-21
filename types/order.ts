export type OrderItem = {
  menuItemId: string
  name: string
  price: number
  quantity: number
  subtotal: number
}

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PREPARING"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "REJECTED"
  | "CANCELLED"

export type Order = {
  _id: string
  customerId: string
  customerName: string
  customerEmail: string
  vendorId: string
  restaurantId: string
  restaurantName: string
  items: OrderItem[]
  totalAmount: number
  deliveryAddress: string
  contactPhone: string
  status: OrderStatus
  rejectionReason: string | null
  createdAt: string
  updatedAt: string
}

export type CreateOrderItemInput = {
  menuItemId: string
  quantity: number
}

export type CreateOrderInput = {
  items: CreateOrderItemInput[]
  deliveryAddress: string
  contactPhone: string
}

export type CreateOrderResponse = {
  success: boolean
  message: string
  order: Order
}