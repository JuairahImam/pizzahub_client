import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import {
  ArrowRight,
  ChefHat,
  CupSoda,
  Flame,
  Leaf,
  Pizza,
  Sandwich,
  Users,
} from "lucide-react"

import { ButtonLink } from "@/components/button-link"
import { PopularMenu } from "@/components/popular-menu"
import { SectionHeading } from "@/components/section-heading"

import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "PizzaHub | Handcrafted pizza, made to be shared",
  description:
    "Explore PizzaHub's handcrafted pizzas, from classic Margherita to BBQ Chicken. Good dough, thoughtful toppings, and a table made for sharing.",
}

const features = [
  {
    icon: ChefHat,
    title: "Dough with patience",
    description:
      "A slow ferment gives the crust a light center and a crisp, blistered edge.",
  },
  {
    icon: Flame,
    title: "A proper bake",
    description:
      "High heat, melted cheese, and just enough char to keep every slice interesting.",
  },
  {
    icon: Leaf,
    title: "Toppings that matter",
    description:
      "Familiar favorites and a few fresh twists, never buried under the extras.",
  },
  {
    icon: Users,
    title: "Built for sharing",
    description:
      "Pizzas made to land in the middle of the table and disappear slice by slice.",
  },
] as const

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"

export default function HomePage() {
  return (
    <>
      <a
        href="#main-content"
        className={cn(
          "fixed top-4 left-4 z-[60] -translate-y-24 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground",
          "focus:translate-y-0",
          focusRing
        )}
      >
        Skip to content
      </a>

      <main id="main-content" tabIndex={-1} className="outline-none">
        <section
          id="home"
          aria-labelledby="hero-heading"
          tabIndex={-1}
          className="scroll-mt-24 outline-none"
        >
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 pt-12 pb-16 sm:px-6 sm:pt-16 sm:pb-20 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:pt-20 lg:pb-24">
            <div className="max-w-xl">
              <p className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
                <Flame className="size-3.5" aria-hidden="true" />
                Fresh from the oven
              </p>
              <h1
                id="hero-heading"
                className="mt-5 text-4xl leading-[1.05] font-semibold tracking-tight text-balance text-foreground sm:text-5xl lg:text-[3.5rem]"
              >
                Your next favorite pizza is{" "}
                <span className="text-primary">one click away.</span>
              </h1>
              <p className="mt-5 max-w-lg text-base leading-relaxed text-pretty text-muted-foreground sm:text-lg">
                Hand-stretched dough, slow-simmered sauce, and generous toppings
                &mdash; made to order and best shared.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <ButtonLink
                  href="#menu"
                  size="lg"
                  className="h-11 gap-2 rounded-[10px] px-6"
                >
                  Explore Menu
                  <ArrowRight className="size-4" aria-hidden="true" />
                </ButtonLink>
                <ButtonLink
                  href="#about"
                  variant="outline"
                  size="lg"
                  className="h-11 rounded-[10px] px-6"
                >
                  Why PizzaHub
                </ButtonLink>
              </div>
              <ul className="mt-10 grid gap-4 border-t border-border pt-6 sm:grid-cols-3">
                {[
                  "Hand-stretched dough",
                  "Slow-simmered sauce",
                  "Made to order",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-2 text-sm font-medium text-foreground"
                  >
                    <span
                      className="size-1.5 shrink-0 rounded-full bg-accent"
                      aria-hidden="true"
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative mx-auto w-full max-w-md lg:max-w-none">
              <div
                className="absolute inset-0 translate-x-3 translate-y-3 rounded-[2rem] bg-accent/50"
                aria-hidden="true"
              />
              <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] border-4 border-card bg-muted lg:aspect-square">
                <Image
                  src="/images/hero-pizza.jpg"
                  alt="A freshly baked cheese pizza on a wooden board with tomatoes and rosemary"
                  fill
                  sizes="(min-width: 1024px) 50vw, (min-width: 640px) 28rem, 100vw"
                  className="object-cover lg:object-right"
                  loading="eager"
                  fetchPriority="high"
                />
              </div>
              <div className="absolute -bottom-5 left-4 flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-sm sm:left-6">
                <span className="grid size-10 place-items-center rounded-full bg-secondary text-primary">
                  <Pizza className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Baked to order
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Served hot, every time
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="categories"
          aria-labelledby="categories-heading"
          tabIndex={-1}
          className="scroll-mt-24 border-y border-border bg-background outline-none"
        >
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
            <SectionHeading
              id="categories-heading"
              eyebrow="Browse by category"
              title="Find your kind of slice"
              description="Start with a category, or jump straight into the full menu."
            />

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {[
                {
                  label: "Pizza",
                  description: "Classic and specialty pies",
                  href: "/menu?category=Pizza",
                  icon: Pizza,
                },
                {
                  label: "Sides",
                  description: "Bread, dips, and extras",
                  href: "/menu?category=Sides",
                  icon: Sandwich,
                },
                {
                  label: "Drinks",
                  description: "Cold and refreshing",
                  href: "/menu?category=Drinks",
                  icon: CupSoda,
                },
              ].map(({ label, description, href, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  className={cn(
                    "group flex items-center gap-4 rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary/40 hover:bg-secondary",
                    focusRing
                  )}
                >
                  <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-secondary text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="size-6" aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold tracking-tight text-foreground">
                      {label}
                    </h3>
                    <p className="text-sm text-muted-foreground">{description}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>

        <section
          id="menu"
          aria-labelledby="menu-heading"
          tabIndex={-1}
          className="scroll-mt-24 border-y border-border bg-background outline-none"
        >
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <SectionHeading
                id="menu-heading"
                eyebrow="From the oven"
                title="Popular right now"
                description="A few favorites from our kitchen, updated from the live menu."
              />
              <Link
                href="/menu"
                className={cn(
                  "inline-flex shrink-0 items-center gap-2 rounded-sm py-1 text-sm font-medium text-primary hover:text-primary-hover",
                  focusRing
                )}
              >
                View full menu
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>

            <div className="mt-10">
              <PopularMenu />
            </div>
          </div>
        </section>

        <section
          id="how-it-works"
          aria-labelledby="how-heading"
          tabIndex={-1}
          className="scroll-mt-24 border-y border-border bg-secondary outline-none"
        >
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
            <SectionHeading
              id="how-heading"
              eyebrow="How it works"
              title="Good pizza, made simple"
              description="A few steps from craving to table."
            />

            <div className="mt-10 grid gap-6 sm:grid-cols-3">
              {[
                {
                  step: "01",
                  title: "Choose your pizza",
                  description:
                    "Browse the menu and pick your favorites, from classic Margherita to BBQ Chicken.",
                },
                {
                  step: "02",
                  title: "We bake it fresh",
                  description:
                    "Every pizza is built when you order it, with dough that has had time to rest.",
                },
                {
                  step: "03",
                  title: "Share and enjoy",
                  description:
                    "Served hot, ready to land in the middle of the table.",
                },
              ].map(({ step, title, description }) => (
                <article
                  key={step}
                  className="rounded-xl border border-border bg-card p-6"
                >
                  <span className="text-sm font-semibold text-accent">
                    {step}
                  </span>
                  <h3 className="mt-3 text-lg font-semibold tracking-tight text-foreground">
                    {title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          id="about"
          aria-labelledby="about-heading"
          tabIndex={-1}
          className="scroll-mt-24 border-b border-border bg-secondary outline-none"
        >
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16 lg:px-8 lg:py-24">
            <div>
              <SectionHeading
                id="about-heading"
                eyebrow="Why PizzaHub"
                title="Pizza is simple. Doing it well is not."
                description="We keep things focused: good dough, balanced toppings, and a bake that does right by both. Everything else is noise."
              />
              <div className="mt-8 rounded-xl bg-primary p-6 text-primary-foreground">
                <span
                  className="block h-1 w-10 rounded-full bg-accent"
                  aria-hidden="true"
                />
                <p className="mt-4 text-lg leading-snug font-medium">
                  Good pizza takes time. We&apos;re happy to give it.
                </p>
                <p className="mt-2 text-sm leading-relaxed text-primary-foreground/80">
                  Our dough gets the rest it needs, our sauces simmer slowly,
                  and every pizza is built when you order it.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {features.map(({ icon: Icon, title, description }) => (
                <article
                  key={title}
                  className="rounded-xl border border-border bg-card p-6"
                >
                  <span className="grid size-11 place-items-center rounded-xl bg-secondary text-primary">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-5 text-lg font-semibold tracking-tight text-foreground">
                    {title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

    </>
  )
}
