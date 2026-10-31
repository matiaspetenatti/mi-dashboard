"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton, UserButton, useUser } from "@clerk/nextjs";
import { motion } from "motion/react";
import { LogOut, Plus, Settings, Sparkles, Zap } from "lucide-react";
import { cn } from "cn";
import { modules, type AppModule } from "@/lib/modules";
import { SoloCliente } from "@/components/solo-cliente";
import type { NavegacionTareas } from "@/modules/tareas/lib/navegacion";
import { NavTareasLateral } from "@/modules/tareas/components/nav-proyectos";
import { DialogoNuevaTarea } from "@/modules/tareas/components/dialogo-nueva-tarea";
import { DialogoProyecto } from "@/modules/tareas/components/dialogo-proyecto";
import { ThemeToggle } from "./theme-toggle";

function isActivePath(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

function iniciales(nombre?: string | null) {
  const partes = (nombre ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  return partes.map((parte) => parte[0]?.toUpperCase() ?? "").join("") || "?";
}

function NavItem({
  module,
  pathname,
  pendientes,
}: {
  module: AppModule;
  pathname: string;
  pendientes?: number;
}) {
  const active = isActivePath(pathname, module.href);
  const Icon = module.icon;
  const mostrarBadge = module.slug === "tareas" && (pendientes ?? 0) > 0;

  return (
    <Link
      href={module.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative isolate flex items-center justify-between rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200 active:scale-[0.98]",
        active
          ? "font-bold text-forest-ink"
          : "text-charcoal hover:bg-surface-container hover:text-heading",
      )}
    >
      {active && (
        <motion.span
          layoutId="sidebar-active-pill"
          className="absolute inset-0 -z-10 rounded-full bg-lime-voltage dark:shadow-[0_2px_10px_rgba(159,232,112,0.25)]"
          transition={{ type: "spring", stiffness: 380, damping: 32 }}
        />
      )}

      <span className="flex min-w-0 items-center gap-2">
        <Icon size={19} className="shrink-0" />
        <span className="truncate">{module.label}</span>
      </span>

      {mostrarBadge ? (
        <span
          className={cn(
            "ml-2 inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-bold leading-none",
            active
              ? "bg-forest-ink text-lime-voltage"
              : "bg-surface-container-high text-charcoal",
          )}
        >
          {pendientes}
        </span>
      ) : (
        active && (
          <span
            aria-hidden="true"
            className="ml-2 size-2 shrink-0 rounded-full bg-forest-ink"
          />
        )
      )}
    </Link>
  );
}

function Marca() {
  return (
    <Link
      href="/"
      className="flex items-center gap-2.5 rounded-2xl px-1 py-1 transition-colors hover:bg-surface-container/60"
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-lime-voltage text-forest-ink shadow-sm">
        <Zap size={19} fill="currentColor" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[20px] font-bold leading-none tracking-tight text-heading">
          Mi dashboard
        </span>
        <span className="mt-1 block truncate text-xs text-charcoal">
          Tu día, en orden
        </span>
      </span>
    </Link>
  );
}

function BloqueUsuario() {
  const { user } = useUser();
  const nombre =
    user?.fullName ??
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ??
    "";
  const email = user?.primaryEmailAddress?.emailAddress ?? "Cuenta personal";

  return (
    <div className="flex items-center gap-2.5 rounded-[14px] px-2 py-2 transition-colors hover:bg-surface-container">
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary-container text-[11px] font-bold text-on-primary-container">
        {iniciales(nombre)}
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-xs font-semibold text-heading">
          {nombre || "Tu cuenta"}
        </span>
        <span className="truncate text-[11px] text-on-surface-variant">
          {email}
        </span>
      </span>
    </div>
  );
}

export function Sidebar({
  pendientes = 0,
  tareas = null,
}: {
  pendientes?: number;
  tareas?: NavegacionTareas | null;
}) {
  const pathname = usePathname();
  const [nuevoProyecto, setNuevoProyecto] = useState(false);
  const [nuevaTarea, setNuevaTarea] = useState(false);
  const enTareas = pathname.startsWith("/tareas");
  const mostrarTareas = Boolean(tareas) && enTareas;

  const claseCta =
    "flex w-full items-center justify-center gap-2 rounded-full bg-lime-voltage px-4 py-2.5 text-sm font-bold text-forest-ink shadow-sm transition-[filter] duration-200 hover:brightness-105 active:scale-[0.98] dark:shadow-[0_0_15px_rgba(159,232,112,0.25)]";

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col justify-between overflow-y-auto border-r border-outline-variant/50 bg-card p-4 md:flex dark:bg-sidebar">
      <div className="flex flex-col gap-4">
        <Marca />

        <div className="flex items-center justify-between px-2 pt-1">
          <span className="text-xs font-bold uppercase tracking-wider text-pebble">
            Espacios
          </span>
          <span className="inline-flex items-center rounded-full bg-linen-mist px-2 py-0.5 text-[11px] font-semibold text-forest-ink dark:bg-surface-container-high dark:text-lime-voltage">
            Personal
          </span>
        </div>

        <nav className="flex flex-col gap-1">
          {modules.map((module) => (
            <NavItem
              key={module.slug}
              module={module}
              pathname={pathname}
              pendientes={pendientes}
            />
          ))}
        </nav>

        {mostrarTareas && tareas && (
          <NavTareasLateral
            resumen={tareas.resumen}
            proyectos={tareas.proyectos}
            onNuevoProyecto={() => setNuevoProyecto(true)}
          />
        )}
      </div>

      <div className="flex flex-col gap-2 pt-4">
        <div className="flex items-center justify-between gap-2 rounded-[16px] border border-outline-variant/60 bg-surface-bright p-3">
          <div className="flex min-w-0 items-center gap-2">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-surface-container text-primary">
              <Sparkles size={15} />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-xs font-semibold text-heading">
                Estilo Wise
              </span>
              <span className="block truncate text-[11px] text-on-surface-variant">
                Voltage Moss
              </span>
            </span>
          </div>
          <ThemeToggle className="size-8 shrink-0" />
        </div>

        {mostrarTareas && tareas ? (
          <button type="button" onClick={() => setNuevaTarea(true)} className={claseCta}>
            <Plus size={16} />
            Nueva Tarea
          </button>
        ) : (
          <Link href="/tareas" className={claseCta}>
            <Plus size={16} />
            Nueva Tarea
          </Link>
        )}

        <div className="mt-1 flex flex-col gap-1 border-t border-outline-variant/50 pt-3">
          <BloqueUsuario />

          <div className="flex items-center justify-between gap-2 px-2 pt-1">
            <Link
              href="/tareas/ajustes"
              className="flex items-center gap-1.5 text-xs text-charcoal transition-colors hover:text-primary"
            >
              <Settings size={14} />
              Ajustes
            </Link>

            <SignOutButton redirectUrl="/sign-in">
              <button
                type="button"
                className="flex items-center gap-1.5 text-xs text-charcoal transition-colors hover:text-alarm-red"
              >
                <LogOut size={14} />
                Cerrar Sesión
              </button>
            </SignOutButton>
          </div>
        </div>
      </div>

      {mostrarTareas && tareas && (
        <>
          <DialogoNuevaTarea
            abierto={nuevaTarea}
            onOpenChange={setNuevaTarea}
            proyectos={tareas.proyectos}
          />
          <DialogoProyecto
            abierto={nuevoProyecto}
            onOpenChange={setNuevoProyecto}
          />
        </>
      )}
    </aside>
  );
}

