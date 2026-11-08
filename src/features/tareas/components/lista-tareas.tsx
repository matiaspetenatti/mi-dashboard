"use client"

import { useMemo } from "react"
import { CheckCircle2, Inbox } from "lucide-react"

import { FilaTarea } from "./fila-tarea"
import { agruparPorEstado } from "@/features/tareas/lib/filtrar"
import type { EstadoDeTarea, TareaConDetalle } from "@/features/tareas/types"

type Grupo = {
  key: string
  nombre: string
  color: string
  categoria: EstadoDeTarea["categoria"] | null
  tareas: TareaConDetalle[]
}

export function ListaTareas({
  tareas,
  estados,
  agruparPor = "estado",
  mostrarProyecto,
  onAbrir,
  onAlternar,
  onEliminar,
}: {
  tareas: TareaConDetalle[]
  estados: EstadoDeTarea[]
  agruparPor?: "estado" | "proyecto"
  mostrarProyecto: boolean
  onAbrir: (tarea: TareaConDetalle) => void
  onAlternar: (tarea: TareaConDetalle, completada: boolean) => void
  onEliminar: (tarea: TareaConDetalle) => void
}) {
  const grupos = useMemo<Grupo[]>(() => {
    if (agruparPor === "proyecto") {
      const porProyecto = new Map<number, Grupo>()
      for (const tarea of tareas) {
        const existente = porProyecto.get(tarea.proyecto.id)
        if (existente) {
          existente.tareas.push(tarea)
        } else {
          porProyecto.set(tarea.proyecto.id, {
            key: `proyecto-${tarea.proyecto.id}`,
            nombre: tarea.proyecto.nombre,
            color: tarea.proyecto.color,
            categoria: null,
            tareas: [tarea],
          })
        }
      }
      return [...porProyecto.values()]
    }

    return agruparPorEstado(tareas, estados).map(({ estado, tareas: tareasEstado }) => ({
      key: `estado-${estado.id}`,
      nombre: estado.nombre,
      color: estado.color,
      categoria: estado.categoria,
      tareas: tareasEstado,
    }))
  }, [tareas, estados, agruparPor])

  if (grupos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-outline-variant/70 bg-card/50 px-6 py-16 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-linen-mist text-forest-ink dark:bg-primary-container dark:text-lime-voltage">
          <Inbox className="size-6" aria-hidden="true" />
        </span>
        <div>
          <p className="text-sm font-black text-heading">No hay tareas acá</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Creá una nueva o cambiá los filtros para ver otras.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      {grupos.map((grupo) => (
        <section key={grupo.key} className="flex flex-col gap-1">
          <header className="flex items-center gap-2 px-2 pb-1">
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: grupo.color }}
            />
            <h2 className="text-[11px] font-black uppercase tracking-[0.12em] text-heading">
              {grupo.nombre}
            </h2>
            <span className="tabular rounded-full bg-surface-container px-1.5 py-0.5 text-[9px] font-bold text-muted-foreground">
              {grupo.tareas.length}
            </span>
            {grupo.categoria === "completado" ? (
              <CheckCircle2 className="size-3.5 text-success" aria-hidden="true" />
            ) : null}
          </header>

          <div className="rounded-3xl border border-outline-variant/60 bg-card p-1.5 shadow-elevation-1">
            {grupo.tareas.map((tarea) => (
              <FilaTarea
                key={tarea.id}
                tarea={tarea}
                mostrarProyecto={mostrarProyecto}
                onAbrir={onAbrir}
                onAlternar={onAlternar}
                onEliminar={onEliminar}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
