export type AdminUser = {
  id: string
  name: string
  email: string
  role: "customer" | "vendor" | "admin"
  isBlocked: boolean
  createdAt: string
  updatedAt: string
}

export type AdminUsersResponse = {
  success: boolean
  count: number
  users: AdminUser[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export type AdminUserResponse = {
  success: boolean
  user: AdminUser
}
