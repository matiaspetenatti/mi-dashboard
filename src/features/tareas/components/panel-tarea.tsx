"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { CalendarDays, Check, GitBranch, Trash2 } from "lucide-react"
import { toast } from "sonner"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import {
  actualizarTarea,
  alternarTarea,
  eliminarTarea,
} from "@/features/tareas/server/functions"
import { prioridadesTarea } from "@/features/tareas/schemas"
import type { TareaConDetalle } from "@/features/tareas/types"
import type { EstadoProyecto } from "@/server/db/schema"
import { cn } from "cn"

export function PanelTarea({
  tarea,
  estados,
  onOpenChange,
}: {
  tarea: TareaConDetalle | null
  estados: EstadoProyecto[]
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Sheet
      open={Boolean(tarea)}
      onOpenChange={(open) => {
        if (!open) onOpenChange(false)
      }}
    >
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        {tarea ? (
          <ContenidoTarea
            key={tarea.id}
            tarea={tarea}
            estados={estados}
            onClose={() => onOpenChange(false)}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  )
}

function ContenidoTarea({
  tarea,
  estados,
  onClose,
}: {
  tarea: TareaConDetalle
  estados: EstadoProyecto[]
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const [titulo, setTitulo] = useState(tarea.titulo)
  const [descripcion, setDescripcion] = useState(tarea.descripcion ?? "")
  const [estadoId, setEstadoId] = useState(tarea.estadoId)
  const [prioridad, setPrioridad] = useState(tarea.prioridad)
  const [fechaInicio, setFechaInicio] = useState(tarea.fechaInicio ?? "")
  const [fechaLimite, setFechaLimite] = useState(tarea.fechaLimite ?? "")
  const [confirmarEliminar, setConfirmarEliminar] = useState(false)

  const completada = tarea.estado.categoria === "completado"
  const estadosProyecto = estados
    .filter((estado) => estado.proyectoId === tarea.proyectoId)
    .sort((a, b) => a.posicion - b.posicion)

  const guardar = useMutation({
    mutationFn: () =>
      actualizarTarea({
        data: {
          id: tarea.id,
          titulo,
          descripcion: descripcion.trim() || null,
          estadoId,
          prioridad,
          fechaInicio: fechaInicio || null,
          fechaLimite: fechaLimite || null,
        },
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["tareas"] })
      toast.success("Tarea actualizada")
      onClose()
    },
    onError: () => toast.error("No se pudo guardar la tarea"),
  })

  const alternar = useMutation({
    mutationFn: (completar: boolean) =>
      alternarTarea({ data: { id: tarea.id, completada: completar } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["tareas"] })
      toast.success(completada ? "Tarea reabierta" : "Tarea completada")
      onClose()
    },
    onError: () => toast.error("No se pudo actualizar la tarea"),
  })

  const borrar = useMutation({
    mutationFn: () => eliminarTarea({ data: { id: tarea.id } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["tareas"] })
      toast.success("Tarea eliminada")
      onClose()
    },
    onError: () => toast.error("No se pudo eliminar la tarea"),
  })

  return (
    <>
      <SheetHeader className="border-b border-outline-variant/50 pb-4">
        <SheetTitle className="flex items-center gap-2 text-left text-sm font-black">
          <span
            className="size-2.5 rounded-full"
            style={{ backgroundColor: tarea.proyecto.color }}
          />
          {tarea.proyecto.nombre}
          <span className="text-[10px] font-bold text-muted-foreground">
            #{tarea.id}
          </span>
        </SheetTitle>
        <SheetDescription>
          Editá los detalles y guardá los cambios.
        </SheetDescription>
      </SheetHeader>

      <div className="flex flex-col gap-4 px-4 pb-6">
        <div className="space-y-2">
          <Label htmlFor="detalle-titulo">Título</Label>
          <Input
            id="detalle-titulo"
            value={titulo}
            onChange={(event) => setTitulo(event.target.value)}
            className="text-base font-bold"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="detalle-descripcion">Descripción</Label>
          <Textarea
            id="detalle-descripcion"
            value={descripcion}
            onChange={(event) => setDescripcion(event.target.value)}
            rows={4}
            placeholder="Sin descripción"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="detalle-estado">Estado</Label>
            <select
              id="detalle-estado"
              value={estadoId}
              onChange={(event) => setEstadoId(Number(event.target.value))}
              className="h-10 w-full rounded-xl border border-outline-variant/70 bg-card px-3 text-sm text-heading outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
            >
              {estadosProyecto.map((estado) => (
                <option key={estado.id} value={estado.id}>
                  {estado.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label>Prioridad</Label>
            <div className="flex flex-wrap gap-1.5">
              {prioridadesTarea.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setPrioridad(prioridad === item ? null : item)}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-[10px] font-bold capitalize transition-colors",
                    prioridad === item
                      ? "border-forest-ink bg-forest-ink text-paper dark:border-lime-voltage dark:bg-lime-voltage dark:text-forest-ink"
                      : "border-outline-variant/70 bg-card text-muted-foreground hover:bg-muted hover:text-heading",
                  )}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="detalle-inicio">Inicio</Label>
            <div className="relative">
              <CalendarDays className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="detalle-inicio"
                type="date"
                className="pl-9"
                value={fechaInicio}
                onChange={(event) => setFechaInicio(event.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="detalle-limite">Fecha límite</Label>
            <div className="relative">
              <CalendarDays className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="detalle-limite"
                type="date"
                className="pl-9"
                value={fechaLimite}
                onChange={(event) => setFechaLimite(event.target.value)}
              />
            </div>
          </div>
        </div>

        {tarea.etiquetas.length > 0 ? (
          <div className="space-y-2">
            <Label>Etiquetas</Label>
            <div className="flex flex-wrap gap-1.5">
              {tarea.etiquetas.map((etiqueta) => (
                <Badge
                  key={etiqueta.id}
                  variant="outline"
                  className="rounded-full px-2 py-0.5 text-[9px] font-bold"
                  style={{
                    backgroundColor: `${etiqueta.color}1f`,
                    color: etiqueta.color,
                  }}
                >
                  {etiqueta.nombre}
                </Badge>
              ))}
            </div>
          </div>
        ) : null}

        {tarea.subtareas.length > 0 ? (
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <GitBranch className="size-3.5" aria-hidden="true" />
              Subtareas ({tarea.subtareasCompletadas}/{tarea.subtareas.length})
            </Label>
            <ul className="space-y-1">
              {tarea.subtareas.map((subtarea) => (
                <li
                  key={subtarea.id}
                  className="flex items-center gap-2 rounded-xl bg-surface-container-low px-3 py-2 text-xs"
                >
                  <span
                    className={cn(
                      "size-1.5 rounded-full",
                      subtarea.estado.categoria === "completado"
                        ? "bg-success"
                        : "bg-muted-foreground/40",
                    )}
                  />
                  <span
                    className={cn(
                      "flex-1 truncate text-heading",
                      subtarea.estado.categoria === "completado" &&
                        "line-through opacity-60",
                    )}
                  >
                    {subtarea.titulo}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-outline-variant/50 pt-4">
          <Button
            type="button"
            onClick={() => guardar.mutate()}
            disabled={!titulo.trim() || guardar.isPending}
          >
            {guardar.isPending ? "Guardando..." : "Guardar cambios"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => alternar.mutate(!completada)}
            disabled={alternar.isPending}
          >
            <Check className="size-4" aria-hidden="true" />
            {completada ? "Reabrir" : "Completar"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="ml-auto text-error hover:bg-error-container hover:text-error"
            onClick={() => setConfirmarEliminar(true)}
          >
            <Trash2 className="size-4" aria-hidden="true" />
            Eliminar
          </Button>
        </div>
      </div>

      <AlertDialog
        open={confirmarEliminar}
        onOpenChange={setConfirmarEliminar}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta tarea?</AlertDialogTitle>
            <AlertDialogDescription>
              Se va a borrar “{tarea.titulo}” y sus subtareas. Esta acción no se
              puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => borrar.mutate()}
              className="bg-error text-paper hover:bg-error/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
