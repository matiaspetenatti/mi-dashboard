"use client"

import { useMemo, useState } from "react"
import { areaY, d3Curve, defineChart, lineY } from "@tanstack/charts"
import { Chart } from "@tanstack/charts/react"
import { scaleLinear } from "@tanstack/charts/scales/linear"
import { scalePoint } from "@tanstack/charts/scales/point"
import { tooltip } from "@tanstack/charts/tooltip"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { curveMonotoneX } from "d3-shape"

import { ChartCard } from "@/components/organisms/chart-card"
import type { PuntoEvolucion } from "@/features/finanzas/types"
import { formatearFecha } from "@/lib/format"
import { cn } from "cn"

const RANGOS = [30, 90, 365] as const
type Rango = (typeof RANGOS)[number]

const ETIQUETAS_RANGO: Record<Rango, string> = {
  30: "30D",
  90: "90D",
  365: "Anual",
}

const SUBTITULOS_RANGO: Record<Rango, string> = {
  30: "Últimos 30 días",
  90: "Últimos 90 días",
  365: "Último año",
}

const formatoPesos = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
})

export function EvolucionFinanzas({
  evolucion,
}: {
  evolucion: PuntoEvolucion[]
}) {
  const [rango, setRango] = useState<Rango>(30)

  const datos = useMemo(
    () =>
      evolucion.slice(-rango).map((punto) => ({
        fecha: punto.fecha,
        saldo: punto.saldo,
      })),
    [evolucion, rango],
  )

  const ticks = useMemo(() => {
    if (datos.length === 0) return []
    const paso = Math.max(1, Math.ceil(datos.length / 7))
    return datos
      .filter(
        (_, indice) => indice % paso === 0 || indice === datos.length - 1,
      )
      .map((punto) => punto.fecha)
  }, [datos])

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
          x: {
            scale: () => scalePoint<string>().padding(0.05),
            axis: {
              ticks: {
                values: ticks,
                format: (valor: string) =>
                  format(parseISO(valor), "d MMM", { locale: es }),
              },
            },
          },
          y: { scale: scaleLinear, nice: true, grid: true },
        },
        focus: "nearest-x",
        maxFocusDistance: Number.POSITIVE_INFINITY,
        tooltip: {
          use: tooltip,
          className: "chart-tooltip",
          anchor: "pointer",
          placement: ["top", "bottom", "right", "left"],
          content: (puntos) => {
            const punto = puntos[0]
            if (!punto) return { rows: [] }
            return {
              title: formatearFecha(String(punto.xValue)),
              rows: [
                {
                  label: "Saldo",
                  value: formatoPesos.format(Number(punto.yValue)),
                  color: "#258f38",
                },
              ],
            }
          },
        },
      }),
    [datos, ticks],
  )

  return (
    <ChartCard
      title="Evolución del patrimonio"
      subtitle={SUBTITULOS_RANGO[rango]}
      className="lg:col-span-2"
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
              {ETIQUETAS_RANGO[opcion]}
            </button>
          ))}
        </div>
      }
    >
      {datos.length === 0 ? (
        <p className="py-12 text-center text-xs text-muted-foreground">
          Todavía no hay movimientos para graficar.
        </p>
      ) : (
        <Chart
          definition={definition}
          ariaLabel={`Evolución del patrimonio · ${SUBTITULOS_RANGO[rango]}`}
          initialWidth={720}
          height={280}
        />
      )}
    </ChartCard>
  )
}
