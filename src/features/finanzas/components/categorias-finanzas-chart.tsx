"use client"

import { useMemo } from "react"
import { defineChart } from "@tanstack/charts"
import { pie, polar, radialArc } from "@tanstack/charts/polar"
import { Chart } from "@tanstack/charts/react"

import { ChartCard } from "@/components/organisms/chart-card"
import { formatMonto } from "@/lib/format"

const COLORES = [
  "#163300",
  "#054d28",
  "#9fe870",
  "#0b4c72",
  "#cb272f",
  "#f2c66d",
  "#6a6c6a",
  "#c3c8b9",
]

export function CategoriasFinanzasChart({
  categorias,
}: {
  categorias: Array<{ nombre: string; total: number }>
}) {
  const datos = useMemo(
    () =>
      categorias.map((categoria) => ({
        categoria: categoria.nombre,
        total: categoria.total,
      })),
    [categorias],
  )

  const definition = useMemo(() => {
    const slices = pie(datos, { value: "total" })
    return defineChart({
      marks: [
        polar({
          radiusRatio: 0.82,
          marks: [
            radialArc(slices, {
              id: "categorias",
              key: "categoria",
              innerRadius: 46,
              color: "categoria",
              stroke: "var(--card)",
              strokeWidth: 2,
            }),
          ],
          scales: { angle: null, radius: null },
        }),
      ],
      scales: { x: null, y: null },
      color: {
        domain: datos.map((dato) => dato.categoria),
        range: COLORES,
      },
      margin: 0,
    })
  }, [datos])

  return (
    <ChartCard title="Gastos por categoría" subtitle="Mes actual">
      {datos.length === 0 ? (
        <p className="py-12 text-center text-xs text-muted-foreground">
          No hay gastos registrados este mes.
        </p>
      ) : (
        <>
          <Chart
            definition={definition}
            ariaLabel="Gastos por categoría del mes actual"
            initialWidth={340}
            height={220}
          />
          <div className="mt-3 grid grid-cols-1 gap-1.5">
            {datos.map((dato, indice) => (
              <span
                key={dato.categoria}
                className="flex items-center gap-2 text-[10px] font-semibold text-muted-foreground"
              >
                <span
                  className="size-1.5 rounded-full"
                  style={{ backgroundColor: COLORES[indice % COLORES.length] }}
                />
                <span className="flex-1 truncate">{dato.categoria}</span>
                <span className="tabular font-bold text-heading">
                  {formatMonto(dato.total)}
                </span>
              </span>
            ))}
          </div>
        </>
      )}
    </ChartCard>
  )
}
