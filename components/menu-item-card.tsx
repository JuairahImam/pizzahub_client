"use client"

import Image from "next/image"
import { useState } from "react"

import { Price } from "@/components/price"
import { cn } from "@/lib/utils"

const FALLBACK_IMAGE = "/images/hero-pizza.jpg"

type MenuItemCardProps = {
  name: string
  description: string
  imageSrc: string
  imageAlt: string
  category: string
  price: number
  restaurantName?: string | null
  priority?: boolean
  className?: string
}

export function MenuItemCard({
  name,
  description,
  imageSrc,
  imageAlt,
  category,
  price,
  restaurantName,
  priority = false,
  className,
}: MenuItemCardProps) {
  const [src, setSrc] = useState(imageSrc || FALLBACK_IMAGE)

  return (
    <article
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-md",
        className
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <Image
          src={src}
          alt={imageAlt}
          fill
          sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          priority={priority}
          onError={() => setSrc(FALLBACK_IMAGE)}
        />
        <span className="absolute top-3 left-3 rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground">
          {category}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="space-y-1.5">
          <h3 className="text-lg font-semibold tracking-tight text-foreground">
            {name}
          </h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        </div>

        {restaurantName ? (
          <p className="text-xs font-medium text-muted-foreground">
            {restaurantName}
          </p>
        ) : null}

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-4">
          <Price value={price} />
          <span className="text-xs font-medium text-muted-foreground">
            Available
          </span>
        </div>
      </div>
    </article>
  )
}