"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { SignOutButton } from "@clerk/nextjs";
import { motion } from "motion/react";
import { Sparkles } from "lucide-react";
import { cn } from "cn";
import { accentStyles, modules, type AppModule } from "@/lib/modules";
import { ThemeToggle } from "./theme-toggle";

function isActivePath(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

function NavItem({ module, pathname }: { module: AppModule; pathname: string }) {
  const active = isActivePath(pathname, module.href);
  const accent = accentStyles[module.accent];
  const Icon = module.icon;

  return (
    <Link
      href={module.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative isolate flex items-center gap-3 rounded-full px-3 py-2.5 text-sm font-medium transition-colors duration-200",
        active
          ? accent.onContainer
          : "text-on-surface-variant hover:bg-on-surface/5 hover:text-on-surface",
      )}
    >
      {active && (
        <motion.span
          layoutId="sidebar-active-pill"
          className={cn("absolute inset-0 -z-10 rounded-full", accent.container)}
          transition={{ type: "spring", stiffness: 380, damping: 32 }}
        />
      )}
      <span
        className={cn(
          "grid size-8 place-items-center rounded-full transition-colors duration-200",
          active
            ? "bg-white/45 dark:bg-white/10"
            : cn(accent.soft, accent.onContainer),
        )}
      >
        <Icon size={16} />
      </span>
      <span className="truncate">{module.label}</span>
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col gap-6 overflow-y-auto border-r border-outline-variant/50 bg-surface-container-low/70 p-4 backdrop-blur-xl md:flex">
      <Link
        href="/"
        className="flex items-center gap-3 rounded-2xl px-2 py-2 transition-colors hover:bg-on-surface/5"
      >
        <span className="grid size-11 place-items-center rounded-2xl bg-primary-container text-on-primary-container shadow-elevation-1">
          <Sparkles size={20} />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold tracking-tight">
            Mi dashboard
          </span>
          <span className="block truncate text-[11px] text-on-surface-variant">
            Tu día, en orden
          </span>
        </span>
      </Link>

      <nav className="flex flex-col gap-1">
        <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-on-surface-variant/70">
          Espacios
        </p>
        {modules.map((module) => (
          <NavItem key={module.slug} module={module} pathname={pathname} />
        ))}
      </nav>

      <div className="mt-auto space-y-3">
        <div className="rounded-3xl bg-surface-container p-4">
          <p className="text-xs font-medium text-on-surface">Material pastel</p>
          <p className="mt-1 text-[11px] leading-relaxed text-on-surface-variant">
            Un espacio suave para organizar tareas, finanzas y estudio.
          </p>
        </div>
        <div className="flex items-center justify-between rounded-full px-1 py-1">
          <span className="pl-2 text-xs text-on-surface-variant">Cuenta</span>
          <div className="flex items-center gap-1">
            <UserButton
              appearance={{ elements: { avatarBox: "size-8" } }}
              showName={false}
            />
            <SignOutButton redirectUrl="/sign-in">
              <button
                className="rounded-full px-3 py-1.5 text-xs text-on-surface-variant transition-colors hover:bg-on-surface/5 hover:text-on-surface"
                title="Cerrar sesión"
              >
                Salir
              </button>
            </SignOutButton>
          </div>
        </div>
        <div className="flex items-center justify-between rounded-full px-1 py-1">
          <span className="pl-2 text-xs text-on-surface-variant">Apariencia</span>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}

export function MobileHeader() {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-outline-variant/40 bg-background/75 px-4 py-3 backdrop-blur-xl md:hidden">
      <Link href="/" className="flex items-center gap-2.5">
        <span className="grid size-9 place-items-center rounded-2xl bg-primary-container text-on-primary-container">
          <Sparkles size={16} />
        </span>
        <span className="text-sm font-semibold tracking-tight">Mi dashboard</span>
      </Link>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <UserButton
          appearance={{ elements: { avatarBox: "size-8" } }}
          showName={false}
        />
        <SignOutButton redirectUrl="/sign-in">
          <button
            className="rounded-full px-3 py-1.5 text-sm text-on-surface-variant transition-colors hover:bg-on-surface/5 hover:text-on-surface"
            title="Cerrar sesión"
          >
            Salir
          </button>
        </SignOutButton>
      </div>
    </header>
  );
}

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-40 mx-auto mb-3 flex w-[calc(100%-1.5rem)] max-w-md items-stretch justify-between gap-0.5 rounded-full border border-outline-variant/50 bg-surface-container-low/90 p-1.5 shadow-elevation-3 backdrop-blur-xl md:hidden"
      style={{
        paddingBottom: "max(0.375rem, env(safe-area-inset-bottom))",
      }}
    >
      {modules.map((module) => {
        const active = isActivePath(pathname, module.href);
        const accent = accentStyles[module.accent];
        const Icon = module.icon;

        return (
          <Link
            key={module.slug}
            href={module.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative isolate flex flex-1 flex-col items-center gap-1 rounded-full px-1 py-2 text-[10px] font-medium transition-colors duration-200",
              active ? accent.onContainer : "text-on-surface-variant",
            )}
          >
            {active && (
              <motion.span
                layoutId="mobile-active-pill"
                className={cn("absolute inset-0 -z-10 rounded-full", accent.container)}
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            )}
            <Icon size={18} />
            <span className="truncate">{module.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
