"use client";

import { createElement } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarClock,
  CalendarDays,
  CheckSquare,
  ChevronRight,
  CircleCheckBig,
  FolderKanban,
  Inbox,
  Plus,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import type { ResumenProyecto } from "@/modules/tareas/queries/proyectos";
import { iconoDe } from "@/modules/tareas/iconos";
import { cn } from "cn";

const listas = [
  { slug: "hoy", label: "Hoy", icon: Sparkles },
  { slug: "proximas", label: "Próximas", icon: CalendarClock },
  { slug: "vencidas", label: "Vencidas", icon: TriangleAlert },
  { slug: "sin-fecha", label: "Sin fecha", icon: CalendarDays },
  { slug: "completadas", label: "Completadas", icon: CircleCheckBig },
  { slug: "todas", label: "Todas", icon: CheckSquare },
] as const;

export function NavProyectos({
  proyectos,
  listaActiva,
  slugActivo,
  className,
}: {
  proyectos: ResumenProyecto[];
  listaActiva?: string | null;
  slugActivo?: string;
  className?: string;
}) {
  const pathname = usePathname();
  const enTareas = pathname === "/tareas";

  return (
    <nav className={cn("space-y-4 text-sm", className)} aria-label="Proyectos">
      <div>
        <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-on-surface-variant/70">
          Inteligentes
        </p>
        <ul className="space-y-0.5">
          {listas.map((lista) => {
            const activa = enTareas && listaActiva === lista.slug;
            const Icono = lista.icon;
            return (
              <li key={lista.slug}>
                <Link
                  href={`/tareas?lista=${lista.slug}`}
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-2 py-1.5 text-xs transition-colors",
                    activa
                      ? "bg-primary-container/60 font-medium text-on-primary-container"
                      : "text-on-surface-variant hover:bg-on-surface/5 hover:text-on-surface",
                  )}
                >
                  <Icono size={14} />
                  <span className="flex-1 truncate">{lista.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between px-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-on-surface-variant/70">
            Proyectos
          </p>
          <Link
            href="/tareas?nuevo=1"
            aria-label="Nuevo proyecto"
            className="grid size-5 place-items-center rounded-full text-on-surface-variant hover:bg-on-surface/5"
          >
            <Plus size={12} />
          </Link>
        </div>

        {proyectos.length === 0 ? (
          <div className="rounded-xl border border-dashed border-outline-variant/70 px-2.5 py-3 text-[11px] text-on-surface-variant">
            Todavía no hay proyectos.
          </div>
        ) : (
          <ul className="space-y-0.5">
            {proyectos.map(({ proyecto, pendientes, vencidas }) => {
              const Icono = iconoDe(proyecto.icono, "proyecto");
              const activo = proyecto.slug === slugActivo;
              return (
                <li key={proyecto.id}>
                  <Link
                    href={`/tareas/proyectos/${proyecto.slug}`}
                    className={cn(
                      "flex items-center gap-2 rounded-xl px-2 py-1.5 text-xs transition-colors",
                      activo
                        ? "bg-surface-container text-on-surface"
                        : "text-on-surface-variant hover:bg-on-surface/5 hover:text-on-surface",
                      proyecto.archivado && "opacity-50",
                    )}
                  >
                    <span
                      className="grid size-5 shrink-0 place-items-center rounded-md"
                      style={{
                        backgroundColor: `color-mix(in oklab, ${proyecto.color} 16%, transparent)`,
                        color: `color-mix(in oklab, ${proyecto.color} 72%, var(--color-on-surface))`,
                      }}
                    >
                      {createElement(Icono, { size: 11 })}
                    </span>
                    <span className="flex-1 truncate">{proyecto.nombre}</span>
                    {vencidas > 0 ? (
                      <span className="rounded-full bg-error-container px-1.5 text-[9px] font-semibold text-on-error-container">
                        {vencidas}
                      </span>
                    ) : pendientes > 0 ? (
                      <span className="text-[9px] text-on-surface-variant/70">
                        {pendientes}
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <Link
        href="/tareas/ajustes"
        className="flex items-center gap-2 rounded-xl px-2 py-1.5 text-xs text-on-surface-variant transition-colors hover:bg-on-surface/5 hover:text-on-surface"
      >
        <FolderKanban size={14} />
        <span className="flex-1">Etiquetas y ajustes</span>
        <ChevronRight size={12} />
      </Link>

      <div className="rounded-2xl bg-surface-container/60 p-3">
        <p className="flex items-center gap-1.5 text-[11px] font-medium text-on-surface">
          <Inbox size={12} />
          Organizá por proyectos
        </p>
        <p className="mt-1 text-[10px] leading-relaxed text-on-surface-variant">
          Cada proyecto tiene estados propios, vistas guardadas y un prefijo de
          ID visible.
        </p>
      </div>
    </nav>
  );
}
