"use client";

import type { TareaConDetalle } from "@/modules/tareas/queries/tareas";
import type { EstadoProyecto, Etiqueta } from "@/modules/tareas/schema";
import type { ConfigVista } from "@/modules/tareas/lib/config-vista";
import { agruparTareas, filtrarTareas, ordenarTareas } from "@/modules/tareas/lib/filtrar";
import { FilaTarea } from "../fila-tarea";

export function VistaLista({
  tareas,
  estados,
  etiquetas,
  config,
  hoy,
  onAbrir,
  onAlternar,
  mostrarProyecto = false,
}: {
  tareas: TareaConDetalle[];
  estados: EstadoProyecto[];
  etiquetas: Etiqueta[];
  config: ConfigVista;
  hoy: string;
  onAbrir: (id: number) => void;
  onAlternar: (id: number) => void;
  mostrarProyecto?: boolean;
}) {
  const filtradas = ordenarTareas(filtrarTareas(tareas, config, hoy), config);
  const grupos = agruparTareas(filtradas, config, estados, etiquetas);

  if (filtradas.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-outline-variant/80 bg-surface-container-lowest/60 px-6 py-14 text-center">
        <p className="text-sm font-medium text-on-surface">No hay tareas que coincidan</p>
        <p className="mt-1 text-xs text-on-surface-variant">
          Ajustá los filtros o creá una tarea nueva.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {grupos.map((grupo) => (
        <section key={grupo.clave}>
          <header className="mb-1.5 flex items-center gap-2 px-1">
            {grupo.color && (
              <span
                aria-hidden="true"
                className="size-2 rounded-full"
                style={{ backgroundColor: grupo.color }}
              />
            )}
            <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant">
              {grupo.titulo}
            </h2>
            <span className="rounded-full bg-surface-container px-1.5 text-[10px] font-medium text-on-surface-variant">
              {grupo.tareas.length}
            </span>
          </header>
          <ul className="divide-y divide-outline-variant/40 overflow-hidden rounded-2xl border border-outline-variant/60 bg-surface-container-lowest">
            {grupo.tareas.map((tarea) => (
              <FilaTarea
                key={tarea.id}
                tarea={tarea}
                hoy={hoy}
                onAbrir={() => onAbrir(tarea.id)}
                onAlternar={() => onAlternar(tarea.id)}
                mostrarProyecto={mostrarProyecto}
                estado={config.agruparPor === "estado" ? null : tarea.estado}
              />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
