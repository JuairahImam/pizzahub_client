import { cn } from "@/lib/utils"

type PriceProps = {
  value: number
  className?: string
}

export function Price({ value, className }: PriceProps) {
  return (
    <span className={cn("text-base font-semibold text-primary", className)}>
      ৳{value.toLocaleString("en-BD")}
    </span>
  )
}