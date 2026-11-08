"use client"

import { useMemo } from "react"
import { barX, defineChart } from "@tanstack/charts"
import { Chart } from "@tanstack/charts/react"
import { scaleBand } from "@tanstack/charts/scales/band"
import { scaleLinear } from "@tanstack/charts/scales/linear"

import { ChartCard } from "@/components/organisms/chart-card"

export function AnimesGenerosChart({
  datos,
}: {
  datos: Array<{ genero: string; total: number }>
}) {
  const filas = useMemo(
    () => datos.slice(0, 8).map((item) => ({ ...item })),
    [datos],
  )

  const maximo = Math.max(1, ...filas.map((fila) => fila.total))

  const definition = useMemo(
    () =>
      defineChart({
        marks: [
          barX(filas, {
            id: "total",
            x: "total",
            y: "genero",
            fill: "#0b4c72",
            maxThickness: 18,
          }),
        ],
        scales: {
          x: {
            scale: () => scaleLinear().domain([0, maximo]),
            nice: true,
            grid: true,
          },
          y: { scale: () => scaleBand<string>().paddingInner(0.25) },
        },
      }),
    [filas, maximo],
  )

  return (
    <ChartCard
      title="Géneros favoritos"
      subtitle="Top 8 por cantidad de animes"
    >
      <Chart
        definition={definition}
        ariaLabel="Animes por género"
        initialWidth={480}
        height={300}
      />
    </ChartCard>
  )
}
