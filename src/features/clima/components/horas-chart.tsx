"use client"

import { useMemo } from "react"
import { barY, d3Curve, defineChart, dot, lineY } from "@tanstack/charts"
import { Chart } from "@tanstack/charts/react"
import { crosshair } from "@tanstack/charts/crosshair"
import { scaleBand } from "@tanstack/charts/scales/band"
import { scaleLinear } from "@tanstack/charts/scales/linear"
import { tooltip } from "@tanstack/charts/tooltip"
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
        sensacion: hora.sensacion,
        lluvia: hora.probLluvia,
        viento: hora.viento,
      })),
    [horas],
  )

  const definition = useMemo(() => {    const temperaturas = datos.flatMap((dato) => [
      dato.temperatura,
      dato.sensacion,
    ])
    const minTemperatura = temperaturas.length
      ? Math.min(...temperaturas) - 2
      : 0
    const maxTemperatura = temperaturas.length
      ? Math.max(...temperaturas)
      : 30
    const techo = maxTemperatura + 6
    const yViento = techo - 2
    const maxViento = Math.max(1, ...datos.map((dato) => dato.viento))

    return defineChart({
      marks: [
        crosshair({
          x: {
            band: {
              inset: 0,
              radius: 4,
              fill: "#64748b",
              fillOpacity: 0.1,
            },
            label: true,
          },
          y: false,
        }),
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
          id: "sensacion-hora",
          x: "hora",
          y: "sensacion",
          stroke: "#d97706",
          strokeWidth: 2,
          strokeDasharray: "5 4",
          curve: curvaSuave,
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
        dot(datos, {
          id: "viento-hora",
          x: "hora",
          y: () => yViento,
          r: "viento",
          rScale: {
            scale: scaleLinear().domain([0, maxViento]).range([2, 9]),
          },
          fill: "#0f766e",
          fillOpacity: 0.8,
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
          scale: scaleLinear().domain([minTemperatura, techo]),
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
      focus: "group-x",
      maxFocusDistance: Number.POSITIVE_INFINITY,
      tooltip: {
        use: tooltip,
        formatGroup: (points) => {
          const dato = points[0].datum
          return [
            `Hora ${dato.hora}`,
            `Temperatura: ${dato.temperatura}°C`,
            `Sensación: ${dato.sensacion}°C`,
            `Lluvia: ${dato.lluvia}%`,
            `Viento: ${dato.viento} km/h`,
          ].join("\n")
        },
      },
    })
  }, [datos])

  const vientoMaximo = Math.max(0, ...datos.map((dato) => dato.viento))

  return (
    <ChartCard
      title="Detalle por hora"
      subtitle="Temperatura, sensación, lluvia y fuerza del viento"
    >
      <div className="mb-2 flex flex-wrap items-center gap-4 text-[10px] font-semibold text-muted-foreground">        <span className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-[#258f38]" /> Temperatura
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-[#d97706]" /> Sensación
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-[#38bdf8]" /> Lluvia
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-[#0f766e]" /> Viento{" "}
          <span className="font-normal">
            (tamaño = fuerza · máx. {vientoMaximo} km/h)
          </span>
        </span>
      </div>
      <Chart
        definition={definition}
        ariaLabel="Temperatura, sensación térmica, probabilidad de lluvia y fuerza del viento por hora"
        initialWidth={760}
        height={240}
      />
    </ChartCard>
  )
}
