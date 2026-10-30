"use client";

import { createElement } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  CalendarClock,
  CalendarDays,
  CheckSquare,
  ChevronRight,
  CircleCheckBig,
  Inbox,
  Plus,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { iconoDe } from "@/modules/tareas/iconos";
import type { ProyectoNav, ResumenNav } from "@/modules/tareas/lib/navegacion";
import { cn } from "cn";

const listas = [
  { slug: "hoy", label: "Hoy", icon: Sparkles },
  { slug: "proximas", label: "Próximas", icon: CalendarClock },
  { slug: "vencidas", label: "Vencidas", icon: TriangleAlert },
  { slug: "sin-fecha", label: "Sin fecha", icon: CalendarDays },
  { slug: "completadas", label: "Completadas", icon: CircleCheckBig },
  { slug: "todas", label: "Todas", icon: CheckSquare },
] as const;

type SlugLista = (typeof listas)[number]["slug"];

function conteo(resumen: ResumenNav, slug: SlugLista) {
  if (slug === "hoy") return resumen.hoy;
  if (slug === "proximas") return resumen.proximas;
  if (slug === "vencidas") return resumen.vencidas;
  if (slug === "sin-fecha") return resumen.sinFecha;
  if (slug === "completadas") return resumen.completadas;
  return resumen.total;
}

function enTareas(pathname: string) {
  return pathname.startsWith("/tareas");
}

/**
 * Secciones "Inteligentes" y "Proyectos" del sidebar global. Replican el
 * mock de Stitch: filas compactas con contador a la derecha.
 */
