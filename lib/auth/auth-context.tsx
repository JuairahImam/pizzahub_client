"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react"

import {
  getSession,
  getToken,
  signIn as signInRequest,
  signOut as signOutRequest,
  signUp as signUpRequest,
  type AuthUser,
} from "@/lib/auth/auth-client"
import { setAuthTokenGetter } from "@/lib/api/client"

type AuthContextValue = {
  user: AuthUser | null
  accessToken: string | null
  loading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<AuthUser>
  register: (
    name: string,
    email: string,
    password: string,
    accountType?: "customer" | "vendor"
  ) => Promise<AuthUser>
  logout: () => Promise<void>
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const accessTokenRef = useRef<string | null>(null)

  useEffect(() => {
    accessTokenRef.current = accessToken
  }, [accessToken])

  // Keep the API client in sync with the in-memory JWT.
  useEffect(() => {
    setAuthTokenGetter(() => accessTokenRef.current)
  }, [])

  const restoreSession = useCallback(async () => {
    setLoading(true)

    try {
      const session = await getSession()

      if (!session?.user) {
        setUser(null)
        setAccessToken(null)
        return
      }

      setUser(session.user)

      try {
        const tokenResponse = await getToken()
        setAccessToken(tokenResponse.token)
      } catch {
        setAccessToken(null)
      }
    } catch {
      setUser(null)
      setAccessToken(null)
    } finally {
      setLoading(false)
    }
  }, [])

  // Prevent duplicate state updates from Strict Mode double-invocation.
  const restoredRef = useRef(false)

  useEffect(() => {
    if (restoredRef.current) return
    restoredRef.current = true

    let cancelled = false

    async function run() {
      try {
        await restoreSession()
      } finally {
        if (cancelled) return
      }
    }

    void run()

    return () => {
      cancelled = true
    }
  }, [restoreSession])

  const login = useCallback(async (email: string, password: string) => {
    const result = await signInRequest(email, password)
    setUser(result.user)

    try {
      const tokenResponse = await getToken()
      setAccessToken(tokenResponse.token)
    } catch {
      setAccessToken(null)
    }

    return result.user
  }, [])

  const register = useCallback(
    async (
      name: string,
      email: string,
      password: string,
      accountType: "customer" | "vendor" = "customer"
    ) => {
      const result = await signUpRequest(name, email, password, accountType)
      setUser(result.user)

      try {
        const tokenResponse = await getToken()
        setAccessToken(tokenResponse.token)
      } catch {
        setAccessToken(null)
      }

      return result.user
    },
    []
  )

  const logout = useCallback(async () => {
    try {
      await signOutRequest()
    } catch {
      // Clear local state even if the server request fails.
    } finally {
      setUser(null)
      setAccessToken(null)
    }
  }, [])

  const value: AuthContextValue = {
    user,
    accessToken,
    loading,
    isAuthenticated: user !== null,
    login,
    register,
    logout,
    refreshSession: restoreSession,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuthContext() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error("useAuthContext must be used within an AuthProvider")
  }

  return context
}