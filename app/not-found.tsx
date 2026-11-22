import { ChefHat, Pizza, Search } from "lucide-react"

import { ButtonLink } from "@/components/button-link"
import { PageContainer } from "@/components/page-container"

export default function NotFound() {
  return (
    <main id="main-content" className="outline-none">
      <PageContainer className="flex min-h-[70vh] flex-col items-center justify-center gap-8 py-16 sm:py-20 lg:py-24 text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
          404 — page not found
        </span>
        <div className="flex items-center justify-center gap-4 rounded-3xl border border-border bg-card p-8">
          <span className="grid size-12 place-items-center rounded-xl bg-primary text-primary-foreground">
            <ChefHat className="size-5" aria-hidden="true" />
          </span>
          <span className="text-4xl font-semibold tracking-tight text-primary sm:text-5xl">
            404
          </span>
          <span className="grid size-12 place-items-center rounded-xl bg-secondary text-primary">
            <Pizza className="size-5" aria-hidden="true" />
          </span>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Sorry, we couldn&rsquo;t find that page.
        </h1>
        <p className="max-w-md text-sm leading-relaxed text-pretty text-muted-foreground sm:text-base">
          The page you&rsquo;re looking for doesn&rsquo;t exist or may have moved.
          Head back to the storefront or browse our menu.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <ButtonLink href="/" size="lg" className="h-11 rounded-[10px] px-6">
            Back to PizzaHub
          </ButtonLink>
          <ButtonLink
            href="/menu"
            variant="outline"
            size="lg"
            className="h-11 rounded-[10px] px-6"
          >
            Browse menu
          </ButtonLink>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3 text-xs font-medium text-muted-foreground">
          <Search className="size-4" aria-hidden="true" />
          Try searching from the homepage navigation.
        </div>
      </PageContainer>
    </main>
  )
}
