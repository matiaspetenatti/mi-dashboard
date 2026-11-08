"use client"

import { useMemo, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  CalendarDays,
  CheckCheck,
  Kanban,
  List,
  Plus,
  Search,
  Table2,
} from "lucide-react"
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
import { PageHeader } from "@/components/organisms/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DialogoNuevaTarea } from "@/features/tareas/components/dialogo-nueva-tarea"
import { DialogoProyecto } from "@/features/tareas/components/dialogo-proyecto"
import { CalendarioTareas } from "@/features/tareas/components/calendario-tareas"
import { ListaTareas } from "@/features/tareas/components/lista-tareas"
import { NavProyectos } from "@/features/tareas/components/nav-proyectos"
import { PanelTarea } from "@/features/tareas/components/panel-tarea"
import { ResumenTareas } from "@/features/tareas/components/resumen-tareas"
import { TablaTareas } from "@/features/tareas/components/tabla-tareas"
import { TableroTareas } from "@/features/tareas/components/tablero-tareas"
import { filtrarTareas, resumenTareas } from "@/features/tareas/lib/filtrar"
import {
  alternarTarea,
  eliminarTarea,
  moverTarea,
} from "@/features/tareas/server/functions"
import type {
  FiltroVencimiento,
  FiltrosTareas,
  TareaConDetalle,
  VistaTareas,
  WorkspaceTareas,
} from "@/features/tareas/types"
import { prioridadesTarea } from "@/features/tareas/schemas"
import { cn } from "cn"

const vistas: Array<{
  value: VistaTareas
  label: string
  icon: typeof List
}> = [
  { value: "lista", label: "Lista", icon: List },
  { value: "tablero", label: "Tablero", icon: Kanban },
  { value: "tabla", label: "Tabla", icon: Table2 },
  { value: "calendario", label: "Calendario", icon: CalendarDays },
]

