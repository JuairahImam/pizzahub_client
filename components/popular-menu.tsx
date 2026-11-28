"use client"

import { useEffect, useState } from "react"

import { EmptyState } from "@/components/empty-state"
import { ErrorState } from "@/components/error-state"
import { LoadingSkeleton } from "@/components/loading-skeleton"
import { MenuGrid } from "@/components/menu-grid"
import { MenuItemCard } from "@/components/menu-item-card"
import { apiGet } from "@/lib/api/client"
import { ENDPOINTS } from "@/lib/api/endpoints"
import type { MenuListResponse } from "@/types/menu"

export function PopularMenu() {
  const [data, setData] = useState<MenuListResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    let active = true

    async function load() {
      setLoading(true)
      setError(null)

      try {
        const response = await apiGet<MenuListResponse>(ENDPOINTS.menuItems, {
          // Premium vendors get featured placement on the homepage.
          sort: "premium_first",
          page: 1,
          limit: 6,
        })

        if (active) setData(response)
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error ? err.message : "Failed to load menu items."
          )
          setData(null)
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    void load()

    return () => {
      active = false
    }
  }, [reloadToken])

  return (
    <div className="space-y-8">
      {loading ? <LoadingSkeleton count={4} /> : null}

      {!loading && error ? (
        <ErrorState
          title="Menu unavailable"
          description={error}
          onRetry={() => setReloadToken((value) => value + 1)}
        />
      ) : null}

      {!loading && !error && data && data.menuItems.length === 0 ? (
        <EmptyState
          title="No pizzas yet"
          description="Our menu is being prepared. Please check back soon."
        />
      ) : null}

      {!loading && !error && data && data.menuItems.length > 0 ? (
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
              priority={index < 2}
            />
          ))}
        </MenuGrid>
      ) : null}
    </div>
  )
}