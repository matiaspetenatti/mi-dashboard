import { getResumenDelMes, getTotalesGlobales } from "./queries";
import { formatMonto } from "@/lib/format";
import { TrendingUp, Wallet, ArrowDownRight, ArrowUpRight, Scale } from "lucide-react";

export function ResumenSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-20 animate-pulse rounded-xl bg-neutral-100" />
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

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {/* Total en Cuentas */}
      <div className="rounded-xl border bg-white p-4 shadow-xs">
        <div className="flex items-center justify-between text-neutral-500">
          <p className="text-xs font-medium">Patrimonio Total</p>
          <Wallet size={16} className="text-neutral-400" />
        </div>
        <p className="mt-1 text-xl font-bold text-neutral-900">
          {formatMonto(totales.saldoTotal)}
        </p>
        <p className="text-[11px] text-neutral-500">
          En {totales.cantidadCuentas} {totales.cantidadCuentas === 1 ? "cuenta" : "cuentas"}
        </p>
      </div>

      {/* Ingresos del mes */}
      <div className="rounded-xl border bg-white p-4 shadow-xs">
        <div className="flex items-center justify-between text-neutral-500">
          <p className="text-xs font-medium">Ingresos (mes)</p>
          <ArrowUpRight size={16} className="text-emerald-500" />
        </div>
        <p className="mt-1 text-xl font-bold text-emerald-600">
          {formatMonto(ingresos)}
        </p>
        {rendimientos > 0 && (
          <p className="text-[11px] text-emerald-600 font-medium">
            incluye {formatMonto(rendimientos)} en rendimientos
          </p>
        )}
      </div>

      {/* Gastos del mes */}
      <div className="rounded-xl border bg-white p-4 shadow-xs">
        <div className="flex items-center justify-between text-neutral-500">
          <p className="text-xs font-medium">Gastos (mes)</p>
          <ArrowDownRight size={16} className="text-red-500" />
        </div>
        <p className="mt-1 text-xl font-bold text-red-600">
          {formatMonto(gastos)}
        </p>
        <p className="text-[11px] text-neutral-500">
          mes en curso
        </p>
      </div>

      {/* Balance o Rendimientos */}
      <div className="rounded-xl border bg-white p-4 shadow-xs">
        <div className="flex items-center justify-between text-neutral-500">
          <p className="text-xs font-medium">
            {totales.rendimientoDiarioTotal > 0 ? "Rendimientos" : "Balance neto"}
          </p>
          {totales.rendimientoDiarioTotal > 0 ? (
            <TrendingUp size={16} className="text-emerald-500" />
          ) : (
            <Scale size={16} className="text-neutral-400" />
          )}
        </div>
        {totales.rendimientoDiarioTotal > 0 ? (
          <>
            <p className="mt-1 text-xl font-bold text-emerald-700">
              +{formatMonto(totales.rendimientoDiarioTotal)}
              <span className="text-xs font-normal text-neutral-500">/día</span>
            </p>
            <p className="text-[11px] text-emerald-600">
              ~+{formatMonto(totales.rendimientoMensualTotal)} / mes
            </p>
          </>
        ) : (
          <>
            <p
              className={`mt-1 text-xl font-bold ${
                balance < 0 ? "text-red-600" : "text-neutral-900"
              }`}
            >
              {formatMonto(balance)}
            </p>
            <p className="text-[11px] text-neutral-500">ingresos − gastos</p>
          </>
        )}
      </div>
    </div>
  );
}
