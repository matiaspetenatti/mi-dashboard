"use client"

import { Receipt, TrendingDown, TrendingUp } from "lucide-react"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"

import { ChartCard } from "@/components/organisms/chart-card"
import type {
  ComparacionServicios,
  ServicioComparado,
} from "@/features/finanzas/types"
import { formatMonto, formatNota } from "@/lib/format"
import { cn } from "cn"

function nombreMes(mes: string) {
  const texto = format(parseISO(`${mes}-01`), "MMMM yyyy", { locale: es })
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

function porcentajeConSigno(valor: number) {
  return `${valor > 0 ? "+" : ""}${formatNota(valor)}%`
}

export function ComparadorServicios({
  comparacion,
}: {
  comparacion: ComparacionServicios
}) {
  const hayServicios = comparacion.servicios.length > 0

  return (
    <ChartCard
      title="Servicios"
      subtitle={`${nombreMes(comparacion.mesAnterior)} vs ${nombreMes(comparacion.mesActual)}`}
    >
      {!hayServicios ? (
        <div className="rounded-2xl border border-dashed border-outline-variant/70 bg-surface-container-low px-4 py-8 text-center">
          <Receipt
            className="mx-auto size-5 text-muted-foreground"
            aria-hidden="true"
          />
          <p className="mt-2 text-xs font-bold text-heading">
            No hay servicios configurados
          </p>
          <p className="mt-1 text-[10px] text-muted-foreground">
            Agregá categorías dentro de “Servicios” para compararlas mes a mes.
          </p>
        </div>
      ) : (
        <>
          <div className="hidden grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_auto] gap-3 px-3 pb-2 text-[9px] font-bold uppercase tracking-[0.1em] text-muted-foreground sm:grid">
            <span>Servicio</span>
            <span>Mes anterior</span>
            <span>Mes actual</span>
            <span className="text-right">Variación</span>
          </div>

          <ul className="divide-y divide-outline-variant/30 rounded-2xl border border-outline-variant/50">
            {comparacion.servicios.map((servicio) => (
              <FilaServicio key={servicio.categoria} servicio={servicio} />
            ))}
          </ul>

          <div className="mt-3 grid gap-3 rounded-2xl bg-surface-container-low px-4 py-3 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-center">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                Total comparable
              </p>
              <p className="text-[9px] text-muted-foreground">
                Solo servicios con ambos meses registrados
              </p>
            </div>
            <div className="flex items-center justify-between gap-2 sm:block">
              <span className="text-[9px] font-semibold text-muted-foreground sm:hidden">
                Anterior
              </span>
              <p className="tabular text-sm font-black text-heading">
                {formatMonto(comparacion.totalAnterior)}
              </p>
            </div>
            <div className="flex items-center justify-between gap-2 sm:block">
              <span className="text-[9px] font-semibold text-muted-foreground sm:hidden">
                Actual
              </span>
              <p className="tabular text-sm font-black text-heading">
                {formatMonto(comparacion.totalActual)}
              </p>
            </div>
            <div className="sm:text-right">
              <BadgeTotal comparacion={comparacion} />
            </div>
          </div>

          {comparacion.sinRegistrar > 0 || comparacion.sinBase > 0 ? (
            <p className="mt-2 text-[9px] text-muted-foreground">
              {comparacion.sinRegistrar > 0
                ? `${comparacion.sinRegistrar} ${
                    comparacion.sinRegistrar === 1
                      ? "servicio sin registrar"
                      : "servicios sin registrar"
                  } este mes.`
                : null}
              {comparacion.sinRegistrar > 0 && comparacion.sinBase > 0
                ? " "
                : null}
              {comparacion.sinBase > 0
                ? `${comparacion.sinBase} ${
                    comparacion.sinBase === 1
                      ? "servicio sin base"
                      : "servicios sin base"
                  } en el mes anterior.`
                : null}
            </p>
          ) : null}
        </>
      )}
    </ChartCard>
  )
}

function FilaServicio({ servicio }: { servicio: ServicioComparado }) {
  return (
    <li className="px-3 py-3">
      <div className="grid grid-cols-2 gap-x-3 gap-y-2 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-center">
        <div className="col-span-2 flex items-center justify-between gap-2 sm:col-span-1">
          <p className="truncate text-xs font-bold text-heading">
            {servicio.categoria}
          </p>
          <div className="sm:hidden">
            <BadgeVariacion servicio={servicio} />
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 sm:block">
          <span className="text-[9px] font-semibold text-muted-foreground sm:hidden">
            Anterior
          </span>
          <span className="tabular text-xs font-semibold text-muted-foreground">
            {servicio.anterior !== null
              ? formatMonto(servicio.anterior)
              : "—"}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2 sm:block">
          <span className="text-[9px] font-semibold text-muted-foreground sm:hidden">
            Actual
          </span>
          <span className="tabular text-xs font-bold text-heading">
            {servicio.actual !== null ? formatMonto(servicio.actual) : "—"}
          </span>
        </div>

        <div className="col-span-2 hidden justify-end sm:col-span-1 sm:flex">
          <BadgeVariacion servicio={servicio} />
        </div>
      </div>
    </li>
  )
}

function BadgeVariacion({ servicio }: { servicio: ServicioComparado }) {
  if (servicio.actual === null) {
    return (
      <span className="rounded-full bg-surface-container px-2 py-1 text-[9px] font-bold text-muted-foreground">
        Sin registrar
      </span>
    )
  }

  if (servicio.anterior === null) {
    return (
      <span className="rounded-full bg-surface-container px-2 py-1 text-[9px] font-bold text-muted-foreground">
        Sin base
      </span>
    )
  }

  const diferencia = servicio.diferencia ?? 0

  if (diferencia === 0) {
    return (
      <span className="rounded-full bg-surface-container px-2 py-1 text-[9px] font-bold text-muted-foreground">
        Sin cambios
      </span>
    )
  }

  const sube = diferencia > 0

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-1 text-[9px] font-bold",
        sube
          ? "bg-error-container text-error"
          : "bg-success-container text-success",
      )}
    >
      {sube ? (
        <TrendingUp className="size-3" aria-hidden="true" />
      ) : (
        <TrendingDown className="size-3" aria-hidden="true" />
      )}
      <span className="whitespace-nowrap">
        {sube ? "+" : ""}
        {formatMonto(diferencia)}
        {servicio.porcentaje !== null
          ? ` · ${porcentajeConSigno(servicio.porcentaje)}`
          : ""}
      </span>
    </span>
  )
}

function BadgeTotal({ comparacion }: { comparacion: ComparacionServicios }) {
  if (comparacion.diferencia === null) {
    return (
      <span className="rounded-full bg-surface-container px-2 py-1 text-[9px] font-bold text-muted-foreground">
        Sin datos comparables
      </span>
    )
  }

  const diferencia = comparacion.diferencia
  const sube = diferencia >= 0

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-1 text-[9px] font-bold",
        diferencia === 0
          ? "bg-surface-container text-muted-foreground"
          : sube
            ? "bg-error-container text-error"
            : "bg-success-container text-success",
      )}
    >
      {diferencia === 0 ? null : sube ? (
        <TrendingUp className="size-3" aria-hidden="true" />
      ) : (
        <TrendingDown className="size-3" aria-hidden="true" />
      )}
      <span className="whitespace-nowrap">
        {diferencia > 0 ? "+" : ""}
        {formatMonto(diferencia)}
        {comparacion.porcentaje !== null
          ? ` · ${porcentajeConSigno(comparacion.porcentaje)}`
          : ""}
      </span>
    </span>
  )
}
