"use client";

import { CalendarClock, ListChecks, Repeat } from "lucide-react";
import type {
  EstadoDeTarea,
  TareaConDetalle,
} from "@/modules/tareas/queries/tareas";
import { textoVencimiento } from "@/modules/tareas/constantes";
import { cn } from "cn";
import { Checkbox } from "./ui/checkbox";
import { EtiquetaChip, PrioridadChip } from "./chips";

export function FilaTarea({
  tarea,
  hoy,
  onAbrir,
  onAlternar,
  mostrarProyecto = false,
  estado,
}: {
  tarea: TareaConDetalle;
  hoy: string;
  onAbrir: () => void;
  onAlternar: () => void;
  mostrarProyecto?: boolean;
  estado?: EstadoDeTarea | null;
}) {
  const completada = tarea.estado.categoria === "completado";
  const vencimiento = textoVencimiento(tarea.fechaLimite, hoy);
  const vencida =
    !completada && tarea.fechaLimite !== null && tarea.fechaLimite < hoy;

  return (
    <li
      className={cn(
        "group flex cursor-pointer items-start gap-3 px-3 py-2.5 transition-colors hover:bg-surface-container-low/70",
        completada && "opacity-70",
      )}
      onClick={onAbrir}
    >
      <Checkbox
        checked={completada}
        ariaLabel={completada ? "Marcar como pendiente" : "Marcar como hecha"}
        onChange={onAlternar}
        className="mt-0.5"
      />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <p
            className={cn(
              "min-w-0 truncate text-sm font-medium text-on-surface",
              completada && "text-on-surface-variant line-through",
            )}
          >
            {tarea.titulo}
          </p>
          {tarea.prioridad && (
            <PrioridadChip prioridad={tarea.prioridad} conTexto={false} />
          )}
          {mostrarProyecto && (
            <span
              className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium"
              style={{
                backgroundColor: `color-mix(in oklab, ${tarea.proyecto.color} 13%, transparent)`,
                color: `color-mix(in oklab, ${tarea.proyecto.color} 72%, var(--color-on-surface))`,
              }}
            >
              {tarea.proyecto.nombre}
            </span>
          )}
        </div>

        <div className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-on-surface-variant">
          {estado && (
            <span className="inline-flex items-center gap-1">
              <span
                aria-hidden="true"
                className="size-1.5 rounded-full"
                style={{ backgroundColor: estado.color }}
              />
              {estado.nombre}
            </span>
          )}
          {vencimiento && (
            <span
              className={cn(
                "inline-flex items-center gap-1",
                vencida && "font-medium text-error",
              )}
            >
              <CalendarClock size={11} />
              {vencimiento}
            </span>
          )}
          {tarea.recurrencia && (
            <span className="inline-flex items-center gap-1">
              <Repeat size={11} />
            </span>
          )}
          {tarea.subtareas.length > 0 && (
            <span className="inline-flex items-center gap-1">
              <ListChecks size={11} />
              {tarea.subtareasCompletadas}/{tarea.subtareas.length}
            </span>
          )}
          {tarea.etiquetas.map((etiqueta) => (
            <EtiquetaChip key={etiqueta.id} etiqueta={etiqueta} />
          ))}
        </div>
      </div>

      <span className="hidden shrink-0 self-center text-[10px] font-medium text-on-surface-variant/50 sm:block">
        {tarea.proyecto.prefijo}-{tarea.id}
      </span>
    </li>
  );
}
