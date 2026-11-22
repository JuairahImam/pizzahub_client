export type UserProfile = {
  id: string
  name: string
  email: string
  role: "customer" | "vendor" | "admin"
  createdAt: string
  updatedAt: string
}

export type UserProfileResponse = {
  success: boolean
  user: UserProfile
}

export type UpdateUserProfileInput = {
  name: string
}
