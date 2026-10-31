"use client";

import { useState } from "react";
import { X, ChevronLeft, Calendar, Activity } from "lucide-react";
import { cn } from "cn";
import type { Habito } from "@/modules/habitos/schema";
import type { HabitoRegistro } from "@/modules/habitos/schema";
import { Heatmap } from "@/modules/habitos/components/heatmap";
import { calcularRachaActual, calcularRachaMaxima, generarHeatmapData } from "@/modules/habitos/lib/heatmap-utils";
import { tipoColor } from "@/modules/habitos/constantes";

interface HabitDetailProps {
  habito: Habito;
  registros: HabitoRegistro[];
  onClose: () => void;
  onToggle: (completado: boolean) => Promise<void>;
  onEditar?: (habito: Habito) => void;
  onEliminar?: (id: number) => void;
}

export function HabitDetail({
  habito,
  registros,
  onClose,
  onToggle,
  onEditar,
  onEliminar,
}: HabitDetailProps) {
  const [fechaSeleccionada, setFechaSeleccionada] = useState<string | null>(null);
  const [completadoSeleccionada, setCompletadoSeleccionada] = useState(false);

  const mapa = generarHeatmapData(registros);
  const hoy = new Date().toISOString().slice(0, 10);
  const completadoHoy = Boolean(mapa.get(hoy));

  const rachaActual = calcularRachaActual(registros, hoy);
  const rachaMaxima = calcularRachaMaxima(registros);
  const totalDias = registros.length;
  const diasCompletados = registros.filter((r) => r.completado).length;
  const porcentaje =
    totalDias > 0 ? Math.round((diasCompletados / totalDias) * 100) : 0;

  const alternarSeleccionada = async () => {
    if (!fechaSeleccionada) return;
    await onToggle(completadoSeleccionada);
  };

  const estiloTipo = tipoColor(habito.tipo);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[95vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-outline-variant/60 bg-card shadow-elevation-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-outline-variant/40 px-5 py-4">
          <button
            onClick={onClose}
            className="grid size-9 place-items-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="flex min-w-0 items-center gap-2.5">
            <span
              className={cn(
                "grid size-11 shrink-0 place-items-center rounded-full bg-surface-container-low",
                estiloTipo.split(" ")[0],
              )}
            >
              {habito.emoji ?? (
                <span className="text-[16px]">
                  {habito.tipo === "bueno" ? "🟢" : "🔴"}
                </span>
              )}
            </span>
            <div className="min-w-0">
              <h3 className="truncate text-lg font-bold text-heading">
                {habito.titulo}
              </h3>
              <p className="text-xs text-on-surface-variant">
                {tipoLabel(habito.tipo)} • {habito.frecuencia}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="grid size-9 place-items-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        {/* Métricas principales */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="rounded-xl border border-outline-variant/50 bg-surface-container-low p-3">
            <p className="text-[10px] uppercase tracking-wider text-pebble">Racha actual</p>
            <p className="text-2xl font-bold tabular-nums text-charcoal">
              {rachaActual}
              <span className="text-sm font-medium text-success"> días</span>
            </p>
          </div>
          <div className="rounded-xl border border-outline-variant/50 bg-surface-container-low p-3">
            <p className="text-[10px] uppercase tracking-wider text-pebble">Racha máxima</p>
            <p className="text-2xl font-bold tabular-nums text-charcoal">
              {rachaMaxima}
              <span className="text-sm font-medium text-on-surface-variant"> días</span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="rounded-xl border border-outline-variant/50 bg-surface-container-low p-3">
            <p className="text-[10px] uppercase tracking-wider text-pebble">Días registrados</p>
            <p className="text-2xl font-bold tabular-nums text-charcoal">
              {totalDias}
            </p>
          </div>
          <div className="rounded-xl border border-outline-variant/50 bg-surface-container-low p-3">
            <p className="text-[10px] uppercase tracking-wider text-pebble">Cumplimiento</p>
            <p className="text-2xl font-bold tabular-nums text-charcoal">
              {porcentaje}%
            </p>
          </div>
        </div>

        {/* Heatmap grande */}
        <div className="rounded-xl border border-outline-variant/50 bg-surface-container-low p-4 mb-5">
          <Heatmap
            habito={habito}
            registros={registros.map((r) => ({
              fecha: r.fecha,
              completado: r.completado,
            }))}
            tamañoCelda={11}
            gap={3}
            onFechaClick={(fecha, completado) => {
              setFechaSeleccionada(fecha);
              setCompletadoSeleccionada(completado);
            }}
          />

          {fechaSeleccionada && (
            <div className="mt-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-pebble" />
                <span className="text-sm font-medium text-charcoal">
                  {new Date(fechaSeleccionada).toLocaleDateString("es-ES", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
              <button
                onClick={alternarSeleccionada}
                disabled={fechaSeleccionada === hoy}
                className="flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-colors bg-surface-container text-charcoal hover:bg-surface-container disabled:opacity-50"
              >
                {completadoSeleccionada ? "Desmarcar" : "Marcar como hecho"}
              </button>
            </div>
          )}
        </div>

        {/* Acciones */}
        <div className="flex items-center justify-end gap-2 border-t border-outline-variant/50 pt-4">
          <button
            onClick={onClose}
            className="rounded-full border border-outline-variant/60 bg-card px-4 py-1.5 text-sm font-medium text-charcoal transition-colors hover:bg-surface-container"
          >
            Cerrar
          </button>
          {onEditar && (
            <button
              onClick={() => {
                onEditar?.(habito);
                onClose();
              }}
              className="flex items-center gap-1.5 rounded-full border border-outline-variant/60 bg-card px-4 py-1.5 text-sm font-medium text-charcoal transition-colors hover:bg-surface-container"
            >
              <Activity size={14} />
              Editar
            </button>
          )}
          {onEliminar && (
            <button
              onClick={() => {
                onEliminar?.(habito.id);
                onClose();
              }}
              className="rounded-full px-2 py-1.5 text-sm font-medium text-error transition-colors hover:bg-error-container"
            >
              Eliminar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function tipoLabel(tipo: "bueno" | "malo") {
  return tipo === "bueno" ? "Hábito bueno" : "Hábito malo";
}
