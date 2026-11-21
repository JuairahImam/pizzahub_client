"use client"

import { useEffect, useRef, useState } from "react"
import { ChevronDown, LogOut, Menu, Pizza, ShoppingCart, User, X } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { ButtonLink } from "@/components/button-link"
import { siteNav } from "@/lib/navigation"
import { useAuth } from "@/hooks/use-auth"
import { useCart } from "@/hooks/use-cart"
import { cn } from "@/lib/utils"

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"

export function SiteHeader() {
  const router = useRouter()
  const { user, loading: authLoading, logout } = useAuth()
  const { totalItems } = useCart()
  const [isOpen, setIsOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isOpen])

  useEffect(() => {
    if (!userMenuOpen) return

    function handleMouseDown(event: MouseEvent) {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setUserMenuOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setUserMenuOpen(false)
      }
    }

    document.addEventListener("mousedown", handleMouseDown)
    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("mousedown", handleMouseDown)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [userMenuOpen])

  async function handleLogout() {
    setSigningOut(true)

    try {
      await logout()
      setUserMenuOpen(false)
      setIsOpen(false)
      router.push("/")
    } catch {
      // Keep the user informed by leaving the menu open.
    } finally {
      setSigningOut(false)
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:h-20 lg:px-8">
        <a
          href="#home"
          aria-label="PizzaHub home"
          className={cn(
            "inline-flex items-center gap-2.5 rounded-lg py-1",
            focusRing
          )}
        >
          <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Pizza className="size-5" aria-hidden="true" />
          </span>
          <span className="text-lg font-semibold tracking-tight text-primary">
            PizzaHub
          </span>
        </a>

        <nav aria-label="Primary" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {siteNav.map((link) => {
              const isActive = link.href === "#home"

              return (
                <li key={link.href}>
                  <a
                    href={link.href}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "block rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      focusRing,
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-secondary hover:text-primary"
                    )}
                  >
                    {link.label}
                  </a>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-flex">
            <ButtonLink
              href="#menu"
              size="lg"
              className="h-11 rounded-[10px] px-4"
            >
              Explore Menu
            </ButtonLink>
          </span>

          <div className="hidden items-center gap-2 sm:flex">
            {authLoading ? (
              <span className="h-9 w-24 animate-pulse rounded-lg bg-muted" />
            ) : user ? (
              <div ref={userMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setUserMenuOpen((value) => !value)}
                  aria-expanded={userMenuOpen}
                  aria-haspopup="menu"
                  className={cn(
                    "inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary",
                    focusRing
                  )}
                >
                  <User className="size-4" aria-hidden="true" />
                  <span className="max-w-28 truncate">{user.name}</span>
                  <ChevronDown className="size-4" aria-hidden="true" />
                </button>

                {userMenuOpen ? (
                  <div
                    role="menu"
                    className="absolute right-0 z-50 mt-2 w-44 rounded-lg border border-border bg-card p-1 shadow-md"
                  >
                    <Link
                      href="/orders"
                      role="menuitem"
                      onClick={() => setUserMenuOpen(false)}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary",
                        focusRing
                      )}
                    >
                      My Orders
                    </Link>
                    <button
                      type="button"
                      role="menuitem"
                      disabled={signingOut}
                      onClick={handleLogout}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary disabled:opacity-50",
                        focusRing
                      )}
                    >
                      <LogOut className="size-4" aria-hidden="true" />
                      {signingOut ? "Signing out..." : "Sign out"}
                    </button>
                  </div>
                ) : null}
              </div>
            ) : (
              <>
                <ButtonLink
                  href="/login"
                  variant="ghost"
                  size="sm"
                  className="h-9 px-3"
                >
                  Sign in
                </ButtonLink>
                <ButtonLink
                  href="/register"
                  variant="outline"
                  size="sm"
                  className="h-9 px-3"
                >
                  Create account
                </ButtonLink>
              </>
            )}
          </div>

          <a
            href="/cart"
            aria-label={`Cart with ${totalItems} item${totalItems === 1 ? "" : "s"}`}
            className={cn(
              "relative inline-flex size-11 items-center justify-center rounded-lg border border-border text-foreground transition-colors hover:bg-secondary",
              focusRing
            )}
          >
            <ShoppingCart className="size-5" aria-hidden="true" />
            {totalItems > 0 ? (
              <span className="absolute -top-1 -right-1 grid min-w-5 place-items-center rounded-full bg-primary px-1 text-xs font-medium text-primary-foreground">
                {totalItems}
              </span>
            ) : null}
          </a>

          <button
            type="button"
            aria-expanded={isOpen}
            aria-controls="mobile-navigation"
            aria-label={
              isOpen ? "Close navigation menu" : "Open navigation menu"
            }
            onClick={() => setIsOpen((open) => !open)}
            className={cn(
              "inline-flex size-11 items-center justify-center rounded-lg border border-border text-foreground transition-colors hover:bg-secondary md:hidden",
              focusRing
            )}
          >
            {isOpen ? (
              <X className="size-5" aria-hidden="true" />
            ) : (
              <Menu className="size-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      <nav
        id="mobile-navigation"
        aria-label="Mobile"
        hidden={!isOpen}
        className="absolute inset-x-0 top-full max-h-[calc(100dvh-4rem)] overflow-y-auto overscroll-contain border-b border-border bg-background shadow-sm md:hidden"
      >
        <ul className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-4 sm:px-6">
          {siteNav.map((link) => {
            const isActive = link.href === "#home"

            return (
              <li key={link.href}>
                <a
                  href={link.href}
                  aria-current={isActive ? "page" : undefined}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "block rounded-lg px-3 py-3 text-sm font-medium transition-colors",
                    focusRing,
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-secondary hover:text-primary"
                  )}
                >
                  {link.label}
                </a>
              </li>
            )
          })}
          {!authLoading && user ? (
            <li className="border-t border-border pt-2">
              <p className="px-3 py-2 text-sm text-muted-foreground">
                Signed in as{" "}
                <span className="font-medium text-foreground">{user.name}</span>
              </p>
              <Link
                href="/orders"
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg px-3 py-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary",
                  focusRing
                )}
              >
                My Orders
              </Link>
              <button
                type="button"
                disabled={signingOut}
                onClick={handleLogout}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg px-3 py-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary disabled:opacity-50",
                  focusRing
                )}
              >
                <LogOut className="size-4" aria-hidden="true" />
                {signingOut ? "Signing out..." : "Sign out"}
              </button>
            </li>
          ) : !authLoading ? (
            <li className="flex gap-2 border-t border-border pt-2">
              <ButtonLink
                href="/login"
                size="lg"
                onClick={() => setIsOpen(false)}
                className="h-11 flex-1 rounded-[10px]"
              >
                Sign in
              </ButtonLink>
              <ButtonLink
                href="/register"
                variant="outline"
                size="lg"
                onClick={() => setIsOpen(false)}
                className="h-11 flex-1 rounded-[10px]"
              >
                Create account
              </ButtonLink>
            </li>
          ) : null}

          <li>
            <a
              href="/cart"
              onClick={() => setIsOpen(false)}
              className={cn(
                "flex items-center justify-between rounded-lg px-3 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-primary",
                focusRing
              )}
            >
              <span className="flex items-center gap-2">
                <ShoppingCart className="size-4" aria-hidden="true" />
                Cart
              </span>
              {totalItems > 0 ? (
                <span className="grid min-w-5 place-items-center rounded-full bg-primary px-1.5 text-xs font-medium text-primary-foreground">
                  {totalItems}
                </span>
              ) : null}
            </a>
          </li>

          <li className="pt-2">
            <ButtonLink
              href="#menu"
              size="lg"
              onClick={() => setIsOpen(false)}
              className="h-11 w-full rounded-[10px]"
            >
              Explore Menu
            </ButtonLink>
          </li>
        </ul>
      </nav>
    </header>
  )
}
