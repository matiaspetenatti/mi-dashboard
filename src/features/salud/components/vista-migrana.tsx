"use client"

import {
  Activity,
  CalendarCheck,
  CheckCircle2,
  Gauge,
  HeartPulse,
  Minus,
  Pencil,
  Pill,
  Plus,
  TrendingDown,
  TrendingUp,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { BitacoraEpisodios } from "@/features/salud/components/bitacora-episodios"
import { CorrelacionHabitosCard } from "@/features/salud/components/correlacion-habitos"
import { GraficoIntensidad } from "@/features/salud/components/grafico-intensidad"
import { MapaDesencadenantes } from "@/features/salud/components/mapa-desencadenantes"
import { nivelDolor } from "@/features/salud/constantes"
import {
  formatearDuracion,
  formatearFechaHoraCorta,
  minutosEntre,
} from "@/features/salud/lib/fechas"
import type {
  EpisodioConFactores,
  WorkspaceSalud,
} from "@/features/salud/types"
import { cn } from "cn"

export function VistaMigrana({
  data,
  onNuevoEpisodio,
  onEditar,
  onCerrar,
}: {
  data: WorkspaceSalud
  onNuevoEpisodio: () => void
  onEditar: (episodio: EpisodioConFactores) => void
  onCerrar: (episodio: EpisodioConFactores) => void
}) {
  const enCurso =
    data.episodios.find((episodio) => !episodio.finEn) ?? null
  const ultimo = data.episodios.at(0) ?? null
  const delta = data.episodiosMes - data.episodiosMesAnterior
  const nivel =
    data.evaPromedio !== null
      ? nivelDolor(Math.round(data.evaPromedio))
      : null

  const textoDelta =
    data.episodiosMesAnterior === 0
      ? data.episodiosMes === 0
        ? "Sin episodios este mes"
        : "Primer mes con registros"
      : `${delta > 0 ? "+" : ""}${delta} vs. mes anterior`

  return (
    <div className="flex flex-col gap-5">
      <section className="flex flex-col justify-between gap-4 rounded-3xl border border-outline-variant/60 bg-card p-5 shadow-elevation-1 sm:flex-row sm:items-center">
        {enCurso ? (
          <>
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "flex size-12 shrink-0 items-center justify-center rounded-2xl",
                  nivelDolor(enCurso.intensidad).clase,
                )}
              >
                <HeartPulse className="size-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                  Episodio en curso
                </p>
                <p className="mt-0.5 text-sm font-black text-heading">
                  EVA {enCurso.intensidad}/10 ·{" "}
                  {formatearFechaHoraCorta(enCurso.inicioEn)}
                </p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  Lleva{" "}
                  {formatearDuracion(
                    minutosEntre(enCurso.inicioEn, data.ahora),
                  )}
                  {enCurso.factores.length > 0
                    ? ` · ${enCurso.factores.length} desencadenantes`
                    : ""}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-9 rounded-full px-4 text-[10px] font-bold"
                onClick={() => onEditar(enCurso)}
              >
                <Pencil className="size-3.5" aria-hidden="true" />
                Editar
              </Button>
              <Button
                size="sm"
                className="h-9 rounded-full px-4 text-[10px] font-bold"
                onClick={() => onCerrar(enCurso)}
              >
                <CheckCircle2 className="size-3.5" aria-hidden="true" />
                Cerrar ahora
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-linen-mist text-forest-ink dark:bg-primary-container dark:text-lime-voltage">
                <Activity className="size-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                  Sin episodio en curso
                </p>
                <p className="mt-0.5 text-sm font-black text-heading">
                  {ultimo
                    ? `Último: ${formatearFechaHoraCorta(ultimo.inicioEn)}`
                    : "Todavía no hay episodios registrados"}
                </p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  {ultimo
                    ? `EVA ${ultimo.intensidad}/10 · ${
                        ultimo.finEn
                          ? formatearDuracion(
                              minutosEntre(ultimo.inicioEn, ultimo.finEn),
                            )
                          : "En curso"
                      }`
                    : "Registrá el primero cuando quieras."}
                </p>
              </div>
            </div>
            <Button
              size="sm"
              className="h-9 w-fit rounded-full px-4 text-[10px] font-bold"
              onClick={onNuevoEpisodio}
            >
              <Plus className="size-3.5" aria-hidden="true" />
              Iniciar ahora
            </Button>
          </>
        )}
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metrica
          icon={CalendarCheck}
          label="Días libres"
          value={String(data.diasLibres)}
          detalle={
            data.rachaLibre === null
              ? "Sin registros"
              : data.rachaLibre === 0
                ? "Hoy hay un episodio"
                : `Racha de ${data.rachaLibre} ${
                    data.rachaLibre === 1 ? "día" : "días"
                  }`
          }
        />
        <Metrica
          icon={Activity}
          label="Episodios del mes"
          value={String(data.episodiosMes)}
          detalle={textoDelta}
          tendencia={delta}
        />
        <Metrica
          icon={Gauge}
          label="Intensidad promedio"
          value={
            data.evaPromedio !== null
              ? `${data.evaPromedio}/10`
              : "—"
          }
          detalle={
            data.duracionPromedioMin !== null
              ? `Duración media ${formatearDuracion(
                  Math.round(data.duracionPromedioMin),
                )}`
              : "Sin episodios cerrados este mes"
          }
          badge={nivel?.label}
        />
        <Metrica
          icon={Pill}
          label="Tetralgin"
          value={
            data.efectividadTetralgin !== null
              ? `${data.efectividadTetralgin}%`
              : "—"
          }
          detalle={
            data.efectividadTetralgin !== null
              ? `${data.episodiosConAlivio} de ${data.episodiosConTetralgin} con alivio`
              : "Sin respuestas registradas"
          }
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <GraficoIntensidad serie={data.serie} />
        <MapaDesencadenantes mapa={data.mapa} />
      </section>

      <BitacoraEpisodios
        episodios={data.episodios}
        onEditar={onEditar}
        onCerrar={onCerrar}
      />

      <CorrelacionHabitosCard correlacion={data.correlacion} />
    </div>
  )
}

function Metrica({
  icon: Icon,
  label,
  value,
  detalle,
  badge,
  tendencia,
}: {
  icon: typeof Activity
  label: string
  value: string
  detalle: string
  badge?: string
  tendencia?: number
}) {
  const TendenciaIcono =
    tendencia === undefined || tendencia === 0
      ? Minus
      : tendencia < 0
        ? TrendingDown
        : TrendingUp
  const tendenciaClase =
    tendencia === undefined || tendencia === 0
      ? "text-muted-foreground"
      : tendencia < 0
        ? "text-success"
        : "text-error"

  return (
    <article className="rounded-3xl border border-outline-variant/60 bg-card p-4 shadow-elevation-1">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon className="size-4 text-secondary" aria-hidden="true" />
          <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
            {label}
          </p>
        </div>
        {badge ? (
          <span className="rounded-full bg-surface-container px-2 py-0.5 text-[8px] font-bold text-muted-foreground">
            {badge}
          </span>
        ) : null}
      </div>
      <p className="tabular mt-3 text-2xl font-black leading-none text-heading">
        {value}
      </p>
      <p
        className={cn(
          "mt-2 flex items-center gap-1 text-[9px] font-semibold",
          tendencia !== undefined ? tendenciaClase : "text-muted-foreground",
        )}
      >
        {tendencia !== undefined ? (
          <TendenciaIcono className="size-3" aria-hidden="true" />
        ) : null}
        {detalle}
      </p>
    </article>
  )
}
