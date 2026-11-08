import type { ReactNode } from "react"

import { cn } from "cn"

export function ChartCard({
  title,
  subtitle,
  actions,
  children,
  className,
}: {
  title: string
  subtitle?: string
  actions?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={cn(
        "rounded-3xl border border-outline-variant/60 bg-card p-6 shadow-elevation-1",
        className,
      )}
    >
      <header className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-black tracking-tight text-heading">{title}</h2>
          {subtitle ? (
            <p className="mt-0.5 text-[11px] text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
        {actions}
      </header>
      {children}
    </section>
  )
}
