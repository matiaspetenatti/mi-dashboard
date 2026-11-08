"use client"

import { useEffect, useMemo, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { CalendarDays, Plus } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { crearTarea } from "@/features/tareas/server/functions"
import { prioridadesTarea } from "@/features/tareas/schemas"
import type { ResumenProyecto } from "@/features/tareas/types"
import type { EstadoProyecto } from "@/server/db/schema"
import { cn } from "cn"

type Prioridad = (typeof prioridadesTarea)[number]

export function DialogoNuevaTarea({
  open,
  onOpenChange,
  proyectos,
  estados,
  proyectoInicial,
  estadoInicial,
  fechaInicial,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  proyectos: ResumenProyecto[]
  estados: EstadoProyecto[]
  proyectoInicial?: number
  estadoInicial?: number
  fechaInicial?: string
}) {
  const queryClient = useQueryClient()
  const proyectosActivos = useMemo(
    () => proyectos.filter((item) => !item.proyecto.archivado),
    [proyectos],
  )

  const [titulo, setTitulo] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [proyectoId, setProyectoId] = useState<number | null>(null)
  const [estadoId, setEstadoId] = useState<number | null>(null)
  const [prioridad, setPrioridad] = useState<Prioridad | null>(null)
  const [fechaInicio, setFechaInicio] = useState("")
  const [fechaLimite, setFechaLimite] = useState("")

  const estadosProyecto = useMemo(
    () => estados.filter((estado) => estado.proyectoId === proyectoId),
    [estados, proyectoId],
  )

  useEffect(() => {
    if (!open) return
    const estadoInicialObj = estados.find(
      (estado) => estado.id === estadoInicial,
    )
    const proyecto =
      proyectosActivos.find(
        (item) =>
          item.proyecto.id ===
          (proyectoInicial ?? estadoInicialObj?.proyectoId),
      ) ?? proyectosActivos.at(0)
    const primerEstado =
      estadoInicialObj ??
      estados
        .filter((estado) => estado.proyectoId === proyecto?.proyecto.id)
        .sort((a, b) => a.posicion - b.posicion)
        .at(0)

    setTitulo("")
    setDescripcion("")
    setProyectoId(proyecto?.proyecto.id ?? null)
    setEstadoId(primerEstado?.id ?? null)
    setPrioridad(null)
    setFechaInicio("")
    setFechaLimite(fechaInicial ?? "")
  }, [open, proyectoInicial, estadoInicial, fechaInicial, proyectosActivos, estados])

  const mutation = useMutation({
    mutationFn: () => {
      if (!proyectoId || !estadoId) throw new Error("Falta proyecto o estado")
      return crearTarea({
        data: {
          proyectoId,
          estadoId,
          titulo,
          descripcion: descripcion.trim() || null,
          prioridad,
          fechaInicio: fechaInicio || null,
          fechaLimite: fechaLimite || null,
        },
      })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["tareas"] })
      toast.success("Tarea creada")
      onOpenChange(false)
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "No se pudo crear la tarea",
      )
    },
  })

  const puedeCrear = titulo.trim().length > 0 && proyectoId && estadoId

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-black tracking-tight">
            Nueva tarea
          </DialogTitle>
          <DialogDescription>
            Elegí el proyecto y el estado. Después podés moverla desde el tablero.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault()
            if (!puedeCrear) return
            mutation.mutate()
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="tarea-titulo">Título</Label>
            <Input
              id="tarea-titulo"
              autoFocus
              value={titulo}
              onChange={(event) => setTitulo(event.target.value)}
              placeholder="¿Qué tenés que hacer?"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tarea-descripcion">Descripción</Label>
            <Textarea
              id="tarea-descripcion"
              value={descripcion}
              onChange={(event) => setDescripcion(event.target.value)}
              placeholder="Detalles, links, contexto..."
              rows={3}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tarea-proyecto">Proyecto</Label>
              <select
                id="tarea-proyecto"
                value={proyectoId ?? ""}
                onChange={(event) => {
                  const id = Number(event.target.value)
                  setProyectoId(id)
                  const primerEstado = estados
                    .filter((estado) => estado.proyectoId === id)
                    .sort((a, b) => a.posicion - b.posicion)
                    .at(0)
                  setEstadoId(primerEstado?.id ?? null)
                }}
                className="h-10 w-full rounded-xl border border-outline-variant/70 bg-card px-3 text-sm text-heading outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
              >
                {proyectosActivos.map((item) => (
                  <option key={item.proyecto.id} value={item.proyecto.id}>
                    {item.proyecto.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tarea-estado">Estado</Label>
              <select
                id="tarea-estado"
                value={estadoId ?? ""}
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
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tarea-inicio">Inicio</Label>
              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="tarea-inicio"
                  type="date"
                  className="pl-9"
                  value={fechaInicio}
                  onChange={(event) => setFechaInicio(event.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tarea-limite">Fecha límite</Label>
              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="tarea-limite"
                  type="date"
                  className="pl-9"
                  value={fechaLimite}
                  onChange={(event) => setFechaLimite(event.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Prioridad</Label>
            <div className="flex flex-wrap gap-2">
              {prioridadesTarea.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() =>
                    setPrioridad(prioridad === item ? null : item)
                  }
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-[11px] font-bold capitalize transition-colors",
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

          <DialogFooter showCloseButton={false}>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={!puedeCrear || mutation.isPending}>
              <Plus className="size-4" aria-hidden="true" />
              {mutation.isPending ? "Creando..." : "Crear tarea"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
