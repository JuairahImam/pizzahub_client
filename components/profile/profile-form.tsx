"use client"

import { Loader2, Save } from "lucide-react"
import { useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import type { UserProfile } from "@/types/profile"

type ProfileFormProps = {
  initialValues: UserProfile
  onSubmit: (name: string) => Promise<string | null>
}

export function ProfileForm({ initialValues, onSubmit }: ProfileFormProps) {
  const [name, setName] = useState(initialValues.name)
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const submittingRef = useRef(false)

  const hasChanges = name.trim() !== initialValues.name.trim()

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (submittingRef.current) return

    setFormError(null)

    if (!name.trim()) {
      setFieldError("Name is required.")
      return
    }

    setFieldError(null)
    submittingRef.current = true
    setSubmitting(true)

    try {
      const errorMessage = await onSubmit(name.trim())
      if (errorMessage) setFormError(errorMessage)
    } catch {
      setFormError("Something went wrong. Please try again.")
    } finally {
      submittingRef.current = false
      setSubmitting(false)
    }
  }

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

      <div className="space-y-2">
        <label htmlFor="profile-name" className="text-sm font-medium text-foreground">
          Name
        </label>
        <input
          id="profile-name"
          type="text"
          value={name}
          onChange={(event) => {
            setName(event.target.value)
            if (fieldError) setFieldError(null)
            if (formError) setFormError(null)
          }}
          disabled={submitting}
          aria-invalid={Boolean(fieldError)}
          aria-describedby={fieldError ? "profile-name-error" : undefined}
          className="w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 disabled:cursor-not-allowed disabled:opacity-60"
        />
        {fieldError ? (
          <p id="profile-name-error" role="alert" className="text-sm text-destructive">
            {fieldError}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label htmlFor="profile-email" className="text-sm font-medium text-foreground">
          Email
        </label>
        <input
          id="profile-email"
          type="email"
          value={initialValues.email}
          readOnly
          className="w-full cursor-not-allowed rounded-lg border border-border bg-muted px-3 text-sm text-muted-foreground"
        />
        <p className="text-xs text-muted-foreground">
          Email is read-only and cannot be changed from this page.
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="profile-role" className="text-sm font-medium text-foreground">
          Role
        </label>
        <input
          id="profile-role"
          type="text"
          value={initialValues.role}
          readOnly
          className="w-full cursor-not-allowed rounded-lg border border-border bg-muted px-3 text-sm text-muted-foreground"
        />
      </div>

      <div className="flex justify-end border-t border-border pt-5">
        <Button
          type="submit"
          size="lg"
          disabled={submitting || !hasChanges}
          className="h-11 rounded-[10px] px-5"
        >
          {submitting ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Saving...
            </>
          ) : (
            <>
              <Save className="size-4" aria-hidden />
              Save changes
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