export function MobileHeader() {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-outline-variant/50 bg-surface/90 px-4 py-3 backdrop-blur-md md:hidden">
      <Link href="/" className="flex min-w-0 items-center gap-2.5">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-lime-voltage text-forest-ink shadow-sm">
          <Zap size={17} fill="currentColor" />
        </span>
        <span className="truncate text-sm font-bold tracking-tight text-heading">
          Mi dashboard
        </span>
      </Link>

      <div className="flex shrink-0 items-center gap-1.5">
        <ThemeToggle className="size-8" />
        <SoloCliente>
          <UserButton
            appearance={{ elements: { avatarBox: "size-8" } }}
            showName={false}
          />
        </SoloCliente>
        <SignOutButton redirectUrl="/sign-in">
          <button
            type="button"
            className="grid size-8 place-items-center rounded-full bg-surface-container text-charcoal transition-colors hover:text-alarm-red"
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
          >
            <LogOut size={15} />
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
      className="fixed inset-x-0 bottom-0 z-40 mx-auto mb-3 flex w-[calc(100%-1.5rem)] max-w-md items-stretch justify-between gap-0.5 rounded-full border border-outline-variant/50 bg-card p-1.5 shadow-elevation-1 md:hidden"
      style={{
        paddingBottom: "max(0.375rem, env(safe-area-inset-bottom))",
      }}
    >
      {modules.map((module) => {
        const active = isActivePath(pathname, module.href);
        const Icon = module.icon;

        return (
          <Link
            key={module.slug}
            href={module.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative isolate flex flex-1 flex-col items-center gap-1 rounded-full px-1 py-2 text-[9px] font-semibold transition-colors duration-200",
              active ? "text-forest-ink" : "text-on-surface-variant",
            )}
          >
            {active && (
              <motion.span
                layoutId="mobile-active-pill"
                className="absolute inset-0 -z-10 rounded-full bg-lime-voltage"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            )}
            <Icon size={18} />
            <span className="max-w-full truncate">{module.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
