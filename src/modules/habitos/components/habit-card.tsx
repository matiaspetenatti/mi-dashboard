"use client";

import { useState } from "react";
import { MoreHorizontal, ChevronRight, Trash2, Edit2 } from "lucide-react";
import { cn } from "cn";
import type { Habito } from "@/modules/habitos/schema";
import { tipoColor } from "@/modules/habitos/constantes";
import { generarHeatmapData, obtenerUltimoAnioDias } from "@/modules/habitos/lib/heatmap-utils";

interface HabitCardProps {
  habito: Habito;
  registros: Array<{ fecha: string; completado: boolean }>;
  rachaActual: number;
  rachaMaxima: number;
  completadoHoy: boolean;
  onToggle: (completado: boolean) => void;
  onEditar?: (habito: Habito) => void;
  onEliminar?: (id: number) => void;
  onVerDetalle?: (habito: Habito) => void;
}

export function HabitCard({
  habito,
  registros,
  rachaActual,
  rachaMaxima,
  completadoHoy,
  onToggle,
  onEditar,
  onEliminar,
  onVerDetalle,
}: HabitCardProps) {
  const [menuAbierto, setMenuAbierto] = useState(false);

  const mapa = generarHeatmapData(registros);
  const hoy = new Date().toISOString().slice(0, 10);
  const ultimos7Dias = obtenerUltimoAnioDias().slice(-7);
  const completadosUltimos7 = ultimos7Dias.filter(
    (f) => mapa.get(f) === true,
  ).length;

  const tipo = habito.tipo;
  const estiloTipo = tipoColor(tipo);

  const alternar = async () => {
    const siguiente = !completadoHoy;
    onToggle(siguiente);
  };

  return (
    <div className="flex flex-col gap-3 rounded-[20px] border border-outline-variant/60 bg-card p-4 shadow-elevation-1 transition-all hover:shadow-elevation-2 group">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className={cn(
              "grid size-10 shrink-0 place-items-center rounded-full bg-surface-container-low",
              estiloTipo.split(" ")[0],
            )}
          >
            {habito.emoji ?? (
              <span className="text-[14px]">
                {tipo === "bueno" ? "🟢" : "🔴"}
              </span>
            )}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h3
                className="truncate text-sm font-bold text-heading"
                title={habito.titulo}
              >
                {habito.titulo}
              </h3>
              {tipo === "malo" && (
                <span className="inline-flex items-center rounded-full px-2 py-0.5 bg-error-container text-on-error-container text-[10px] font-medium">
                  Erradicar
                </span>
              )}
            </div>
            {habito.descripcion && (
              <p className="mt-0.5 truncate text-[11px] text-on-surface-variant">
                {habito.descripcion}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenuAbierto(!menuAbierto);
            }}
            className="grid size-8 place-items-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
            aria-label="Más opciones"
          >
            <MoreHorizontal size={16} />
          </button>
        </div>
      </div>

      {/* Mini heatmap de últimos 7 días + métricas */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          {ultimos7Dias.map((fecha) => {
            const completado = mapa.get(fecha) === true;
            const esHoy = fecha === hoy;
            return (
              <div
                key={fecha}
                className={cn(
                  "size-5 rounded-sm transition-all hover:scale-125",
                  completado ? "bg-success" : "bg-surface-container-low",
                  esHoy && !completado ? "ring-1 ring-pebble" : "",
                )}
                title={formatFechaCorta(fecha)}
              />
            );
          })}
          <span className="ml-1.5 text-[10px] text-pebble">
            {completadosUltimos7}/7 esta semana
          </span>
        </div>

        <div className="flex items-center gap-1 text-[10px] font-semibold text-charcoal">
          <span className="flex items-center gap-0.5">
            <span className="size-3.5 text-success" />
            {rachaActual}
          </span>
          <span className="text-pebble">racha</span>
          {rachaMaxima > 0 && (
            <>
              <span className="ml-1 text-pebble">|</span>
              <span className="flex items-center gap-0.5">
                <span className="size-3.5 text-pebble" />
                {rachaMaxima}
              </span>
              <span className="text-pebble">máx</span>
            </>
          )}
        </div>
      </div>

      {/* Checkbox + acciones */}
      <div className="mt-2 flex items-center justify-between gap-2">
        <button
          onClick={alternar}
          className={cn(
            "flex items-center justify-center rounded-full p-1.5 transition-all duration-200 active:scale-95",
            completadoHoy
              ? "bg-success text-white shadow-[0_0_12px_rgba(34,197,94,0.4)]"
              : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container hover:text-on-surface",
          )}
          aria-pressed={completadoHoy}
          aria-label={completadoHoy ? "Desmarcar hábito" : "Marcar hábito como completado"}
        >
          {completadoHoy ? (
            <span className="size-5">✓</span>
          ) : (
            <span className="size-5 text-on-surface-variant/50">○</span>
          )}
        </button>

        <div className="flex items-center gap-1">
          {onVerDetalle && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuAbierto(false);
                onVerDetalle?.(habito);
              }}
              className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors bg-surface-container-low text-charcoal hover:bg-surface-container"
            >
              <ChevronRight size={12} />
              Ver
            </button>
          )}
        </div>
      </div>

      {/* Menú desplegable */}
      {menuAbierto && (
        <div className="absolute right-0 mt-2 w-48 rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-1.5 shadow-xl z-50">
          {onEditar && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuAbierto(false);
                onEditar?.(habito);
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-left text-charcoal transition-colors hover:bg-surface-container"
            >
              <Edit2 size={14} />
              Editar hábito
            </button>
          )}
          {onEliminar && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuAbierto(false);
                onEliminar?.(habito.id);
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-left text-error transition-colors hover:bg-error-container/50"
            >
              <Trash2 size={14} />
              Eliminar
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function formatFechaCorta(fecha: string): string {
  const d = new Date(fecha + "T00:00:00");
  return d.toLocaleDateString("es-ES", { weekday: "short", day: "numeric" });
}
