import { Link } from "@tanstack/react-router"
import { ArrowUpRight, type LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

import type { AppModuleHref } from "@/lib/modules"
import { cn } from "cn"

export function WidgetCard({
  title,
  subtitle,
  href,
  icon: Icon,
  accent = "primary",
  variant = "default",
  footer,
  children,
  className,
}: {
  title: string
  subtitle?: string
  href: AppModuleHref
  icon: LucideIcon
  accent?: "primary" | "secondary" | "tertiary"
  variant?: "default" | "inverse"
  footer?: ReactNode
  children: ReactNode
  className?: string
}) {
  const inverse = variant === "inverse"

  const accentClass = {
    primary:
      "bg-linen-mist text-forest-ink dark:bg-primary-container dark:text-lime-voltage",
    secondary:
      "bg-secondary-container text-on-secondary-container dark:bg-primary-container dark:text-lime-voltage",
    tertiary:
      "bg-surface-container-high text-heading dark:bg-surface-container-highest dark:text-lime-voltage",
  }[accent]

  return (
    <section
      className={cn(
        "group relative flex min-h-[260px] flex-col overflow-hidden rounded-3xl border p-5 shadow-elevation-1 transition-shadow hover:shadow-elevation-2",
        inverse
          ? "border-card-inverse-border bg-card-inverse text-card-inverse-foreground"
          : "border-outline-variant/60 bg-card text-card-foreground",
        className,
      )}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-full",
              inverse
                ? "border border-card-inverse-border bg-white/5 text-card-inverse-muted"
                : accentClass,
            )}
          >
            <Icon className="size-4.5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2
              className={cn(
                "truncate text-sm font-black tracking-tight",
                inverse ? "text-card-inverse-foreground" : "text-heading",
              )}
            >
              {title}
            </h2>
            {subtitle ? (
              <p
                className={cn(
                  "truncate text-[11px] font-medium",
                  inverse
                    ? "text-card-inverse-muted/80"
                    : "text-muted-foreground",
                )}
              >
                {subtitle}
              </p>
            ) : null}
          </div>
        </div>

        <Link
          to={href}
          aria-label={`Ir a ${title}`}
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-full transition-colors",
            inverse
              ? "text-card-inverse-muted hover:bg-white/10"
              : "text-muted-foreground hover:bg-muted hover:text-heading",
          )}
        >
          <ArrowUpRight className="size-4" aria-hidden="true" />
        </Link>
      </header>

      <div className="mt-5 flex flex-1 flex-col">{children}</div>

      {footer ? (
        <footer
          className={cn(
            "mt-4 flex items-center justify-between gap-2 border-t pt-3 text-[10px] font-semibold",
            inverse
              ? "border-card-inverse-border text-card-inverse-muted/80"
              : "border-outline-variant/40 text-muted-foreground",
          )}
        >
          {footer}
        </footer>
      ) : null}
    </section>
  )
}
