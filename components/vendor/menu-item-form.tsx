"use client"

import { Loader2, Save } from "lucide-react"
import { useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type FormMode = "create" | "edit"

type FormValues = {
  name: string
  description: string
  category: string
  location: string
  price: string
  isAvailable: boolean
}

type MenuItemFormProps = {
  mode: FormMode
  initialValues?: FormValues & { imageUrl?: string; images?: string[] }
  onSubmit: (values: FormValues, imageFiles: File[]) => Promise<string | null>
  onCancel: () => void
}

type FieldName = keyof FormValues
type FieldErrors = Partial<Record<FieldName | "image", string>>

const EMPTY_VALUES: FormValues = {
  name: "",
  description: "",
  category: "",
  location: "",
  price: "",
  isAvailable: true,
}

const FIELD_ORDER: (FieldName | "image")[] = [
  "name",
  "description",
  "category",
  "location",
  "price",
  "image",
]

const FIELD_LABELS: Record<FieldName, string> = {
  name: "Item name",
  description: "Description",
  category: "Category",
  location: "Location (area / city)",
  price: "Price",
  isAvailable: "Availability",
}

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
]

const MAX_IMAGE_SIZE = 5 * 1024 * 1024

const controlClassName =
  "w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 disabled:cursor-not-allowed disabled:opacity-60"

