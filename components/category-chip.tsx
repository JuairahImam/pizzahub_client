import { cn } from "@/lib/utils"

type CategoryChipProps = {
  label: string
  active?: boolean
  onClick?: () => void
  className?: string
}

export function CategoryChip({
  label,
  active = false,
  onClick,
  className,
}: CategoryChipProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "inline-flex items-center rounded-full border px-4 py-2 text-sm font-medium transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-secondary",
        className
      )}
    >
      {label}
    </button>
  )
}