import type { ReactNode } from "react"
import { CalendarDays } from "lucide-react"

import { cn } from "cn"

export function PageHeader({
  eyebrow,
  title,
  description,
  meta,
  actions,
  className,
}: {
  eyebrow?: string
  title: ReactNode
  description?: string
  meta?: string
  actions?: ReactNode
  className?: string
}) {
  return (
    <header
      className={cn(
        "flex flex-col justify-between gap-5 md:flex-row md:items-end",
        className,
      )}
    >
      <div className="flex flex-col gap-2">
        {eyebrow ? (
          <span className="inline-flex items-center gap-2 self-start rounded-full border border-primary-container/30 bg-linen-mist px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-forest-ink dark:border-lime-voltage/25 dark:bg-primary-container dark:text-lime-voltage">
            <span className="size-1.5 rounded-full bg-secondary dark:bg-lime-voltage" />
            {eyebrow}
          </span>
        ) : null}

        <h1 className="text-display text-4xl text-heading md:text-5xl">
          {title}
        </h1>

        {description ? (
          <p className="max-w-2xl text-base leading-7 text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {actions}
        {meta ? (
          <span className="inline-flex items-center gap-2 rounded-full border border-outline-variant/70 bg-card px-4 py-2 text-xs font-semibold text-heading">
            <CalendarDays className="size-4 text-secondary" aria-hidden="true" />
            {meta}
          </span>
        ) : null}
      </div>
    </header>
  )
}