export function MenuItemForm({
  mode,
  initialValues,
  onSubmit,
  onCancel,
}: MenuItemFormProps) {
  const isEdit = mode === "edit"
  const [values, setValues] = useState<FormValues>(
    initialValues
      ? {
          name: initialValues.name,
          description: initialValues.description,
          category: initialValues.category,
          location: initialValues.location,
          price: initialValues.price,
          isAvailable: initialValues.isAvailable,
        }
      : EMPTY_VALUES
  )
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>(
    initialValues?.images?.length
      ? initialValues.images
      : initialValues?.imageUrl
        ? [initialValues.imageUrl]
        : []
  )
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const submittingRef = useRef(false)
  const formRef = useRef<HTMLFormElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const hasChanges =
    !initialValues ||
    values.name.trim() !== (initialValues.name ?? "").trim() ||
    values.description.trim() !== (initialValues.description ?? "").trim() ||
    values.category.trim() !== (initialValues.category ?? "").trim() ||
    values.location.trim() !== (initialValues.location ?? "").trim() ||
    values.price.trim() !== (initialValues.price ?? "").trim() ||
    values.isAvailable !== (initialValues.isAvailable ?? true) ||
    selectedFiles.length > 0

  function updateField(field: FieldName, value: string | boolean) {
    setValues((current) => ({ ...current, [field]: value }))

    setFieldErrors((current) => {
      if (!current[field]) return current
      const next = { ...current }
      delete next[field]
      return next
    })

    if (formError) setFormError(null)
  }

  function releasePreviewUrls(urls: string[]) {
    urls.forEach((url) => {
      if (url.startsWith("blob:")) URL.revokeObjectURL(url)
    })
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])

    setFieldErrors((current) => {
      if (!current.image) return current
      const next = { ...current }
      delete next.image
      return next
    })

    if (files.length === 0) {
      setSelectedFiles([])
      setPreviewUrls(initialValues?.images ?? [])
      return
    }

    if (files.length > 5) {
      setFieldErrors((current) => ({
        ...current,
        image: "Select up to 5 images.",
      }))
      setSelectedFiles([])
      if (fileInputRef.current) fileInputRef.current.value = ""
      return
    }

    if (files.some((file) => !ALLOWED_IMAGE_TYPES.includes(file.type))) {
      setFieldErrors((current) => ({
        ...current,
        image: "Only JPG, JPEG, PNG, and WEBP images are allowed.",
      }))
      setSelectedFiles([])
      if (fileInputRef.current) fileInputRef.current.value = ""
      return
    }

    if (files.some((file) => file.size > MAX_IMAGE_SIZE)) {
      setFieldErrors((current) => ({
        ...current,
        image: "Each image must not exceed 5 MB.",
      }))
      setSelectedFiles([])
      if (fileInputRef.current) fileInputRef.current.value = ""
      return
    }

    releasePreviewUrls(previewUrls)
    setSelectedFiles(files)
    setPreviewUrls(files.map((file) => URL.createObjectURL(file)))
    if (formError) setFormError(null)
  }

  function clearSelectedImage() {
    releasePreviewUrls(previewUrls)
    setSelectedFiles([])
    setPreviewUrls(initialValues?.images ?? [])

    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  function focusFirstInvalidField(errors: FieldErrors) {
    const firstInvalidField = FIELD_ORDER.find((field) => errors[field])
    if (!firstInvalidField) return

    window.requestAnimationFrame(() => {
      if (firstInvalidField === "image") {
        fileInputRef.current?.focus()
        return
      }

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

    if (!values.name.trim()) {
      nextErrors.name = "Item name is required."
    }

    if (!values.description.trim()) {
      nextErrors.description = "Description is required."
    }

    if (!values.category.trim()) {
      nextErrors.category = "Category is required."
    }

    if (!values.location.trim()) {
      nextErrors.location = "Location (area / city) is required."
    }

    const priceValue = Number(values.price)
    if (!values.price.trim() || !Number.isFinite(priceValue) || priceValue <= 0) {
      nextErrors.price = "Price must be a positive number."
    }

    const hasImage = selectedFiles.length > 0 || Boolean(initialValues?.imageUrl)
    if (mode === "create" && !hasImage) {
      nextErrors.image = "Please select an image to upload."
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
      const errorMessage = await onSubmit(
        {
          name: values.name.trim(),
          description: values.description.trim(),
          category: values.category.trim(),
          location: values.location.trim(),
          price: values.price.trim(),
          isAvailable: values.isAvailable,
        },
        selectedFiles
      )

      if (errorMessage) {
        setFormError(errorMessage)
      }
    } catch {
      setFormError("Something went wrong. Please try again.")
    } finally {
      submittingRef.current = false
      setSubmitting(false)
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-5" noValidate>
      {formError ? (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {formError}
        </div>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <label
            htmlFor="menu-item-name"
            className="text-sm font-medium text-foreground"
          >
            {FIELD_LABELS.name}
          </label>
          <input
            id="menu-item-name"
            name="name"
            type="text"
            value={values.name}
            onChange={(event) => updateField("name", event.target.value)}
            disabled={submitting}
            aria-invalid={Boolean(fieldErrors.name)}
            aria-describedby={fieldErrors.name ? "menu-item-name-error" : undefined}
            className={controlClassName}
            placeholder="Chicken BBQ Pizza"
          />
          {fieldErrors.name ? (
            <p
              id="menu-item-name-error"
              role="alert"
              className="text-sm text-destructive"
            >
              {fieldErrors.name}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="menu-item-category"
            className="text-sm font-medium text-foreground"
          >
            {FIELD_LABELS.category}
          </label>
          <input
            id="menu-item-category"
            name="category"
            type="text"
            value={values.category}
            onChange={(event) => updateField("category", event.target.value)}
            disabled={submitting}
            aria-invalid={Boolean(fieldErrors.category)}
            aria-describedby={
              fieldErrors.category ? "menu-item-category-error" : undefined
            }
            className={controlClassName}
            placeholder="Pizza"
          />
          {fieldErrors.category ? (
            <p
              id="menu-item-category-error"
              role="alert"
              className="text-sm text-destructive"
            >
              {fieldErrors.category}
            </p>
          ) : null}
        </div>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="menu-item-description"
          className="text-sm font-medium text-foreground"
        >
          {FIELD_LABELS.description}
        </label>
        <textarea
          id="menu-item-description"
          name="description"
          value={values.description}
          onChange={(event) => updateField("description", event.target.value)}
          disabled={submitting}
          rows={4}
          aria-invalid={Boolean(fieldErrors.description)}
          aria-describedby={
            fieldErrors.description ? "menu-item-description-error" : undefined
          }
          className={cn(controlClassName, "min-h-24 resize-y py-2")}
          placeholder="Describe the item, ingredients, and serving size."
        />
        {fieldErrors.description ? (
          <p
            id="menu-item-description-error"
            role="alert"
            className="text-sm text-destructive"
          >
            {fieldErrors.description}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label
          htmlFor="menu-item-location"
          className="text-sm font-medium text-foreground"
        >
          {FIELD_LABELS.location}
        </label>
        <input
          id="menu-item-location"
          name="location"
          type="text"
          value={values.location}
          onChange={(event) => updateField("location", event.target.value)}
          disabled={submitting}
          aria-invalid={Boolean(fieldErrors.location)}
          aria-describedby={
            fieldErrors.location ? "menu-item-location-error" : undefined
          }
          className={controlClassName}
          placeholder="Dhanmondi, Dhaka"
        />
        {fieldErrors.location ? (
          <p
            id="menu-item-location-error"
            role="alert"
            className="text-sm text-destructive"
          >
            {fieldErrors.location}
          </p>
        ) : null}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <label
            htmlFor="menu-item-price"
            className="text-sm font-medium text-foreground"
          >
            {FIELD_LABELS.price}
          </label>
          <input
            id="menu-item-price"
            name="price"
            type="number"
            min="0.01"
            step="0.01"
            value={values.price}
            onChange={(event) => updateField("price", event.target.value)}
            disabled={submitting}
            aria-invalid={Boolean(fieldErrors.price)}
            aria-describedby={
              fieldErrors.price ? "menu-item-price-error" : undefined
            }
            className={controlClassName}
            placeholder="650"
          />
          {fieldErrors.price ? (
            <p
              id="menu-item-price-error"
              role="alert"
              className="text-sm text-destructive"
            >
              {fieldErrors.price}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <span className="text-sm font-medium text-foreground">
            {FIELD_LABELS.isAvailable}
          </span>
          <label className="flex h-10 items-center gap-3 rounded-lg border border-border bg-background px-3 text-sm text-foreground">
            <input
              type="checkbox"
              checked={values.isAvailable}
              onChange={(event) =>
                updateField("isAvailable", event.target.checked)
              }
              disabled={submitting}
              className="size-4 rounded border-border text-primary focus-visible:ring-2 focus-visible:ring-ring"
            />
            <span>
              {values.isAvailable ? "Available to customers" : "Hidden from customers"}
            </span>
          </label>
        </div>
      </div>

      <div className="space-y-3">
        <span className="text-sm font-medium text-foreground">Item images</span>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-border bg-muted sm:w-48">
            {previewUrls[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrls[0]}
                alt="Menu item preview"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No image selected
              </div>
            )}
          </div>

          <div className="flex-1 space-y-3">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              disabled={submitting}
              aria-invalid={Boolean(fieldErrors.image)}
              aria-describedby={
                fieldErrors.image ? "menu-item-image-error" : undefined
              }
              className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary-hover"
            />

            {selectedFiles.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="truncate">
                  {selectedFiles.length} image
                  {selectedFiles.length === 1 ? "" : "s"} selected
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={clearSelectedImage}
                  disabled={submitting}
                  className="h-8 rounded-[8px] px-2"
                >
                  Remove
                </Button>
              </div>
            ) : null}

            <p className="text-xs leading-relaxed text-muted-foreground">
              Up to 5 images. JPG, PNG, or WEBP, maximum 5 MB each. The first
              image is the cover; all images are uploaded to ImgBB before the
              menu item is saved.
            </p>

            {fieldErrors.image ? (
              <p
                id="menu-item-image-error"
                role="alert"
                className="text-sm text-destructive"
              >
                {fieldErrors.image}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end">
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
          disabled={
            submitting ||
            (isEdit && !hasChanges)
          }
          className="h-11 rounded-[10px] px-5"
        >
          {submitting ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              {mode === "create" ? "Creating..." : "Saving..."}
            </>
          ) : (
            <>
              <Save className="size-4" aria-hidden />
              {mode === "create" ? "Create item" : "Save changes"}
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
