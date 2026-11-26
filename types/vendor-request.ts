export type VendorRequestStatus = "PENDING" | "APPROVED" | "REJECTED"

export type VendorRequest = {
  id: string
  userId: string
  name: string
  email: string
  restaurantName: string
  message: string
  status: VendorRequestStatus
  createdAt: string
  updatedAt: string
  reviewedAt: string | null
  reviewedBy: string | null
  rejectionReason: string | null
}

export type VendorRequestResponse = {
  success: boolean
  request: VendorRequest | null
}

export type CreateVendorRequestResponse = {
  success: boolean
  message: string
  request: VendorRequest
}

export type VendorRequestsResponse = {
  success: boolean
  count: number
  requests: VendorRequest[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export type VendorRequestDetailsResponse = {
  success: boolean
  request: VendorRequest
}
