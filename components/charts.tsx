"use client"

import type { CSSProperties } from "react"

import { cn } from "@/lib/utils"

export type ChartBar = {
  label: string
  value: number
  color?: string
}

type BarChartProps = {
  data: ChartBar[]
  title: string
  description?: string
  height?: number
  className?: string
}

export function BarChart({
  data,
  title,
  description,
  height = 180,
  className,
}: BarChartProps) {
  const max = Math.max(1, ...data.map((item) => item.value))

  if (data.length === 0) {
    return (
      <div className={cn("rounded-xl border border-border bg-card p-5", className)}>
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="mt-2 text-xs text-muted-foreground">
          No data available yet.
        </p>
      </div>
    )
  }

  return (
    <div className={cn("rounded-xl border border-border bg-card p-5", className)}>
      <p id="chart-title" className="text-sm font-medium text-foreground">
        {title}
      </p>
      {description ? (
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      ) : null}

      <div
        className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(0,1fr))] gap-2"
        style={{ height }}
        role="img"
        aria-label={title}
      >
        {data.map((item) => {
          const barHeight = `calc(${(item.value / max) * 100}% - 26px)`

          return (
            <div
              key={item.label}
              className="flex h-full flex-col justify-end gap-1"
              data-chart-bar={item.label}
            >
              <div
                className={cn(
                  "w-full rounded-t-md",
                  item.color ??
                    "bg-gradient-to-b from-primary to-primary-hover"
                )}
                style={{ minHeight: 8, height: barHeight } as CSSProperties}
              >
                <span className="sr-only">
                  {item.label}: {item.value}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-3 flex flex-wrap justify-center gap-x-3 gap-y-1">
        {data.map((item) => (
          <span key={item.label} className="text-[11px] text-muted-foreground">
            {item.label}: {item.value}
          </span>
        ))}
      </div>
    </div>
  )
}