export function NavTareasLateral({
  resumen,
  proyectos,
  onNuevoProyecto,
}: {
  resumen: ResumenNav;
  proyectos: ProyectoNav[];
  onNuevoProyecto: () => void;
}) {
  const pathname = usePathname();
  const params = useSearchParams();
  const listaActiva = params.get("lista");
  const proyectoActivo =
    pathname.startsWith("/tareas/proyectos/")
      ? pathname.split("/")[3]
      : null;

  return (
    <div className="space-y-5 border-t border-outline-variant/50 pt-3.5">
      <div>
        <p className="mb-1.5 px-2.5 text-[10px] font-bold uppercase tracking-wider text-pebble">
          Inteligentes
        </p>
        <ul className="space-y-0.5">
          {listas.map((lista) => {
            const Icono = lista.icon;
            const total = conteo(resumen, lista.slug);
            const activa = enTareas(pathname) && listaActiva === lista.slug;
            const alerta = lista.slug === "vencidas" && total > 0;

            return (
              <li key={lista.slug}>
                <Link
                  href={`/tareas?lista=${lista.slug}`}
                  aria-current={activa ? "page" : undefined}
                  className={cn(
                    "flex items-center justify-between rounded-lg px-2.5 py-1 text-xs transition-colors",
                    activa
                      ? "bg-lime-voltage/15 font-semibold text-heading"
                      : "text-charcoal hover:bg-surface-container",
                    alerta && !activa && "text-error",
                  )}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <Icono
                      size={15}
                      className={cn(
                        "shrink-0",
                        alerta ? "text-error" : "text-pebble",
                      )}
                    />
                    <span className="truncate">{lista.label}</span>
                  </span>
                  <span
                    className={cn(
                      "shrink-0 text-[11px] font-semibold",
                      alerta ? "text-error" : "text-pebble",
                    )}
                  >
                    {total}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between px-2.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-pebble">
            Proyectos
          </p>
          <button
            type="button"
            onClick={onNuevoProyecto}
            title="Nuevo proyecto"
            aria-label="Nuevo proyecto"
            className="grid size-5 place-items-center rounded-full text-pebble transition-colors hover:bg-surface-container hover:text-primary"
          >
            <Plus size={14} />
          </button>
        </div>

        {proyectos.length === 0 ? (
          <p className="rounded-xl border border-dashed border-outline-variant/70 px-2.5 py-3 text-[11px] text-on-surface-variant">
            Todavía no hay proyectos.
          </p>
        ) : (
          <ul className="space-y-0.5">
            {proyectos.map((proyecto) => {
              const Icono = iconoDe(proyecto.icono, "proyecto");
              const activo = proyecto.slug === proyectoActivo;

              return (
                <li key={proyecto.id}>
                  <Link
                    href={`/tareas/proyectos/${proyecto.slug}`}
                    aria-current={activo ? "page" : undefined}
                    className={cn(
                      "flex items-center justify-between rounded-lg px-2.5 py-1 text-xs transition-colors",
                      activo
                        ? "bg-lime-voltage/15 font-semibold text-heading"
                        : "text-charcoal hover:bg-surface-container",
                      proyecto.archivado && "opacity-60",
                    )}
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span
                        className="grid size-4 shrink-0 place-items-center rounded"
                        style={{
                          backgroundColor: `color-mix(in oklab, ${proyecto.color} 16%, transparent)`,
                          color: `color-mix(in oklab, ${proyecto.color} 72%, var(--color-on-surface))`,
                        }}
                      >
                        {createElement(Icono, { size: 11 })}
                      </span>
                      <span className="truncate">{proyecto.nombre}</span>
                    </span>
                    {proyecto.vencidas > 0 ? (
                      <span className="grid size-4 shrink-0 place-items-center rounded-full bg-error/10 text-[10px] font-bold text-error">
                        {proyecto.vencidas}
                      </span>
                    ) : proyecto.pendientes > 0 ? (
                      <span className="shrink-0 text-[11px] font-semibold text-pebble">
                        {proyecto.pendientes}
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}

        <Link
          href="/tareas/ajustes"
          className="mt-1 flex items-center justify-between rounded-lg px-2.5 py-1 text-xs text-pebble transition-colors hover:bg-surface-container hover:text-charcoal"
        >
          <span className="flex items-center gap-2">
            <Inbox size={15} />
            Etiquetas y ajustes
          </span>
          <ChevronRight size={14} />
        </Link>
      </div>

      <div className="rounded-2xl bg-surface-container/60 p-3">
        <p className="text-[11px] font-semibold text-on-surface">
          Organizá por proyectos
        </p>
        <p className="mt-1 text-[10px] leading-relaxed text-on-surface-variant">
          Cada proyecto tiene estados propios, vistas guardadas y un prefijo de
          ID visible.
        </p>
      </div>
    </div>
  );
}

/**
 * Versión mobile de las listas inteligentes: chips horizontales con conteo,
 * porque el sidebar desaparece por debajo de `md`.
 */
export function NavTareasMovil({ resumen }: { resumen: ResumenNav }) {
  const params = useSearchParams();
  const listaActiva = params.get("lista");

  return (
    <nav
      aria-label="Listas inteligentes"
      className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none] md:hidden [&::-webkit-scrollbar]:hidden"
    >
      {listas.map((lista) => {
        const Icono = lista.icon;
        const total = conteo(resumen, lista.slug);
        const activa = listaActiva === lista.slug;
        const alerta = lista.slug === "vencidas" && total > 0;

        return (
          <Link
            key={lista.slug}
            href={`/tareas?lista=${lista.slug}`}
            aria-current={activa ? "page" : undefined}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-colors",
              activa
                ? "border-transparent bg-lime-voltage text-forest-ink"
                : "border-outline-variant/60 bg-card text-charcoal",
              alerta && !activa && "border-error/40 text-error",
            )}
          >
            <Icono
              size={13}
              className={cn(
                !activa && !alerta && "text-on-surface-variant",
                alerta && "text-error",
              )}
            />
            {lista.label}
            <span
              className={cn(
                "rounded-full px-1.5 text-[10px] font-bold",
                activa
                  ? "bg-forest-ink/10 text-forest-ink"
                  : "bg-surface-container-high text-on-surface-variant",
              )}
            >
              {total}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
