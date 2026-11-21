import { Pizza } from "lucide-react"

import { cn } from "@/lib/utils"

type AuthCardProps = {
  title: string
  description: string
  children: React.ReactNode
  footer?: React.ReactNode
  className?: string
}

export function AuthCard({
  title,
  description,
  children,
  footer,
  className,
}: AuthCardProps) {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12 sm:px-6">
      <div
        className={cn(
          "w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8",
          className
        )}
      >
        <div className="mb-6 flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Pizza className="size-5" aria-hidden="true" />
          </span>
          <span className="text-lg font-semibold tracking-tight text-primary">
            PizzaHub
          </span>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {title}
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        </div>

        <div className="mt-6">{children}</div>

        {footer ? (
          <div className="mt-6 border-t border-border pt-6 text-center text-sm text-muted-foreground">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  )
}