const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5001"

let authTokenGetter: (() => string | null) | null = null

export function setAuthTokenGetter(getter: (() => string | null) | null) {
  authTokenGetter = getter
}

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = "ApiError"
    this.status = status
  }
}

type QueryParams = Record<
  string,
  string | number | boolean | null | undefined
>

function buildUrl(path: string, params?: QueryParams) {
  const url = new URL(path, API_BASE_URL)

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null || value === "") continue
      url.searchParams.set(key, String(value))
    }
  }

  return url.toString()
}

export async function apiGet<T>(
  path: string,
  params?: QueryParams
): Promise<T> {
  let response: Response

  const token = authTokenGetter ? authTokenGetter() : null

  try {
    response = await fetch(buildUrl(path, params), {
      method: "GET",
      headers: {
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      cache: "no-store",
    })
  } catch {
    throw new ApiError("Network error. Please check your connection.", 0)
  }

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

    throw new ApiError(message, response.status)
  }

  return data as T
}

export async function apiPost<T>(
  path: string,
  body?: unknown
): Promise<T> {
  const token = authTokenGetter ? authTokenGetter() : null

  let response: Response

  try {
    response = await fetch(buildUrl(path), {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
    })
  } catch {
    throw new ApiError("Network error. Please check your connection.", 0)
  }

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

    throw new ApiError(message, response.status)
  }

  return data as T
}