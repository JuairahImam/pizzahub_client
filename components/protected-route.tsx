"use client"

import type { ReactNode } from "react"

import { useRequireAuth, type RequiredRole } from "@/hooks/use-require-auth"

type ProtectedRouteProps = {
  requiredRole?: RequiredRole
  children: ReactNode
}

export function ProtectedRoute({
  requiredRole,
  children,
}: ProtectedRouteProps) {
  const { allowed, loading } = useRequireAuth(requiredRole)

  // Do not render protected content until auth state is resolved.
  if (loading || !allowed) {
    return null
  }

  return <>{children}</>
}