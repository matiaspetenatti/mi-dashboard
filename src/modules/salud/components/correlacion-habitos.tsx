import { LineChart, Info } from "lucide-react";
import type { CorrelacionHabitos } from "../queries";

function BarraComparativa({
  etiqueta,
  unidad,
  conCrisis,
  sinCrisis,
}: {
  etiqueta: string;
  unidad: string;
  conCrisis: number;
  sinCrisis: number;
}) {
  const maximo = Math.max(conCrisis, sinCrisis, 0.0001);
  const anchoCon = Math.round((conCrisis / maximo) * 100);
  const anchoSin = Math.round((sinCrisis / maximo) * 100);

  return (
    <li className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-heading">{etiqueta}</span>
        <span className="text-[11px] text-pebble">{unidad}</span>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="w-20 shrink-0 text-[10px] font-medium text-on-surface-variant">
            Con crisis
          </span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-container">
            <div
              className="h-full rounded-full bg-error/70"
              style={{ width: `${Math.max(4, anchoCon)}%` }}
            />
          </div>
          <span className="w-10 shrink-0 text-right text-[11px] font-bold tabular-nums text-heading">
            {conCrisis}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-20 shrink-0 text-[10px] font-medium text-on-surface-variant">
            Sin crisis
          </span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-container">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-500"
              style={{ width: `${Math.max(4, anchoSin)}%` }}
            />
          </div>
          <span className="w-10 shrink-0 text-right text-[11px] font-bold tabular-nums text-heading">
            {sinCrisis}
          </span>
        </div>
      </div>
    </li>
  );
}

export function CorrelacionHabitos({
  correlacion,
}: {
  correlacion: CorrelacionHabitos | null;
}) {
  return (
    <section className="rounded-2xl border border-outline-variant/40 bg-card p-5 shadow-elevation-1 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-base font-bold tracking-tight text-heading">
            <LineChart size={17} className="text-primary" />
            Hábitos y crisis
          </h2>
          <p className="mt-0.5 text-xs text-charcoal">
            Promedio de cada hábito en días con y sin migraña (últimos 90 días).
          </p>
        </div>
        {correlacion && (
          <span className="shrink-0 rounded-full bg-surface-container px-2.5 py-1 text-[10px] font-bold text-on-surface-variant">
            {correlacion.registros} días
          </span>
        )}
      </div>

      {correlacion === null ? (
        <div className="mt-4 flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-outline-variant/60 bg-surface-container-low/40 px-4 py-10 text-center">
          <LineChart size={22} className="text-primary" />
          <p className="text-sm font-semibold text-heading">
            Faltan datos para comparar
          </p>
          <p className="max-w-sm text-xs text-on-surface-variant">
            Necesitás al menos 7 días de diario y 2 días con crisis y 2 sin
            crisis. Seguí registrando y esta comparación aparece sola.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-2 gap-2 text-center">
            <div className="rounded-xl border border-error/20 bg-error-container/50 px-3 py-2">
              <p className="text-lg font-bold text-on-error-container">
                {correlacion.registrosConCrisis}
              </p>
              <p className="text-[10px] font-semibold text-on-error-container">
                días con crisis
              </p>
            </div>
            <div className="rounded-xl border border-primary/20 bg-primary-container/40 px-3 py-2">
              <p className="text-lg font-bold text-on-primary-container">
                {correlacion.registrosSinCrisis}
              </p>
              <p className="text-[10px] font-semibold text-on-primary-container">
                días sin crisis
              </p>
            </div>
          </div>

          {correlacion.metricas.length === 0 ? (
            <p className="mt-4 text-xs text-on-surface-variant">
              Los días registrados no tienen métricas en común para comparar.
            </p>
          ) : (
            <ul className="mt-5 space-y-4">
              {correlacion.metricas.map((metrica) => (
                <BarraComparativa
                  key={metrica.clave}
                  etiqueta={metrica.etiqueta}
                  unidad={metrica.unidad}
                  conCrisis={metrica.conCrisis ?? 0}
                  sinCrisis={metrica.sinCrisis ?? 0}
                />
              ))}
            </ul>
          )}

          <p className="mt-4 flex items-start gap-1.5 rounded-xl bg-surface-container-low/60 px-3 py-2 text-[11px] leading-relaxed text-on-surface-variant">
            <Info size={13} className="mt-0.5 shrink-0 text-primary" />
            Es una comparación descriptiva, no un diagnóstico. Llevala a la
            consulta para interpretarla junto a tu médico.
          </p>
        </>
      )}
    </section>
  );
}
