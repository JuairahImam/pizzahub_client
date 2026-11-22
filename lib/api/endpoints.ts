export const ENDPOINTS = {
  menuItems: "/api/menu-items",
  menuCategories: "/api/menu-items/categories",
  menuItem: (id: string) => `/api/menu-items/${encodeURIComponent(id)}`,
  vendorMenuItems: "/api/vendor/menu-items",
  vendorMenuItem: (id: string) =>
    `/api/vendor/menu-items/${encodeURIComponent(id)}`,
  vendorUploadImage: "/api/vendor/upload-image",
} as const