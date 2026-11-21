"use client"

import { Search } from "lucide-react"

import { CategoryChip } from "@/components/category-chip"
import { cn } from "@/lib/utils"

type SortOption = "newest" | "price_asc" | "price_desc"

type MenuFiltersProps = {
  search: string
  onSearchChange: (value: string) => void
  categories: string[]
  category: string
  onCategoryChange: (value: string) => void
  minPrice: string
  maxPrice: string
  onMinPriceChange: (value: string) => void
  onMaxPriceChange: (value: string) => void
  sort: SortOption
  onSortChange: (value: SortOption) => void
  className?: string
}

const inputClassName =
  "h-11 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"

export function MenuFilters({
  search,
  onSearchChange,
  categories,
  category,
  onCategoryChange,
  minPrice,
  maxPrice,
  onMinPriceChange,
  onMaxPriceChange,
  sort,
  onSortChange,
  className,
}: MenuFiltersProps) {
  return (
    <div className={cn("space-y-6", className)}>
      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <input
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search pizzas, sides, drinks..."
          aria-label="Search menu items"
          className={cn(inputClassName, "pl-10")}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <CategoryChip
          label="All"
          active={category === ""}
          onClick={() => onCategoryChange("")}
        />
        {categories.map((item) => (
          <CategoryChip
            key={item}
            label={item}
            active={category === item}
            onClick={() => onCategoryChange(item)}
          />
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <label className="space-y-2">
          <span className="text-xs font-medium text-muted-foreground">
            Min price (৳)
          </span>
          <input
            type="number"
            min={0}
            value={minPrice}
            onChange={(event) => onMinPriceChange(event.target.value)}
            placeholder="0"
            className={inputClassName}
          />
        </label>

        <label className="space-y-2">
          <span className="text-xs font-medium text-muted-foreground">
            Max price (৳)
          </span>
          <input
            type="number"
            min={0}
            value={maxPrice}
            onChange={(event) => onMaxPriceChange(event.target.value)}
            placeholder="Any"
            className={inputClassName}
          />
        </label>

        <label className="space-y-2">
          <span className="text-xs font-medium text-muted-foreground">
            Sort by
          </span>
          <select
            value={sort}
            onChange={(event) =>
              onSortChange(event.target.value as SortOption)
            }
            className={inputClassName}
          >
            <option value="newest">Newest</option>
            <option value="price_asc">Price: low to high</option>
            <option value="price_desc">Price: high to low</option>
          </select>
        </label>
      </div>
    </div>
  )
}