import { Link } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { AlertCircle, CheckCircle2, Clock, Plus } from "lucide-react"

import { WidgetCard } from "@/components/organisms/widget-card"
import { WidgetError, WidgetLoading } from "@/components/molecules/widget-states"
import { resumenTareasQuery } from "@/features/tareas/api"
import { fechaHoy } from "@/lib/dates"
import { formatearFecha } from "@/lib/format"
import { cn } from "cn"

function etiquetaVencimiento(fecha: string | null, vencida: boolean) {
  if (!fecha) return "Sin fecha"
  if (vencida) return "Vencida"
  if (fecha === fechaHoy()) return "Hoy"
  return formatearFecha(fecha, false)
}

export function WidgetTareas() {
  const { data, isPending, isError } = useQuery(resumenTareasQuery)

  return (
    <WidgetCard
      title="Tareas"
      subtitle="Pendientes para hoy"
      href="/tareas"
      icon={CheckCircle2}
      accent="primary"
      footer={
        <>
          <span>
            {data
              ? `${data.vencidas} ${data.vencidas === 1 ? "vencida" : "vencidas"} · ${data.hoy} para hoy`
              : "Cargando..."}
          </span>
          <Link
            to="/tareas"
            className="inline-flex items-center gap-1 text-heading hover:underline"
          >
            <Plus className="size-3" aria-hidden="true" />
            Nueva
          </Link>
        </>
      }
    >
      {isPending ? <WidgetLoading /> : null}

      {isError ? (
        <WidgetError message="No se pudieron cargar las tareas." />
      ) : null}

      {data ? (
        <div className="flex flex-1 flex-col gap-4">
          <div className="flex items-end gap-2">
            <span className="text-display text-5xl leading-none text-heading">
              {data.pendientes}
            </span>
            <span className="pb-1 text-xs font-semibold text-muted-foreground">
              {data.pendientes === 1 ? "pendiente" : "pendientes"}
            </span>
          </div>

          <ul className="flex flex-col gap-1.5">
            {data.items.length === 0 ? (
              <li className="rounded-2xl bg-surface-container-low px-4 py-3 text-xs font-semibold text-muted-foreground">
                No hay tareas pendientes. Buen trabajo.
              </li>
            ) : (
              data.items.map((tarea) => (
                <li
                  key={tarea.id}
                  className="flex items-center gap-3 rounded-2xl bg-surface-container-low px-3 py-2.5"
                >
                  <span
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-full",
                      tarea.vencida
                        ? "bg-error-container text-error"
                        : "bg-linen-mist text-forest-ink dark:bg-primary-container dark:text-lime-voltage",
                    )}
                  >
                    {tarea.vencida ? (
                      <AlertCircle className="size-3.5" aria-hidden="true" />
                    ) : (
                      <Clock className="size-3.5" aria-hidden="true" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-heading">
                      {tarea.titulo}
                    </p>
                    <p className="truncate text-[10px] text-muted-foreground">
                      {tarea.proyecto}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-1 text-[10px] font-bold",
                      tarea.vencida
                        ? "bg-error-container text-error"
                        : "bg-card text-muted-foreground",
                    )}
                  >
                    {etiquetaVencimiento(tarea.fechaLimite, tarea.vencida)}
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </WidgetCard>
  )
}
