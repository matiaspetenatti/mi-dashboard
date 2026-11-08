"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { CalendarDays, Check, GitBranch, Plus, Trash2, X } from "lucide-react"
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
  asignarEtiqueta,
  crearEtiqueta,
  crearTarea,
  eliminarTarea,
  quitarEtiqueta,
} from "@/features/tareas/server/functions"
import { paleta } from "@/features/tareas/constantes"
import { prioridadesTarea } from "@/features/tareas/schemas"
import type { TareaConDetalle } from "@/features/tareas/types"
import type { EstadoProyecto, Etiqueta } from "@/server/db/schema"
import { cn } from "cn"

export function PanelTarea({
  tarea,
  estados,
  etiquetas,
  onOpenChange,
}: {
  tarea: TareaConDetalle | null
  estados: EstadoProyecto[]
  etiquetas: Etiqueta[]
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
            etiquetas={etiquetas}
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
  etiquetas,
  onClose,
}: {
  tarea: TareaConDetalle
  estados: EstadoProyecto[]
  etiquetas: Etiqueta[]
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const [titulo, setTitulo] = useState(tarea.titulo)
  const [descripcion, setDescripcion] = useState(tarea.descripcion ?? "")
  const [estadoId, setEstadoId] = useState(tarea.estadoId)
  const [prioridad, setPrioridad] = useState(tarea.prioridad)
  const [fechaInicio, setFechaInicio] = useState(tarea.fechaInicio ?? "")
  const [fechaLimite, setFechaLimite] = useState(tarea.fechaLimite ?? "")
  const [nuevaSubtarea, setNuevaSubtarea] = useState("")
  const [mostrarNuevaEtiqueta, setMostrarNuevaEtiqueta] = useState(false)
  const [nombreEtiqueta, setNombreEtiqueta] = useState("")
  const [colorEtiqueta, setColorEtiqueta] = useState<string>(paleta[0])
  const [confirmarEliminar, setConfirmarEliminar] = useState(false)

  const completada = tarea.estado.categoria === "completado"
  const estadosProyecto = estados
    .filter((estado) => estado.proyectoId === tarea.proyectoId)
    .sort((a, b) => a.posicion - b.posicion)
  const estadoPendiente =
    estadosProyecto.find((estado) => estado.categoria === "pendiente") ??
    estadosProyecto.at(0)

  const etiquetasDisponibles = etiquetas.filter(
    (etiqueta) =>
      (etiqueta.proyectoId === null ||
        etiqueta.proyectoId === tarea.proyectoId) &&
      !tarea.etiquetas.some((actual) => actual.id === etiqueta.id),
  )

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

  const crearSubtarea = useMutation({
    mutationFn: (tituloSubtarea: string) => {
      if (!estadoPendiente) throw new Error("El proyecto no tiene estados")
      return crearTarea({
        data: {
          proyectoId: tarea.proyectoId,
          estadoId: estadoPendiente.id,
          parentId: tarea.id,
          titulo: tituloSubtarea,
        },
      })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["tareas"] })
      toast.success("Subtarea creada")
      setNuevaSubtarea("")
    },
    onError: () => toast.error("No se pudo crear la subtarea"),
  })

  const asignar = useMutation({
    mutationFn: (etiquetaId: number) =>
      asignarEtiqueta({ data: { tareaId: tarea.id, etiquetaId } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["tareas"] })
      toast.success("Etiqueta agregada")
    },
    onError: () => toast.error("No se pudo agregar la etiqueta"),
  })

  const quitar = useMutation({
    mutationFn: (etiquetaId: number) =>
      quitarEtiqueta({ data: { tareaId: tarea.id, etiquetaId } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["tareas"] })
      toast.success("Etiqueta quitada")
    },
    onError: () => toast.error("No se pudo quitar la etiqueta"),
  })

  const crearEtiquetaMutation = useMutation({
    mutationFn: async () => {
      const etiqueta = await crearEtiqueta({
        data: {
          nombre: nombreEtiqueta,
          color: colorEtiqueta,
          proyectoId: tarea.proyectoId,
        },
      })
      await asignarEtiqueta({
        data: { tareaId: tarea.id, etiquetaId: etiqueta.id },
      })
      return etiqueta
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["tareas"] })
      toast.success("Etiqueta creada")
      setNombreEtiqueta("")
      setMostrarNuevaEtiqueta(false)
    },
    onError: () => toast.error("No se pudo crear la etiqueta"),
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

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Etiquetas</Label>
            <button
              type="button"
              onClick={() => setMostrarNuevaEtiqueta((valor) => !valor)}
              className="text-[10px] font-bold text-muted-foreground hover:text-heading"
            >
              {mostrarNuevaEtiqueta ? "Cancelar" : "+ Nueva"}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {tarea.etiquetas.map((etiqueta) => (
              <Badge
                key={etiqueta.id}
                variant="outline"
                className="gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold"
                style={{
                  backgroundColor: `${etiqueta.color}1f`,
                  color: etiqueta.color,
                }}
              >
                {etiqueta.nombre}
                <button
                  type="button"
                  aria-label={`Quitar ${etiqueta.nombre}`}
                  onClick={() => quitar.mutate(etiqueta.id)}
                  className="rounded-full p-0.5 hover:bg-black/10"
                >
                  <X className="size-2.5" />
                </button>
              </Badge>
            ))}

            {etiquetasDisponibles.length > 0 ? (
              <select
                value=""
                onChange={(event) => {
                  const id = Number(event.target.value)
                  if (id) asignar.mutate(id)
                }}
                aria-label="Agregar etiqueta"
                className="h-7 rounded-full border border-outline-variant/70 bg-card px-2 text-[9px] font-bold text-muted-foreground outline-none focus:border-ring"
              >
                <option value="">+ Agregar</option>
                {etiquetasDisponibles.map((etiqueta) => (
                  <option key={etiqueta.id} value={etiqueta.id}>
                    {etiqueta.nombre}
                  </option>
                ))}
              </select>
            ) : null}
          </div>

          {mostrarNuevaEtiqueta ? (
            <div className="space-y-2 rounded-2xl bg-surface-container-low p-3">
              <Input
                value={nombreEtiqueta}
                onChange={(event) => setNombreEtiqueta(event.target.value)}
                placeholder="Nombre de la etiqueta"
                className="h-8 text-xs"
              />
              <div className="flex flex-wrap gap-1.5">
                {paleta.slice(0, 8).map((color) => (
                  <button
                    key={color}
                    type="button"
                    aria-label={`Color ${color}`}
                    onClick={() => setColorEtiqueta(color)}
                    className={cn(
                      "size-4 rounded-full border-2",
                      colorEtiqueta === color
                        ? "border-heading ring-1 ring-lime-voltage"
                        : "border-transparent",
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <Button
                type="button"
                size="sm"
                className="h-7 rounded-full px-3 text-[10px]"
                onClick={() => crearEtiquetaMutation.mutate()}
                disabled={
                  !nombreEtiqueta.trim() || crearEtiquetaMutation.isPending
                }
              >
                Crear y asignar
              </Button>
            </div>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-1.5">
            <GitBranch className="size-3.5" aria-hidden="true" />
            Subtareas ({tarea.subtareasCompletadas}/{tarea.subtareas.length})
          </Label>

          {tarea.subtareas.length > 0 ? (
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
          ) : null}

          <form
            className="flex items-center gap-2"
            onSubmit={(event) => {
              event.preventDefault()
              if (!nuevaSubtarea.trim()) return
              crearSubtarea.mutate(nuevaSubtarea.trim())
            }}
          >
            <Input
              value={nuevaSubtarea}
              onChange={(event) => setNuevaSubtarea(event.target.value)}
              placeholder="Agregar subtarea..."
              className="h-9 text-xs"
              disabled={!estadoPendiente}
            />
            <Button
              type="submit"
              size="icon"
              className="size-9 shrink-0"
              aria-label="Agregar subtarea"
              disabled={
                !nuevaSubtarea.trim() ||
                crearSubtarea.isPending ||
                !estadoPendiente
              }
            >
              <Plus className="size-4" aria-hidden="true" />
            </Button>
          </form>
        </div>

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
