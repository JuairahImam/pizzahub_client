import { useAuthContext } from "@/lib/auth/auth-context"

export function useAuth() {
  return useAuthContext()
}

export type { AuthUser } from "@/lib/auth/auth-client"