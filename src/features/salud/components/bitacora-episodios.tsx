"use client"

import { useMemo, useState, type ReactNode } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  CalendarClock,
  CheckCircle2,
  Pencil,
  Pill,
  Sparkles,
  Trash2,
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
import { Button } from "@/components/ui/button"
import {
  ALIVIOS_POR_VALOR,
  LATERALIDADES_POR_VALOR,
  PATRONES_POR_VALOR,
  etiquetaAura,
  etiquetaFactor,
  etiquetaSintoma,
  nivelDolor,
} from "@/features/salud/constantes"
import {
  formatearDuracion,
  formatearFechaHoraCorta,
  minutosEntre,
} from "@/features/salud/lib/fechas"
import { eliminarEpisodio } from "@/features/salud/server/functions"
import type { EpisodioConFactores } from "@/features/salud/types"
import { cn } from "cn"

type Filtro = "todos" | "aura" | "severa" | "curso"

const FILTROS: Array<{ valor: Filtro; label: string }> = [
  { valor: "todos", label: "Todos" },
  { valor: "aura", label: "Con aura" },
  { valor: "severa", label: "Severa (8+)" },
  { valor: "curso", label: "En curso" },
]

function duracionTexto(episodio: EpisodioConFactores) {
  if (!episodio.finEn) return "En curso"
  const minutos = minutosEntre(episodio.inicioEn, episodio.finEn)
  return formatearDuracion(minutos)
}

function descripcionDolor(episodio: EpisodioConFactores) {
  const partes = [
    episodio.patron
      ? (PATRONES_POR_VALOR.get(episodio.patron) ?? episodio.patron)
      : null,
    episodio.lateralidad
      ? (LATERALIDADES_POR_VALOR.get(episodio.lateralidad) ??
        episodio.lateralidad)
      : null,
  ].filter(Boolean)

  return partes.length > 0 ? partes.join(" · ") : null
}

function etiquetaAlivio(episodio: EpisodioConFactores) {
  if (!episodio.tomoTetralgin) return null
  if (!episodio.alivio) return "Sin respuesta"
  return ALIVIOS_POR_VALOR.get(episodio.alivio) ?? episodio.alivio
}

