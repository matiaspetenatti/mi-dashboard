"use client"

import { useMemo } from "react"
import { areaY, d3Curve, defineChart, lineY } from "@tanstack/charts"
import { Chart } from "@tanstack/charts/react"
import { scaleLinear } from "@tanstack/charts/scales/linear"
import { scalePoint } from "@tanstack/charts/scales/point"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { curveMonotoneX } from "d3-shape"

import { ChartCard } from "@/components/organisms/chart-card"
import type { PuntoEvolucion } from "@/features/finanzas/types"

export function EvolucionFinanzas({
  evolucion,
}: {
  evolucion: PuntoEvolucion[]
}) {
  const datos = useMemo(() => {
    if (evolucion.length === 0) return []
    const paso = Math.max(1, Math.ceil(evolucion.length / 13))
    return evolucion
      .filter((_, indice) => indice % paso === 0 || indice === evolucion.length - 1)
      .map((punto) => ({
        fecha: format(parseISO(punto.fecha), "d MMM", { locale: es }),
        saldo: punto.saldo,
      }))
  }, [evolucion])

  const definition = useMemo(
    () =>
      defineChart({
        marks: [
          areaY(datos, {
            id: "patrimonio-area",
            x: "fecha",
            y: "saldo",
            fill: "#9fe870",
            fillOpacity: 0.18,
            curve: d3Curve(curveMonotoneX),
          }),
          lineY(datos, {
            id: "patrimonio-linea",
            x: "fecha",
            y: "saldo",
            stroke: "#258f38",
            strokeWidth: 2.25,
            curve: d3Curve(curveMonotoneX),
          }),
        ],
        scales: {
          x: { scale: () => scalePoint<string>().padding(0.15) },
          y: { scale: scaleLinear, nice: true, grid: true },
        },
      }),
    [datos],
  )

  return (
    <ChartCard
      title="Evolución del patrimonio"
      subtitle="Últimos 90 días"
      className="lg:col-span-2"
    >
      {datos.length === 0 ? (
        <p className="py-12 text-center text-xs text-muted-foreground">
          Todavía no hay movimientos para graficar.
        </p>
      ) : (
        <Chart
          definition={definition}
          ariaLabel="Evolución del patrimonio en los últimos 90 días"
          initialWidth={720}
          height={280}
        />
      )}
    </ChartCard>
  )
}
