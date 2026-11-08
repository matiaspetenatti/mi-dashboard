"use client"

import {
  DndContext,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { CalendarDays, Check, GripVertical, Plus } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  colorPrioridad,
  esVencida,
  textoVencimiento,
} from "@/features/tareas/lib/fechas"
import type { EstadoDeTarea, TareaConDetalle } from "@/features/tareas/types"
import { cn } from "cn"

export function TableroTareas({
  tareas,
  estados,
  onAbrir,
  onMover,
  onAlternar,
  onCrearEnEstado,
}: {
  tareas: TareaConDetalle[]
  estados: EstadoDeTarea[]
  onAbrir: (tarea: TareaConDetalle) => void
  onMover: (tareaId: number, estadoId: number) => void
  onAlternar: (tarea: TareaConDetalle, completada: boolean) => void
  onCrearEnEstado: (estadoId: number) => void
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  )

  const tareasPorEstado = new Map<number, TareaConDetalle[]>()
  for (const estado of estados) tareasPorEstado.set(estado.id, [])
  for (const tarea of tareas) {
    const lista = tareasPorEstado.get(tarea.estadoId)
    if (lista) lista.push(tarea)
  }

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return

    const activa = tareas.find((tarea) => tarea.id === Number(active.id))
    const estadoDestino = over.data.current?.estadoId
    if (!activa || typeof estadoDestino !== "number") return
    if (activa.estadoId === estadoDestino) return
    onMover(activa.id, estadoDestino)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragEnd={onDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-2">
        {estados.map((estado) => {
          const items = tareasPorEstado.get(estado.id) ?? []
          return (
            <ColumnaTablero
              key={estado.id}
              estado={estado}
              tareas={items}
              onAbrir={onAbrir}
              onAlternar={onAlternar}
              onCrear={() => onCrearEnEstado(estado.id)}
            />
          )
        })}
      </div>
    </DndContext>
  )
}

function ColumnaTablero({
  estado,
  tareas,
  onAbrir,
  onAlternar,
  onCrear,
}: {
  estado: EstadoDeTarea
  tareas: TareaConDetalle[]
  onAbrir: (tarea: TareaConDetalle) => void
  onAlternar: (tarea: TareaConDetalle, completada: boolean) => void
  onCrear: () => void
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `estado-${estado.id}`,
    data: { estadoId: estado.id },
  })

  return (
    <section
      ref={setNodeRef}
      className={cn(
        "flex w-[280px] shrink-0 flex-col rounded-3xl border bg-surface-container-low/70 p-2 transition-colors",
        isOver
          ? "border-lime-voltage bg-linen-mist/60 dark:bg-primary-container/40"
          : "border-outline-variant/50",
      )}
    >
      <header className="flex items-center gap-2 px-2 py-2">
        <span
          className="size-2.5 rounded-full"
          style={{ backgroundColor: estado.color }}
        />
        <h2 className="flex-1 truncate text-[11px] font-black uppercase tracking-[0.1em] text-heading">
          {estado.nombre}
        </h2>
        <span className="tabular rounded-full bg-card px-1.5 py-0.5 text-[9px] font-bold text-muted-foreground">
          {tareas.length}
        </span>
        <button
          type="button"
          onClick={onCrear}
          aria-label={`Crear tarea en ${estado.nombre}`}
          className="flex size-6 items-center justify-center rounded-full text-muted-foreground hover:bg-card hover:text-heading"
        >
          <Plus className="size-3.5" />
        </button>
      </header>

      <SortableContext
        items={tareas.map((tarea) => tarea.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex min-h-[80px] flex-col gap-2">
          {tareas.map((tarea) => (
            <TarjetaTablero
              key={tarea.id}
              tarea={tarea}
              onAbrir={onAbrir}
              onAlternar={onAlternar}
            />
          ))}
          {tareas.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-outline-variant/60 px-3 py-6 text-center text-[10px] font-semibold text-muted-foreground">
              Arrastrá una tarea acá
            </div>
          ) : null}
        </div>
      </SortableContext>
    </section>
  )
}

function TarjetaTablero({
  tarea,
  onAbrir,
  onAlternar,
}: {
  tarea: TareaConDetalle
  onAbrir: (tarea: TareaConDetalle) => void
  onAlternar: (tarea: TareaConDetalle, completada: boolean) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: tarea.id,
    data: { estadoId: tarea.estadoId },
  })

  const completada = tarea.estado.categoria === "completado"
  const vencida = esVencida(tarea.fechaLimite) && !completada
  const textoFecha = textoVencimiento(tarea.fechaLimite)

  return (
    <article
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn(
        "group cursor-pointer rounded-2xl border border-outline-variant/60 bg-card p-3 shadow-elevation-1 transition-shadow hover:shadow-elevation-2",
        isDragging && "z-50 opacity-70 shadow-elevation-3",
        completada && "opacity-60",
      )}
      onClick={() => onAbrir(tarea)}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          className="mt-0.5 cursor-grab touch-none text-muted-foreground/60 hover:text-muted-foreground active:cursor-grabbing"
          aria-label="Arrastrar tarea"
          onClick={(event) => event.stopPropagation()}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-3.5" />
        </button>

        <span onClick={(event) => event.stopPropagation()}>
          <Checkbox
            checked={completada}
            aria-label={completada ? "Reabrir tarea" : "Completar tarea"}
            onCheckedChange={(checked: boolean) => onAlternar(tarea, checked)}
          />
        </span>

        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "text-xs font-bold leading-4 text-heading",
              completada && "line-through",
            )}
          >
            {tarea.titulo}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {tarea.prioridad ? (
              <Badge
                variant="outline"
                className={cn(
                  "rounded-full border px-1.5 py-0 text-[8px] font-bold capitalize",
                  colorPrioridad(tarea.prioridad),
                )}
              >
                {tarea.prioridad}
              </Badge>
            ) : null}

            {textoFecha ? (
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[8px] font-bold",
                  vencida
                    ? "bg-error-container text-error"
                    : "bg-surface-container text-muted-foreground",
                )}
              >
                <CalendarDays className="size-2.5" aria-hidden="true" />
                {textoFecha}
              </span>
            ) : null}

            {tarea.etiquetas.slice(0, 1).map((etiqueta) => (
              <span
                key={etiqueta.id}
                className="rounded-full px-1.5 py-0.5 text-[8px] font-bold"
                style={{
                  backgroundColor: `${etiqueta.color}1f`,
                  color: etiqueta.color,
                }}
              >
                {etiqueta.nombre}
              </span>
            ))}
          </div>
        </div>
      </div>

      {completada ? (
        <span className="mt-2 inline-flex items-center gap-1 text-[8px] font-bold text-success">
          <Check className="size-2.5" aria-hidden="true" />
          Completada
        </span>
      ) : null}
    </article>
  )
}
