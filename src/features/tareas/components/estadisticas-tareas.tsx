"use client"

import { useMemo } from "react"
import {
  areaY,
  barY,
  defineChart,
  lineY,
} from "@tanstack/charts"
import { pie, polar, radialArc } from "@tanstack/charts/polar"
import { Chart } from "@tanstack/charts/react"
import { scaleLinear } from "@tanstack/charts/scales/linear"
import { scalePoint } from "@tanstack/charts/scales/point"
import {
  CheckCircle2,
  Gauge,
  ListTodo,
  Percent,
  Timer,
  TriangleAlert,
} from "lucide-react"
import { format, startOfWeek, subWeeks } from "date-fns"
import { es } from "date-fns/locale"

import { ChartCard } from "@/components/organisms/chart-card"
import { resumenTareas } from "@/features/tareas/lib/filtrar"
import type { EstadoDeTarea, TareaConDetalle } from "@/features/tareas/types"
import { cn } from "cn"

const prioridades = [
  { key: "urgente", label: "Urgente", color: "#cb272f" },
  { key: "alta", label: "Alta", color: "#f2c66d" },
  { key: "media", label: "Media", color: "#0b4c72" },
  { key: "baja", label: "Baja", color: "#6a6c6a" },
  { key: "sin", label: "Sin prioridad", color: "#c3c8b9" },
] as const

function parseFechaDb(value: string): Date | null {
  const iso = value.includes("T") ? value : `${value.replace(" ", "T")}Z`
  const fecha = new Date(iso)
  return Number.isNaN(fecha.getTime()) ? null : fecha
}

