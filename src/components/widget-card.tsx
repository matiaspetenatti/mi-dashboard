import Link from "next/link";
import { ArrowUpRight, type LucideIcon } from "lucide-react";
import { cn } from "cn";
import { accentStyles, type ModuleAccent } from "@/lib/modules";

type WidgetCardProps = {
  title: string;
  href: string;
  icon?: LucideIcon;
  accent?: ModuleAccent;
  children: React.ReactNode;
  className?: string;
};

export function WidgetCard({
  title,
  href,
  icon: Icon,
  accent = "primary",
  children,
  className,
}: WidgetCardProps) {
  const styles = accentStyles[accent];

  return (
    <section
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-white/60 bg-surface-container-lowest/90 p-5 shadow-elevation-1 backdrop-blur-sm transition-shadow duration-300 hover:shadow-elevation-3 dark:border-white/5",
        className,
      )}
    >
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute -right-12 -top-12 size-32 rounded-full blur-2xl",
          styles.soft,
        )}
      />
      <header className="relative mb-4 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          {Icon && (
            <span
              className={cn(
                "grid size-8 shrink-0 place-items-center rounded-full",
                styles.container,
                styles.onContainer,
              )}
            >
              <Icon size={15} />
            </span>
          )}
          <h2 className="truncate text-sm font-medium text-on-surface-variant">
            {title}
          </h2>
        </div>
        <Link
          href={href}
          aria-label={`Ir a ${title}`}
          className={cn(
            "grid size-8 shrink-0 place-items-center rounded-full bg-surface-container text-on-surface-variant transition-colors duration-200 hover:bg-surface-container-high hover:text-on-surface",
            styles.text,
          )}
        >
          <ArrowUpRight
            size={16}
            className="transition-transform duration-300 ease-emphasized group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
          />
        </Link>
      </header>
      <div className="relative flex flex-1 flex-col">{children}</div>
    </section>
  );
}