export function WorkspaceTareas({
  workspace,
  proyectoSlug,
  onSeleccionarProyecto,
}: {
  workspace: WorkspaceTareas
  proyectoSlug: string | null
  onSeleccionarProyecto: (slug: string | null) => void
}) {
  const queryClient = useQueryClient()
  const [vista, setVista] = useState<VistaTareas>("lista")
  const [filtros, setFiltros] = useState<FiltrosTareas>({
    busqueda: "",
    prioridad: null,
    vencimiento: "todas",
    mostrarCompletadas: false,
  })
  const [tareaSeleccionadaId, setTareaSeleccionadaId] = useState<number | null>(
    null,
  )
  const [tareaAEliminar, setTareaAEliminar] =
    useState<TareaConDetalle | null>(null)
  const [nuevaTarea, setNuevaTarea] = useState<{
    open: boolean
    estadoId?: number
    fecha?: string
  }>({ open: false })
  const [nuevoProyecto, setNuevoProyecto] = useState(false)

  const proyectoActual = useMemo(
    () =>
      workspace.proyectos.find(
        (item) => item.proyecto.slug === proyectoSlug,
      ) ?? null,
    [workspace.proyectos, proyectoSlug],
  )

  const tareasProyecto = useMemo(
    () =>
      proyectoActual
        ? workspace.tareas.filter(
            (tarea) => tarea.proyectoId === proyectoActual.proyecto.id,
          )
        : workspace.tareas,
    [workspace.tareas, proyectoActual],
  )

  const resumenActual = useMemo(
    () => resumenTareas(tareasProyecto),
    [tareasProyecto],
  )
  const resumenGlobal = useMemo(
    () => resumenTareas(workspace.tareas),
    [workspace.tareas],
  )

  const tareasFiltradas = useMemo(
    () =>
      filtrarTareas(
        workspace.tareas,
        proyectoActual?.proyecto.id ?? null,
        filtros,
      ),
    [workspace.tareas, proyectoActual, filtros],
  )

  const estadosActuales = proyectoActual?.estados ?? workspace.estados

  const tareaSeleccionada = useMemo(
    () =>
      workspace.tareas.find((tarea) => tarea.id === tareaSeleccionadaId) ??
      null,
    [workspace.tareas, tareaSeleccionadaId],
  )

  const abrirTarea = (tarea: TareaConDetalle) => {
    setTareaSeleccionadaId(tarea.id)
  }

  const invalidar = () => {
    void queryClient.invalidateQueries({ queryKey: ["tareas"] })
  }

  const alternar = useMutation({
    mutationFn: ({
      id,
      completada,
    }: {
      id: number
      completada: boolean
    }) => alternarTarea({ data: { id, completada } }),
    onSuccess: invalidar,
    onError: () => toast.error("No se pudo actualizar la tarea"),
  })

  const mover = useMutation({
    mutationFn: ({
      id,
      estadoId,
    }: {
      id: number
      estadoId: number
    }) => moverTarea({ data: { id, estadoId } }),
    onSuccess: invalidar,
    onError: () => {
      toast.error("No se pudo mover la tarea")
      invalidar()
    },
  })

  const borrar = useMutation({
    mutationFn: (id: number) => eliminarTarea({ data: { id } }),
    onSuccess: () => {
      invalidar()
      toast.success("Tarea eliminada")
      setTareaAEliminar(null)
    },
    onError: () => toast.error("No se pudo eliminar la tarea"),
  })

  const onAlternar = (tarea: TareaConDetalle, completada: boolean) => {
    alternar.mutate({ id: tarea.id, completada })
  }

  const onSeleccionar = (slug: string | null) => {
    setTareaSeleccionadaId(null)
    onSeleccionarProyecto(slug)
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Productividad"
        title={proyectoActual?.proyecto.nombre ?? "Tareas"}
        description={
          proyectoActual?.proyecto.descripcion ??
          "Todos tus proyectos, pendientes y fechas en un solo lugar."
        }
        meta={`${resumenActual.pendientes} pendientes`}
        actions={
          workspace.proyectos.length === 0 ? (
            <Button onClick={() => setNuevoProyecto(true)}>
              <Plus className="size-4" aria-hidden="true" />
              Nuevo proyecto
            </Button>
          ) : (
            <Button onClick={() => setNuevaTarea({ open: true })}>
              <Plus className="size-4" aria-hidden="true" />
              Nueva tarea
            </Button>
          )
        }
      />

      {proyectoActual ? (
        <div className="flex items-center gap-3">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-container">
            <div
              className="h-full rounded-full bg-lime-voltage"
              style={{
                width: `${Math.min(100, Math.max(2, proyectoActual.progreso))}%`,
              }}
            />
          </div>
          <span className="tabular text-[10px] font-bold text-muted-foreground">
            {proyectoActual.progreso}% completado
          </span>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <NavProyectos
          proyectos={workspace.proyectos}
          proyectoSeleccionado={proyectoSlug}
          onSeleccionar={onSeleccionar}
          onNuevoProyecto={() => setNuevoProyecto(true)}
          filtroVencimiento={filtros.vencimiento}
          onFiltroVencimiento={(vencimiento: FiltroVencimiento) =>
            setFiltros((actual) => ({ ...actual, vencimiento }))
          }
          resumenGlobal={resumenGlobal}
        />

        <div className="flex min-w-0 flex-col gap-4">
          <ResumenTareas resumen={resumenActual} />

          <div className="flex flex-col gap-3 rounded-3xl border border-outline-variant/60 bg-card p-3 shadow-elevation-1">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 rounded-full bg-surface-container p-1">
                {vistas.map((item) => {
                  const Icon = item.icon
                  const activo = vista === item.value
                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setVista(item.value)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold transition-colors",
                        activo
                          ? "bg-lime-voltage text-forest-ink"
                          : "text-muted-foreground hover:text-heading",
                      )}
                    >
                      <Icon className="size-3.5" aria-hidden="true" />
                      <span className="hidden sm:inline">{item.label}</span>
                    </button>
                  )
                })}
              </div>

              <div className="relative ml-auto w-full sm:w-56">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={filtros.busqueda}
                  onChange={(event) =>
                    setFiltros((actual) => ({
                      ...actual,
                      busqueda: event.target.value,
                    }))
                  }
                  placeholder="Buscar tareas..."
                  className="h-9 pl-9 text-xs"
                />
              </div>

              <select
                value={filtros.prioridad ?? ""}
                onChange={(event) =>
                  setFiltros((actual) => ({
                    ...actual,
                    prioridad: event.target.value || null,
                  }))
                }
                className="h-9 rounded-xl border border-outline-variant/70 bg-card px-2.5 text-[10px] font-semibold text-muted-foreground outline-none focus:border-ring"
                aria-label="Filtrar por prioridad"
              >
                <option value="">Todas las prioridades</option>
                {prioridadesTarea.map((prioridad) => (
                  <option key={prioridad} value={prioridad}>
                    {prioridad}
                  </option>
                ))}
              </select>

              <Button
                type="button"
                variant={filtros.mostrarCompletadas ? "default" : "outline"}
                size="sm"
                className="h-9 rounded-full px-3 text-[10px] font-bold"
                onClick={() =>
                  setFiltros((actual) => ({
                    ...actual,
                    mostrarCompletadas: !actual.mostrarCompletadas,
                  }))
                }
              >
                <CheckCheck className="size-3.5" aria-hidden="true" />
                Completadas
              </Button>
            </div>

            {filtros.vencimiento !== "todas" ||
            filtros.prioridad ||
            filtros.busqueda ? (
              <div className="flex items-center gap-2 text-[10px] font-semibold text-muted-foreground">
                Filtros activos
                <button
                  type="button"
                  onClick={() =>
                    setFiltros({
                      busqueda: "",
                      prioridad: null,
                      vencimiento: "todas",
                      mostrarCompletadas: filtros.mostrarCompletadas,
                    })
                  }
                  className="font-bold text-heading underline underline-offset-2"
                >
                  Limpiar
                </button>
              </div>
            ) : null}
          </div>

          {vista === "lista" ? (
            <ListaTareas
              tareas={tareasFiltradas}
              estados={estadosActuales}
              agruparPor={proyectoActual ? "estado" : "proyecto"}
              mostrarProyecto={!proyectoActual}
              onAbrir={abrirTarea}
              onAlternar={onAlternar}
              onEliminar={setTareaAEliminar}
            />
          ) : null}

          {vista === "tablero" && !proyectoActual ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-outline-variant/70 bg-card/50 px-6 py-12 text-center">
              <span className="flex size-12 items-center justify-center rounded-full bg-linen-mist text-forest-ink dark:bg-primary-container dark:text-lime-voltage">
                <Kanban className="size-6" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-black text-heading">
                  Elegí un proyecto para usar el tablero
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  El tablero muestra las columnas de estado de un proyecto.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {workspace.proyectos.map((item) => (
                  <Button
                    key={item.proyecto.id}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-full px-3 text-[10px] font-bold"
                    onClick={() => onSeleccionar(item.proyecto.slug)}
                  >
                    <span
                      className="size-2 rounded-full"
                      style={{ backgroundColor: item.proyecto.color }}
                    />
                    {item.proyecto.nombre}
                  </Button>
                ))}
              </div>
            </div>
          ) : null}

          {vista === "tablero" && proyectoActual ? (
            <TableroTareas
              tareas={tareasFiltradas}
              estados={estadosActuales}
              onAbrir={abrirTarea}
              onMover={(id, estadoId) => mover.mutate({ id, estadoId })}
              onAlternar={onAlternar}
              onCrearEnEstado={(estadoId) =>
                setNuevaTarea({ open: true, estadoId })
              }
            />
          ) : null}

          {vista === "tabla" ? (
            <TablaTareas
              tareas={tareasFiltradas}
              onAbrir={abrirTarea}
              onAlternar={onAlternar}
            />
          ) : null}

          {vista === "calendario" ? (
            <CalendarioTareas
              tareas={tareasFiltradas}
              onAbrir={abrirTarea}
              onCrearEnFecha={(fecha) => setNuevaTarea({ open: true, fecha })}
            />
          ) : null}
        </div>
      </div>

      <PanelTarea
        tarea={tareaSeleccionada}
        estados={workspace.estados}
        onOpenChange={(open) => {
          if (!open) setTareaSeleccionadaId(null)
        }}
      />

      <DialogoNuevaTarea
        open={nuevaTarea.open}
        onOpenChange={(open) => setNuevaTarea((actual) => ({ ...actual, open }))}
        proyectos={workspace.proyectos}
        estados={workspace.estados}
        proyectoInicial={proyectoActual?.proyecto.id}
        estadoInicial={nuevaTarea.estadoId}
        fechaInicial={nuevaTarea.fecha}
      />

      <DialogoProyecto
        open={nuevoProyecto}
        onOpenChange={setNuevoProyecto}
        onCreado={(slug) => onSeleccionar(slug)}
      />

      <AlertDialog
        open={Boolean(tareaAEliminar)}
        onOpenChange={(open) => {
          if (!open) setTareaAEliminar(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta tarea?</AlertDialogTitle>
            <AlertDialogDescription>
              Se va a borrar “{tareaAEliminar?.titulo}”. Esta acción no se puede
              deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (tareaAEliminar) borrar.mutate(tareaAEliminar.id)
              }}
              className="bg-error text-paper hover:bg-error/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
