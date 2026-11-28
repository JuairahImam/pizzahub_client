"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Suspense, useCallback, useEffect, useState } from "react"

import { EmptyState } from "@/components/empty-state"
import { ErrorState } from "@/components/error-state"
import { LoadingSkeleton } from "@/components/loading-skeleton"
import { MenuFilters } from "@/components/menu-filters"
import { MenuGrid } from "@/components/menu-grid"
import { MenuItemCard } from "@/components/menu-item-card"
import { PageContainer } from "@/components/page-container"
import { Pagination } from "@/components/pagination"

import { apiGet } from "@/lib/api/client"
import { ENDPOINTS } from "@/lib/api/endpoints"
import type {
  CategoryListResponse,
  MenuListResponse,
} from "@/types/menu"

type SortOption = "newest" | "price_asc" | "price_desc"

function MenuPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const [searchInput, setSearchInput] = useState(
    searchParams.get("q") ?? ""
  )
  const [location, setLocation] = useState(searchParams.get("location") ?? "")
  const [search, setSearch] = useState(searchParams.get("q") ?? "")
  const [category, setCategory] = useState(searchParams.get("category") ?? "")
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") ?? "")
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") ?? "")
  const [sort, setSort] = useState<SortOption>(
    (searchParams.get("sort") as SortOption) ?? "newest"
  )
  const [page, setPage] = useState(Number(searchParams.get("page") ?? "1") || 1)

  const [categories, setCategories] = useState<string[]>([])
  const [data, setData] = useState<MenuListResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)

  // Debounce search input before triggering a fetch.
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 400)
    return () => clearTimeout(timer)
  }, [searchInput])

  // Reset to first page whenever filters change.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(1)
  }, [search, category, minPrice, maxPrice, sort, location])

  // Keep the URL in sync with the active filters.
  useEffect(() => {
    const params = new URLSearchParams()
    if (search) params.set("q", search)
    if (category) params.set("category", category)
    if (minPrice) params.set("minPrice", minPrice)
    if (maxPrice) params.set("maxPrice", maxPrice)
    if (location) params.set("location", location)
    if (sort && sort !== "newest") params.set("sort", sort)
    if (page > 1) params.set("page", String(page))

    const query = params.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    })
  }, [search, category, minPrice, maxPrice, sort, location, page, pathname, router])

  // Load categories once.
  useEffect(() => {
    let active = true

    apiGet<CategoryListResponse>(ENDPOINTS.menuCategories)
      .then((response) => {
        if (active) setCategories(response.categories)
      })
      .catch(() => {
        if (active) setCategories([])
      })

    return () => {
      active = false
    }
  }, [])

  const fetchMenu = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const minPriceValue =
        minPrice && !Number.isNaN(Number(minPrice))
          ? Number(minPrice)
          : undefined
      const maxPriceValue =
        maxPrice && !Number.isNaN(Number(maxPrice))
          ? Number(maxPrice)
          : undefined

      const response = await apiGet<MenuListResponse>(ENDPOINTS.menuItems, {
        q: search || undefined,
        category: category || undefined,
        minPrice: minPriceValue,
        maxPrice: maxPriceValue,
        location: location || undefined,
        sort,
        page,
        limit: 12,
      })

      setData(response)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load menu items."
      )
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [search, category, minPrice, maxPrice, sort, location, page])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchMenu()
  }, [fetchMenu, reloadToken])

  const handleRetry = () => setReloadToken((value) => value + 1)

  return (
    <main id="main-content" className="outline-none">
      <section className="border-b border-border bg-secondary">
        <PageContainer className="py-12 sm:py-16 lg:py-20">
          <div className="max-w-3xl space-y-4">
            <p className="text-xs font-medium tracking-[0.2em] text-primary uppercase">
              From the oven
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-balance text-foreground sm:text-4xl lg:text-5xl">
              Browse the PizzaHub menu
            </h1>
            <p className="text-base leading-relaxed text-pretty text-muted-foreground sm:text-lg">
              Handcrafted pizzas, sides, and drinks made to order. Filter by
              category, price, or search for your next favorite.
            </p>
          </div>
        </PageContainer>
      </section>

      <section className="bg-background">
        <PageContainer className="py-10 sm:py-12 lg:py-16">
          <div className="space-y-8">
            <MenuFilters
              location={location}
              onLocationChange={setLocation}
              search={searchInput}
              onSearchChange={setSearchInput}
              categories={categories}
              category={category}
              onCategoryChange={setCategory}
              minPrice={minPrice}
              maxPrice={maxPrice}
              onMinPriceChange={setMinPrice}
              onMaxPriceChange={setMaxPrice}
              sort={sort}
              onSortChange={setSort}
            />

            {loading ? <LoadingSkeleton count={8} /> : null}

            {!loading && error ? (
              <ErrorState description={error} onRetry={handleRetry} />
            ) : null}

            {!loading && !error && data && data.menuItems.length === 0 ? (
              <EmptyState
                title="No menu items found"
                description="Try adjusting your search, category, or price filters."
              />
            ) : null}

            {!loading && !error && data && data.menuItems.length > 0 ? (
              <>
                <MenuGrid>
                  {data.menuItems.map((item, index) => (
                    <MenuItemCard
                      key={item._id}
                      id={item._id}
                      name={item.name}
                      description={item.description}
                      imageSrc={item.imageUrl}
                      imageAlt={`${item.name} from ${item.restaurant?.name ?? "PizzaHub"}`}
                      category={item.category}
                      price={item.price}
                      restaurantId={item.restaurantId}
                      restaurantName={item.restaurant?.name}
                      restaurantAddress={item.location ?? item.restaurant?.address}
                      isPremium={item.isPremium}
                      available={item.isAvailable}
                      priority={index < 4}
                    />
                  ))}
                </MenuGrid>

                <Pagination
                  page={data.pagination.page}
                  totalPages={data.pagination.totalPages}
                  onPageChange={setPage}
                />
              </>
            ) : null}
          </div>
        </PageContainer>
      </section>
    </main>
  )
}

export default function MenuPage() {
  return (
    <Suspense fallback={<LoadingSkeleton count={8} />}>
      <MenuPageContent />
    </Suspense>
  )
}