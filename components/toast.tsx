"use client"

import { CheckCircle2, Info, X, XCircle } from "lucide-react"

import { ToastProvider, useToastContext } from "@/lib/toast/context"
import type { ToastKind } from "@/lib/toast/types"
import type { Toast } from "@/lib/toast/types"

const iconByKind: Record<ToastKind, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: XCircle,
  warning: Info,
  info: Info,
}

const styleByKind: Record<ToastKind, string> = {
  success:
    "border-green-200 bg-green-50 text-green-900 dark:border-green-900/40 dark:bg-green-950/30 dark:text-green-100",
  error:
    "border-destructive/30 bg-destructive/10 text-destructive dark:border-destructive/40 dark:bg-destructive/10",
  warning:
    "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100",
  info:
    "border-border bg-card text-foreground",
}

function ToastItem({ toast }: { toast: Toast }) {
  const { remove } = useToastContext()
  const Icon = iconByKind[toast.kind]

  return (
    <div
      role={toast.kind === "error" ? "alert" : "status"}
      aria-live="polite"
      className={`group pointer-events-none flex w-full max-w-sm items-start gap-3 rounded-xl border px-4 py-3 shadow-lg sm:w-96 ${styleByKind[toast.kind]}`}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <p className="min-w-0 flex-1 text-sm leading-relaxed">{toast.message}</p>
      <button
        type="button"
        aria-label="Dismiss toast"
        onClick={() => remove(toast.id)}
        className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <X className="size-4" aria-hidden="true" />
      </button>
    </div>
  )
}

export function Toaster() {
  const { toasts } = useToastContext()

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[100] flex max-w-[calc(100%-2rem)] flex-col gap-3 sm:right-6 sm:top-5 lg:right-8">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  )
}

export { ToastProvider }
