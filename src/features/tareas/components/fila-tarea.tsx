"use client"

import { CalendarDays, GitBranch, MoreHorizontal, Tag } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { colorPrioridad, esVencida, textoVencimiento } from "@/features/tareas/lib/fechas"
import { fechaHoy } from "@/lib/dates"
import type { TareaConDetalle } from "@/features/tareas/types"
import { cn } from "cn"

export function FilaTarea({
  tarea,
  mostrarProyecto,
  onAbrir,
  onAlternar,
  onEliminar,
}: {
  tarea: TareaConDetalle
  mostrarProyecto: boolean
  onAbrir: (tarea: TareaConDetalle) => void
  onAlternar: (tarea: TareaConDetalle, completada: boolean) => void
  onEliminar: (tarea: TareaConDetalle) => void
}) {
  const completada = tarea.estado.categoria === "completado"
  const vencida = esVencida(tarea.fechaLimite) && !completada
  const textoFecha = textoVencimiento(tarea.fechaLimite)

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onAbrir(tarea)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          onAbrir(tarea)
        }
      }}
      className={cn(
        "group flex cursor-pointer items-center gap-3 rounded-2xl border border-transparent px-3 py-2.5 transition-colors hover:border-outline-variant/60 hover:bg-surface-container-low",
        completada && "opacity-60",
      )}
    >
      <span onClick={(event) => event.stopPropagation()}>
        <Checkbox
          checked={completada}
          aria-label={completada ? "Reabrir tarea" : "Completar tarea"}
          onCheckedChange={(checked: boolean) => onAlternar(tarea, checked)}
        />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <p
            className={cn(
              "truncate text-xs font-bold text-heading",
              completada && "line-through",
            )}
          >
            {tarea.titulo}
          </p>
          {tarea.subtareas.length > 0 ? (
            <span className="flex shrink-0 items-center gap-1 text-[9px] font-bold text-muted-foreground">
              <GitBranch className="size-2.5" aria-hidden="true" />
              {tarea.subtareasCompletadas}/{tarea.subtareas.length}
            </span>
          ) : null}
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          {mostrarProyecto ? (
            <span className="flex items-center gap-1 text-[9px] font-semibold text-muted-foreground">
              <span
                className="size-1.5 rounded-full"
                style={{ backgroundColor: tarea.proyecto.color }}
              />
              {tarea.proyecto.nombre}
            </span>
          ) : null}

          {tarea.etiquetas.slice(0, 2).map((etiqueta) => (
            <span
              key={etiqueta.id}
              className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold"
              style={{
                backgroundColor: `${etiqueta.color}1f`,
                color: etiqueta.color,
              }}
            >
              <Tag className="size-2" aria-hidden="true" />
              {etiqueta.nombre}
            </span>
          ))}
          {tarea.etiquetas.length > 2 ? (
            <span className="text-[9px] font-bold text-muted-foreground">
              +{tarea.etiquetas.length - 2}
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        {tarea.prioridad ? (
          <Badge
            variant="outline"
            className={cn(
              "hidden rounded-full border px-2 py-0.5 text-[9px] font-bold capitalize sm:inline-flex",
              colorPrioridad(tarea.prioridad),
            )}
          >
            {tarea.prioridad}
          </Badge>
        ) : null}

        {textoFecha ? (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold",
              vencida
                ? "bg-error-container text-error"
                : tarea.fechaLimite === fechaHoy()
                  ? "bg-warning-container text-on-warning-container"
                  : "bg-surface-container text-muted-foreground",
            )}
          >
            <CalendarDays className="size-2.5" aria-hidden="true" />
            {textoFecha}
          </span>
        ) : null}

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="size-7 opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                aria-label="Acciones de la tarea"
              />
            }
          >
            <MoreHorizontal className="size-3.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onAbrir(tarea)}>
              Abrir detalle
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onAlternar(tarea, !completada)}
            >
              {completada ? "Reabrir" : "Completar"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => onEliminar(tarea)}
            >
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
