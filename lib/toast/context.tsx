"use client"

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react"

import type { Toast, ToastContextValue, ToastKind } from "./types"

const ToastContext = createContext<ToastContextValue | null>(null)

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }

  return `toast-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const remove = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const toast = useCallback(
    (kind: ToastKind, message: string) => {
      const id = createId()

      setToasts((current) => [
        ...current.slice(-4),
        { id, kind, message },
      ])

      window.setTimeout(() => {
        setToasts((current) => current.filter((item) => item.id !== id))
      }, 4200)

      return id
    },
    []
  )

  const value: ToastContextValue = {
    toasts,
    toast,
    success: (message) => toast("success", message),
    error: (message) => toast("error", message),
    warning: (message) => toast("warning", message),
    info: (message) => toast("info", message),
    remove,
  }

  return (
    <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
  )
}

export function useToastContext() {
  const context = useContext(ToastContext)

  if (!context) {
    throw new Error("useToastContext must be used within a ToastProvider")
  }

  return context
}

export { ToastContext }
