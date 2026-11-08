"use client"

import { useMemo } from "react"
import { barY, defineChart, lineY } from "@tanstack/charts"
import { Chart } from "@tanstack/charts/react"
import { scaleBand } from "@tanstack/charts/scales/band"
import { scaleLinear } from "@tanstack/charts/scales/linear"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"

import { ChartCard } from "@/components/organisms/chart-card"
import type { DiaClima } from "@/features/clima/types"

export function Pronostico14Chart({ dias }: { dias: DiaClima[] }) {
  const datos = useMemo(
    () =>
      dias.map((dia) => ({
        dia: format(parseISO(dia.fecha), "EEE d", { locale: es }),
        max: dia.max,
        min: dia.min,
        lluvia: dia.probLluvia,
      })),
    [dias],
  )

  const definition = useMemo(
    () =>
      defineChart({
        marks: [
          barY(datos, {
            id: "lluvia",
            x: "dia",
            y: "lluvia",
            yScale: "lluvia",
            fill: "#38bdf8",
            fillOpacity: 0.22,
            maxThickness: 18,
          }),
          lineY(datos, {
            id: "maxima",
            x: "dia",
            y: "max",
            stroke: "#cb272f",
            strokeWidth: 2.5,
            points: true,
          }),
          lineY(datos, {
            id: "minima",
            x: "dia",
            y: "min",
            stroke: "#0b4c72",
            strokeWidth: 2.5,
            points: true,
          }),
        ],
        scales: {
          x: {
            scale: () =>
              scaleBand<string>().paddingInner(0.25).paddingOuter(0.1),
            axis: { label: "Día" },
          },
          y: {
            scale: scaleLinear,
            nice: true,
            grid: true,
            axis: { label: "°C" },
          },
          lluvia: {
            channel: "y",
            side: "right",
            scale: scaleLinear().domain([0, 100]),
            axis: {
              label: "% lluvia",
              ticks: {
                count: 5,
                format: (value: number) => `${Math.round(value)}%`,
              },
            },
          },
        },
      }),
    [datos],
  )

  return (
    <ChartCard
      title="Pronóstico de 14 días"
      subtitle="Máximas, mínimas y probabilidad de lluvia"
    >
      <div className="mb-2 flex flex-wrap items-center gap-4 text-[10px] font-semibold text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-[#cb272f]" /> Máxima
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-[#0b4c72]" /> Mínima
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-[#38bdf8]" /> Lluvia
        </span>
      </div>
      <Chart
        definition={definition}
        ariaLabel="Pronóstico de 14 días con máximas, mínimas y probabilidad de lluvia"
        initialWidth={760}
        height={300}
      />
    </ChartCard>
  )
}
