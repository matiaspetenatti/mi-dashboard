import { useQuery } from "@tanstack/react-query"
import { Lock, TrendingUp, Wallet } from "lucide-react"

import { WidgetCard } from "@/components/organisms/widget-card"
import { WidgetError } from "@/components/molecules/widget-states"
import { resumenFinanzasQuery } from "@/features/finanzas/api"
import { formatMonto } from "@/lib/format"

export function WidgetFinanzas() {
  const { data, isPending, isError } = useQuery(resumenFinanzasQuery)

  return (
    <WidgetCard
      title="Finanzas"
      subtitle="Patrimonio en cuentas"
      href="/finanzas"
      icon={Wallet}
      accent="secondary"
      variant="inverse"
      footer={
        <>
          <span>
            {data
              ? `${data.cantidadCuentas} ${data.cantidadCuentas === 1 ? "cuenta" : "cuentas"} · ARS`
              : "Cargando..."}
          </span>
          <Lock className="size-3" aria-hidden="true" />
        </>
      }
    >
      {isPending ? (
        <div className="space-y-3">
          <div className="h-11 w-48 animate-pulse rounded-xl bg-white/10" />
          <div className="h-6 w-44 animate-pulse rounded-full bg-white/10" />
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="h-16 animate-pulse rounded-2xl bg-white/10" />
            <div className="h-16 animate-pulse rounded-2xl bg-white/10" />
          </div>
        </div>
      ) : null}

      {isError ? (
        <WidgetError message="No se pudieron cargar las finanzas." />
      ) : null}

      {data ? (
        <div className="flex flex-1 flex-col">
          <span className="tabular text-display text-4xl leading-none text-card-inverse-foreground">
            {formatMonto(data.saldoTotal)}
          </span>

          {data.rendimientoDiario > 0 ? (
            <span className="mt-3 inline-flex items-center gap-1.5 self-start rounded-full border border-lime-voltage/30 bg-white/5 px-3 py-1 text-[10px] font-semibold text-card-inverse-muted">
              <TrendingUp className="size-3" aria-hidden="true" />
              +{formatMonto(data.rendimientoDiario)}/día en rendimientos
            </span>
          ) : (
            <span className="mt-3 inline-flex items-center gap-1.5 self-start rounded-full border border-card-inverse-border bg-white/5 px-3 py-1 text-[10px] font-semibold text-card-inverse-muted/80">
              Sin rendimiento configurado
            </span>
          )}

          <div className="mt-auto grid grid-cols-2 gap-2 pt-4">
            <div className="rounded-2xl border border-card-inverse-border bg-card-inverse-inset p-3">
              <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-card-inverse-muted/70">
                Ingresos
              </p>
              <p className="tabular mt-1 truncate text-xs font-bold text-card-inverse-foreground">
                {formatMonto(data.ingresosMes)}
              </p>
            </div>
            <div className="rounded-2xl border border-card-inverse-border bg-card-inverse-inset p-3">
              <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-card-inverse-muted/70">
                Gastos
              </p>
              <p className="tabular mt-1 truncate text-xs font-bold text-card-inverse-foreground">
                {formatMonto(data.gastosMes)}
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </WidgetCard>
  )
}
