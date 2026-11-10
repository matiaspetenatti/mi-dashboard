"use client"

import { useMemo } from "react"
import { barY, d3Curve, defineChart, lineY } from "@tanstack/charts"
import { Chart } from "@tanstack/charts/react"
import { scaleBand } from "@tanstack/charts/scales/band"
import { scaleLinear } from "@tanstack/charts/scales/linear"
import { curveMonotoneX } from "d3-shape"
import { format, parseISO } from "date-fns"

import { ChartCard } from "@/components/organisms/chart-card"
import type { HoraClima } from "@/features/clima/types"

const curvaSuave = d3Curve(curveMonotoneX)

export function HorasClimaChart({ horas }: { horas: HoraClima[] }) {
  const datos = useMemo(
    () =>
      horas.map((hora) => ({
        hora: format(parseISO(hora.hora), "HH:mm"),
        temperatura: hora.temperatura,
        lluvia: hora.probLluvia,
      })),
    [horas],
  )

  const definition = useMemo(
    () =>
      defineChart({
        marks: [
          barY(datos, {
            id: "lluvia-hora",
            x: "hora",
            y: "lluvia",
            yScale: "lluvia",
            fill: "#38bdf8",
            fillOpacity: 0.22,
            maxThickness: 14,
          }),
          lineY(datos, {
            id: "temperatura-hora",
            x: "hora",
            y: "temperatura",
            stroke: "#258f38",
            strokeWidth: 2.5,
            points: true,
            curve: curvaSuave,
          }),
        ],
        scales: {
          x: {
            scale: () =>
              scaleBand<string>().paddingInner(0.25).paddingOuter(0.1),
            axis: {
              label: "Hora",
              tickLabels: { thin: { minGap: 24 } },
            },
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
    <ChartCard title="Detalle por hora" subtitle="Temperatura y probabilidad de lluvia">
      <Chart
        definition={definition}
        ariaLabel="Temperatura y probabilidad de lluvia por hora"
        initialWidth={760}
        height={240}
      />
    </ChartCard>
  )
}
