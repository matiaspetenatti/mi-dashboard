"use client"

import { useQuery } from "@tanstack/react-query"
import { ChefHat, ShoppingBasket, UtensilsCrossed } from "lucide-react"

import { WidgetError, WidgetLoading } from "@/components/molecules/widget-states"
import { WidgetCard } from "@/components/organisms/widget-card"
import { resumenComidaQuery } from "@/features/comida/api"
import { etiquetaMomento } from "@/features/comida/constantes"
import { formatMonto } from "@/lib/format"

export function WidgetComida() {
  const { data, isPending, isError } = useQuery(resumenComidaQuery)

  return (
    <WidgetCard
      title="Comida"
      subtitle="Despensa y compras"
      href="/comida"
      icon={UtensilsCrossed}
      accent="tertiary"
      footer={
        <>
          <span>
            {data
              ? `${data.items} ingredientes`
              : "Cargando..."}
          </span>
          <span>
            {data
              ? `${data.porVencer} por vencer`
              : "Despensa"}
          </span>
        </>
      }
    >
      {isPending ? <WidgetLoading /> : null}

      {isError ? (
        <WidgetError message="No se pudo cargar la despensa." />
      ) : null}

      {data ? (
        <div className="flex flex-1 flex-col gap-3">
          <div className="flex items-end gap-2">
            <span className="text-display text-5xl leading-none text-heading">
              {data.comprasPendientes}
            </span>
            <span className="pb-1 text-xs font-semibold text-muted-foreground">
              {data.comprasPendientes === 1
                ? "compra pendiente"
                : "compras pendientes"}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-2xl bg-surface-container-low p-2.5">
              <p className="text-[8px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                Estimado
              </p>
              <p className="tabular mt-1 text-sm font-black text-heading">
                {formatMonto(data.totalCompraCentavos)}
              </p>
            </div>
            <div className="rounded-2xl bg-surface-container-low p-2.5">
              <p className="text-[8px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                Recetas
              </p>
              <p className="tabular mt-1 text-sm font-black text-heading">
                {data.recetas}
              </p>
            </div>
          </div>

          {data.menuHoy.length > 0 ? (
            <ul className="mt-auto flex flex-col gap-1">
              {data.menuHoy.slice(0, 2).map((slot) => (
                <li
                  key={slot.id}
                  className="flex items-center gap-2 rounded-xl bg-surface-container-low px-2 py-1.5"
                >
                  <ChefHat
                    className="size-3 shrink-0 text-secondary"
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1 truncate text-[9px] font-semibold text-heading">
                    {etiquetaMomento(slot.momento)}: {slot.titulo}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-auto flex items-center gap-1.5 rounded-2xl bg-surface-container-low p-2.5 text-[9px] font-semibold text-muted-foreground">
              <ShoppingBasket className="size-3" aria-hidden="true" />
              Sin menú para hoy
            </p>
          )}
        </div>
      ) : null}
    </WidgetCard>
  )
}
