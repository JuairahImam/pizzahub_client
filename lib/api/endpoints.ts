export const ENDPOINTS = {
  menuItems: "/api/menu-items",
  menuCategories: "/api/menu-items/categories",
  menuItem: (id: string) => `/api/menu-items/${encodeURIComponent(id)}`,
} as const