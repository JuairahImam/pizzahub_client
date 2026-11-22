"use client"

import { Loader2, Save } from "lucide-react"
import { useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { changePassword } from "@/lib/auth/auth-client"

type PasswordFormProps = {
  onSuccess?: () => void
}

export function PasswordForm({ onSuccess }: PasswordFormProps) {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const submittingRef = useRef(false)

  function resetForm() {
    setCurrentPassword("")
    setNewPassword("")
    setConfirmPassword("")
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (submittingRef.current) return

    setFormError(null)
    setSuccessMessage(null)

    const nextErrors: Record<string, string> = {}

    if (!currentPassword) {
      nextErrors.currentPassword = "Current password is required."
    }

    if (newPassword.length < 8) {
      nextErrors.newPassword = "New password must be at least 8 characters."
    }

    if (newPassword !== confirmPassword) {
      nextErrors.confirmPassword = "Passwords do not match."
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors)
      return
    }

    setFieldErrors({})
    submittingRef.current = true
    setSubmitting(true)

    try {
      await changePassword(currentPassword, newPassword)
      setSuccessMessage("Password changed successfully.")
      resetForm()
      onSuccess?.()
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Failed to change password."
      )
    } finally {
      submittingRef.current = false
      setSubmitting(false)
    }
  }

  const controlClassName =
    "w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 disabled:cursor-not-allowed disabled:opacity-60"

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {formError ? (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {formError}
        </div>
      ) : null}

      {successMessage ? (
        <div
          role="status"
          className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-900 dark:border-green-900/40 dark:bg-green-950/30 dark:text-green-100"
        >
          {successMessage}
        </div>
      ) : null}

      <div className="space-y-2">
        <label htmlFor="current-password" className="text-sm font-medium text-foreground">
          Current password
        </label>
        <input
          id="current-password"
          type="password"
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
          disabled={submitting}
          aria-invalid={Boolean(fieldErrors.currentPassword)}
          aria-describedby={
            fieldErrors.currentPassword ? "current-password-error" : undefined
          }
          className={controlClassName}
        />
        {fieldErrors.currentPassword ? (
          <p id="current-password-error" role="alert" className="text-sm text-destructive">
            {fieldErrors.currentPassword}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label htmlFor="new-password" className="text-sm font-medium text-foreground">
          New password
        </label>
        <input
          id="new-password"
          type="password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          disabled={submitting}
          aria-invalid={Boolean(fieldErrors.newPassword)}
          aria-describedby={fieldErrors.newPassword ? "new-password-error" : undefined}
          className={controlClassName}
        />
        {fieldErrors.newPassword ? (
          <p id="new-password-error" role="alert" className="text-sm text-destructive">
            {fieldErrors.newPassword}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label htmlFor="confirm-password" className="text-sm font-medium text-foreground">
          Confirm new password
        </label>
        <input
          id="confirm-password"
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          disabled={submitting}
          aria-invalid={Boolean(fieldErrors.confirmPassword)}
          aria-describedby={
            fieldErrors.confirmPassword ? "confirm-password-error" : undefined
          }
          className={controlClassName}
        />
        {fieldErrors.confirmPassword ? (
          <p id="confirm-password-error" role="alert" className="text-sm text-destructive">
            {fieldErrors.confirmPassword}
          </p>
        ) : null}
      </div>

      <div className="flex justify-end border-t border-border pt-5">
        <Button type="submit" size="lg" disabled={submitting} className="h-11 rounded-[10px] px-5">
          {submitting ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Changing...
            </>
          ) : (
            <>
              <Save className="size-4" aria-hidden />
              Change password
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
