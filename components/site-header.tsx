"use client"

import { useEffect, useState } from "react"
import { Menu, Pizza, X } from "lucide-react"

import { ButtonLink } from "@/components/button-link"
import { siteNav } from "@/lib/navigation"
import { cn } from "@/lib/utils"

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"

export function SiteHeader() {
  const [isOpen, setIsOpen] = useState(false)

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
