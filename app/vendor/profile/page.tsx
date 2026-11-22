"use client"

import { useEffect, useState } from "react"

import { EmptyState } from "@/components/empty-state"
import { ErrorState } from "@/components/error-state"
import { ProtectedRoute } from "@/components/protected-route"
import { ProfileForm } from "@/components/profile/profile-form"
import { ProfileImageUploader } from "@/components/profile/profile-image-uploader"
import { PasswordForm } from "@/components/profile/password-form"
import { useAuth } from "@/hooks/use-auth"
import { ApiError, apiGet, apiPatch } from "@/lib/api/client"
import { ENDPOINTS } from "@/lib/api/endpoints"
import type { UserProfile, UserProfileResponse } from "@/types/profile"

export default function VendorProfilePage() {
  return (
    <ProtectedRoute requiredRole="vendor">
      <VendorProfileContent />
    </ProtectedRoute>
  )
}

function VendorProfileContent() {
  const { loading: authLoading, isAuthenticated, accessToken, refreshSession } = useAuth()

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    if (authLoading || !isAuthenticated || !accessToken) return

    let active = true

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStatus("loading")
    setErrorMessage(null)

    apiGet<UserProfileResponse>(ENDPOINTS.profile, undefined, accessToken)
      .then((response) => {
        if (!active) return
        if (!response?.user) {
          setErrorMessage("Received an unexpected response from the server.")
          setStatus("error")
          return
        }
        setProfile(response.user)
        setStatus("ready")
      })
      .catch((error) => {
        if (!active) return
        setErrorMessage(
          error instanceof ApiError
            ? error.message
            : "Failed to load profile. Please try again."
        )
        setStatus("error")
      })

    return () => {
      active = false
    }
  }, [authLoading, isAuthenticated, accessToken, reloadToken])

  async function handleUpdate(name: string) {
    if (!accessToken) return "We couldn't verify your session. Please sign in again."

    try {
      const response = await apiPatch<UserProfileResponse>(
        ENDPOINTS.profile,
        { name },
        accessToken
      )

      if (!response?.user) {
        return "Received an unexpected response from the server."
      }

      setProfile(response.user)
      await refreshSession()
      setNotice("Profile updated successfully.")
      return null
    } catch (error) {
      return error instanceof ApiError
        ? error.message
        : "Failed to update profile. Please try again."
    }
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading profile...</p>
      </div>
    )
  }

  if (!isAuthenticated || !accessToken) return null

  return (
    <div className="max-w-3xl space-y-6 sm:space-y-8">
      <header>
        <p className="text-xs font-medium tracking-[0.2em] text-primary uppercase">
          Vendor dashboard
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Profile Settings
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Update your personal account information. Restaurant details are managed separately.
        </p>
      </header>

      {notice ? (
        <div
          role="status"
          className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-green-900 dark:border-green-900/40 dark:bg-green-950/30 dark:text-green-100"
        >
          <p className="flex-1 text-sm leading-relaxed">{notice}</p>
          <button
            type="button"
            onClick={() => setNotice(null)}
            aria-label="Dismiss success message"
            className="-m-1 inline-flex size-7 shrink-0 items-center justify-center rounded-md text-green-800 transition-colors hover:bg-green-100 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none dark:text-green-200 dark:hover:bg-green-900/50"
          >
            <span aria-hidden>×</span>
          </button>
        </div>
      ) : null}

      {status === "loading" ? (
        <div className="h-64 animate-pulse rounded-xl border border-border bg-card" />
      ) : null}

      {status === "error" ? (
        <ErrorState
          title="Unable to load profile"
          description={errorMessage ?? "We couldn't load your profile. Please try again."}
          onRetry={() => setReloadToken((value) => value + 1)}
        />
      ) : null}

      {status === "ready" && profile ? (
        <>
          <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              Personal information
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Update your name. Email and role are managed by the system.
            </p>
            <div className="mt-6">
              <ProfileForm initialValues={profile} onSubmit={handleUpdate} />
            </div>
            <div className="mt-6">
              <ProfileImageUploader
                initialImage={profile.image ?? null}
                onImageUploaded={(imageUrl) => {
                  setProfile((current) =>
                    current ? { ...current, image: imageUrl || null } : current
                  )
                }}
              />
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              Change password
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Use a strong password that you do not use elsewhere.
            </p>
            <div className="mt-6">
              <PasswordForm />
            </div>
          </section>
        </>
      ) : null}

      {status === "ready" && !profile ? (
        <EmptyState
          title="Profile unavailable"
          description="We couldn't find your profile information."
        />
      ) : null}
    </div>
  )
}
