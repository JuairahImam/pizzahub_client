import { RefreshCcw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type ErrorStateProps = {
  title?: string
  description?: string
  onRetry?: () => void
  className?: string
}

export function ErrorState({
  title = "Something went wrong",
  description = "We couldn't load the menu right now. Please try again.",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 rounded-2xl border border-border bg-card px-6 py-16 text-center",
        className
      )}
    >
      <div className="max-w-md space-y-1">
        <h3 className="text-lg font-semibold tracking-tight text-foreground">
          {title}
        </h3>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
      {onRetry ? (
        <Button type="button" variant="outline" onClick={onRetry}>
          <RefreshCcw className="size-4" aria-hidden="true" />
          Try again
        </Button>
      ) : null}
    </div>
  )
}