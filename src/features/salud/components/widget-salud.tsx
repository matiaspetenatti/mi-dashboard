"use client"

import { useQuery } from "@tanstack/react-query"
import { Activity, HeartPulse, Pill } from "lucide-react"

import { WidgetError, WidgetLoading } from "@/components/molecules/widget-states"
import { WidgetCard } from "@/components/organisms/widget-card"
import { resumenSaludQuery } from "@/features/salud/api"
import { formatearDuracion } from "@/features/salud/lib/fechas"

export function WidgetSalud() {
  const { data, isPending, isError } = useQuery(resumenSaludQuery)

  return (
    <WidgetCard
      title="Salud"
      subtitle="Migraña y bienestar"
      href="/salud"
      icon={HeartPulse}
      accent="secondary"
      footer={
        <>
          <span>
            {data
              ? `${data.totalEpisodios} ${
                  data.totalEpisodios === 1 ? "episodio" : "episodios"
                } registrados`
              : "Cargando..."}
          </span>
          <span>
            {data?.totalConAura
              ? `${data.totalConAura} con aura`
              : "Seguimiento diario"}
          </span>
        </>
      }
    >
      {isPending ? <WidgetLoading /> : null}

      {isError ? (
        <WidgetError message="No se pudo cargar el seguimiento de salud." />
      ) : null}

      {data ? (
        data.totalEpisodios === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-2xl bg-surface-container-low px-4 py-8 text-center">
            <HeartPulse className="size-5 text-secondary" aria-hidden="true" />
            <p className="text-xs font-black text-heading">
              Sin episodios registrados
            </p>
            <p className="text-[10px] text-muted-foreground">
              Entrá a Salud para registrar tu primera crisis y tu diario.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <Metrica
              etiqueta="Episodios"
              valor={String(data.episodiosMes)}
              detalle="Este mes"
            />
            <Metrica
              etiqueta="Días libres"
              valor={String(data.diasLibres)}
              detalle={
                data.rachaLibre !== null && data.rachaLibre > 0
                  ? `Racha de ${data.rachaLibre} ${
                      data.rachaLibre === 1 ? "día" : "días"
                    }`
                  : "Sin racha activa"
              }
            />
            <Metrica
              etiqueta="EVA promedio"
              valor={
                data.evaPromedio !== null ? `${data.evaPromedio}/10` : "—"
              }
              detalle={
                data.duracionPromedioMin !== null
                  ? `Duración ${formatearDuracion(
                      Math.round(data.duracionPromedioMin),
                    )}`
                  : "Sin datos del mes"
              }
            />
            <Metrica
              etiqueta="Tetralgin"
              valor={
                data.efectividadTetralgin !== null
                  ? `${data.efectividadTetralgin}%`
                  : "—"
              }
              detalle="Con alivio (90 días)"
            />
          </div>
        )
      ) : null}

      {data ? (
        <p className="mt-2 flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground">
          {data.totalEpisodios === 0 ? (
            <>
              <Activity className="size-3 text-secondary" aria-hidden="true" />
              Empezá hoy con el registro diario
            </>
          ) : (
            <>
              <Pill className="size-3 text-secondary" aria-hidden="true" />
              {data.episodiosConAlivio} de {data.episodiosConTetralgin} con
              respuesta al Tetralgin
            </>
          )}
        </p>
      ) : null}
    </WidgetCard>
  )
}

function Metrica({
  etiqueta,
  valor,
  detalle,
}: {
  etiqueta: string
  valor: string
  detalle: string
}) {
  return (
    <div className="rounded-2xl border border-outline-variant/60 bg-surface-container-low p-3">
      <p className="text-[8px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
        {etiqueta}
      </p>
      <p className="tabular mt-1 text-lg font-black leading-none text-heading">
        {valor}
      </p>
      <p className="mt-1 truncate text-[9px] text-muted-foreground">{detalle}</p>
    </div>
  )
}
