"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import type { Habito } from "@/modules/habitos/schema";
import {
  generarHeatmapData,
  obtenerUltimoAnioDias,
  agruparPorSemanas,
  nivelIntensidad,
} from "@/modules/habitos/lib/heatmap-utils";
import { DIAS_SEMANA } from "@/modules/habitos/constantes";

interface HeatmapProps {
  habito: Habito;
  registros: Array<{ fecha: string; completado: boolean }>;
  tamañoCelda?: number;
  gap?: number;
  onFechaClick?: (fecha: string, completado: boolean) => void;
}

const NIVELES_COLOR = [
  "bg-surface-container-low",   // 0 - sin actividad
  "bg-success-container/30",    // 1 - actividad (completado / día limpio)
];

export function Heatmap({
  habito,
  registros,
  onFechaClick,
}: HeatmapProps) {
  const [fechaSeleccionada, setFechaSeleccionada] = useState<string | null>(null);

  const mapaCompletados = generarHeatmapData(registros);
  const fechas = obtenerUltimoAnioDias();
  const semanas = agruparPorSemanas(fechas);

  const hoy = new Date().toISOString().slice(0, 10);
  const esHoy = (fecha: string) => fecha === hoy;

  const celdaSeleccionada = fechaSeleccionada
    ? Array.from(mapaCompletados.entries()).find(([f]) => f === fechaSeleccionada)
    : null;

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-pebble">
            Historial del último año
          </p>
          <p className="text-xs text-charcoal font-medium">
            {habito.tipo === "bueno" ? "Días completados" : "Días limpios"}
          </p>
        </div>

        <div className="flex items-center gap-2 text-[10px]">
          <span
            className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium ${NIVELES_COLOR[0]} text-on-surface-variant`}
          >
            <span className="size-2 rounded-full bg-pebble" /> Sin actividad
          </span>
          <span
            className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium ${NIVELES_COLOR[1]} text-on-success-container`}
          >
            <span className="size-2 rounded-full bg-success" /> {habito.tipo === "bueno" ? "Completado" : "Día limpio"}
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-fit">
          {/* Etiquetas de días (eje Y) */}
          <div className="flex flex-col gap-[calc(10px+2px)]">
            {DIAS_SEMANA.map((dia) => (
              <div
                key={dia.clave}
                className="flex h-[10px] items-end justify-end pr-1 text-[9px] text-pebble"
              >
                {dia.etiqueta}
              </div>
            ))}
          </div>

          {/* Grid de semanas */}
          <div className="flex gap-[calc(10px+2px)]">
            {semanas.map((semana, si) => (
              <div key={si} className="flex gap-1.5">
                {semana.map((fecha, di) => {
                  const esValido = fecha !== null;
                  const completado = esValido ? Boolean(mapaCompletados.get(fecha)) : false;
                  const intensidad = esValido ? nivelIntensidad(completado) : 0;
                  const esSeleccionado = fechaSeleccionada === fecha;
                  const esHoyDia = esHoy(fecha || "");

                  if (!esValido) {
                    return (
                      <div
                        key={di}
                        className={`size-[10px] rounded-sm ${NIVELES_COLOR[0]}`}
                      />
                    );
                  }

                  const label = format(parseISO(fecha), "dd/MM/yyyy");
                  const estadoTexto = completado
                    ? habito.tipo === "bueno"
                      ? "Completado"
                      : "Día limpio"
                    : habito.tipo === "bueno"
                      ? "No completado"
                      : "Recaída";

                  return (
                    <button
                      key={di}
                      onClick={() => {
                        setFechaSeleccionada(fecha);
                        onFechaClick?.(fecha, completado);
                      }}
                      className={`
                        size-[10px] rounded-sm transition-all duration-200
                        ${NIVELES_COLOR[intensidad]}
                        ${esSeleccionado ? "ring-2 ring-success ring-offset-1" : ""}
                        ${esHoyDia && !esSeleccionado ? "ring-1 ring-pebble" : ""}
                        hover:scale-125 active:scale-75
                      `}
                      aria-label={`${label}: ${estadoTexto}`}
                      title={`${label} — ${estadoTexto}`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {celdaSeleccionada && (
        <div className="rounded-lg border border-outline-variant/60 bg-surface-container-low p-3">
          <p className="text-xs font-medium text-charcoal">
            {format(parseISO(celdaSeleccionada[0]), "dd/MM/yyyy")}
          </p>
          <p className="text-[11px] text-on-surface-variant">
            {celdaSeleccionada[1]
              ? habito.tipo === "bueno"
                ? "Hábito completado este día"
                : "Día sin recaída (hábito malo)"
              : habito.tipo === "bueno"
                ? "Hábito no completado este día"
                : "Hubo recaída del hábito malo"
            }
          </p>
        </div>
      )}
    </div>
  );
}
