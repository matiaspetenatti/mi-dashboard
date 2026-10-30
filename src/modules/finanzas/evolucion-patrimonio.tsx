"use client";

import { useState, useMemo } from "react";
import { ArrowDownRight, ArrowUpRight, TrendingUp } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatMonto, formatMontoCompacto } from "@/lib/format";
import type { PuntoEvolucion } from "./queries";

type RangoTiempo = "1M" | "3M" | "6M" | "1A";

const rangos: { id: RangoTiempo; label: string; dias: number }[] = [
  { id: "1M", label: "1 mes", dias: 30 },
  { id: "3M", label: "3 meses", dias: 90 },
  { id: "6M", label: "6 meses", dias: 180 },
  { id: "1A", label: "1 año", dias: 365 },
];

const chartConfig = {
  saldo: {
    label: "Patrimonio",
    color: "var(--chart-finance-line)",
  },
} satisfies ChartConfig;

export function EvolucionPatrimonioChart({
  puntos,
}: {
  puntos: PuntoEvolucion[];
}) {
  const [rango, setRango] = useState<RangoTiempo>("1M");

  const datosFiltrados = useMemo(() => {
    const configRango = rangos.find((r) => r.id === rango) ?? rangos[0];
    const slice = puntos.slice(-configRango.dias);
    return slice.length > 0 ? slice : puntos;
  }, [puntos, rango]);

  const stats = useMemo(() => {
    if (datosFiltrados.length === 0) {
      return {
        actual: 0,
        inicial: 0,
        diferencia: 0,
        porcentaje: 0,
        min: 0,
        max: 0,
      };
    }

    const inicial = datosFiltrados[0].saldo;
    const actual = datosFiltrados[datosFiltrados.length - 1].saldo;
    const diferencia = actual - inicial;
    const saldos = datosFiltrados.map((d) => d.saldo);
    const min = Math.min(...saldos);
    const max = Math.max(...saldos);

    let porcentaje = 0;
    if (inicial > 0) {
      porcentaje = (diferencia / inicial) * 100;
    } else if (actual > 0) {
      porcentaje = 100;
    }

    return {
      actual,
      inicial,
      diferencia,
      porcentaje: Math.round(porcentaje * 10) / 10,
      min,
      max,
    };
  }, [datosFiltrados]);

  const esPositivo = stats.diferencia >= 0;
  const colorLinea = esPositivo
    ? "var(--chart-finance-line)"
    : "var(--error)";
  const colorArea = esPositivo ? "var(--chart-finance-area)" : "var(--error)";
  const etiquetaRango = rangos.find((r) => r.id === rango)?.label ?? "1 mes";

  const yDomain = useMemo(() => {
    const { min, max } = stats;
    const spread = max - min;
    const padding = spread > 0 ? spread * 0.15 : max > 0 ? max * 0.15 : 1000;
    const bottom = Math.max(0, Math.floor(min - padding));
    const top = Math.ceil(max + padding);
    return [bottom, top];
  }, [stats]);

  return (
    <section className="rounded-xl border border-outline-variant/60 bg-card p-6 shadow-elevation-1">
      {/* Encabezado: título y selector de rango */}
      <div className="flex flex-col gap-4 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary-container text-primary">
            <TrendingUp size={16} />
          </span>
          <div>
            <h2 className="text-base font-bold leading-tight text-heading">
              Evolución del Patrimonio
            </h2>
            <p className="text-xs text-charcoal">
              Seguimiento histórico de tu saldo acumulado en todas las cuentas
            </p>
          </div>
        </div>

        <div className="inline-flex self-start rounded-full border border-outline-variant/60 bg-surface-container p-1 text-xs font-semibold sm:self-auto">
          {rangos.map((r) => {
            const activo = rango === r.id;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => setRango(r.id)}
                aria-pressed={activo}
                className={`rounded-full px-3.5 py-1 transition-colors ${
                  activo
                    ? "bg-card text-heading shadow-xs"
                    : "text-charcoal hover:text-heading"
                }`}
              >
                {r.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Métricas del periodo */}
      <div className="grid grid-cols-2 gap-4 border-t border-outline-variant/50 py-3 text-xs sm:grid-cols-4">
        <div>
          <span className="block text-charcoal">Patrimonio al día de hoy</span>
          <span className="text-base font-extrabold text-heading">
            {formatMonto(stats.actual * 100)}
          </span>
        </div>

        <div>
          <span className="block text-charcoal">Variación en {etiquetaRango}</span>
          <span
            className={`mt-0.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-bold ${
              esPositivo
                ? "bg-success-container text-on-success-container"
                : "bg-error-container text-on-error-container"
            }`}
          >
            {esPositivo ? (
              <ArrowUpRight size={13} />
            ) : (
              <ArrowDownRight size={13} />
            )}
            {esPositivo ? "+" : "−"} {formatMonto(Math.abs(stats.diferencia) * 100)}
            <span
              className={`rounded-full px-1.5 text-[10px] ${
                esPositivo
                  ? "bg-on-success-container/10"
                  : "bg-on-error-container/10"
              }`}
            >
              {esPositivo ? "+" : ""}
              {stats.porcentaje}%
            </span>
          </span>
        </div>

        <div>
          <span className="block text-charcoal">Mínimo</span>
          <span className="font-bold text-heading">
            {formatMonto(stats.min * 100)}
          </span>
        </div>

        <div>
          <span className="block text-charcoal">Máximo</span>
          <span className="font-bold text-heading">
            {formatMonto(stats.max * 100)}
          </span>
        </div>
      </div>

      {/* Gráfico */}
      <div className="pt-2">
        {datosFiltrados.length === 0 ? (
          <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-outline-variant/60 bg-surface-container-low/60 px-6 text-center text-xs text-charcoal">
            Todavía no hay movimientos suficientes para dibujar la evolución
            del patrimonio.
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-64 w-full">
            <AreaChart
              data={datosFiltrados}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="patrimonioGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={colorArea} stopOpacity={0.45} />
                  <stop offset="100%" stopColor={colorArea} stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="4 4"
                vertical={false}
                stroke="var(--outline-variant)"
              />

              <XAxis
                dataKey="fecha"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={28}
                tickFormatter={(value: string) => {
                  if (!value) return "";
                  const [y, m, d] = value.split("-").map(Number);
                  const date = new Date(Date.UTC(y, m - 1, d));
                  if (rango === "1M") {
                    return new Intl.DateTimeFormat("es-AR", {
                      day: "numeric",
                      month: "short",
                    }).format(date);
                  }
                  if (rango === "3M" || rango === "6M") {
                    return new Intl.DateTimeFormat("es-AR", {
                      month: "short",
                      day: "numeric",
                    }).format(date);
                  }
                  return new Intl.DateTimeFormat("es-AR", {
                    month: "short",
                    year: "2-digit",
                  }).format(date);
                }}
                className="text-[11px]"
              />

              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                domain={yDomain}
                tickFormatter={(value: number) => formatMontoCompacto(value)}
                className="text-[11px]"
                width={58}
              />

              <ChartTooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const punto = payload[0].payload as PuntoEvolucion;
                  const [y, m, d] = punto.fecha.split("-").map(Number);
                  const fechaFormat = new Intl.DateTimeFormat("es-AR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  }).format(new Date(Date.UTC(y, m - 1, d)));

                  return (
                    <div className="rounded-lg border border-outline-variant/60 bg-card p-3 shadow-elevation-3">
                      <p className="text-[11px] font-medium capitalize text-charcoal">
                        {fechaFormat}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <span
                          className="size-2 rounded-full"
                          style={{ backgroundColor: colorLinea }}
                        />
                        <span className="text-xs text-charcoal">
                          Patrimonio:
                        </span>
                        <span className="text-sm font-bold text-heading">
                          {formatMonto(punto.saldo * 100)}
                        </span>
                      </div>
                    </div>
                  );
                }}
              />

              <Area
                type="monotone"
                dataKey="saldo"
                stroke={colorLinea}
                strokeWidth={2.2}
                fill="url(#patrimonioGrad)"
                activeDot={{
                  r: 5,
                  fill: colorLinea,
                  stroke: "var(--card)",
                  strokeWidth: 2,
                }}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </div>
    </section>
  );
}
