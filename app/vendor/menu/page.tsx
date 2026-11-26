"use client"

import { Plus } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import { EmptyState } from "@/components/empty-state"
import { ErrorState } from "@/components/error-state"
import { ProtectedRoute } from "@/components/protected-route"
import { Button, buttonVariants } from "@/components/ui/button"
import { MenuItemForm } from "@/components/vendor/menu-item-form"
import { VendorMenuItemCard } from "@/components/vendor/vendor-menu-item-card"
import { useAuth } from "@/hooks/use-auth"
import {
  ApiError,
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
  apiUpload,
} from "@/lib/api/client"
import { ENDPOINTS } from "@/lib/api/endpoints"
import { cn } from "@/lib/utils"
import type {
  ImageUploadResponse,
  UpdateVendorMenuItemInput,
  VendorMenuItem,
  VendorMenuItemFormValues,
  VendorMenuMutationResponse,
  VendorMenuResponse,
} from "@/types/vendor-menu"

type PageStatus = "loading" | "ready" | "forbidden" | "error"

type FormMode = "create" | "edit"

function getMutationErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    if (error.status === 401) {
      return "Your session expired. Please sign in again."
    }

    if (error.status === 403) {
      return error.message || "You don't have permission to manage menu items."
    }

    return error.message || fallback
  }

  return `${fallback} Please check your connection and try again.`
}

export default function VendorMenuPage() {
  return (
    <ProtectedRoute requiredRole="vendor">
      <VendorMenuContent />
    </ProtectedRoute>
  )
}

