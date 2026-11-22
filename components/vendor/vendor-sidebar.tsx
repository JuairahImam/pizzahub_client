"use client"

import {
  ArrowLeft,
  ChefHat,
  CreditCard,
  LayoutDashboard,
  Menu as MenuIcon,
  Package,
  Pizza,
  UtensilsCrossed,
  X,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useRef, useState } from "react"

import { cn } from "@/lib/utils"

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"

type NavItem = {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>
  enabled: boolean
}

const NAV_ITEMS: NavItem[] = [
  { label: "Overview", href: "/vendor", icon: LayoutDashboard, enabled: true },
  {
    label: "Restaurant",
    href: "/vendor/restaurant",
    icon: ChefHat,
    enabled: true,
  },
  {
    label: "Menu",
    href: "/vendor/menu",
    icon: UtensilsCrossed,
    enabled: false,
  },
  { label: "Orders", href: "/vendor/orders", icon: Package, enabled: false },
  {
    label: "Premium",
    href: "/vendor/premium",
    icon: CreditCard,
    enabled: false,
  },
]

function SidebarContent({
  onNavigate,
  mobile = false,
}: {
  onNavigate?: () => void
  mobile?: boolean
}) {
  const pathname = usePathname()

  return (
    <nav aria-label={mobile ? "Vendor dashboard mobile" : "Vendor dashboard"}>
      <p className="px-3 text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase">
        Manage
      </p>
      <ul className="mt-2 space-y-1">
        {NAV_ITEMS.map(({ label, href, icon: Icon, enabled }) => {
          const active = enabled && pathname === href

          return (
            <li key={label}>
              {enabled ? (
                <Link
                  href={href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    focusRing,
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-secondary hover:text-primary"
                  )}
                >
                  <Icon className="size-4 shrink-0" aria-hidden />
                  {label}
                </Link>
              ) : (
                <span
                  aria-disabled="true"
                  title={`${label} is coming soon`}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground"
                >
                  <Icon className="size-4 shrink-0" aria-hidden />
                  <span className="min-w-0 truncate">{label}</span>
                  <span className="ml-auto shrink-0 rounded-full border border-border bg-secondary px-2 py-0.5 text-[10px] font-medium tracking-wide text-muted-foreground">
                    Coming soon
                  </span>
                </span>
              )}
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

function Brand() {
  return (
    <Link
      href="/vendor"
      aria-label="PizzaHub vendor dashboard"
      className={cn(
        "inline-flex items-center gap-2.5 rounded-lg py-1",
        focusRing
      )}
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
        <Pizza className="size-5" aria-hidden />
      </span>
      <span className="flex flex-col leading-none">
        <span className="text-base font-semibold tracking-tight text-primary">
          PizzaHub
        </span>
        <span className="mt-1 text-[10px] font-medium tracking-[0.18em] text-muted-foreground uppercase">
          Vendor
        </span>
      </span>
    </Link>
  )
}

function StorefrontLink({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <Link
      href="/"
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-primary",
        focusRing
      )}
    >
      <ArrowLeft className="size-4" aria-hidden />
      Back to storefront
    </Link>
  )
}

export function VendorSidebar() {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    const trigger = triggerRef.current
    const previousActive =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null
    const previousOverflow = document.body.style.overflow

    document.body.style.overflow = "hidden"
    closeRef.current?.focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault()
        setOpen(false)
        return
      }

      if (event.key !== "Tab" || !panelRef.current) return

      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      )

      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = previousOverflow

      if (previousActive?.isConnected) {
        previousActive.focus()
      } else {
        trigger?.focus()
      }
    }
  }, [open])

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-border bg-card md:flex">
        <div className="flex h-16 items-center border-b border-border px-5">
          <Brand />
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-5">
          <SidebarContent />
        </div>
        <div className="border-t border-border p-3">
          <StorefrontLink />
        </div>
      </aside>

      <div className="sticky top-0 z-40 border-b border-border bg-background md:hidden">
        <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
          <Brand />
          <button
            ref={triggerRef}
            type="button"
            onClick={() => setOpen(true)}
            aria-expanded={open}
            aria-controls="vendor-mobile-navigation"
            aria-label="Open dashboard navigation"
            className={cn(
              "inline-flex size-11 shrink-0 items-center justify-center rounded-lg border border-border text-foreground transition-colors hover:bg-secondary",
              focusRing
            )}
          >
            <MenuIcon className="size-5" aria-hidden />
          </button>
        </div>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div
            ref={panelRef}
            id="vendor-mobile-navigation"
            role="dialog"
            aria-modal="true"
            aria-labelledby="vendor-mobile-navigation-title"
            className="relative flex h-full w-72 max-w-[85vw] flex-col border-r border-border bg-card shadow-xl"
          >
            <div className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-border px-4">
              <p
                id="vendor-mobile-navigation-title"
                className="text-sm font-semibold tracking-tight text-foreground"
              >
                Vendor dashboard
              </p>
              <button
                ref={closeRef}
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close dashboard navigation"
                className={cn(
                  "inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-border text-foreground transition-colors hover:bg-secondary",
                  focusRing
                )}
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain px-3 py-5">
              <SidebarContent mobile onNavigate={() => setOpen(false)} />
            </div>

            <div className="border-t border-border p-3">
              <StorefrontLink onNavigate={() => setOpen(false)} />
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
