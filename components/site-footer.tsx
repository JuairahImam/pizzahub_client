import { ArrowUp, Pizza } from "lucide-react"

import { siteNav } from "@/lib/navigation"
import { cn } from "@/lib/utils"

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-primary"

export function SiteFooter() {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_0.7fr_0.8fr]">
          <div className="max-w-sm">
            <a
              href="#home"
              aria-label="PizzaHub home"
              className={cn(
                "inline-flex items-center gap-2.5 rounded-lg py-1",
                focusRing
              )}
            >
              <span className="grid size-9 place-items-center rounded-xl bg-accent text-accent-foreground">
                <Pizza className="size-5" aria-hidden="true" />
              </span>
              <span className="text-lg font-semibold tracking-tight">
                PizzaHub
              </span>
            </a>
            <p className="mt-4 text-sm leading-relaxed text-primary-foreground/80">
              Handcrafted pizza, made to be shared. Good dough, good toppings,
              good company.
            </p>
          </div>

          <nav aria-label="Footer">
            <p className="text-xs font-medium tracking-[0.2em] text-accent uppercase">
              Explore
            </p>
            <ul className="mt-4 space-y-2">
              {siteNav.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className={cn(
                      "inline-block rounded-sm py-1 text-sm text-primary-foreground/80 transition-colors hover:text-primary-foreground",
                      focusRing
                    )}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="max-w-sm sm:col-span-2 lg:col-span-1">
            <p className="text-xs font-medium tracking-[0.2em] text-accent uppercase">
              From the kitchen
            </p>
            <p className="mt-4 text-sm leading-relaxed text-primary-foreground/80">
              No shortcuts, no fuss. Just good pizza, made when you order it.
            </p>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-primary-foreground/15 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-primary-foreground/80">
            © {new Date().getFullYear()} PizzaHub. All rights reserved.
          </p>
          <a
            href="#home"
            className={cn(
              "inline-flex items-center gap-1.5 rounded-sm py-1 text-xs font-medium text-primary-foreground/80 transition-colors hover:text-primary-foreground",
              focusRing
            )}
          >
            Back to top
            <ArrowUp className="size-3.5" aria-hidden="true" />
          </a>
        </div>
      </div>
    </footer>
  )
}
