import {
  Brain,
  CircleHelp,
  CloudSun,
  Dumbbell,
  HeartPulse,
  Moon,
  PieChart,
  Utensils,
  type LucideIcon,
} from "lucide-react";
import type { CategoriaFactor } from "../constantes";
import type { FilaMapa } from "../queries";

const ICONOS: Record<string, LucideIcon> = {
  emocional: Brain,
  sueno: Moon,
  alimentacion: Utensils,
  ambiental: CloudSun,
  fisico: Dumbbell,
  hormonal: HeartPulse,
  otro: CircleHelp,
};

export function MapaDesencadenantes({ mapa }: { mapa: FilaMapa[] }) {
  return (
    <section className="flex h-full flex-col rounded-2xl border border-outline-variant/40 bg-card p-5 shadow-elevation-1 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold tracking-tight text-heading">
            Mapa de desencadenantes
          </h2>
          <p className="mt-0.5 text-xs text-charcoal">
            Porcentaje de episodios de los últimos 90 días.
          </p>
        </div>
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary-container text-on-primary-container">
          <PieChart size={16} />
        </span>
      </div>

      {mapa.length === 0 ? (
        <div className="mt-4 flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-outline-variant/60 bg-surface-container-low/40 px-4 py-8 text-center">
          <PieChart size={22} className="text-primary" />
          <p className="text-sm font-semibold text-heading">
            Sin desencadenantes registrados
          </p>
          <p className="max-w-xs text-xs text-on-surface-variant">
            Marcá los factores que detectaste en cada episodio para ver cuáles
            se repiten.
          </p>
        </div>
      ) : (
        <ul className="mt-5 flex flex-col gap-4">
          {mapa.map((fila) => {
            const Icono = ICONOS[fila.categoria as CategoriaFactor] ?? CircleHelp;

            return (
              <li key={fila.factor}>
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-1.5 text-xs font-semibold text-heading">
                    <Icono
                      size={14}
                      className="shrink-0 text-on-surface-variant"
                      aria-hidden="true"
                    />
                    <span className="truncate">{fila.etiqueta}</span>
                  </span>
                  <span className="shrink-0 text-xs font-bold tabular-nums text-heading">
                    {fila.porcentaje}%
                  </span>
                </div>
                <div
                  className="h-2.5 w-full overflow-hidden rounded-full bg-surface-container"
                  role="progressbar"
                  aria-label={`${fila.etiqueta}: ${fila.porcentaje}%`}
                  aria-valuenow={fila.porcentaje}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div
                    className="h-full rounded-full bg-primary-container transition-[width] duration-500 ease-out"
                    style={{ width: `${Math.max(4, fila.porcentaje)}%` }}
                  />
                </div>
                <p className="mt-1 text-[11px] text-pebble">
                  {fila.episodios}{" "}
                  {fila.episodios === 1 ? "episodio" : "episodios"}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