export function BitacoraEpisodios({
  episodios,
  onEditar,
  onCerrar,
}: {
  episodios: EpisodioConFactores[]
  onEditar: (episodio: EpisodioConFactores) => void
  onCerrar: (episodio: EpisodioConFactores) => void
}) {
  const queryClient = useQueryClient()
  const [filtro, setFiltro] = useState<Filtro>("todos")
  const [eliminando, setEliminando] =
    useState<EpisodioConFactores | null>(null)

  const eliminar = useMutation({
    mutationFn: (id: number) => eliminarEpisodio({ data: { id } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["salud"] })
      toast.success("Episodio eliminado")
      setEliminando(null)
    },
    onError: () => toast.error("No se pudo eliminar el episodio"),
  })

  const visibles = useMemo(() => {
    if (filtro === "aura") return episodios.filter((episodio) => episodio.aura)
    if (filtro === "severa") {
      return episodios.filter((episodio) => episodio.intensidad >= 8)
    }
    if (filtro === "curso") {
      return episodios.filter((episodio) => !episodio.finEn)
    }
    return episodios
  }, [episodios, filtro])

  const enCurso = episodios.filter((episodio) => !episodio.finEn).length

  return (
    <section className="rounded-3xl border border-outline-variant/60 bg-card shadow-elevation-1">
      <div className="flex flex-col gap-3 border-b border-outline-variant/40 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-black tracking-tight text-heading">
            Bitácora de episodios
            <span className="rounded-full bg-surface-container px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
              {episodios.length}
            </span>
          </h2>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            Historial para revisar y compartir en la consulta.
            {enCurso > 0 ? (
              <span className="ml-1 font-bold text-secondary">
                {enCurso} en curso.
              </span>
            ) : null}
          </p>
        </div>

        <div className="flex flex-wrap gap-1 rounded-full border border-outline-variant/60 bg-surface-container-low p-1">
          {FILTROS.map((opcion) => (
            <button
              key={opcion.valor}
              type="button"
              onClick={() => setFiltro(opcion.valor)}
              className={cn(
                "rounded-full px-3 py-1 text-[10px] font-bold transition-colors",
                filtro === opcion.valor
                  ? "bg-forest-ink text-paper dark:bg-lime-voltage dark:text-forest-ink"
                  : "text-muted-foreground hover:text-heading",
              )}
            >
              {opcion.label}
            </button>
          ))}
        </div>
      </div>

      {visibles.length === 0 ? (
        <div className="px-5 py-12 text-center">
          <p className="text-xs font-bold text-heading">
            {episodios.length === 0
              ? "Todavía no registraste episodios"
              : "No hay episodios con ese filtro"}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {episodios.length === 0
              ? "Usá “Registrar episodio” para cargar el primero."
              : "Probá con otro filtro."}
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-outline-variant/30">
          {visibles.map((episodio) => {
            const nivel = nivelDolor(episodio.intensidad)
            const dolor = descripcionDolor(episodio)
            const alivio = etiquetaAlivio(episodio)

            return (
              <li
                key={episodio.id}
                className={cn(
                  "px-4 py-4",
                  !episodio.finEn && "bg-linen-mist/40 dark:bg-primary-container/20",
                )}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={cn(
                      "flex size-10 shrink-0 flex-col items-center justify-center rounded-2xl text-center",
                      nivel.clase,
                    )}
                    title={`Intensidad ${episodio.intensidad}/10`}
                  >
                    <span className="tabular text-sm font-black leading-none">
                      {episodio.intensidad}
                    </span>
                    <span className="text-[7px] font-bold uppercase">EVA</span>
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="flex items-center gap-1.5 text-[11px] font-black text-heading">
                        <CalendarClock
                          className="size-3.5 text-secondary"
                          aria-hidden="true"
                        />
                        {formatearFechaHoraCorta(episodio.inicioEn)}
                      </p>
                      <span className="text-[10px] font-bold text-muted-foreground">
                        {duracionTexto(episodio)}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <Chip>{nivel.label}</Chip>
                      {!episodio.finEn ? (
                        <Chip tono="verde">En curso</Chip>
                      ) : null}
                      {dolor ? <Chip>{dolor}</Chip> : null}
                      {episodio.aura ? (
                        <Chip tono="ambar">
                          <Sparkles className="size-2.5" aria-hidden="true" />
                          Aura
                        </Chip>
                      ) : null}
                      {alivio ? (
                        <Chip tono={alivio === "Completo" ? "verde" : "neutro"}>
                          <Pill className="size-2.5" aria-hidden="true" />
                          {alivio}
                        </Chip>
                      ) : null}
                    </div>

                    <details className="group mt-2">
                      <summary className="cursor-pointer list-none text-[9px] font-bold text-muted-foreground hover:text-heading">
                        Ver detalle
                      </summary>
                      <div className="mt-2 space-y-1.5 rounded-2xl bg-surface-container-low p-3 text-[10px] text-muted-foreground">
                        {episodio.factores.length > 0 ? (
                          <p>
                            <span className="font-bold text-heading">
                              Desencadenantes:
                            </span>{" "}
                            {episodio.factores
                              .map((factor) => etiquetaFactor(factor))
                              .join(", ")}
                          </p>
                        ) : null}
                        {episodio.aura && episodio.auraTipos.length > 0 ? (
                          <p>
                            <span className="font-bold text-heading">Aura:</span>{" "}
                            {episodio.auraTipos
                              .map((tipo) => etiquetaAura(tipo))
                              .join(", ")}
                          </p>
                        ) : null}
                        {episodio.sintomas.length > 0 ? (
                          <p>
                            <span className="font-bold text-heading">
                              Síntomas:
                            </span>{" "}
                            {episodio.sintomas
                              .map((sintoma) => etiquetaSintoma(sintoma))
                              .join(", ")}
                          </p>
                        ) : null}
                        {episodio.tomoTetralgin ? (
                          <p>
                            <span className="font-bold text-heading">
                              Tetralgin:
                            </span>{" "}
                            {episodio.dosisTetralgin ?? 1} comprimido
                            {episodio.tetralginEn
                              ? ` · ${formatearFechaHoraCorta(episodio.tetralginEn)}`
                              : ""}
                          </p>
                        ) : null}
                        {episodio.otroDesencadenante ? (
                          <p>
                            <span className="font-bold text-heading">Otro:</span>{" "}
                            {episodio.otroDesencadenante}
                          </p>
                        ) : null}
                        {episodio.notas ? (
                          <p className="whitespace-pre-wrap">
                            <span className="font-bold text-heading">
                              Notas:
                            </span>{" "}
                            {episodio.notas}
                          </p>
                        ) : null}
                      </div>
                    </details>
                  </div>

                  <div className="flex shrink-0 items-center gap-0.5">
                    {!episodio.finEn ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-7 text-muted-foreground hover:text-success"
                        aria-label="Cerrar episodio"
                        onClick={() => onCerrar(episodio)}
                      >
                        <CheckCircle2 className="size-3.5" />
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-7 text-muted-foreground hover:text-heading"
                      aria-label="Editar episodio"
                      onClick={() => onEditar(episodio)}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-7 text-muted-foreground hover:text-error"
                      aria-label="Eliminar episodio"
                      onClick={() => setEliminando(episodio)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <AlertDialog
        open={Boolean(eliminando)}
        onOpenChange={(open) => {
          if (!open) setEliminando(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este episodio?</AlertDialogTitle>
            <AlertDialogDescription>
              Se va a borrar el episodio del{" "}
              {eliminando ? formatearFechaHoraCorta(eliminando.inicioEn) : ""}{" "}
              y sus desencadenantes. No se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-error text-paper hover:bg-error/90"
              onClick={() => {
                if (eliminando) eliminar.mutate(eliminando.id)
              }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}

function Chip({
  children,
  tono = "neutro",
}: {
  children: ReactNode
  tono?: "neutro" | "verde" | "ambar"
}) {
  const tonos = {
    neutro: "bg-surface-container text-muted-foreground",
    verde: "bg-success-container text-success",
    ambar: "bg-warning-container text-warning",
  } as const

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold",
        tonos[tono],
      )}
    >
      {children}
    </span>
  )
}
