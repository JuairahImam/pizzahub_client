"use client"

import { usePathname } from "next/navigation"

import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isVendorDashboard =
    pathname === "/vendor" || pathname.startsWith("/vendor/")

  // The vendor dashboard uses its own shell and navigation.
  if (isVendorDashboard) {
    return <>{children}</>
  }

  return (
    <>
      <SiteHeader />
      {children}
      <SiteFooter />
    </>
  )
}
