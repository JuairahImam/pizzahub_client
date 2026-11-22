"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { Camera, Loader2, Upload, User, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { useToastContext } from "@/lib/toast/context"
import { ApiError, apiUpload } from "@/lib/api/client"
import { ENDPOINTS } from "@/lib/api/endpoints"
import { cn } from "@/lib/utils"

const FALLBACK_IMAGE = "/images/hero-pizza.jpg"
const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"])

type ProfileImageUploaderProps = {
  initialImage?: string | null
  onImageUploaded?: (imageUrl: string) => void
  onUploadError?: (message: string) => void
}

export function ProfileImageUploader({
  initialImage = null,
  onImageUploaded,
  onUploadError,
}: ProfileImageUploaderProps) {
  const { accessToken } = useAuth()
  const toast = useToastContext()
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialImage ?? null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const previewRef = useRef<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPreviewUrl(initialImage ?? null)
  }, [initialImage])

  useEffect(() => {
    return () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current)
    }
  }, [])

  function handleSelectFile(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0] ?? null
    if (previewRef.current) {
      URL.revokeObjectURL(previewRef.current)
      previewRef.current = null
    }

    if (!selected) {
      setFile(null)
      setPreviewUrl(initialImage ?? null)
      setError(null)
      return
    }

    if (!allowedTypes.has(selected.type)) {
      setError("Only JPG, JPEG, PNG and WEBP images are allowed.")
      setFile(null)
      setPreviewUrl(initialImage ?? null)
      return
    }

    if (selected.size > 5 * 1024 * 1024) {
      setError("Image size must not exceed 5 MB.")
      setFile(null)
      setPreviewUrl(initialImage ?? null)
      return
    }

    setFile(selected)
    const objectUrl = URL.createObjectURL(selected)
    previewRef.current = objectUrl
    setPreviewUrl(objectUrl)
    setError(null)
  }

  async function handleUpload() {
    if (!file || !accessToken || uploading) return

    setUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("image", file)

      const response = await apiUpload<{
        success: boolean
        user: { image?: string | null }
        image?: { imageUrl?: string }
      }>(ENDPOINTS.profileImage, formData, accessToken)

      const imageUrl =
        response?.user?.image ?? response?.image?.imageUrl ?? null

      if (!imageUrl) {
        setError("Received an unexpected response from the server.")
        onUploadError?.("Received an unexpected response from the server.")
        return
      }

      setPreviewUrl(imageUrl)
      toast.success("Profile image uploaded.")
      onImageUploaded?.(imageUrl)
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Failed to upload profile image. Please try again."
      setError(message)
      toast.error(message)
      onUploadError?.(message)
    } finally {
      setUploading(false)
    }
  }

  function handleRemoveImage() {
    setFile(null)
    setPreviewUrl(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    onImageUploaded?.("")
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5 sm:p-6">
      <div className="flex items-center gap-4">
        <div className="relative size-20 shrink-0 overflow-hidden rounded-full border-2 border-primary/20 bg-muted">
          <Image
            src={previewUrl || FALLBACK_IMAGE}
            alt="Profile image preview"
            fill
            className="object-cover"
          />
          {!previewUrl ? (
            <div className="absolute inset-0 grid place-items-center bg-muted/70 text-muted-foreground">
              <User className="size-6" aria-hidden="true" />
            </div>
          ) : null}
        </div>

        <div className="min-w-0 space-y-2">
          <label className="text-sm font-medium text-foreground">Profile image</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleSelectFile}
            className="sr-only"
            aria-label="Choose profile image"
          />
          <p className="text-xs text-muted-foreground">
            JPG, PNG, or WEBP · up to 5 MB
          </p>
          {error ? (
            <p role="alert" className="text-xs text-destructive">
              {error}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="h-9 rounded-[8px] px-3"
            >
              <Camera className="size-4" aria-hidden="true" />
              Choose image
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleUpload}
              disabled={!file || !accessToken || uploading}
              className="h-9 rounded-[8px] px-3"
            >
              {uploading ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Upload className="size-4" aria-hidden="true" />
              )}
              {uploading ? "Uploading..." : "Upload image"}
            </Button>
            {previewUrl && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={handleRemoveImage}
                disabled={uploading}
                className={cn(
                  "h-9 rounded-[8px] px-3 text-destructive hover:bg-destructive/10 hover:text-destructive"
                )}
              >
                <X className="size-4" aria-hidden="true" />
                Remove
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
