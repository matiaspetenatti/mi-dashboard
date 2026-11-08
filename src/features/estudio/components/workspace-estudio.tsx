"use client"

import { useMemo, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Award,
  BookOpen,
  CalendarClock,
  CalendarDays,
  GraduationCap,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
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
import { DialogoCarrera } from "@/features/estudio/components/dialogo-carrera"
import { DialogoExamen } from "@/features/estudio/components/dialogo-examen"
import { DialogoMateria } from "@/features/estudio/components/dialogo-materia"
import { EstudioTiempoChart } from "@/features/estudio/components/estudio-tiempo-chart"
import { PomodoroEstudio } from "@/features/estudio/components/pomodoro-estudio"
import {
  borrarCarrera,
  borrarExamen,
  borrarMateria,
} from "@/features/estudio/server/functions"
import {
  etiquetasCuatrimestre,
  etiquetasEstadoCarrera,
  etiquetasEstadoExamen,
  etiquetasEstadoMateria,
  etiquetasResultadoExamen,
  etiquetasTipoExamen,
} from "@/features/estudio/constantes"
import type {
  EstudioWorkspace,
  ExamenConContexto,
  ResumenCarrera,
} from "@/features/estudio/types"
import type {
  Carrera,
  EstadoMateria,
  Materia,
} from "@/server/db/schema"
import { diasHasta } from "@/lib/dates"
import { formatNota, formatearFecha } from "@/lib/format"
import { cn } from "cn"

const clasesEstadoMateria: Record<EstadoMateria, string> = {
  pendiente: "bg-surface-container text-muted-foreground",
  cursando: "bg-signal-blue/10 text-signal-blue",
  regular: "bg-warning-container text-warning",
  aprobada: "bg-success-container text-success",
  libre: "bg-error-container text-error",
}

const clasesEstadoExamen: Record<string, string> = {
  programado: "bg-signal-blue/10 text-signal-blue",
  rendido: "bg-success-container text-success",
  ausente: "bg-warning-container text-warning",
}

type ObjetivoEliminar =
  | { tipo: "carrera"; carrera: Carrera }
  | { tipo: "materia"; materia: Materia }
  | { tipo: "examen"; examen: ExamenConContexto }

export function WorkspaceEstudio({
  workspace,
  carreraId,
  onSeleccionarCarrera,
}: {
  workspace: EstudioWorkspace
  carreraId: number | null
  onSeleccionarCarrera: (id: number | null) => void
}) {
  const queryClient = useQueryClient()

  const [carreraOpen, setCarreraOpen] = useState(false)
  const [carreraEditando, setCarreraEditando] = useState<Carrera | null>(null)
  const [materiaOpen, setMateriaOpen] = useState(false)
  const [materiaEditando, setMateriaEditando] = useState<Materia | null>(null)
  const [examenOpen, setExamenOpen] = useState(false)
  const [examenEditando, setExamenEditando] =
    useState<ExamenConContexto | null>(null)
  const [objetivoEliminar, setObjetivoEliminar] =
    useState<ObjetivoEliminar | null>(null)
  const [busqueda, setBusqueda] = useState("")
  const [filtro, setFiltro] = useState<"todas" | EstadoMateria>("todas")

  const carrera =
    workspace.carreras.find((item) => item.carrera.id === carreraId) ??
    workspace.carreras.at(0) ??
    null

  const invalidar = () => {
    void queryClient.invalidateQueries({ queryKey: ["estudio"] })
  }

  const borrar = useMutation({
    mutationFn: (objetivo: ObjetivoEliminar) => {
      if (objetivo.tipo === "carrera") {
        return borrarCarrera({ data: { id: objetivo.carrera.id } })
      }
      if (objetivo.tipo === "materia") {
        return borrarMateria({ data: { id: objetivo.materia.id } })
      }
      return borrarExamen({ data: { id: objetivo.examen.id } })
    },
    onSuccess: (_resultado, objetivo) => {
      invalidar()
      setObjetivoEliminar(null)
      if (objetivo.tipo === "carrera") {
        toast.success("Carrera eliminada")
        onSeleccionarCarrera(null)
        return
      }
      toast.success(
        objetivo.tipo === "materia" ? "Materia eliminada" : "Examen eliminado",
      )
    },
    onError: () => toast.error("No se pudo eliminar"),
  })

  const materiasFiltradas = useMemo(() => {
    if (!carrera) return []
    const texto = busqueda.trim().toLowerCase()
    return carrera.materias.filter((materia) => {
      const coincideTexto =
        texto.length === 0 || materia.nombre.toLowerCase().includes(texto)
      const coincideEstado = filtro === "todas" || materia.estado === filtro
      return coincideTexto && coincideEstado
    })
  }, [carrera, busqueda, filtro])

  const grupos = useMemo(() => {
    const mapa = new Map<number | null, Materia[]>()
    for (const materia of materiasFiltradas) {
      const lista = mapa.get(materia.anio) ?? []
      lista.push(materia)
      mapa.set(materia.anio, lista)
    }
    return [...mapa.entries()].sort((a, b) => {
      if (a[0] === null) return 1
      if (b[0] === null) return -1
      return a[0] - b[0]
    })
  }, [materiasFiltradas])

  const sesiones = useMemo(
    () =>
      carrera
        ? workspace.sesiones.filter(
            (sesion) => sesion.carreraId === carrera.carrera.id,
          )
        : [],
    [carrera, workspace.sesiones],
  )

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Carrera"
        title="Estudio"
        description="Carreras, materias, notas y exámenes. Todo tu recorrido académico en un lugar."
        meta={`${workspace.resumen.totalCarreras} carreras`}
        actions={
          <Button
            onClick={() => {
              setCarreraEditando(null)
              setCarreraOpen(true)
            }}
          >
            <Plus className="size-4" aria-hidden="true" />
            Nueva carrera
          </Button>
        }
      />

      {workspace.carreras.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-outline-variant/70 bg-card/50 px-6 py-16 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-linen-mist text-forest-ink dark:bg-primary-container dark:text-lime-voltage">
            <GraduationCap className="size-6" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-black text-heading">
              Empezá cargando tu carrera
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Después vas a poder sumar materias, notas y exámenes.
            </p>
          </div>
          <Button
            onClick={() => {
              setCarreraEditando(null)
              setCarreraOpen(true)
            }}
          >
            <Plus className="size-4" aria-hidden="true" />
            Crear carrera
          </Button>
        </div>
      ) : (
        <>
          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-black text-heading">Tus carreras</h2>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {workspace.carreras.map((item) => (
                <TarjetaCarrera
                  key={item.carrera.id}
                  item={item}
                  activa={item.carrera.id === carrera?.carrera.id}
                  onSeleccionar={() => onSeleccionarCarrera(item.carrera.id)}
                  onEditar={() => {
                    setCarreraEditando(item.carrera)
                    setCarreraOpen(true)
                  }}
                />
              ))}
            </div>
          </section>

          {carrera ? (
            <>
              <section className="flex flex-col justify-between gap-4 rounded-3xl border border-card-inverse-border bg-card-inverse p-6 text-card-inverse-foreground lg:flex-row lg:items-end">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.12em] text-card-inverse-muted">
                    <span
                      className="size-2 rounded-full"
                      style={{ backgroundColor: carrera.carrera.color }}
                    />
                    {etiquetasEstadoCarrera[carrera.carrera.estado]}
                  </p>
                  <h2 className="mt-2 truncate text-3xl font-black leading-tight">
                    {carrera.carrera.nombre}
                  </h2>
                  <p className="mt-1 text-xs text-card-inverse-muted">
                    {carrera.carrera.institucion ?? "Sin institución"}
                    {carrera.carrera.anioInicio
                      ? ` · Desde ${carrera.carrera.anioInicio}`
                      : ""}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-white/15 px-3 py-1.5 text-[10px] font-bold">
                    {carrera.aprobadas}/{carrera.totalPlan} materias
                  </span>
                  <Button
                    variant="outline"
                    className="h-9 rounded-full border-white/20 bg-white/5 px-4 text-[11px] font-bold text-card-inverse-foreground hover:bg-white/10 hover:text-card-inverse-foreground"
                    onClick={() => {
                      setCarreraEditando(carrera.carrera)
                      setCarreraOpen(true)
                    }}
                  >
                    <Pencil className="size-3.5" aria-hidden="true" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-9 rounded-full border-white/20 bg-white/5 text-card-inverse-foreground hover:bg-error/20 hover:text-error"
                    aria-label="Eliminar carrera"
                    onClick={() =>
                      setObjetivoEliminar({
                        tipo: "carrera",
                        carrera: carrera.carrera,
                      })
                    }
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </section>

              <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Metrica
                  icon={Target}
                  label="Avance"
                  value={`${carrera.progreso}%`}
                  detalle={`${carrera.aprobadas} de ${carrera.totalPlan}`}
                  progreso={carrera.progreso}
                />
                <Metrica
                  icon={Award}
                  label="Promedio"
                  value={
                    carrera.promedio != null
                      ? formatNota(carrera.promedio)
                      : "—"
                  }
                  detalle="Materias aprobadas"
                />
                <Metrica
                  icon={BookOpen}
                  label="Cursando"
                  value={String(carrera.cursando + carrera.regulares)}
                  detalle={`${carrera.pendientes} pendientes`}
                />
                <Metrica
                  icon={CalendarDays}
                  label="Graduación"
                  value={
                    carrera.graduacionEstimada
                      ? String(carrera.graduacionEstimada)
                      : "—"
                  }
                  detalle="Estimada"
                />
              </section>

              {carrera.proximoExamen ? (
                <div className="flex flex-wrap items-center gap-3 rounded-3xl border border-lime-voltage/40 bg-linen-mist/60 px-5 py-4 dark:bg-primary-container/40">
                  <span className="flex size-10 items-center justify-center rounded-full bg-lime-voltage text-forest-ink">
                    <CalendarClock className="size-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                      Próximo examen
                    </p>
                    <p className="truncate text-sm font-black text-heading">
                      {carrera.proximoExamen.materia} ·{" "}
                      {carrera.proximoExamen.titulo ||
                        etiquetasTipoExamen[carrera.proximoExamen.tipo]}
                    </p>
                  </div>
                  <span className="rounded-full bg-card px-3 py-1.5 text-[11px] font-bold text-heading">
                    {textoCuenta(carrera.proximoExamen.fecha, workspace.hoy)}
                  </span>
                </div>
              ) : null}

              <section className="grid gap-4 xl:grid-cols-[1.45fr_1fr]">
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-sm font-black text-heading">Materias</h2>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 rounded-full px-3 text-[10px] font-bold"
                      onClick={() => {
                        setMateriaEditando(null)
                        setMateriaOpen(true)
                      }}
                    >
                      <Plus className="size-3.5" aria-hidden="true" />
                      Nueva materia
                    </Button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative min-w-48 flex-1">
                      <Search
                        className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
                        aria-hidden="true"
                      />
                      <Input
                        value={busqueda}
                        onChange={(event) => setBusqueda(event.target.value)}
                        placeholder="Buscar materia..."
                        className="h-9 pl-8 text-xs"
                        aria-label="Buscar materia"
                      />
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {(
                        [
                          ["todas", "Todas"],
                          ["cursando", "Cursando"],
                          ["regular", "Regulares"],
                          ["aprobada", "Aprobadas"],
                          ["pendiente", "Pendientes"],
                        ] as const
                      ).map(([valor, etiqueta]) => (
                        <button
                          key={valor}
                          type="button"
                          onClick={() => setFiltro(valor)}
                          className={cn(
                            "rounded-full border px-2.5 py-1 text-[10px] font-bold transition-colors",
                            filtro === valor
                              ? "border-forest-ink bg-forest-ink text-paper dark:border-lime-voltage dark:bg-lime-voltage dark:text-forest-ink"
                              : "border-outline-variant/70 bg-card text-muted-foreground hover:text-heading",
                          )}
                        >
                          {etiqueta}
                        </button>
                      ))}
                    </div>
                  </div>

                  {materiasFiltradas.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-outline-variant/70 bg-card/40 px-5 py-10 text-center">
                      <p className="text-xs font-bold text-heading">
                        {carrera.materias.length === 0
                          ? "Todavía no cargaste materias"
                          : "No hay materias con ese filtro"}
                      </p>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {carrera.materias.length === 0
                          ? "Sumá la primera para empezar a seguir tu avance."
                          : "Probá con otro estado o limpiá la búsqueda."}
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {grupos.map(([anio, materias]) => (
                        <div key={anio ?? "sin-anio"} className="flex flex-col gap-2">
                          <h3 className="px-1 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                            {anio ? `${anio}° año` : "Sin año"}
                            <span className="ml-2 text-muted-foreground/70">
                              {materias.length}
                            </span>
                          </h3>
                          <div className="overflow-hidden rounded-3xl border border-outline-variant/60 bg-card shadow-elevation-1">
                            <ul className="divide-y divide-outline-variant/30">
                              {materias.map((materia) => (
                                <li
                                  key={materia.id}
                                  className="flex items-center gap-3 px-4 py-3"
                                >
                                  <span
                                    className={cn(
                                      "flex size-8 shrink-0 items-center justify-center rounded-full",
                                      clasesEstadoMateria[materia.estado],
                                    )}
                                  >
                                    <BookOpen
                                      className="size-3.5"
                                      aria-hidden="true"
                                    />
                                  </span>

                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-xs font-bold text-heading">
                                      {materia.nombre}
                                    </p>
                                    <p className="truncate text-[9px] text-muted-foreground">
                                      {[
                                        materia.cuatrimestre
                                          ? etiquetasCuatrimestre[
                                              materia.cuatrimestre
                                            ]
                                          : null,
                                        materia.profesor,
                                        materia.creditos
                                          ? `${materia.creditos} créditos`
                                          : null,
                                      ]
                                        .filter(Boolean)
                                        .join(" · ") || "Sin datos extra"}
                                    </p>
                                  </div>

                                  <span
                                    className={cn(
                                      "shrink-0 rounded-full px-2.5 py-1 text-[9px] font-bold",
                                      clasesEstadoMateria[materia.estado],
                                    )}
                                  >
                                    {etiquetasEstadoMateria[materia.estado]}
                                  </span>

                                  <span className="tabular w-9 shrink-0 text-right text-xs font-black text-heading">
                                    {materia.notaFinal != null
                                      ? formatNota(materia.notaFinal)
                                      : "—"}
                                  </span>

                                  <div className="flex shrink-0 items-center gap-0.5">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="size-7 text-muted-foreground hover:text-heading"
                                      aria-label={`Editar ${materia.nombre}`}
                                      onClick={() => {
                                        setMateriaEditando(materia)
                                        setMateriaOpen(true)
                                      }}
                                    >
                                      <Pencil className="size-3" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="size-7 text-muted-foreground hover:text-error"
                                      aria-label={`Eliminar ${materia.nombre}`}
                                      onClick={() =>
                                        setObjetivoEliminar({
                                          tipo: "materia",
                                          materia,
                                        })
                                      }
                                    >
                                      <Trash2 className="size-3" />
                                    </Button>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-4">
                  <PomodoroEstudio
                    key={carrera.carrera.id}
                    carreraId={carrera.carrera.id}
                    materias={carrera.materias}
                  />

                  <section className="rounded-3xl border border-outline-variant/60 bg-card p-5 shadow-elevation-1">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <h2 className="text-sm font-black text-heading">
                          Exámenes
                        </h2>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          {carrera.examenes.length} registrados
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 rounded-full px-3 text-[10px] font-bold"
                        onClick={() => {
                          setExamenEditando(null)
                          setExamenOpen(true)
                        }}
                        disabled={carrera.materias.length === 0}
                      >
                        <Plus className="size-3.5" aria-hidden="true" />
                        Nuevo
                      </Button>
                    </div>

                    {carrera.examenes.length === 0 ? (
                      <p className="mt-5 rounded-2xl bg-surface-container-low px-3 py-6 text-center text-[11px] text-muted-foreground">
                        {carrera.materias.length === 0
                          ? "Cargá una materia para registrar exámenes."
                          : "Sin exámenes registrados todavía."}
                      </p>
                    ) : (
                      <ul className="mt-4 flex flex-col gap-2">
                        {carrera.examenes.map((examen) => {
                          const proximo =
                            examen.estado === "programado" &&
                            examen.fecha >= workspace.hoy
                          return (
                            <li
                              key={examen.id}
                              className="rounded-2xl border border-outline-variant/50 bg-surface-container-low/60 p-3"
                            >
                              <div className="flex items-start gap-2">
                                <span
                                  className={cn(
                                    "flex size-7 shrink-0 items-center justify-center rounded-full",
                                    clasesEstadoExamen[examen.estado],
                                  )}
                                >
                                  <CalendarClock
                                    className="size-3.5"
                                    aria-hidden="true"
                                  />
                                </span>

                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-[11px] font-black text-heading">
                                    {examen.titulo ||
                                      etiquetasTipoExamen[examen.tipo]}
                                  </p>
                                  <p className="truncate text-[9px] text-muted-foreground">
                                    {examen.materia} ·{" "}
                                    {formatearFecha(examen.fecha, false)}
                                  </p>
                                </div>

                                <div className="flex shrink-0 items-center gap-0.5">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-6 text-muted-foreground hover:text-heading"
                                    aria-label="Editar examen"
                                    onClick={() => {
                                      setExamenEditando(examen)
                                      setExamenOpen(true)
                                    }}
                                  >
                                    <Pencil className="size-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-6 text-muted-foreground hover:text-error"
                                    aria-label="Eliminar examen"
                                    onClick={() =>
                                      setObjetivoEliminar({
                                        tipo: "examen",
                                        examen,
                                      })
                                    }
                                  >
                                    <Trash2 className="size-3" />
                                  </Button>
                                </div>
                              </div>

                              <div className="mt-2 flex items-center justify-between gap-2 pl-9">
                                <span
                                  className={cn(
                                    "rounded-full px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.08em]",
                                    clasesEstadoExamen[examen.estado],
                                  )}
                                >
                                  {etiquetasEstadoExamen[examen.estado]}
                                </span>

                                <span className="text-[9px] font-bold text-muted-foreground">
                                  {examen.nota != null
                                    ? `Nota ${formatNota(examen.nota)}`
                                    : examen.resultado
                                      ? etiquetasResultadoExamen[examen.resultado]
                                      : proximo
                                        ? textoCuenta(examen.fecha, workspace.hoy)
                                        : "—"}
                                </span>
                              </div>
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </section>
                </div>
              </section>

              <EstudioTiempoChart sesiones={sesiones} />
            </>
          ) : null}
        </>
      )}

      <DialogoCarrera
        open={carreraOpen}
        onOpenChange={setCarreraOpen}
        carrera={carreraEditando}
        onCreada={(id) => onSeleccionarCarrera(id)}
      />

      {carrera ? (
        <>
          <DialogoMateria
            open={materiaOpen}
            onOpenChange={setMateriaOpen}
            carreraId={carrera.carrera.id}
            materia={materiaEditando}
          />
          <DialogoExamen
            open={examenOpen}
            onOpenChange={setExamenOpen}
            materias={carrera.materias}
            examen={examenEditando}
          />
        </>
      ) : null}

      <AlertDialog
        open={Boolean(objetivoEliminar)}
        onOpenChange={(open) => {
          if (!open) setObjetivoEliminar(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {objetivoEliminar?.tipo === "carrera"
                ? "¿Eliminar esta carrera?"
                : objetivoEliminar?.tipo === "materia"
                  ? "¿Eliminar esta materia?"
                  : "¿Eliminar este examen?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {objetivoEliminar?.tipo === "carrera"
                ? `Se va a borrar “${objetivoEliminar.carrera.nombre}” junto con sus materias, exámenes y sesiones.`
                : objetivoEliminar?.tipo === "materia"
                  ? `Se va a borrar “${objetivoEliminar.materia.nombre}” junto con sus exámenes y sesiones.`
                  : `Se va a borrar el examen de “${objetivoEliminar?.examen.materia}” del ${objetivoEliminar ? formatearFecha(objetivoEliminar.examen.fecha, false) : ""}.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-error text-paper hover:bg-error/90"
              onClick={() => {
                if (objetivoEliminar) borrar.mutate(objetivoEliminar)
              }}
            >
              <Trash2 className="size-4" aria-hidden="true" />
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function TarjetaCarrera({
  item,
  activa,
  onSeleccionar,
  onEditar,
}: {
  item: ResumenCarrera
  activa: boolean
  onSeleccionar: () => void
  onEditar: () => void
}) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onSeleccionar}
        className={cn(
          "flex w-full flex-col gap-3 rounded-3xl border p-5 text-left transition-colors",
          activa
            ? "border-lime-voltage bg-linen-mist/60 dark:bg-primary-container/40"
            : "border-outline-variant/60 bg-card shadow-elevation-1 hover:bg-muted/50",
        )}
      >
        <div className="flex items-center justify-between gap-2 pr-8">
          <span className="flex items-center gap-2">
            <span
              className="size-2.5 rounded-full"
              style={{ backgroundColor: item.carrera.color }}
            />
            <span className="rounded-full bg-surface-container px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
              {etiquetasEstadoCarrera[item.carrera.estado]}
            </span>
          </span>
        </div>

        <div>
          <h3 className="truncate text-sm font-black text-heading">
            {item.carrera.nombre}
          </h3>
          <p className="truncate text-[10px] text-muted-foreground">
            {item.carrera.institucion ?? "Sin institución"}
          </p>
        </div>

        <div>
          <div className="h-1.5 overflow-hidden rounded-full bg-surface-container">
            <div
              className="h-full rounded-full bg-lime-voltage transition-[width]"
              style={{ width: `${Math.max(2, item.progreso)}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-[9px] font-semibold text-muted-foreground">
            <span>
              {item.aprobadas}/{item.totalPlan} materias
            </span>
            <span>
              Prom.{" "}
              {item.promedio != null ? formatNota(item.promedio) : "—"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-[9px] font-semibold text-muted-foreground">
          <span className="flex items-center gap-1">
            <TrendingUp className="size-3" aria-hidden="true" />
            {item.progreso}% avance
          </span>
          {item.graduacionEstimada ? (
            <span className="flex items-center gap-1">
              <Sparkles className="size-3" aria-hidden="true" />
              {item.graduacionEstimada}
            </span>
          ) : null}
        </div>
      </button>

      <Button
        variant="ghost"
        size="icon"
        className="absolute right-2 top-2 size-7 text-muted-foreground hover:text-heading"
        aria-label={`Editar ${item.carrera.nombre}`}
        onClick={onEditar}
      >
        <Pencil className="size-3.5" />
      </Button>
    </div>
  )
}

function Metrica({
  icon: Icon,
  label,
  value,
  detalle,
  progreso,
}: {
  icon: typeof Target
  label: string
  value: string
  detalle: string
  progreso?: number
}) {
  return (
    <div className="rounded-3xl border border-outline-variant/60 bg-card p-5 shadow-elevation-1">
      <div className="flex items-center gap-2">
        <Icon className="size-4 text-secondary" aria-hidden="true" />
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
          {label}
        </p>
      </div>
      <p className="tabular mt-3 text-2xl font-black leading-none text-heading">
        {value}
      </p>
      <p className="mt-2 text-[10px] text-muted-foreground">{detalle}</p>
      {progreso !== undefined ? (
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-container">
          <div
            className="h-full rounded-full bg-lime-voltage"
            style={{ width: `${Math.min(100, Math.max(2, progreso))}%` }}
          />
        </div>
      ) : null}
    </div>
  )
}

function textoCuenta(fecha: string, hoy: string): string {
  const dias = diasHasta(fecha, hoy)
  if (dias === 0) return "Hoy"
  if (dias === 1) return "Mañana"
  if (dias < 0) return `Hace ${Math.abs(dias)} días`
  return `En ${dias} días`
}
