import Image from "next/image"

type PizzaCardProps = {
  name: string
  description: string
  imageSrc: string
  imageAlt: string
  tag: string
}

export function PizzaCard({
  name,
  description,
  imageSrc,
  imageAlt,
  tag,
}: PizzaCardProps) {
  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-border bg-card">
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover"
        />
        <span className="absolute top-3 left-3 rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground">
          {tag}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-lg font-semibold tracking-tight text-foreground">
          {name}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
    </article>
  )
}
