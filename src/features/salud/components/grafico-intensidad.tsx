"use client"

import { useMemo, useState } from "react"
import { barY, defineChart, lineY } from "@tanstack/charts"
import { Chart } from "@tanstack/charts/react"
import { scaleBand } from "@tanstack/charts/scales/band"
import { scaleLinear } from "@tanstack/charts/scales/linear"

import { ChartCard } from "@/components/organisms/chart-card"
import type { PuntoSerie } from "@/features/salud/types"
import { cn } from "cn"

const RANGOS = [7, 30, 90] as const
type Rango = (typeof RANGOS)[number]

export function GraficoIntensidad({ serie }: { serie: PuntoSerie[] }) {
  const [rango, setRango] = useState<Rango>(30)
  const datos = useMemo(
    () =>
      serie.slice(-rango).map((punto) => ({
        etiqueta: punto.etiqueta,
        eva: punto.eva ?? 0,
        horas: punto.duracionHoras,
      })),
    [serie, rango],
  )
  const hayDatos = useMemo(
    () => serie.slice(-rango).some((punto) => punto.eva !== null),
    [serie, rango],
  )

  const maxHoras = Math.max(1, ...datos.map((punto) => punto.horas))

  const definition = useMemo(
    () =>
      defineChart({
        marks: [
          barY(datos, {
            id: "horas",
            x: "etiqueta",
            y: "horas",
            fill: "#0b4c72",
            fillOpacity: 0.18,
            maxThickness: 18,
          }),
          lineY(datos, {
            id: "eva",
            x: "etiqueta",
            y: "eva",
            yScale: "eva",
            stroke: "#cb272f",
            strokeWidth: 2.5,
            points: true,
          }),
        ],
        scales: {
          x: { scale: () => scaleBand<string>().paddingInner(0.2) },
          y: {
            scale: () => scaleLinear().domain([0, maxHoras]),
            nice: true,
            grid: true,
            axis: { label: "horas" },
          },
          eva: {
            channel: "y",
            side: "right",
            scale: scaleLinear().domain([0, 10]),
            axis: {
              label: "EVA",
              ticks: { count: 5 },
            },
          },
        },
      }),
    [datos, maxHoras],
  )

  return (
    <ChartCard
      title="Evolución de la intensidad"
      subtitle="EVA máxima y horas de crisis por día"
      actions={
        <div
          role="group"
          aria-label="Rango del gráfico"
          className="flex shrink-0 items-center gap-1 rounded-full border border-outline-variant/60 bg-surface-container-low p-1"
        >
          {RANGOS.map((opcion) => (
            <button
              key={opcion}
              type="button"
              onClick={() => setRango(opcion)}
              aria-pressed={rango === opcion}
              className={cn(
                "rounded-full px-3 py-1 text-[10px] font-bold transition-colors",
                rango === opcion
                  ? "bg-forest-ink text-paper dark:bg-lime-voltage dark:text-forest-ink"
                  : "text-muted-foreground hover:text-heading",
              )}
            >
              {opcion}D
            </button>
          ))}
        </div>
      }
    >
      <div className="mb-2 flex flex-wrap items-center gap-4 text-[10px] font-semibold text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-[#cb272f]" />
          Intensidad EVA
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-[#0b4c72]/40" />
          Horas de crisis
        </span>
      </div>

      {hayDatos ? (
        <Chart
          definition={definition}
          ariaLabel="Intensidad y duración de episodios de migraña"
          initialWidth={760}
          height={280}
        />
      ) : (
        <div className="flex h-56 flex-col items-center justify-center gap-1 rounded-2xl bg-surface-container-low text-center">
          <p className="text-xs font-bold text-heading">
            Sin episodios en este rango
          </p>
          <p className="text-[10px] text-muted-foreground">
            Registrá una crisis para ver la evolución.
          </p>
        </div>
      )}
    </ChartCard>
  )
}
