"use client"

import { PageContainer } from "@/components/page-container"
import { ProtectedRoute } from "@/components/protected-route"
import { VendorSidebar } from "@/components/vendor/vendor-sidebar"

export default function VendorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute requiredRole="vendor">
      <div className="min-h-dvh bg-background">
        <a
          href="#vendor-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[80] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background focus:outline-none"
        >
          Skip to dashboard content
        </a>

        <VendorSidebar />

        <div className="md:pl-64">
          <PageContainer className="py-6 sm:py-8 lg:py-10">
            <main id="vendor-content" tabIndex={-1} className="outline-none">
              {children}
            </main>
          </PageContainer>
        </div>
      </div>
    </ProtectedRoute>
  )
}
