"use client";

import { createElement } from "react";
import Link from "next/link";
import { Settings2 } from "lucide-react";
import type { Proyecto } from "@/modules/tareas/schema";
import { iconoDe } from "@/modules/tareas/iconos";
import { cn } from "cn";

export function EncabezadoProyecto({
  proyecto,
  total,
  completadas,
  pendientes,
  vencidas,
  progreso,
}: {
  proyecto: Proyecto;
  total: number;
  completadas: number;
  pendientes: number;
  vencidas: number;
  progreso: number;
}) {
  const Icono = iconoDe(proyecto.icono, "proyecto");

  return (
    <header className="space-y-3">
      <div className="flex items-start gap-3">
        <span
          className="grid size-11 shrink-0 place-items-center rounded-2xl"
          style={{
            backgroundColor: `color-mix(in oklab, ${proyecto.color} 18%, transparent)`,
            color: `color-mix(in oklab, ${proyecto.color} 72%, var(--color-on-surface))`,
          }}
        >
          {createElement(Icono, { size: 20 })}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-2xl font-semibold tracking-tight text-on-surface">
              {proyecto.nombre}
            </h1>
            {proyecto.archivado && (
              <span className="rounded-full bg-surface-container px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-on-surface-variant">
                Archivado
              </span>
            )}
            <span className="rounded-full bg-surface-container-low px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-on-surface-variant">
              {proyecto.prefijo}
            </span>
          </div>
          {proyecto.descripcion && (
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-on-surface-variant">
              {proyecto.descripcion}
            </p>
          )}
        </div>

        <Link
          href={`/tareas/proyectos/${proyecto.slug}/ajustes`}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-outline-variant/60 px-3 py-1.5 text-xs text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-on-surface"
        >
          <Settings2 size={13} />
          Ajustes
        </Link>
      </div>

      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <div>
          <div className="mb-1 flex items-center justify-between text-[11px] text-on-surface-variant">
            <span>
              {completadas} de {total} completadas
            </span>
            <span>{progreso}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-surface-container">
            <div
              className="h-full rounded-full transition-[width] duration-500"
              style={{
                width: `${progreso}%`,
                backgroundColor: proyecto.color,
              }}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
          <span className="rounded-full bg-surface-container-low px-2 py-1 text-on-surface-variant">
            {pendientes} pendientes
          </span>
          {vencidas > 0 && (
            <span
              className={cn(
                "rounded-full bg-error-container px-2 py-1 font-medium text-on-error-container",
              )}
            >
              {vencidas} vencidas
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
