import { getResumenDelMes, getTotalesGlobales } from "./queries";
import { formatMonto } from "@/lib/format";
import {
  TrendingUp,
  Wallet,
  ArrowDownRight,
  ArrowUpRight,
  Scale,
} from "lucide-react";

const cardClass =
  "flex flex-col justify-between rounded-xl border border-outline-variant/60 bg-card p-5 shadow-elevation-1";

export function ResumenSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="h-28 animate-pulse rounded-xl border border-outline-variant/40 bg-surface-container/60"
        />
      ))}
    </div>
  );
}

export async function ResumenMes({ filtroCuentaId }: { filtroCuentaId?: number }) {
  const resumenPromise = filtroCuentaId
    ? getResumenDelMes(filtroCuentaId)
    : getResumenDelMes();

  const [resumen, totales] = await Promise.all([
    resumenPromise,
    getTotalesGlobales(),
  ]);

  const { ingresos, gastos, balance, rendimientos } = resumen;
  const tieneRendimientos = totales.rendimientoDiarioTotal > 0;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Patrimonio total */}
      <div className={cardClass}>
        <div className="flex items-center justify-between gap-2 text-xs font-semibold text-charcoal">
          <span>Patrimonio Total</span>
          <Wallet size={16} className="shrink-0 text-pebble" />
        </div>
        <p className="my-2 text-2xl font-extrabold tracking-tight text-heading">
          {formatMonto(totales.saldoTotal)}
        </p>
        <p className="text-xs text-charcoal">
          En {totales.cantidadCuentas}{" "}
          {totales.cantidadCuentas === 1 ? "cuenta" : "cuentas"}
        </p>
      </div>

      {/* Ingresos del mes */}
      <div className={cardClass}>
        <div className="flex items-center justify-between gap-2 text-xs font-semibold text-charcoal">
          <span>Ingresos (mes)</span>
          <ArrowUpRight size={16} className="shrink-0 text-success" />
        </div>
        <p className="my-2 text-2xl font-extrabold tracking-tight text-success">
          {formatMonto(ingresos)}
        </p>
        {rendimientos > 0 ? (
          <p className="text-xs font-medium text-success">
            incluye {formatMonto(rendimientos)} en rendimientos
          </p>
        ) : (
          <p className="text-xs text-charcoal">mes en curso</p>
        )}
      </div>

      {/* Gastos del mes */}
      <div className={cardClass}>
        <div className="flex items-center justify-between gap-2 text-xs font-semibold text-charcoal">
          <span>Gastos (mes)</span>
          <ArrowDownRight size={16} className="shrink-0 text-error" />
        </div>
        <p className="my-2 text-2xl font-extrabold tracking-tight text-error">
          {formatMonto(gastos)}
        </p>
        <p className="text-xs text-charcoal">mes en curso</p>
      </div>

      {/* Rendimientos o balance neto */}
      <div className={cardClass}>
        <div className="flex items-center justify-between gap-2 text-xs font-semibold text-charcoal">
          <span>{tieneRendimientos ? "Rendimientos" : "Balance neto"}</span>
          {tieneRendimientos ? (
            <TrendingUp size={16} className="shrink-0 text-success" />
          ) : (
            <Scale size={16} className="shrink-0 text-pebble" />
          )}
        </div>

        {tieneRendimientos ? (
          <>
            <p className="my-2 flex items-baseline gap-1 text-2xl font-extrabold tracking-tight text-success">
              +{formatMonto(totales.rendimientoDiarioTotal)}
              <span className="text-xs font-bold text-charcoal">/día</span>
            </p>
            <p className="text-xs font-medium text-charcoal">
              ~+{formatMonto(totales.rendimientoMensualTotal)} / mes
            </p>
          </>
        ) : (
          <>
            <p
              className={`my-2 text-2xl font-extrabold tracking-tight ${
                balance < 0 ? "text-error" : "text-heading"
              }`}
            >
              {formatMonto(balance)}
            </p>
            <p className="text-xs text-charcoal">ingresos − gastos</p>
          </>
        )}
      </div>
    </div>
  );
}
