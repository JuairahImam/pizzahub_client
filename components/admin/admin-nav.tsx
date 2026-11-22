"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"

const ADMIN_NAV = [
  { label: "Overview", href: "/admin" },
  { label: "Menu Moderation", href: "/admin/menu" },
  { label: "Manage Users", href: "/admin/users" },
]

export function AdminNav() {
  const pathname = usePathname()

  return (
    <nav aria-label="Admin" className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-7xl flex-wrap gap-2 px-4 py-3 sm:px-6">
        {ADMIN_NAV.map((item) => {
          const active = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-secondary hover:text-primary"
              )}
            >
              {item.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
