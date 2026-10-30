"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Activity } from "lucide-react";
import { cn } from "cn";
import { formatearDiaLargo, formatearDuracion } from "../lib/fechas";
import type { PuntoSerie } from "../queries";

const RANGOS = [7, 30, 90] as const;
type Rango = (typeof RANGOS)[number];

function TooltipSerie({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: PuntoSerie }>;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const punto = payload[0].payload;

  return (
    <div className="rounded-xl border border-outline-variant/60 bg-surface-container-lowest px-3 py-2 text-xs shadow-elevation-2">
      <p className="font-bold text-heading">{formatearDiaLargo(punto.fecha)}</p>
      {punto.eva === null ? (
        <p className="mt-1 text-on-surface-variant">Sin episodios registrados</p>
      ) : (
        <div className="mt-1 space-y-0.5 text-on-surface-variant">
          <p>
            Intensidad máxima:{" "}
            <span className="font-semibold text-heading">{punto.eva} / 10</span>
          </p>
          <p>
            Duración total:{" "}
            <span className="font-semibold text-heading">
              {formatearDuracion(Math.round(punto.duracionHoras * 60))}
            </span>
          </p>
          <p>
            Episodios:{" "}
            <span className="font-semibold text-heading">
              {punto.episodios}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}

export function GraficoIntensidad({ serie }: { serie: PuntoSerie[] }) {
  const [rango, setRango] = useState<Rango>(30);
  const datos = useMemo(() => serie.slice(-rango), [serie, rango]);
  const hayDatos = datos.some((punto) => punto.eva !== null);

  return (
    <section className="rounded-2xl border border-outline-variant/40 bg-card p-5 shadow-elevation-1 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-bold tracking-tight text-heading">
            Evolución de la intensidad
          </h2>
          <p className="mt-0.5 text-xs text-charcoal">
            Intensidad máxima (EVA) y horas de crisis por día.
          </p>
        </div>

        <div
          role="group"
          aria-label="Rango del gráfico"
          className="flex shrink-0 items-center gap-1 self-start rounded-full border border-outline-variant/40 bg-surface-container-low p-1"
        >
          {RANGOS.map((opcion) => (
            <button
              key={opcion}
              type="button"
              onClick={() => setRango(opcion)}
              aria-pressed={rango === opcion}
              className={cn(
                "rounded-full px-3 py-1 text-[11px] font-bold transition-colors",
                rango === opcion
                  ? "bg-inverse-surface text-inverse-on-surface"
                  : "text-on-surface-variant hover:text-heading",
              )}
            >
              {opcion}D
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-medium text-on-surface-variant">
        <span className="flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: "var(--chart-1)" }}
          />
          Intensidad EVA
        </span>
        <span className="flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className="inline-block h-2.5 w-2.5 rounded-sm"
            style={{ backgroundColor: "var(--chart-3)" }}
          />
          Horas de crisis
        </span>
      </div>

      {hayDatos ? (
        <div className="mt-2 h-[280px] w-full min-w-0 sm:h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={datos}
              margin={{ top: 16, right: 4, left: -16, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--outline-variant)"
                strokeOpacity={0.45}
                vertical={false}
              />
              <XAxis
                dataKey="etiqueta"
                stroke="var(--outline-variant)"
                tickLine={false}
                axisLine={{ stroke: "var(--outline-variant)" }}
                interval="preserveStartEnd"
                minTickGap={24}
                tick={{ fontSize: 11, fill: "var(--on-surface-variant)" }}
              />
              <YAxis
                yAxisId="eva"
                domain={[0, 10]}
                ticks={[1, 4, 7, 10]}
                width={34}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "var(--on-surface-variant)" }}
              />
              <YAxis
                yAxisId="horas"
                orientation="right"
                width={34}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "var(--on-surface-variant)" }}
                tickFormatter={(valor: number) => `${valor}h`}
              />
              <Tooltip
                cursor={{ fill: "var(--on-surface)", fillOpacity: 0.04 }}
                content={<TooltipSerie />}
              />
              <Bar
                yAxisId="horas"
                dataKey="duracionHoras"
                fill="var(--chart-3)"
                radius={[4, 4, 0, 0]}
                maxBarSize={18}
                name="Horas de crisis"
              />
              <Line
                yAxisId="eva"
                type="monotone"
                dataKey="eva"
                stroke="var(--chart-1)"
                strokeWidth={2}
                dot={{ r: 2.5, fill: "var(--chart-1)", strokeWidth: 0 }}
                activeDot={{ r: 4 }}
                connectNulls={false}
                name="Intensidad EVA"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="mt-4 flex h-[240px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-outline-variant/60 bg-surface-container-low/40 text-center">
          <Activity size={24} className="text-primary" />
          <p className="text-sm font-semibold text-heading">
            Todavía no hay episodios en este rango
          </p>
          <p className="max-w-xs text-xs text-on-surface-variant">
            Cuando registres un episodio vas a ver acá la intensidad y la
            duración en el tiempo.
          </p>
        </div>
      )}
    </section>
  );
}
