"use client"

import { useMemo } from "react"
import { areaY, defineChart, lineY } from "@tanstack/charts"
import { Chart } from "@tanstack/charts/react"
import { scaleLinear } from "@tanstack/charts/scales/linear"
import { scalePoint } from "@tanstack/charts/scales/point"

const datos = [
  { dia: "Lun", valor: 268_000 },
  { dia: "Mar", valor: 274_500 },
  { dia: "Mié", valor: 271_200 },
  { dia: "Jue", valor: 289_400 },
  { dia: "Vie", valor: 301_800 },
  { dia: "Sáb", valor: 312_500 },
  { dia: "Dom", valor: 320_837 },
]

export function ChartDemo() {
  const definition = useMemo(
    () =>
      defineChart({
        marks: [
          areaY(datos, {
            id: "patrimonio-area",
            x: "dia",
            y: "valor",
            fill: "#9fe870",
            fillOpacity: 0.18,
          }),
          lineY(datos, {
            id: "patrimonio-linea",
            x: "dia",
            y: "valor",
            stroke: "#258f38",
            strokeWidth: 2.5,
            points: true,
          }),
        ],
        scales: {
          x: {
            scale: () => scalePoint<string>().padding(0.2),
            axis: { label: "Día" },
          },
          y: {
            scale: scaleLinear,
            nice: true,
            grid: true,
            axis: { label: "Patrimonio (ARS)" },
          },
        },
      }),
    [],
  )

  return (
    <Chart
      definition={definition}
      ariaLabel="Ejemplo de evolución del patrimonio"
      initialWidth={640}
      height={260}
    />
  )
}
