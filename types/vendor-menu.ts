export type VendorMenuApprovalStatus = "PENDING" | "APPROVED" | "REJECTED"

export type VendorMenuItem = {
  _id: string
  vendorId: string
  restaurantId: string
  name: string
  description: string
  category: string
  price: number
  imageUrl: string
  imageId: string
  images?: string[]
  isAvailable: boolean
  approvalStatus: VendorMenuApprovalStatus
  rejectionReason: string | null
  reviewedAt: string | null
  reviewedBy: string | null
  createdAt: string
  updatedAt: string
}

export type VendorMenuResponse = {
  success: boolean
  count: number
  menuItems: VendorMenuItem[]
}

export type VendorMenuMutationResponse = {
  success: boolean
  message: string
  menuItem: VendorMenuItem
}

export type CreateVendorMenuItemInput = {
  name: string
  description: string
  category: string
  price: number
  imageUrl: string
  imageId: string
  images?: string[]
  isAvailable?: boolean
}

export type UpdateVendorMenuItemInput = Partial<CreateVendorMenuItemInput>

export type VendorMenuItemFormValues = {
  name: string
  description: string
  category: string
  price: string
  isAvailable: boolean
}

export type UploadedImage = {
  id: string
  title: string
  imageUrl: string
  displayUrl: string
  size: number
}

export type ImageUploadResponse = {
  success: boolean
  message: string
  image: UploadedImage
}
