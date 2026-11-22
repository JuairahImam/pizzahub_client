export type AdminDashboardOverview = {
  success: boolean
  overview: {
    users: {
      total: number
      customers: number
      vendors: number
      blocked: number
    }
    menuItems: {
      total: number
      pending: number
      approved: number
      rejected: number
    }
    orders: {
      total: number
      pending: number
      confirmed: number
      preparing: number
      outForDelivery: number
      delivered: number
      rejected: number
      cancelled: number
      deliveredOrderValue: number
    }
    recentOrders: Array<{
      id: string
      customerName: string
      restaurantName: string
      totalAmount: number
      status: string
      createdAt: string
    }>
    recentMenuItems: Array<{
      id: string
      name: string
      category: string
      approvalStatus: string
      isAvailable: boolean
      vendorName: string | null
      createdAt: string
    }>
  }
}
