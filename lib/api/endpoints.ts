export const ENDPOINTS = {
  menuItems: "/api/menu-items",
  menuCategories: "/api/menu-items/categories",
  menuItem: (id: string) => `/api/menu-items/${encodeURIComponent(id)}`,
  vendorMenuItems: "/api/vendor/menu-items",
  vendorMenuItem: (id: string) =>
    `/api/vendor/menu-items/${encodeURIComponent(id)}`,
  vendorUploadImage: "/api/vendor/upload-image",
  adminMenuItems: "/api/admin/menu-items",
  adminMenuItem: (id: string) =>
    `/api/admin/menu-items/${encodeURIComponent(id)}`,
  adminApproveMenuItem: (id: string) =>
    `/api/admin/menu-items/${encodeURIComponent(id)}/approve`,
  adminRejectMenuItem: (id: string) =>
    `/api/admin/menu-items/${encodeURIComponent(id)}/reject`,
  vendorOrders: "/api/vendor/orders",
  vendorOrderAccept: (id: string) =>
    `/api/vendor/orders/${encodeURIComponent(id)}/accept`,
  vendorOrderReject: (id: string) =>
    `/api/vendor/orders/${encodeURIComponent(id)}/reject`,
  vendorOrderStatus: (id: string) =>
    `/api/vendor/orders/${encodeURIComponent(id)}/status`,
  vendorPremiumCheckout: "/api/vendor/premium/checkout",
  profile: "/api/users/profile",
  adminDashboardOverview: "/api/admin/dashboard/overview",
} as const