export function EstadisticasTareas({
  tareas,
  estados,
}: {
  tareas: TareaConDetalle[]
  estados: EstadoDeTarea[]
}) {
  const total = tareas.length
  const resumen = resumenTareas(tareas)
  const tasa =
    total === 0 ? 0 : Math.round((resumen.completadas / total) * 100)

  const diasPromedio = useMemo(() => {
    const valores: number[] = []
    for (const tarea of tareas) {
      if (!tarea.completadaEn) continue
      const fin = parseFechaDb(tarea.completadaEn)
      const inicio = parseFechaDb(tarea.creadaEn)
      if (!fin || !inicio) continue
      const dias = (fin.getTime() - inicio.getTime()) / 86_400_000
      if (dias >= 0) valores.push(dias)
    }
    if (valores.length === 0) return null
    return valores.reduce((acc, valor) => acc + valor, 0) / valores.length
  }, [tareas])

  const datosEstados = useMemo(
    () =>
      estados.map((estado) => ({
        estado: estado.nombre,
        total: tareas.filter((tarea) => tarea.estadoId === estado.id).length,
      })),
    [estados, tareas],
  )

  const datosPrioridad = useMemo(
    () =>
      prioridades
        .map((prioridad) => ({
          prioridad: prioridad.label,
          total: tareas.filter(
            (tarea) => (tarea.prioridad ?? "sin") === prioridad.key,
          ).length,
        }))
        .filter((dato) => dato.total > 0),
    [tareas],
  )

  const semanas = useMemo(() => {
    const hoy = new Date()
    return Array.from({ length: 8 }, (_, indice) =>
      startOfWeek(subWeeks(hoy, 7 - indice), { weekStartsOn: 1 }),
    )
  }, [])

  const datosSemanas = useMemo(() => {
    const conteos = semanas.map(() => 0)
    for (const tarea of tareas) {
      if (!tarea.completadaEn) continue
      const fecha = parseFechaDb(tarea.completadaEn)
      if (!fecha) continue
      const semana = startOfWeek(fecha, { weekStartsOn: 1 })
      const indice = semanas.findIndex(
        (actual) => actual.getTime() === semana.getTime(),
      )
      if (indice >= 0) conteos[indice] += 1
    }
    return semanas.map((semana, indice) => ({
      semana: format(semana, "d MMM", { locale: es }),
      total: conteos[indice],
    }))
  }, [semanas, tareas])

  const barDefinition = useMemo(
    () =>
      defineChart({
        marks: [
          barY(datosEstados, {
            id: "tareas-estado",
            x: "estado",
            y: "total",
            fill: "#9fe870",
          }),
        ],
        scales: {
          x: { scale: () => scalePoint<string>().padding(0.25) },
          y: { scale: scaleLinear, nice: true, grid: true },
        },
      }),
    [datosEstados],
  )

  const donutDefinition = useMemo(() => {
    const slices = pie(datosPrioridad, { value: "total" })
    return defineChart({
      marks: [
        polar({
          radiusRatio: 0.82,
          marks: [
            radialArc(slices, {
              id: "prioridades",
              key: "prioridad",
              innerRadius: 52,
              color: "prioridad",
              stroke: "var(--card)",
              strokeWidth: 2,
            }),
          ],
          scales: { angle: null, radius: null },
        }),
      ],
      scales: { x: null, y: null },
      color: {
        domain: prioridades.map((prioridad) => prioridad.label),
        range: prioridades.map((prioridad) => prioridad.color),
      },
      margin: 0,
    })
  }, [datosPrioridad])

  const lineDefinition = useMemo(
    () =>
      defineChart({
        marks: [
          areaY(datosSemanas, {
            id: "completadas-area",
            x: "semana",
            y: "total",
            fill: "#9fe870",
            fillOpacity: 0.18,
          }),
          lineY(datosSemanas, {
            id: "completadas-linea",
            x: "semana",
            y: "total",
            stroke: "#258f38",
            strokeWidth: 2.5,
            points: true,
          }),
        ],
        scales: {
          x: { scale: () => scalePoint<string>().padding(0.2) },
          y: { scale: scaleLinear, nice: true, grid: true },
        },
      }),
    [datosSemanas],
  )

  const kpis = [
    { label: "Total", value: total, icon: ListTodo, tone: "text-heading" },
    {
      label: "Completadas",
      value: resumen.completadas,
      icon: CheckCircle2,
      tone: "text-success",
    },
    {
      label: "Pendientes",
      value: resumen.pendientes,
      icon: Gauge,
      tone: "text-signal-blue",
    },
    {
      label: "Vencidas",
      value: resumen.vencidas,
      icon: TriangleAlert,
      tone: "text-error",
    },
    {
      label: "Tasa de cierre",
      value: `${tasa}%`,
      icon: Percent,
      tone: "text-forest-ink dark:text-lime-voltage",
    },
    {
      label: "Días promedio",
      value:
        diasPromedio === null
          ? "—"
          : diasPromedio.toLocaleString("es-AR", {
              maximumFractionDigits: 1,
            }),
      icon: Timer,
      tone: "text-muted-foreground",
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {kpis.map((kpi) => {
          const Icon = kpi.icon
          return (
            <div
              key={kpi.label}
              className="rounded-2xl border border-outline-variant/50 bg-card p-3"
            >
              <Icon className={cn("size-4", kpi.tone)} aria-hidden="true" />
              <p className="tabular mt-2 text-xl font-black leading-none text-heading">
                {kpi.value}
              </p>
              <p className="mt-1 text-[9px] font-semibold text-muted-foreground">
                {kpi.label}
              </p>
            </div>
          )
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Tareas por estado"
          subtitle="Distribución actual del proyecto"
          className="lg:col-span-2"
        >
          <Chart
            definition={barDefinition}
            ariaLabel="Tareas por estado"
            initialWidth={720}
            height={260}
          />
        </ChartCard>

        <ChartCard title="Prioridades" subtitle="Cómo se reparte la carga">
          {datosPrioridad.length > 0 ? (
            <>
              <Chart
                definition={donutDefinition}
                ariaLabel="Tareas por prioridad"
                initialWidth={340}
                height={240}
              />
              <div className="mt-2 grid grid-cols-2 gap-1.5">
                {datosPrioridad.map((dato) => {
                  const color =
                    prioridades.find(
                      (prioridad) => prioridad.label === dato.prioridad,
                    )?.color ?? "#c3c8b9"
                  return (
                    <span
                      key={dato.prioridad}
                      className="flex items-center gap-1.5 text-[9px] font-semibold text-muted-foreground"
                    >
                      <span
                        className="size-1.5 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                      {dato.prioridad} · {dato.total}
                    </span>
                  )
                })}
              </div>
            </>
          ) : (
            <p className="py-10 text-center text-xs text-muted-foreground">
              Sin datos de prioridad.
            </p>
          )}
        </ChartCard>

        <ChartCard
          title="Completadas por semana"
          subtitle="Últimas 8 semanas"
        >
          <Chart
            definition={lineDefinition}
            ariaLabel="Tareas completadas por semana"
            initialWidth={340}
            height={240}
          />
        </ChartCard>
      </div>
    </div>
  )
}
