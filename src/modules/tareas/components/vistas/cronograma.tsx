"use client";

import type { TareaConDetalle } from "@/modules/tareas/queries/tareas";
import type { Etiqueta } from "@/modules/tareas/schema";
import type { ConfigVista } from "@/modules/tareas/lib/config-vista";
import { filtrarTareas, ordenarTareas } from "@/modules/tareas/lib/filtrar";
import { cn } from "cn";

function fechasDe(tarea: TareaConDetalle) {
  const inicio = tarea.fechaInicio ?? tarea.fechaLimite;
  const fin = tarea.fechaLimite ?? tarea.fechaInicio;
  if (!inicio || !fin) return null;
  return inicio <= fin ? { inicio, fin } : { inicio: fin, fin: inicio };
}

function diasEntre(desde: string, hasta: string) {
  return Math.round(
    (Date.parse(`${hasta}T00:00:00Z`) - Date.parse(`${desde}T00:00:00Z`)) /
      86_400_000,
  );
}

function sumar(fecha: string, dias: number) {
  return new Date(Date.parse(`${fecha}T00:00:00Z`) + dias * 86_400_000)
    .toISOString()
    .slice(0, 10);
}

export function VistaCronograma({
  tareas,
  estados,
  config,
  hoy,
  onAbrir,
}: {
  tareas: TareaConDetalle[];
  estados: { id: number; nombre: string; color: string }[];
  etiquetas: Etiqueta[];
  config: ConfigVista;
  hoy: string;
  onAbrir: (id: number) => void;
}) {
  const visibles = ordenarTareas(filtrarTareas(tareas, config, hoy), config);
  const conFechas = visibles
    .map((tarea) => ({ tarea, rango: fechasDe(tarea) }))
    .filter(
      (item): item is { tarea: TareaConDetalle; rango: { inicio: string; fin: string } } =>
        item.rango !== null,
    )
    .sort((a, b) => a.rango.inicio.localeCompare(b.rango.inicio));
  const sinFecha = visibles.filter((tarea) => !fechasDe(tarea));

  if (conFechas.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-outline-variant/80 bg-surface-container-lowest/60 px-6 py-14 text-center">
        <p className="text-sm font-medium text-on-surface">
          No hay tareas con fechas
        </p>
        <p className="mt-1 text-xs text-on-surface-variant">
          Asigná una fecha de inicio o límite para verlas en el cronograma.
        </p>
      </div>
    );
  }

  const inicioMinimo = conFechas.reduce(
    (min, item) => (item.rango.inicio < min ? item.rango.inicio : min),
    conFechas[0].rango.inicio,
  );
  const finMaximo = conFechas.reduce(
    (max, item) => (item.rango.fin > max ? item.rango.fin : max),
    conFechas[0].rango.fin,
  );

  let inicio = inicioMinimo < hoy ? inicioMinimo : hoy;
  let fin = finMaximo > sumar(hoy, 21) ? finMaximo : sumar(hoy, 21);
  if (diasEntre(inicio, fin) > 120) fin = sumar(inicio, 120);
  inicio = sumar(inicio, -2);
  fin = sumar(fin, 2);

  const totalDias = diasEntre(inicio, fin) + 1;
  const dias = Array.from({ length: totalDias }, (_, indice) =>
    sumar(inicio, indice),
  );
  const anchoMinimo = totalDias * 26 + 220;

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-2xl border border-outline-variant/60 bg-surface-container-lowest">
        <div style={{ minWidth: anchoMinimo }}>
          <div className="flex border-b border-outline-variant/60 bg-surface-container-low/70">
            <div className="sticky left-0 z-10 w-[210px] shrink-0 border-r border-outline-variant/50 bg-surface-container-low/95 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-on-surface-variant">
              Tarea
            </div>
            <div
              className="grid flex-1"
              style={{ gridTemplateColumns: `repeat(${totalDias}, minmax(26px, 1fr))` }}
            >
              {dias.map((dia) => {
                const esHoy = dia === hoy;
                const esLunes = new Date(`${dia}T00:00:00Z`).getUTCDay() === 1;
                return (
                  <div
                    key={dia}
                    className={cn(
                      "border-r border-outline-variant/30 px-0.5 py-1 text-center text-[9px] text-on-surface-variant",
                      esHoy && "bg-primary-container/40 font-semibold text-on-primary-container",
                      esLunes && "border-l border-l-outline-variant/60",
                    )}
                    title={dia}
                  >
                    <span className="block">{Number(dia.slice(8))}</span>
                    {dia.endsWith("-01") && (
                      <span className="block text-[8px] uppercase">
                        {new Intl.DateTimeFormat("es-AR", {
                          month: "short",
                          timeZone: "UTC",
                        }).format(new Date(`${dia}T00:00:00Z`))}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {conFechas.map(({ tarea, rango }) => {
            const desde = Math.max(0, diasEntre(inicio, rango.inicio));
            const hasta = Math.min(totalDias - 1, diasEntre(inicio, rango.fin));
            const color =
              estados.find((estado) => estado.id === tarea.estadoId)?.color ??
              tarea.estado.color;

            return (
              <div
                key={tarea.id}
                className="group flex border-b border-outline-variant/30 last:border-0 hover:bg-surface-container-low/50"
              >
                <button
                  type="button"
                  onClick={() => onAbrir(tarea.id)}
                  className="sticky left-0 z-10 w-[210px] shrink-0 truncate border-r border-outline-variant/50 bg-surface-container-lowest/95 px-3 py-2 text-left text-xs text-on-surface group-hover:bg-surface-container-low"
                >
                  <span className="block truncate font-medium">{tarea.titulo}</span>
                  <span className="text-[10px] text-on-surface-variant">
                    {tarea.proyecto.prefijo}-{tarea.id}
                  </span>
                </button>
                <div
                  className="grid flex-1 py-1.5"
                  style={{ gridTemplateColumns: `repeat(${totalDias}, minmax(26px, 1fr))` }}
                >
                  <button
                    type="button"
                    onClick={() => onAbrir(tarea.id)}
                    title={`${tarea.titulo} · ${rango.inicio} → ${rango.fin}`}
                    className="relative z-[1] flex min-w-0 items-center gap-1 overflow-hidden rounded-full px-2 py-0.5 text-left text-[10px] font-medium transition-transform hover:scale-y-105"
                    style={{
                      gridColumn: `${desde + 1} / ${hasta + 2}`,
                      backgroundColor: `color-mix(in oklab, ${color} 22%, transparent)`,
                      color: `color-mix(in oklab, ${color} 72%, var(--color-on-surface))`,
                    }}
                  >
                    <span
                      aria-hidden="true"
                      className="size-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <span className="truncate">{tarea.titulo}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {sinFecha.length > 0 && (
        <section className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-3">
          <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant">
            Sin fechas · {sinFecha.length}
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {sinFecha.map((tarea) => (
              <button
                key={tarea.id}
                type="button"
                onClick={() => onAbrir(tarea.id)}
                className="rounded-full border border-outline-variant/60 px-2.5 py-1 text-xs text-on-surface hover:bg-surface-container-low"
              >
                {tarea.titulo}
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
