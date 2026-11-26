import { ArrowUp, Mail, MapPin, Phone, Pizza } from "lucide-react"
import Link from "next/link"

import { siteNav } from "@/lib/navigation"
import { cn } from "@/lib/utils"

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-primary"

const socials = [
  {
    label: "PizzaHub on X",
    href: "https://x.com",
    icon: (
      <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden="true">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
      </svg>
    ),
  },
  {
    label: "PizzaHub on Instagram",
    href: "https://instagram.com",
    icon: (
      <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <rect x="2" y="2" width="20" height="20" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    label: "PizzaHub on Facebook",
    href: "https://facebook.com",
    icon: (
      <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden="true">
        <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.9 3.77-3.9 1.1 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12Z" />
      </svg>
    ),
  },
]

export function SiteFooter() {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_0.7fr_0.8fr_0.9fr]">
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
                  <Link
                    href={link.href}
                    className={cn(
                      "inline-block rounded-sm py-1 text-sm text-primary-foreground/80 transition-colors hover:text-primary-foreground",
                      focusRing
                    )}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <p className="text-xs font-medium tracking-[0.2em] text-accent uppercase">
              Contact
            </p>
            <ul className="mt-4 space-y-3 text-sm text-primary-foreground/80">
              <li className="flex items-start gap-2">
                <Mail className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <a href="mailto:hello@pizzahub.com" className={cn("rounded-sm", focusRing)}>
                  hello@pizzahub.com
                </a>
              </li>
              <li className="flex items-start gap-2">
                <Phone className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <a href="tel:+18005550199" className={cn("rounded-sm", focusRing)}>
                  +1 (800) 555-0199
                </a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <span>24 Pizza Lane, Food District</span>
              </li>
            </ul>
          </div>

          <div className="max-w-sm sm:col-span-2 lg:col-span-1">
            <p className="text-xs font-medium tracking-[0.2em] text-accent uppercase">
              From the kitchen
            </p>
            <p className="mt-4 text-sm leading-relaxed text-primary-foreground/80">
              No shortcuts, no fuss. Just good pizza, made when you order it.
            </p>
            <ul className="mt-5 flex gap-2">
              {socials.map((social) => (
                <li key={social.label}>
                  <a
                    href={social.href}
                    aria-label={social.label}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "inline-flex size-9 items-center justify-center rounded-lg border border-primary-foreground/20 text-primary-foreground/80 transition-colors hover:bg-accent hover:text-accent-foreground",
                      focusRing
                    )}
                  >
                    {social.icon}
                  </a>
                </li>
              ))}
            </ul>
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
