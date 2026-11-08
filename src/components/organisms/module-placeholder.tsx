import { Link } from "@tanstack/react-router"
import { ArrowLeft, type LucideIcon } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "cn"

export function ModulePlaceholder({
  icon: Icon,
  title,
  description,
  features,
}: {
  icon: LucideIcon
  title: string
  description: string
  features: Array<string>
}) {
  return (
    <section className="mt-8 overflow-hidden rounded-3xl border border-outline-variant/60 bg-card shadow-elevation-1">
      <div className="flex flex-col gap-6 p-8 md:p-10">
        <span className="flex size-12 items-center justify-center rounded-full bg-linen-mist text-forest-ink dark:bg-primary-container dark:text-lime-voltage">
          <Icon className="size-6" aria-hidden="true" />
        </span>
        <div className="max-w-2xl space-y-2">
          <h2 className="text-2xl font-black tracking-tight text-heading">
            {title}
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">{description}</p>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          {features.map((feature) => (
            <div
              key={feature}
              className="flex items-center gap-2 rounded-2xl bg-surface-container-low px-4 py-3 text-sm text-on-surface-variant"
            >
              <span className="size-1.5 shrink-0 rounded-full bg-lime-voltage" />
              {feature}
            </div>
          ))}
        </div>

        <div>
          <Link
            to="/"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "h-9 rounded-full px-4 text-xs font-bold",
            )}
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Volver al inicio
          </Link>
        </div>
      </div>
    </section>
  )
}
