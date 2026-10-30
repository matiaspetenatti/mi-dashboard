import { Lock, TrendingUp, Wallet } from "lucide-react";
import { WidgetCard } from "@/components/widget-card";
import { CountUp } from "@/components/motion/count-up";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMonto } from "@/lib/format";
import { getResumenDelMes, getTotalesGlobales, getCuentas } from "./queries";

export function FinanzasWidgetSkeleton() {
  return (
    <WidgetCard
      title="Finanzas"
      subtitle="Patrimonio en cuentas"
      href="/finanzas"
      icon={Wallet}
      accent="secondary"
      variant="inverse"
    >
      <div className="space-y-3">
        <Skeleton className="h-12 w-48 bg-white/10" />
        <Skeleton className="h-7 w-44 rounded-full bg-white/10" />
        <div className="grid grid-cols-2 gap-3 pt-2">
          <Skeleton className="h-16 w-full rounded-[14px] bg-white/10" />
          <Skeleton className="h-16 w-full rounded-[14px] bg-white/10" />
        </div>
      </div>
    </WidgetCard>
  );
}

export async function FinanzasWidget() {
  let resumen: Awaited<ReturnType<typeof getResumenDelMes>>;
  let totales: Awaited<ReturnType<typeof getTotalesGlobales>>;
  let cuentas: Awaited<ReturnType<typeof getCuentas>>;

  try {
    [resumen, totales, cuentas] = await Promise.all([
      getResumenDelMes(),
      getTotalesGlobales(),
      getCuentas(),
    ]);
  } catch {
    return <FinanzasWidgetError />;
  }

  const { ingresos, gastos } = resumen;

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
            {cuentas.length}{" "}
            {cuentas.length === 1 ? "cuenta conectada" : "cuentas conectadas"}{" "}
            · ARS
          </span>
          <Lock size={13} aria-hidden="true" />
        </>
      }
    >
      <CountUp
        value={totales.saldoTotal}
        format="ars"
        className="block text-[38px] font-black leading-none tracking-tight text-card-inverse-foreground md:text-[45px]"
      />

      {totales.rendimientoDiarioTotal > 0 && (
        <div className="mt-2 inline-flex items-center gap-1.5 self-start rounded-full border border-lime-voltage/30 bg-white/5 px-3 py-1 text-xs font-semibold text-card-inverse-muted">
          <TrendingUp size={13} />
          <span>
            +{formatMonto(totales.rendimientoDiarioTotal)}/día en rendimientos
          </span>
        </div>
      )}

      <div className="mt-auto grid grid-cols-2 gap-3 pt-4">
        <div className="rounded-[14px] border border-white/10 bg-card-inverse-inset p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-card-inverse-muted/70">
            Ingresos
          </p>
          <p className="mt-1 truncate text-sm font-bold text-card-inverse-foreground">
            {formatMonto(ingresos)}
          </p>
        </div>
        <div className="rounded-[14px] border border-white/10 bg-card-inverse-inset p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-card-inverse-muted/70">
            Gastos
          </p>
          <p className="mt-1 truncate text-sm font-bold text-card-inverse-foreground">
            {formatMonto(gastos)}
          </p>
        </div>
      </div>
    </WidgetCard>
  );
}

export function FinanzasWidgetError() {
  return (
    <WidgetCard
      title="Finanzas"
      subtitle="Patrimonio en cuentas"
      href="/finanzas"
      icon={Wallet}
      accent="secondary"
      variant="inverse"
    >
      <div className="flex flex-1 flex-col justify-center gap-1 py-6 text-center">
        <Wallet className="mx-auto h-6 w-6 text-card-inverse-muted opacity-70" />
        <p className="text-sm font-medium text-card-inverse-foreground">
          No se pudieron cargar las finanzas
        </p>
        <p className="text-xs text-card-inverse-muted">
          Entrá al módulo de Finanzas para reintentar.
        </p>
      </div>
    </WidgetCard>
  );
}
