const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5001"

export type AuthUser = {
  id: string
  name: string
  email: string
  emailVerified: boolean
  role: "customer" | "vendor" | "admin"
  isBlocked: boolean
  isPremium: boolean
  subscriptionStatus: string
  premiumExpiresAt: string | null
  createdAt: string
  updatedAt: string
}

export type AuthSession = {
  session: {
    id: string
    userId: string
    token: string
    expiresAt: string
    createdAt: string
    updatedAt: string
    ipAddress?: string | null
    userAgent?: string | null
  }
  user: AuthUser
}

export type AuthTokenResponse = {
  token: string
}

export type AuthResult = {
  token: string
  user: AuthUser
}

async function authFetch(path: string, init?: RequestInit) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(init?.headers ?? {}),
    },
  })

  let data: unknown = null

  try {
    data = await response.json()
  } catch {
    data = null
  }

  if (!response.ok) {
    const message =
      (data as { message?: string } | null)?.message ??
      `Request failed with status ${response.status}`

    throw new Error(message)
  }

  return data
}

export async function signUp(
  name: string,
  email: string,
  password: string
): Promise<AuthResult> {
  return authFetch("/api/auth/sign-up/email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  }) as Promise<AuthResult>
}

export async function signIn(
  email: string,
  password: string
): Promise<AuthResult> {
  return authFetch("/api/auth/sign-in/email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  }) as Promise<AuthResult>
}

export async function signOut(): Promise<void> {
  await authFetch("/api/auth/sign-out", {
    method: "POST",
  })
}

export async function getSession(): Promise<AuthSession | null> {
  const response = await fetch(`${API_BASE_URL}/api/auth/get-session`, {
    method: "GET",
    credentials: "include",
    headers: { Accept: "application/json" },
    cache: "no-store",
  })

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`)
  }

  const data = (await response.json()) as AuthSession | null
  return data
}

export async function getToken(): Promise<AuthTokenResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/token`, {
    method: "GET",
    credentials: "include",
    headers: { Accept: "application/json" },
    cache: "no-store",
  })

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`
    try {
      const data = (await response.json()) as { message?: string }
      if (data?.message) message = data.message
    } catch {
      // ignore
    }
    throw new Error(message)
  }

  return (await response.json()) as AuthTokenResponse
}

export function signInWithGoogle(callbackURL = "/"): void {
  const url = new URL("/api/auth/sign-in/social", API_BASE_URL)
  // Better Auth social sign-in is a POST endpoint; use a form-less navigation fallback.
  void fetch(url.toString(), {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ provider: "google", callbackURL }),
  })
    .then(async (response) => {
      const data = (await response.json()) as { url?: string }
      if (data?.url) {
        window.location.href = data.url
      }
    })
    .catch(() => {
      // noop
    })
}