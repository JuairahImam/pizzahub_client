"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

import { useAuth } from "@/hooks/use-auth"

export type RequiredRole = "customer" | "vendor" | "admin"

export function useRequireAuth(requiredRole?: RequiredRole) {
  const router = useRouter()
  const { user, loading, isAuthenticated } = useAuth()

  useEffect(() => {
    if (loading) return

    if (!isAuthenticated) {
      router.replace("/login")
      return
    }

    if (requiredRole && user?.role !== requiredRole) {
      router.replace("/")
    }
  }, [loading, isAuthenticated, user, requiredRole, router])

  const allowed =
    !loading &&
    isAuthenticated &&
    (requiredRole === undefined || user?.role === requiredRole)

  return { user, loading, isAuthenticated, allowed }
}