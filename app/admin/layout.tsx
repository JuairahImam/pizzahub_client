import { ProtectedRoute } from "@/components/protected-route"
import { AdminNav } from "@/components/admin/admin-nav"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute requiredRole="admin">
      <AdminNav />
      {children}
    </ProtectedRoute>
  )
}
