import Link from "next/link";
import { ArrowUpRight, type LucideIcon } from "lucide-react";
import { cn } from "cn";
import { accentStyles, type ModuleAccent } from "@/lib/modules";

type WidgetCardVariant = "paper" | "inverse";

type WidgetCardProps = {
  title: string;
  subtitle?: React.ReactNode;
  href: string;
  icon?: LucideIcon;
  accent?: ModuleAccent;
  variant?: WidgetCardVariant;
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export function WidgetCard({
  title,
  subtitle,
  href,
  icon: Icon,
  accent = "primary",
  variant = "paper",
  footer,
  children,
  className,
}: WidgetCardProps) {
  const styles = accentStyles[accent];
  const inversa = variant === "inverse";

  return (
    <section
      className={cn(
        "group relative flex h-full flex-col rounded-[20px] p-6 transition-all duration-300",
        inversa
          ? "bg-card-inverse text-card-inverse-foreground ring-1 ring-inset ring-card-inverse-border dark:shadow-[0_0_24px_-6px_rgba(159,232,112,0.25)]"
          : "bg-card text-card-foreground ring-1 ring-inset ring-black/[0.07] hover:ring-black/[0.14] dark:ring-[rgba(159,232,112,0.12)] dark:hover:ring-[rgba(159,232,112,0.3)]",
        className,
      )}
    >
      <header
        className={cn(
          "flex items-start justify-between gap-3 border-b pb-3",
          inversa ? "border-white/10" : "border-outline-variant/50",
        )}
      >
        <div className="flex min-w-0 items-center gap-2.5">
          {Icon && (
            <span
              className={cn(
                "grid size-9 shrink-0 place-items-center rounded-full",
                inversa
                  ? "bg-white/10 text-lime-voltage"
                  : cn("bg-surface-container", styles.text),
              )}
            >
              <Icon size={17} />
            </span>
          )}
          <div className="min-w-0">
            <h2
              title={title}
              className={cn(
                "truncate text-lg font-bold leading-[24px] tracking-[-0.007em]",
                inversa ? "text-card-inverse-foreground" : "text-heading",
              )}
            >
              {title}
            </h2>
            {subtitle && (
              <div
                className={cn(
                  "mt-0.5 flex min-w-0 items-center gap-1 truncate text-xs",
                  inversa ? "text-card-inverse-muted" : "text-on-surface-variant",
                )}
              >
                {subtitle}
              </div>
            )}
          </div>
        </div>

        <Link
          href={href}
          aria-label={`Ir a ${title}`}
          className={cn(
            "grid size-8 shrink-0 place-items-center rounded-full transition-colors duration-200",
            inversa
              ? "bg-white/10 text-lime-voltage hover:bg-white/20"
              : cn(
                  "bg-surface-container/70 text-on-surface-variant hover:bg-surface-container hover:text-on-surface",
                  styles.text,
                ),
          )}
        >
          <ArrowUpRight
            size={16}
            className="transition-transform duration-300 ease-emphasized group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
          />
        </Link>
      </header>

      <div className="mt-4 flex flex-1 flex-col">{children}</div>

      {footer && (
        <footer
          className={cn(
            "mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-3 text-xs",
            inversa
              ? "border-white/10 text-card-inverse-muted"
              : "border-outline-variant/50 text-on-surface-variant",
          )}
        >
          {footer}
        </footer>
      )}
    </section>
  );
}
