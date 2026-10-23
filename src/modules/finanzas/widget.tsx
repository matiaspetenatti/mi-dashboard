import { TrendingUp, Wallet } from "lucide-react";
import { WidgetCard } from "@/components/widget-card";
import { CountUp } from "@/components/motion/count-up";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMonto } from "@/lib/format";
import { getResumenDelMes, getTotalesGlobales, getCuentas } from "./queries";

export function FinanzasWidgetSkeleton() {
  return (
    <WidgetCard
      title="Finanzas"
      href="/finanzas"
      icon={Wallet}
      accent="secondary"
    >
      <div className="space-y-3">
        <Skeleton className="h-3.5 w-32" />
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-8 w-full" />
        <div className="grid grid-cols-2 gap-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    </WidgetCard>
  );
}

export async function FinanzasWidget() {
  const [{ ingresos, gastos }, totales, cuentas] = await Promise.all([
    getResumenDelMes(),
    getTotalesGlobales(),
    getCuentas(),
  ]);

  return (
    <WidgetCard
      title="Finanzas"
      href="/finanzas"
      icon={Wallet}
      accent="secondary"
    >
      <div className="space-y-3">
        <div>
          <p className="text-xs font-medium text-on-surface-variant">
            Patrimonio en cuentas
          </p>
          <CountUp
            value={totales.saldoTotal}
            format="ars"
            className="mt-1 block text-3xl font-medium tracking-tight text-on-surface"
          />
        </div>

        {totales.rendimientoDiarioTotal > 0 && (
          <div className="flex items-center gap-1.5 rounded-full bg-success-container px-3 py-1.5 text-xs font-medium text-on-success-container">
            <TrendingUp size={13} />
            <span>
              +{formatMonto(totales.rendimientoDiarioTotal)}/día en
              rendimientos
            </span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-2xl bg-success-container/60 px-3 py-2 text-on-success-container">
            <p className="text-[10px] font-medium uppercase tracking-wider opacity-80">
              Ingresos
            </p>
            <p className="mt-0.5 truncate font-semibold">↑ {formatMonto(ingresos)}</p>
          </div>
          <div className="rounded-2xl bg-error-container/60 px-3 py-2 text-on-error-container">
            <p className="text-[10px] font-medium uppercase tracking-wider opacity-80">
              Gastos
            </p>
            <p className="mt-0.5 truncate font-semibold">↓ {formatMonto(gastos)}</p>
          </div>
        </div>

        <p className="text-[11px] text-on-surface-variant">
          {cuentas.length} {cuentas.length === 1 ? "cuenta conectada" : "cuentas conectadas"}
        </p>
      </div>
    </WidgetCard>
  );
}
