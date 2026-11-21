import { Pizza } from "lucide-react"

import { cn } from "@/lib/utils"

type EmptyStateProps = {
  title: string
  description?: string
  className?: string
}

export function EmptyState({ title, description, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center",
        className
      )}
    >
      <span className="grid size-12 place-items-center rounded-full bg-secondary text-primary">
        <Pizza className="size-6" aria-hidden="true" />
      </span>
      <div className="max-w-md space-y-1">
        <h3 className="text-lg font-semibold tracking-tight text-foreground">
          {title}
        </h3>
        {description ? (
          <p className="text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
    </div>
  )
}