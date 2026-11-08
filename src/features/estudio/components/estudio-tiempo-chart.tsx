"use client"

import { useMemo } from "react"
import { barY, defineChart } from "@tanstack/charts"
import { Chart } from "@tanstack/charts/react"
import { scaleBand } from "@tanstack/charts/scales/band"
import { scaleLinear } from "@tanstack/charts/scales/linear"
import { format, parseISO, startOfWeek, subWeeks } from "date-fns"
import { es } from "date-fns/locale"

import { ChartCard } from "@/components/organisms/chart-card"
import type { SesionEstudio } from "@/server/db/schema"

export function EstudioTiempoChart({
  sesiones,
}: {
  sesiones: SesionEstudio[]
}) {
  const datos = useMemo(() => {
    const hoy = new Date()
    const semanas = Array.from({ length: 8 }, (_, indice) =>
      startOfWeek(subWeeks(hoy, 7 - indice), { weekStartsOn: 1 }),
    )
    const minutos = semanas.map(() => 0)

    for (const sesion of sesiones) {
      if (sesion.tipo !== "trabajo") continue
      const fecha = parseISO(sesion.fecha)
      if (Number.isNaN(fecha.getTime())) continue
      const semana = startOfWeek(fecha, { weekStartsOn: 1 })
      const indice = semanas.findIndex(
        (actual) => actual.getTime() === semana.getTime(),
      )
      if (indice >= 0) minutos[indice] += sesion.duracionMinutos
    }

    return semanas.map((semana, indice) => ({
      semana: format(semana, "d MMM", { locale: es }),
      minutos: minutos[indice],
    }))
  }, [sesiones])

  const maximo = Math.max(25, ...datos.map((dia) => dia.minutos))

  const definition = useMemo(
    () =>
      defineChart({
        marks: [
          barY(datos, {
            id: "minutos",
            x: "semana",
            y: "minutos",
            fill: "#9fe870",
          }),
        ],
        scales: {
          x: { scale: () => scaleBand<string>().paddingInner(0.25) },
          y: {
            scale: () => scaleLinear().domain([0, maximo]),
            nice: true,
            grid: true,
            axis: { label: "min" },
          },
        },
      }),
    [datos, maximo],
  )

  return (
    <ChartCard
      title="Tiempo de estudio"
      subtitle="Minutos por semana · últimas 8 semanas"
    >
      <Chart
        definition={definition}
        ariaLabel="Minutos de estudio por semana"
        initialWidth={640}
        height={220}
      />
    </ChartCard>
  )
}
