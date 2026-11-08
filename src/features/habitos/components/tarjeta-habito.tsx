"use client"

import {
  Archive,
  Check,
  ChevronRight,
  Flame,
  Pencil,
  RotateCcw,
  Trophy,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  claseTipo,
  etiquetaTipo,
} from "@/features/habitos/constantes"
import type { HabitoConEstado } from "@/features/habitos/types"
import { cn } from "cn"

export function TarjetaHabito({
  habito,
  onToggle,
  onAbrir,
  onEditar,
  onArchivar,
  pendiente,
}: {
  habito: HabitoConEstado
  onToggle: () => void
  onAbrir: () => void
  onEditar: () => void
  onArchivar: () => void
  pendiente: boolean
}) {
  const completadosSemana = habito.ultimos7.filter(
    (dia) => dia.completado,
  ).length

  return (
    <article
      className={cn(
        "flex flex-col gap-3 rounded-3xl border border-outline-variant/60 bg-card p-4 shadow-elevation-1",
        !habito.activo && "opacity-60",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className="flex size-10 shrink-0 items-center justify-center rounded-2xl text-base"
            style={{ backgroundColor: `${habito.color}22` }}
          >
            {habito.emoji ?? (habito.tipo === "bueno" ? "🟢" : "🔴")}
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-xs font-black text-heading">
              {habito.titulo}
            </h3>
            <div className="mt-1 flex flex-wrap items-center gap-1">
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[8px] font-bold",
                  claseTipo(habito.tipo),
                )}
              >
                {etiquetaTipo(habito.tipo)}
              </span>
              {!habito.activo ? (
                <span className="rounded-full bg-surface-container px-1.5 py-0.5 text-[8px] font-bold text-muted-foreground">
                  Archivado
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="size-6 text-muted-foreground hover:text-heading"
            aria-label={`Editar ${habito.titulo}`}
            onClick={onEditar}
          >
            <Pencil className="size-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-6 text-muted-foreground hover:text-heading"
            aria-label={
              habito.activo
                ? `Archivar ${habito.titulo}`
                : `Reactivar ${habito.titulo}`
            }
            onClick={onArchivar}
          >
            <Archive className="size-3" />
          </Button>
        </div>
      </div>

      {habito.descripcion ? (
        <p className="line-clamp-2 text-[10px] text-muted-foreground">
          {habito.descripcion}
        </p>
      ) : null}

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          {habito.ultimos7.map((dia) => (
            <span
              key={dia.fecha}
              className={cn(
                "size-4 rounded-sm transition-colors",
                dia.completado
                  ? "bg-lime-voltage"
                  : "bg-surface-container",
                dia.fecha &&
                  habito.completadoHoy &&
                  dia.fecha === habito.ultimos7.at(-1)?.fecha &&
                  "ring-1 ring-heading",
              )}
              title={dia.fecha}
            />
          ))}
        </div>
        <span className="text-[9px] font-semibold text-muted-foreground">
          {completadosSemana}/7
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-[9px] font-semibold text-muted-foreground">
        <span className="flex items-center gap-1 rounded-full bg-surface-container px-2 py-0.5">
          <Flame className="size-3 text-secondary" aria-hidden="true" />
          {habito.rachaActual} racha
        </span>
        <span className="flex items-center gap-1 rounded-full bg-surface-container px-2 py-0.5">
          <Trophy className="size-3 text-secondary" aria-hidden="true" />
          {habito.rachaMaxima} máx
        </span>
        <span className="flex items-center gap-1 rounded-full bg-surface-container px-2 py-0.5">
          <RotateCcw className="size-3 text-secondary" aria-hidden="true" />
          {habito.porcentaje}%
        </span>
      </div>

      <div className="mt-auto flex items-center gap-2">
        <Button
          type="button"
          variant={habito.completadoHoy ? "default" : "outline"}
          size="sm"
          className="h-8 flex-1 rounded-full px-3 text-[10px] font-bold"
          disabled={pendiente || !habito.activo}
          onClick={onToggle}
        >
          <Check className="size-3.5" aria-hidden="true" />
          {habito.completadoHoy
            ? habito.tipo === "bueno"
              ? "Completado hoy"
              : "Día limpio"
            : habito.tipo === "bueno"
              ? "Marcar hoy"
              : "Sin recaída"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 rounded-full px-2 text-[9px] font-bold"
          onClick={onAbrir}
        >
          Ver
          <ChevronRight className="size-3" aria-hidden="true" />
        </Button>
      </div>
    </article>
  )
}
