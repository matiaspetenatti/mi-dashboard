"use client"

import { useMemo } from "react"
import { barY, defineChart } from "@tanstack/charts"
import { Chart } from "@tanstack/charts/react"
import { scaleBand } from "@tanstack/charts/scales/band"
import { scaleLinear } from "@tanstack/charts/scales/linear"

import { ChartCard } from "@/components/organisms/chart-card"
import { etiquetasEstadoAnime, type EstadoAnime } from "@/features/animes/constantes"

export function AnimesEstadoChart({
  datos,
}: {
  datos: Array<{ estado: EstadoAnime; total: number }>
}) {
  const filas = useMemo(
    () =>
      datos.map((item) => ({
        estado: etiquetasEstadoAnime[item.estado],
        total: item.total,
      })),
    [datos],
  )

  const maximo = Math.max(1, ...filas.map((fila) => fila.total))

  const definition = useMemo(
    () =>
      defineChart({
        marks: [
          barY(filas, {
            id: "total",
            x: "estado",
            y: "total",
            fill: "#9fe870",
            maxThickness: 52,
          }),
        ],
        scales: {
          x: { scale: () => scaleBand<string>().paddingInner(0.32) },
          y: {
            scale: () => scaleLinear().domain([0, maximo]),
            nice: true,
            grid: true,
          },
        },
      }),
    [filas, maximo],
  )

  return (
    <ChartCard
      title="Estados"
      subtitle="Cómo se distribuye tu biblioteca"
    >
      <Chart
        definition={definition}
        ariaLabel="Animes por estado"
        initialWidth={480}
        height={230}
      />
    </ChartCard>
  )
}
