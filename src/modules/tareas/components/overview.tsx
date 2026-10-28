"use client";

import Link from "next/link";
import { createElement, useState } from "react";
import {
  ArrowRight,
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
import { NavProyectos } from "./nav-proyectos";

const listas = [
  {
    slug: "hoy",
    titulo: "Hoy",
    descripcion: "Lo que vence hoy",
    icon: Sparkles,
    color: "var(--color-primary)",
  },
  {
    slug: "proximas",
    titulo: "Próximas",
    descripcion: "Los próximos 7 días",
    icon: CalendarClock,
    color: "var(--color-tertiary)",
  },
  {
    slug: "vencidas",
    titulo: "Vencidas",
    descripcion: "Necesitan atención",
    icon: TriangleAlert,
    color: "var(--color-error)",
  },
  {
    slug: "sin-fecha",
    titulo: "Sin fecha",
    descripcion: "Para planificar",
    icon: CalendarDays,
    color: "var(--color-secondary)",
  },
  {
    slug: "completadas",
    titulo: "Completadas",
    descripcion: "Lo que ya terminaste",
    icon: CircleCheckBig,
    color: "var(--color-success)",
  },
  {
    slug: "todas",
    titulo: "Todas",
    descripcion: "Todo el tablero",
    icon: CheckSquare,
    color: "var(--color-on-surface-variant)",
  },
] as const;

function conteo(resumen: ResumenGlobal, slug: string) {
  if (slug === "hoy") return resumen.hoy;
  if (slug === "proximas") return resumen.proximas;
  if (slug === "vencidas") return resumen.vencidas;
  if (slug === "sin-fecha") return resumen.sinFecha;
  if (slug === "completadas") return resumen.completadas;
  return resumen.pendientes;
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
    <div className="flex gap-6">
      <NavProyectos proyectos={proyectos} className="hidden w-52 shrink-0 lg:block" />

      <div className="min-w-0 flex-1 space-y-7">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
              Gestor de proyectos
            </p>
            <h1 className="mt-1 text-3xl font-medium tracking-tight text-on-surface md:text-4xl">
              Tareas
            </h1>
            <p className="mt-1 max-w-xl text-sm leading-relaxed text-on-surface-variant">
              Proyectos, estados y vistas para organizar todo lo que tenés en
              marcha.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/tareas/ajustes"
              className="inline-flex items-center gap-1.5 rounded-full border border-outline-variant/60 px-3 py-2 text-xs text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-on-surface"
            >
              <Settings2 size={13} />
              Ajustes
            </Link>
            <button
              type="button"
              onClick={() => setCreando(true)}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-medium text-on-primary shadow-elevation-1 transition-shadow hover:shadow-elevation-2"
            >
              <Plus size={13} />
              Nuevo proyecto
            </button>
          </div>
        </header>

        <section className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {listas.map((lista) => {
            const Icono = lista.icon;
            const total = conteo(resumen, lista.slug);
            return (
              <Link
                key={lista.slug}
                href={`/tareas?lista=${lista.slug}`}
                className="group relative overflow-hidden rounded-2xl border border-outline-variant/50 bg-surface-container-lowest p-3 transition-shadow hover:shadow-elevation-2"
              >
                <div className="flex items-center justify-between">
                  <span
                    className="grid size-7 place-items-center rounded-full"
                    style={{
                      backgroundColor:
                        "color-mix(in oklab, currentColor 12%, transparent)",
                      color: lista.color,
                    }}
                  >
                    <Icono size={13} />
                  </span>
                  <ArrowRight
                    size={13}
                    className="text-on-surface-variant/50 transition-transform group-hover:translate-x-0.5"
                  />
                </div>
                <p className="mt-2 text-2xl font-medium leading-none text-on-surface">
                  {total}
                </p>
                <p className="mt-1 text-xs font-medium text-on-surface">
                  {lista.titulo}
                </p>
                <p className="text-[10px] text-on-surface-variant">
                  {lista.descripcion}
                </p>
              </Link>
            );
          })}
        </section>

        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
              Proyectos
            </h2>
            <span className="text-[11px] text-on-surface-variant">
              {proyectos.length} {proyectos.length === 1 ? "proyecto" : "proyectos"}
            </span>
          </div>

          {proyectos.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-outline-variant/80 bg-surface-container-lowest/60 px-6 py-12 text-center">
              <FolderPlus size={22} className="mx-auto text-on-surface-variant" />
              <p className="mt-2 text-sm font-medium text-on-surface">
                Creá tu primer proyecto
              </p>
              <p className="mt-1 text-xs text-on-surface-variant">
                Cada proyecto arranca con estados y vistas listas para usar.
              </p>
              <button
                type="button"
                onClick={() => setCreando(true)}
                className="mt-3 rounded-full bg-primary px-4 py-2 text-xs font-medium text-on-primary"
              >
                Nuevo proyecto
              </button>
            </div>
          ) : (
            <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
              {proyectos.map((item) => {
                const { proyecto } = item;
                const Icono = iconoDe(proyecto.icono, "proyecto");
                return (
                  <Link
                    key={proyecto.id}
                    href={`/tareas/proyectos/${proyecto.slug}`}
                    className={cn(
                      "group flex flex-col gap-3 rounded-2xl border border-outline-variant/50 bg-surface-container-lowest p-4 transition-shadow hover:shadow-elevation-2",
                      proyecto.archivado && "opacity-60",
                    )}
                  >
                    <div className="flex items-start gap-2.5">
                      <span
                        className="grid size-9 shrink-0 place-items-center rounded-xl"
                        style={{
                          backgroundColor: `color-mix(in oklab, ${proyecto.color} 17%, transparent)`,
                          color: `color-mix(in oklab, ${proyecto.color} 72%, var(--color-on-surface))`,
                        }}
                      >
                        {createElement(Icono, { size: 16 })}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate text-sm font-semibold text-on-surface">
                            {proyecto.nombre}
                          </p>
                          <span className="rounded bg-surface-container-low px-1 text-[9px] font-semibold uppercase tracking-wider text-on-surface-variant">
                            {proyecto.prefijo}
                          </span>
                        </div>
                        <p className="mt-0.5 line-clamp-2 min-h-8 text-[11px] leading-relaxed text-on-surface-variant">
                          {proyecto.descripcion ?? "Sin descripción."}
                        </p>
                      </div>
                    </div>

                    <div>
                      <div className="mb-1 flex items-center justify-between text-[10px] text-on-surface-variant">
                        <span>
                          {item.completadas}/{item.total} completadas
                        </span>
                        <span>{item.progreso}%</span>
                      </div>
                      <div className="flex h-1.5 overflow-hidden rounded-full bg-surface-container">
                        {item.porEstado
                          .filter((estado) => estado.total > 0)
                          .map((estado) => (
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

                    <div className="flex items-center justify-between text-[10px] text-on-surface-variant">
                      <span>{item.pendientes} pendientes</span>
                      {item.vencidas > 0 ? (
                        <span className="font-medium text-error">
                          {item.vencidas} vencidas
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-on-surface-variant/70">
                          Abrir proyecto
                          <ArrowRight
                            size={10}
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
      </div>

      <DialogoProyecto
        abierto={creando}
        onOpenChange={setCreando}
      />
    </div>
  );
}
