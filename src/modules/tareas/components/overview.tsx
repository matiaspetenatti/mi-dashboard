"use client";

import Link from "next/link";
import { createElement, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarClock,
  CalendarDays,
  CheckSquare,
  CircleCheckBig,
  FolderPlus,
  Plus,
  Settings2,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import type { ResumenProyecto } from "@/modules/tareas/queries/proyectos";
import type { ResumenGlobal } from "@/modules/tareas/queries/tareas";
import { iconoDe } from "@/modules/tareas/iconos";
import { cn } from "cn";
import { DialogoProyecto } from "./dialogo-proyecto";
import { NavTareasMovil } from "./nav-proyectos";

type Tono = "primary" | "neutro" | "error";

const listas = [
  {
    slug: "hoy",
    titulo: "Hoy",
    descripcion: "Lo que vence hoy",
    icon: Sparkles,
    tono: "primary",
  },
  {
    slug: "proximas",
    titulo: "Próximas",
    descripcion: "Los próximos 7 días",
    icon: CalendarClock,
    tono: "neutro",
  },
  {
    slug: "vencidas",
    titulo: "Vencidas",
    descripcion: "Necesitan atención",
    icon: TriangleAlert,
    tono: "error",
  },
  {
    slug: "sin-fecha",
    titulo: "Sin fecha",
    descripcion: "Para planificar",
    icon: CalendarDays,
    tono: "neutro",
  },
  {
    slug: "completadas",
    titulo: "Completadas",
    descripcion: "Lo que ya terminaste",
    icon: CircleCheckBig,
    tono: "primary",
  },
  {
    slug: "todas",
    titulo: "Todas",
    descripcion: "Todo el tablero",
    icon: CheckSquare,
    tono: "neutro",
  },
] as const satisfies ReadonlyArray<{
  slug: string;
  titulo: string;
  descripcion: string;
  icon: typeof Sparkles;
  tono: Tono;
}>;

const estilosTono: Record<Tono, { icono: string; numero: string; label: string }> =
  {
    primary: {
      icono: "bg-lime-voltage/15 text-primary",
      numero: "text-heading",
      label: "text-heading",
    },
    neutro: {
      icono: "bg-surface-container-high text-charcoal",
      numero: "text-heading",
      label: "text-heading",
    },
    error: {
      icono: "bg-error-container/60 text-error",
      numero: "text-error",
      label: "text-error",
    },
  };

function conteo(resumen: ResumenGlobal, slug: string) {
  if (slug === "hoy") return resumen.hoy;
  if (slug === "proximas") return resumen.proximas;
  if (slug === "vencidas") return resumen.vencidas;
  if (slug === "sin-fecha") return resumen.sinFecha;
  if (slug === "completadas") return resumen.completadas;
  return resumen.total;
}

export function TareasOverview({
  proyectos,
  resumen,
  abrirNuevo = false,
}: {
  proyectos: ResumenProyecto[];
  resumen: ResumenGlobal;
  abrirNuevo?: boolean;
}) {
  const [creando, setCreando] = useState(abrirNuevo);

  return (
    <div className="space-y-7">
      <NavTareasMovil resumen={resumen} />

      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-pebble">
            Gestor de proyectos
          </p>
          <h1 className="mt-0.5 text-4xl font-extrabold tracking-tight text-heading lg:text-5xl">
            Tareas
          </h1>
          <p className="mt-1 max-w-xl text-sm text-charcoal">
            Proyectos, estados y vistas para organizar todo lo que tenés en
            marcha.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/tareas/ajustes"
            className="inline-flex items-center gap-1.5 rounded-full border border-outline-variant/60 bg-card px-3.5 py-1.5 text-xs font-semibold text-charcoal transition-colors hover:bg-surface-container active:scale-[0.98]"
          >
            <Settings2 size={14} />
            Ajustes
          </Link>
          <button
            type="button"
            onClick={() => setCreando(true)}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-on-primary transition-colors hover:bg-primary/90 active:scale-[0.98]"
          >
            <Plus size={14} />
            Nuevo proyecto
          </button>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {listas.map((lista) => {
          const Icono = lista.icon;
          const total = conteo(resumen, lista.slug);
          const tono = estilosTono[lista.tono];

          return (
            <Link
              key={lista.slug}
              href={`/tareas?lista=${lista.slug}`}
              className="group flex flex-col justify-between rounded-2xl border border-outline-variant/50 bg-card p-3.5 transition-shadow hover:shadow-elevation-2"
            >
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    "grid size-7 place-items-center rounded-full",
                    tono.icono,
                  )}
                >
                  <Icono size={15} />
                </span>
                <ArrowUpRight
                  size={15}
                  className="text-on-surface-variant/40 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-on-surface-variant"
                />
              </div>
              <div className="mt-3">
                <p
                  className={cn(
                    "text-2xl font-black leading-none tracking-tight",
                    tono.numero,
                  )}
                >
                  {total}
                </p>
                <p className={cn("mt-1 text-xs font-bold", tono.label)}>
                  {lista.titulo}
                </p>
                <p className="mt-0.5 truncate text-[11px] text-pebble">
                  {lista.descripcion}
                </p>
              </div>
            </Link>
          );
        })}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between px-0.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-pebble">
            Proyectos
          </h2>
          <span className="text-xs text-pebble">
            {proyectos.length}{" "}
            {proyectos.length === 1 ? "proyecto" : "proyectos"}
          </span>
        </div>

        {proyectos.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-outline-variant/80 bg-card/60 px-6 py-12 text-center">
            <FolderPlus size={22} className="mx-auto text-on-surface-variant" />
            <p className="mt-2 text-sm font-semibold text-heading">
              Creá tu primer proyecto
            </p>
            <p className="mt-1 text-xs text-on-surface-variant">
              Cada proyecto arranca con estados y vistas listas para usar.
            </p>
            <button
              type="button"
              onClick={() => setCreando(true)}
              className="mt-3 rounded-full bg-primary px-4 py-2 text-xs font-bold text-on-primary"
            >
              Nuevo proyecto
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {proyectos.map((item) => {
              const { proyecto } = item;
              const Icono = iconoDe(proyecto.icono, "proyecto");
              const segmentos = item.porEstado.filter(
                (estado) => estado.total > 0,
              );

              return (
                <Link
                  key={proyecto.id}
                  href={`/tareas/proyectos/${proyecto.slug}`}
                  className={cn(
                    "group flex flex-col justify-between gap-4 rounded-2xl border border-outline-variant/50 bg-card p-5 transition-shadow hover:shadow-elevation-2",
                    proyecto.archivado && "opacity-60",
                  )}
                >
                  <div>
                    <div className="flex items-center gap-3">
                      <span
                        className="grid size-10 shrink-0 place-items-center rounded-2xl"
                        style={{
                          backgroundColor: `color-mix(in oklab, ${proyecto.color} 17%, transparent)`,
                          color: `color-mix(in oklab, ${proyecto.color} 72%, var(--color-on-surface))`,
                        }}
                      >
                        {createElement(Icono, { size: 20 })}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-base font-bold text-heading">
                            {proyecto.nombre}
                          </p>
                          <span className="shrink-0 rounded bg-surface-container px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-charcoal">
                            {proyecto.prefijo}
                          </span>
                        </div>
                        <p
                          className={cn(
                            "mt-0.5 line-clamp-2 text-xs",
                            proyecto.descripcion
                              ? "text-charcoal"
                              : "italic text-pebble",
                          )}
                        >
                          {proyecto.descripcion ?? "Sin descripción."}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5">
                      <div className="mb-1.5 flex items-center justify-between text-xs">
                        <span className="text-pebble">
                          {item.completadas}/{item.total} completadas
                        </span>
                        <span className="font-bold text-heading">
                          {item.progreso}%
                        </span>
                      </div>
                      <div className="flex h-2 gap-0.5 overflow-hidden rounded-full bg-surface-container-high">
                        {segmentos.map((estado) => (
                          <span
                            key={estado.estado.id}
                            style={{
                              width: `${(estado.total / item.total) * 100}%`,
                              backgroundColor: estado.estado.color,
                            }}
                            title={`${estado.estado.nombre}: ${estado.total}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-outline-variant/30 pt-3 text-xs">
                    <span className="font-medium text-charcoal">
                      {item.pendientes}{" "}
                      {item.pendientes === 1 ? "pendiente" : "pendientes"}
                    </span>
                    {item.vencidas > 0 ? (
                      <span className="flex items-center gap-1 font-medium text-error">
                        <span
                          aria-hidden="true"
                          className="size-1.5 rounded-full bg-error"
                        />
                        {item.vencidas}{" "}
                        {item.vencidas === 1 ? "vencida" : "vencidas"}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 font-semibold text-charcoal transition-colors group-hover:text-primary">
                        Abrir proyecto
                        <ArrowRight
                          size={12}
                          className="transition-transform group-hover:translate-x-0.5"
                        />
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <DialogoProyecto abierto={creando} onOpenChange={setCreando} />
    </div>
  );
}
