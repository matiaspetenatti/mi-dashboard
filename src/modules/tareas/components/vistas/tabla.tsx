"use client";

import type { TareaConDetalle } from "@/modules/tareas/queries/tareas";
import type { EstadoProyecto, Etiqueta } from "@/modules/tareas/schema";
import type { ConfigVista } from "@/modules/tareas/lib/config-vista";
import {
  etiquetasColumna,
  type ColumnaTabla,
} from "@/modules/tareas/lib/config-vista";
import { filtrarTareas, ordenarTareas } from "@/modules/tareas/lib/filtrar";
import { textoVencimiento } from "@/modules/tareas/constantes";
import { cn } from "cn";
import { Checkbox } from "../ui/checkbox";
import { EstadoChip, EtiquetaChip, PrioridadChip } from "../chips";

function fechaCorta(fecha: string | null) {
  if (!fecha) return "—";
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(`${fecha}T00:00:00Z`));
}

export function VistaTabla({
  tareas,
  estados,
  config,
  hoy,
  onAbrir,
  onAlternar,
}: {
  tareas: TareaConDetalle[];
  estados: EstadoProyecto[];
  etiquetas: Etiqueta[];
  config: ConfigVista;
  hoy: string;
  onAbrir: (id: number) => void;
  onAlternar: (id: number) => void;
}) {
  const visibles = ordenarTareas(filtrarTareas(tareas, config, hoy), config);
  const columnas = config.columnas.length > 0 ? config.columnas : [...etiquetasColumnaKeys];

  if (visibles.length === 0) {
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
    <div className="overflow-x-auto rounded-2xl border border-outline-variant/60 bg-surface-container-lowest">
      <table className="w-full min-w-[760px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-outline-variant/60 bg-surface-container-low/70 text-[10px] uppercase tracking-[0.12em] text-on-surface-variant">
            <th className="w-10 px-3 py-2.5" aria-label="Completar" />
            <th className="min-w-56 px-2 py-2.5 font-semibold">Tarea</th>
            {columnas.map((columna) => (
              <th key={columna} className="whitespace-nowrap px-2 py-2.5 font-semibold">
                {etiquetasColumna[columna]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {visibles.map((tarea) => {
            const completada = tarea.estado.categoria === "completado";
            const vencimiento = textoVencimiento(tarea.fechaLimite, hoy);
            const vencida =
              !completada &&
              tarea.fechaLimite !== null &&
              tarea.fechaLimite < hoy;

            return (
              <tr
                key={tarea.id}
                onClick={() => onAbrir(tarea.id)}
                className="cursor-pointer border-b border-outline-variant/40 transition-colors last:border-0 hover:bg-surface-container-low/60"
              >
                <td className="px-3 py-2.5 align-middle">
                  <Checkbox
                    checked={completada}
                    ariaLabel="Completar tarea"
                    onChange={() => onAlternar(tarea.id)}
                  />
                </td>
                <td className="max-w-80 px-2 py-2.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "truncate font-medium text-on-surface",
                        completada && "text-on-surface-variant line-through",
                      )}
                    >
                      {tarea.titulo}
                    </span>
                    <span className="shrink-0 text-[10px] text-on-surface-variant/60">
                      {tarea.proyecto.prefijo}-{tarea.id}
                    </span>
                  </div>
                </td>
                {columnas.map((columna) => (
                  <td
                    key={columna}
                    className="whitespace-nowrap px-2 py-2.5 text-xs text-on-surface-variant"
                  >
                    {celda(columna, tarea, estados, vencimiento, vencida)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function celda(
  columna: ColumnaTabla,
  tarea: TareaConDetalle,
  estados: EstadoProyecto[],
  vencimiento: string | null,
  vencida: boolean,
) {
  switch (columna) {
    case "estado": {
      const estado =
        estados.find((item) => item.id === tarea.estadoId) ?? tarea.estado;
      return <EstadoChip estado={estado} />;
    }
    case "prioridad":
      return tarea.prioridad ? (
        <PrioridadChip prioridad={tarea.prioridad} />
      ) : (
        <span className="text-on-surface-variant/50">—</span>
      );
    case "etiquetas":
      return tarea.etiquetas.length > 0 ? (
        <span className="flex flex-wrap gap-1">
          {tarea.etiquetas.map((etiqueta) => (
            <EtiquetaChip key={etiqueta.id} etiqueta={etiqueta} />
          ))}
        </span>
      ) : (
        <span className="text-on-surface-variant/50">—</span>
      );
    case "fechaInicio":
      return fechaCorta(tarea.fechaInicio);
    case "fechaLimite":
      return tarea.fechaLimite ? (
        <span className={cn(vencida && "font-medium text-error")}>
          {vencimiento ?? fechaCorta(tarea.fechaLimite)}
        </span>
      ) : (
        <span className="text-on-surface-variant/50">—</span>
      );
    case "subtareas":
      return tarea.subtareas.length > 0
        ? `${tarea.subtareasCompletadas}/${tarea.subtareas.length}`
        : "—";
    case "actualizada":
      return fechaCorta(tarea.actualizadaEn?.slice(0, 10) ?? tarea.creadaEn.slice(0, 10));
  }
}

const etiquetasColumnaKeys: ColumnaTabla[] = [
  "estado",
  "prioridad",
  "etiquetas",
  "fechaInicio",
  "fechaLimite",
  "subtareas",
  "actualizada",
];
