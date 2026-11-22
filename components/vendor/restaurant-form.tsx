"use client"

import { AlertCircle, Loader2, Save } from "lucide-react"
import { useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { RestaurantInput } from "@/types/restaurant"

type RestaurantFormMode = "create" | "edit"

type RestaurantFormProps = {
  mode: RestaurantFormMode
  initialValues?: RestaurantInput
  onSubmit: (values: RestaurantInput) => Promise<string | null>
  onCancel: () => void
}

type FieldName = keyof RestaurantInput
type FieldErrors = Partial<Record<FieldName, string>>

const EMPTY_VALUES: RestaurantInput = {
  name: "",
  description: "",
  address: "",
  phone: "",
}

const FIELD_ORDER: FieldName[] = ["name", "description", "address", "phone"]

const FIELD_LABELS: Record<FieldName, string> = {
  name: "Restaurant name",
  description: "Description",
  address: "Address",
  phone: "Phone number",
}

const controlClassName =
  "w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 disabled:cursor-not-allowed disabled:opacity-60"

export function RestaurantForm({
  mode,
  initialValues,
  onSubmit,
  onCancel,
}: RestaurantFormProps) {
  const isEdit = mode === "edit"
  const [values, setValues] = useState<RestaurantInput>(
    initialValues ?? EMPTY_VALUES
  )
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const submittingRef = useRef(false)
  const formRef = useRef<HTMLFormElement>(null)

  const hasChanges =
    !initialValues ||
    FIELD_ORDER.some(
      (field) => values[field].trim() !== initialValues[field].trim()
    )

  function updateField(field: FieldName, value: string) {
    setValues((current) => ({ ...current, [field]: value }))

    setFieldErrors((current) => {
      if (!current[field]) return current
      const next = { ...current }
      delete next[field]
      return next
    })

    if (formError) setFormError(null)
  }

  function focusFirstInvalidField(errors: FieldErrors) {
    const firstInvalidField = FIELD_ORDER.find((field) => errors[field])
    if (!firstInvalidField) return

    window.requestAnimationFrame(() => {
      formRef.current
        ?.querySelector<HTMLElement>(`[name="${firstInvalidField}"]`)
        ?.focus()
    })
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (submittingRef.current) return

    setFormError(null)

    const nextErrors: FieldErrors = {}

    for (const field of FIELD_ORDER) {
      if (!values[field].trim()) {
        nextErrors[field] = `${FIELD_LABELS[field]} is required.`
      }
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors)
      focusFirstInvalidField(nextErrors)
      return
    }

    if (isEdit && !hasChanges) {
      setFormError("Edit at least one field before saving.")
      return
    }

    setFieldErrors({})
    submittingRef.current = true
    setSubmitting(true)

    try {
      const errorMessage = await onSubmit({
        name: values.name.trim(),
        description: values.description.trim(),
        address: values.address.trim(),
        phone: values.phone.trim(),
      })

      if (errorMessage) setFormError(errorMessage)
    } catch {
      setFormError("Something went wrong. Please try again.")
    } finally {
      submittingRef.current = false
      setSubmitting(false)
    }
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      noValidate
      aria-busy={submitting}
      className="space-y-5"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField
          field="name"
          label="Restaurant name"
          value={values.name}
          error={fieldErrors.name}
          autoComplete="organization"
          autoFocus
          placeholder="e.g. PizzaHub Dhanmondi"
          className="sm:col-span-2"
          onChange={(value) => updateField("name", value)}
        />

        <FormField
          field="description"
          label="Description"
          value={values.description}
          error={fieldErrors.description}
          placeholder="Tell customers what makes your restaurant special."
          multiline
          rows={4}
          className="sm:col-span-2"
          onChange={(value) => updateField("description", value)}
        />

        <FormField
          field="address"
          label="Address"
          value={values.address}
          error={fieldErrors.address}
          autoComplete="street-address"
          placeholder="Street, area, city"
          multiline
          rows={2}
          onChange={(value) => updateField("address", value)}
        />

        <FormField
          field="phone"
          label="Phone number"
          value={values.phone}
          error={fieldErrors.phone}
          type="tel"
          autoComplete="tel"
          inputMode="tel"
          placeholder="e.g. 01700000000"
          onChange={(value) => updateField("phone", value)}
        />
      </div>

      {formError ? (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <p>{formError}</p>
        </div>
      ) : null}

      <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          {isEdit && !hasChanges
            ? "No changes to save yet."
            : "All fields are required."}
        </p>

        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={onCancel}
            disabled={submitting}
            className="h-11 rounded-[10px] px-5"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            size="lg"
            disabled={submitting || (isEdit && !hasChanges)}
            className="h-11 rounded-[10px] px-5"
          >
            {submitting ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Save className="size-4" aria-hidden />
            )}
            {submitting
              ? isEdit
                ? "Saving..."
                : "Creating..."
              : isEdit
                ? "Save changes"
                : "Create restaurant"}
          </Button>
        </div>
      </div>
    </form>
  )
}

type FormFieldProps = {
  field: FieldName
  label: string
  value: string
  error?: string
  type?: "text" | "tel"
  autoComplete?: string
  inputMode?: "tel"
  placeholder?: string
  multiline?: boolean
  rows?: number
  autoFocus?: boolean
  className?: string
  onChange: (value: string) => void
}

function FormField({
  field,
  label,
  value,
  error,
  type = "text",
  autoComplete,
  inputMode,
  placeholder,
  multiline = false,
  rows,
  autoFocus,
  className,
  onChange,
}: FormFieldProps) {
  const id = `restaurant-${field}`
  const errorId = `${id}-error`

  return (
    <div className={cn("space-y-2", className)}>
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
        <span className="ml-1 text-destructive" aria-hidden="true">
          *
        </span>
      </label>

      {multiline ? (
        <textarea
          id={id}
          name={field}
          value={value}
          required
          rows={rows}
          autoComplete={autoComplete}
          placeholder={placeholder}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          onChange={(event) => onChange(event.target.value)}
          className={cn(controlClassName, "min-h-20 py-2.5")}
        />
      ) : (
        <input
          id={id}
          name={field}
          type={type}
          value={value}
          required
          autoFocus={autoFocus}
          autoComplete={autoComplete}
          inputMode={inputMode}
          placeholder={placeholder}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          onChange={(event) => onChange(event.target.value)}
          className={cn(controlClassName, "h-11")}
        />
      )}

      {error ? (
        <p id={errorId} className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}
