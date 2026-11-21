import { cn } from "@/lib/utils"

type SectionHeadingProps = {
  id: string
  eyebrow: string
  title: string
  description?: string
  className?: string
}

export function SectionHeading({
  id,
  eyebrow,
  title,
  description,
  className,
}: SectionHeadingProps) {
  return (
    <div className={cn("max-w-2xl", className)}>
      <p className="flex items-center gap-2 text-xs font-medium tracking-[0.2em] text-primary uppercase">
        <span className="h-px w-6 bg-accent" aria-hidden="true" />
        {eyebrow}
      </p>
      <h2
        id={id}
        className="mt-3 text-2xl font-semibold tracking-tight text-balance text-foreground sm:text-[1.75rem]"
      >
        {title}
      </h2>
      {description ? (
        <p className="mt-3 text-base leading-relaxed text-pretty text-muted-foreground">
          {description}
        </p>
      ) : null}
    </div>
  )
}
