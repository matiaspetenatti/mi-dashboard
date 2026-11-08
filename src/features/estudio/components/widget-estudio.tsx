import { useQuery } from "@tanstack/react-query"
import { CalendarClock, GraduationCap } from "lucide-react"

import { WidgetCard } from "@/components/organisms/widget-card"
import { WidgetError, WidgetLoading } from "@/components/molecules/widget-states"
import { resumenEstudioQuery } from "@/features/estudio/api"
import { formatNota, formatearFecha } from "@/lib/format"

export function WidgetEstudio() {
  const { data, isPending, isError } = useQuery(resumenEstudioQuery)

  const avance =
    data && data.materiasTotales > 0
      ? Math.round((data.materiasAprobadas / data.materiasTotales) * 100)
      : 0

  return (
    <WidgetCard
      title="Estudio"
      subtitle="Progreso universitario"
      href="/estudio"
      icon={GraduationCap}
      accent="tertiary"
      footer={
        <>
          <span>
            {data ? `${data.carrerasActivas} carreras activas` : "Cargando..."}
          </span>
          <span>Promedio {data?.promedio != null ? formatNota(data.promedio) : "—"}</span>
        </>
      }
    >
      {isPending ? <WidgetLoading /> : null}

      {isError ? (
        <WidgetError message="No se pudo cargar el progreso de estudio." />
      ) : null}

      {data ? (
        <div className="flex flex-1 flex-col gap-3">
          <div className="flex items-end gap-2">
            <span className="text-display text-5xl leading-none text-heading">
              {avance}%
            </span>
            <span className="pb-1 text-[11px] font-semibold text-muted-foreground">
              de avance
            </span>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-surface-container">
            <div
              className="h-full rounded-full bg-lime-voltage"
              style={{ width: `${Math.min(100, Math.max(2, avance))}%` }}
            />
          </div>

          <p className="text-xs font-semibold text-on-surface-variant">
            {data.materiasAprobadas} de {data.materiasTotales} materias aprobadas
          </p>

          {data.proximoExamen ? (
            <div className="mt-auto flex items-start gap-2 rounded-2xl bg-surface-container-low p-3">
              <CalendarClock
                className="mt-0.5 size-4 shrink-0 text-secondary"
                aria-hidden="true"
              />
              <div className="min-w-0">
                <p className="truncate text-[11px] font-bold text-heading">
                  {data.proximoExamen.materia}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {formatearFecha(data.proximoExamen.fecha, false)} ·{" "}
                  {data.proximoExamen.dias === 0
                    ? "hoy"
                    : data.proximoExamen.dias === 1
                      ? "mañana"
                      : `en ${data.proximoExamen.dias} días`}
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-auto rounded-2xl bg-surface-container-low p-3 text-[10px] font-semibold text-muted-foreground">
              Sin exámenes próximos
            </div>
          )}
        </div>
      ) : null}
    </WidgetCard>
  )
}