function VendorMenuContent() {
  const router = useRouter()
  const {
    loading: authLoading,
    isAuthenticated,
    accessToken,
    refreshSession,
  } = useAuth()

  const [status, setStatus] = useState<PageStatus>("loading")
  const [items, setItems] = useState<VendorMenuItem[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [forbiddenMessage, setForbiddenMessage] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)
  const [formMode, setFormMode] = useState<FormMode | null>(null)
  const [editingItem, setEditingItem] = useState<VendorMenuItem | null>(null)

  const sessionUnavailable =
    !authLoading && isAuthenticated && accessToken === null
  const visibleStatus: PageStatus = sessionUnavailable ? "error" : status
  const visibleErrorMessage = sessionUnavailable
    ? "We couldn't verify your session. Please sign in again."
    : errorMessage

  useEffect(() => {
    if (authLoading || !isAuthenticated || !accessToken) return

    let active = true

    apiGet<VendorMenuResponse>(ENDPOINTS.vendorMenuItems, undefined, accessToken)
      .then((response) => {
        if (!active) return

        if (!Array.isArray(response?.menuItems)) {
          setErrorMessage("Received an unexpected response from the server.")
          setStatus("error")
          return
        }

        setItems(response.menuItems)
        setStatus("ready")
      })
      .catch((error) => {
        if (!active) return

        if (error instanceof ApiError) {
          if (error.status === 401) {
            router.replace("/login")
            return
          }

          if (error.status === 403) {
            setForbiddenMessage(error.message || null)
            setStatus("forbidden")
            return
          }

          setErrorMessage(error.message || "Failed to load menu items.")
          setStatus("error")
          return
        }

        setErrorMessage("Failed to load menu items. Please try again.")
        setStatus("error")
      })

    return () => {
      active = false
    }
  }, [authLoading, isAuthenticated, accessToken, reloadToken, router])

  function handleRetry() {
    setStatus("loading")
    setErrorMessage(null)
    setForbiddenMessage(null)

    if (!accessToken) {
      void refreshSession()
    }

    setReloadToken((value) => value + 1)
  }

  function startCreate() {
    setNotice(null)
    setEditingItem(null)
    setFormMode("create")
  }

  function startEdit(item: VendorMenuItem) {
    setNotice(null)
    setEditingItem(item)
    setFormMode("edit")
  }

  function cancelForm() {
    setFormMode(null)
    setEditingItem(null)
  }

  async function handleCreate(
    values: VendorMenuItemFormValues,
    imageFiles: File[]
  ) {
    if (!accessToken) {
      return "We couldn't verify your session. Please sign in again."
    }

    if (imageFiles.length === 0) {
      return "Please select at least one image to upload."
    }

    try {
      const uploaded: { imageUrl: string; id: string }[] = []

      for (const file of imageFiles) {
        const formData = new FormData()
        formData.append("image", file)

        const uploadResponse = await apiUpload<ImageUploadResponse>(
          ENDPOINTS.vendorUploadImage,
          formData,
          accessToken
        )

        if (!uploadResponse?.image?.imageUrl || !uploadResponse.image.id) {
          return "Received an unexpected response from the image upload."
        }

        uploaded.push({
          imageUrl: uploadResponse.image.imageUrl,
          id: uploadResponse.image.id,
        })
      }

      const payload = {
        name: values.name,
        description: values.description,
        category: values.category,
        price: Number(values.price),
        imageUrl: uploaded[0].imageUrl,
        imageId: uploaded[0].id,
        images: uploaded.map((image) => image.imageUrl),
        isAvailable: values.isAvailable,
      }

      const response = await apiPost<VendorMenuMutationResponse>(
        ENDPOINTS.vendorMenuItems,
        payload,
        accessToken
      )

      if (!response?.menuItem) {
        return "Received an unexpected response from the server."
      }

      setItems((current) => [response.menuItem, ...current])
      setFormMode(null)
      setEditingItem(null)
      setNotice(response.message || "Menu item created successfully.")
      return null
    } catch (error) {
      return getMutationErrorMessage(error, "Failed to create menu item.")
    }
  }

  async function handleUpdate(
    values: VendorMenuItemFormValues,
    imageFiles: File[]
  ) {
    if (!accessToken || !editingItem) {
      return "We couldn't verify your session. Please sign in again."
    }

    const updates: UpdateVendorMenuItemInput = {}

    if (values.name !== editingItem.name) {
      updates.name = values.name
    }

    if (values.description !== editingItem.description) {
      updates.description = values.description
    }

    if (values.category !== editingItem.category) {
      updates.category = values.category
    }

    const nextPrice = Number(values.price)
    if (Number.isFinite(nextPrice) && nextPrice !== editingItem.price) {
      updates.price = nextPrice
    }

    if (values.isAvailable !== editingItem.isAvailable) {
      updates.isAvailable = values.isAvailable
    }

    try {
      if (imageFiles.length > 0) {
        const uploaded: { imageUrl: string; id: string }[] = []

        for (const file of imageFiles) {
          const formData = new FormData()
          formData.append("image", file)

          const uploadResponse = await apiUpload<ImageUploadResponse>(
            ENDPOINTS.vendorUploadImage,
            formData,
            accessToken
          )

          if (!uploadResponse?.image?.imageUrl || !uploadResponse.image.id) {
            return "Received an unexpected response from the image upload."
          }

          uploaded.push({
            imageUrl: uploadResponse.image.imageUrl,
            id: uploadResponse.image.id,
          })
        }

        updates.imageUrl = uploaded[0].imageUrl
        updates.imageId = uploaded[0].id
        updates.images = uploaded.map((image) => image.imageUrl)
      }

      if (Object.keys(updates).length === 0) {
        return "Edit at least one field before saving."
      }

      const response = await apiPatch<VendorMenuMutationResponse>(
        ENDPOINTS.vendorMenuItem(editingItem._id),
        updates,
        accessToken
      )

      if (!response?.menuItem) {
        return "Received an unexpected response from the server."
      }

      setItems((current) =>
        current.map((item) =>
          item._id === response.menuItem._id ? response.menuItem : item
        )
      )
      setFormMode(null)
      setEditingItem(null)

      const updateNotice =
        response.menuItem.approvalStatus === "PENDING"
          ? "Menu item updated successfully. Content changes require admin re-approval."
          : response.message || "Menu item updated successfully."

      setNotice(updateNotice)
      return null
    } catch (error) {
      return getMutationErrorMessage(error, "Failed to update menu item.")
    }
  }

  async function handleDelete(id: string) {
    if (!accessToken) {
      throw new ApiError("We couldn't verify your session. Please sign in again.", 401)
    }

    try {
      await apiDelete(ENDPOINTS.vendorMenuItem(id), accessToken)
      setItems((current) => current.filter((item) => item._id !== id))
      setNotice("Menu item deleted successfully.")
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        router.replace("/login")
      }
      throw error
    }
  }

  const formInitialValues:
    | (VendorMenuItemFormValues & { imageUrl?: string; images?: string[] })
    | undefined =
    editingItem
      ? {
          name: editingItem.name,
          description: editingItem.description,
          category: editingItem.category,
          price: String(editingItem.price),
          isAvailable: editingItem.isAvailable,
          imageUrl: editingItem.imageUrl,
          images: editingItem.images,
        }
      : undefined

  return (
    <div className="max-w-6xl space-y-6 sm:space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium tracking-[0.2em] text-primary uppercase">
            Vendor dashboard
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Menu
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Create and manage the menu items offered by your restaurant. Images
            are uploaded to ImgBB before the item is saved.
          </p>
        </div>

        {visibleStatus === "ready" && formMode === null ? (
          <Button
            id="menu-create-action"
            type="button"
            size="lg"
            onClick={startCreate}
            className="h-11 w-full rounded-[10px] px-5 sm:w-auto"
          >
            <Plus className="size-4" aria-hidden />
            Add menu item
          </Button>
        ) : null}
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

      {visibleStatus === "loading" ? <MenuSkeleton /> : null}

      {visibleStatus === "forbidden" ? (
        <div className="space-y-4">
          <EmptyState
            title="Access denied"
            description={
              forbiddenMessage
                ? `${forbiddenMessage} If you believe this is a mistake, contact support.`
                : "Your account does not have permission to manage menu items. Sign in with a vendor account or contact support if you believe this is a mistake."
            }
          />
          <div className="flex justify-center">
            <Link
              href="/"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "h-11 rounded-[10px] px-6"
              )}
            >
              Back to PizzaHub
            </Link>
          </div>
        </div>
      ) : null}

      {visibleStatus === "error" ? (
        <ErrorState
          title="Unable to load menu items"
          description={
            visibleErrorMessage ??
            "We couldn't load your menu items. Please try again."
          }
          onRetry={handleRetry}
        />
      ) : null}

      {visibleStatus === "ready" && formMode !== null ? (
        <section
          aria-labelledby="menu-form-heading"
          className="rounded-xl border border-border bg-card p-5 sm:p-6"
        >
          <div className="mb-6">
            <h2
              id="menu-form-heading"
              className="text-lg font-semibold tracking-tight text-foreground sm:text-xl"
            >
              {formMode === "edit" ? "Edit menu item" : "Create menu item"}
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {formMode === "edit"
                ? "Update the details below. Leave the image unchanged to keep the current photo."
                : "Add a new menu item. All fields are required, including an uploaded image."}
            </p>
          </div>

          <MenuItemForm
            mode={formMode}
            initialValues={formInitialValues}
            onSubmit={formMode === "edit" ? handleUpdate : handleCreate}
            onCancel={cancelForm}
          />
        </section>
      ) : null}

      {visibleStatus === "ready" &&
      items.length === 0 &&
      formMode === null ? (
        <EmptyState
          title="No menu items yet"
          description="Add your first menu item to make it available for customers."
        />
      ) : null}

      {visibleStatus === "ready" && items.length > 0 ? (
        <section aria-labelledby="menu-items-heading" className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2
              id="menu-items-heading"
              className="text-lg font-semibold tracking-tight text-foreground"
            >
              Your menu items
            </h2>
            <p className="text-xs text-muted-foreground">
              {items.length} item{items.length === 1 ? "" : "s"}
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <VendorMenuItemCard
                key={item._id}
                item={item}
                onEdit={startEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}

function MenuSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading menu items</span>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="h-80 animate-pulse rounded-xl border border-border bg-card"
          />
        ))}
      </div>
    </div>
  )
}
