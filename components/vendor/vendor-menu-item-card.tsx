"use client"

import Image from "next/image"
import { Loader2, Pencil, Trash2 } from "lucide-react"
import { useState } from "react"

import { Price } from "@/components/price"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { VendorMenuItem } from "@/types/vendor-menu"

const FALLBACK_IMAGE = "/images/hero-pizza.jpg"

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Date unavailable"
  return date.toLocaleString("en-BD", {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

type VendorMenuItemCardProps = {
  item: VendorMenuItem
  onEdit: (item: VendorMenuItem) => void
  onDelete: (id: string) => Promise<void>
}

export function VendorMenuItemCard({
  item,
  onEdit,
  onDelete,
}: VendorMenuItemCardProps) {
  const [src, setSrc] = useState(item.imageUrl || FALLBACK_IMAGE)
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  async function handleDelete() {
    if (deleting) return

    setDeleting(true)
    setDeleteError(null)

    try {
      await onDelete(item._id)
    } catch (error) {
      setDeleteError(
        error instanceof Error
          ? error.message
          : "Failed to delete menu item."
      )
      setDeleting(false)
    }
  }

  return (
    <article className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <Image
          src={src}
          alt={item.name}
          fill
          sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover"
          onError={() => setSrc(FALLBACK_IMAGE)}
        />
        <span
          className={cn(
            "absolute top-3 left-3 rounded-full px-2.5 py-1 text-xs font-medium",
            item.isAvailable
              ? "bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-200"
              : "bg-muted text-muted-foreground"
          )}
        >
          {item.isAvailable ? "Available" : "Unavailable"}
        </span>
        <span className="absolute top-3 right-3 rounded-full bg-card/90 px-2.5 py-1 text-xs font-medium text-foreground backdrop-blur">
          {item.category}
        </span>
      </div>

      <div className="space-y-4 p-5">
        <div className="space-y-1.5">
          <h3 className="text-lg font-semibold tracking-tight text-foreground">
            {item.name}
          </h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {item.description}
          </p>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
          <Price value={item.price} />
          <p className="text-xs text-muted-foreground">
            Added {formatDate(item.createdAt)}
          </p>
        </div>

        {deleteError ? (
          <p role="alert" className="text-sm text-destructive">
            {deleteError}
          </p>
        ) : null}

        {confirming ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
            <p className="text-sm font-medium text-foreground">
              Delete this menu item permanently?
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              This cannot be undone. Existing orders will keep their saved item
              details.
            </p>
            <div className="mt-3 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setConfirming(false)}
                disabled={deleting}
                className="h-9 rounded-[8px] px-3"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={deleting}
                className="h-9 rounded-[8px] px-3"
              >
                {deleting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="size-4" aria-hidden />
                    Delete
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onEdit(item)}
              className="h-9 rounded-[8px] px-3"
            >
              <Pencil className="size-4" aria-hidden />
              Edit
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setDeleteError(null)
                setConfirming(true)
              }}
              className="h-9 rounded-[8px] px-3 text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="size-4" aria-hidden />
              Delete
            </Button>
          </div>
        )}
      </div>
    </article>
  )
}
