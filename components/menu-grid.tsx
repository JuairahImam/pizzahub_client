import { cn } from "@/lib/utils"

type MenuGridProps = {
  children: React.ReactNode
  className?: string
}

export function MenuGrid({ children, className }: MenuGridProps) {
  return (
    <div
      className={cn(
        "grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
        className
      )}
    >
      {children}
    </div>
  )
}