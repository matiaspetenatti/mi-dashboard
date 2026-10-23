"use client";

import { useState, useMemo } from "react";
import {
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
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
    color: "#10b981",
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
  const strokeColor = esPositivo ? "#059669" : "#dc2626";

  const yDomain = useMemo(() => {
    const { min, max } = stats;
    const spread = max - min;
    const padding = spread > 0 ? spread * 0.15 : (max > 0 ? max * 0.15 : 1000);
    const bottom = Math.max(0, Math.floor(min - padding));
    const top = Math.ceil(max + padding);
    return [bottom, top];
  }, [stats]);

  return (
    <div className="rounded-xl border bg-white p-5 shadow-xs transition">
      {/* Encabezado: Título y Selector de Rango */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <TrendingUp size={15} />
            </div>
            <h3 className="text-base font-semibold text-neutral-900">
              Evolución del Patrimonio
            </h3>
          </div>
          <p className="mt-0.5 text-xs text-neutral-500">
            Seguimiento histórico de tu saldo acumulado en todas las cuentas
          </p>
        </div>

        {/* Selector de Rango (1M, 3M, 6M, 1A) */}
        <div className="inline-flex rounded-lg border border-neutral-200 bg-neutral-50 p-1 self-start sm:self-auto">
          {rangos.map((r) => {
            const activo = rango === r.id;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => setRango(r.id)}
                className={`rounded-md px-3 py-1 text-xs font-medium transition ${
                  activo
                    ? "bg-white text-neutral-900 shadow-xs"
                    : "text-neutral-500 hover:text-neutral-900"
                }`}
              >
                {r.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Métricas destacadas del periodo */}
      <div className="mt-4 flex flex-wrap items-baseline gap-4 sm:gap-6">
        <div>
          <span className="text-[11px] font-medium text-neutral-500">
            Patrimonio al día de hoy
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-neutral-900">
              {formatMonto(stats.actual * 100)}
            </span>
          </div>
        </div>

        <div className="border-l border-neutral-200 pl-4 sm:pl-6">
          <span className="text-[11px] font-medium text-neutral-500">
            Variación en {rangos.find((r) => r.id === rango)?.label}
          </span>
          <div className="flex items-center gap-1.5">
            <span
              className={`inline-flex items-center gap-0.5 text-sm font-semibold ${
                esPositivo ? "text-emerald-600" : "text-red-600"
              }`}
            >
              {esPositivo ? (
                <ArrowUpRight size={15} />
              ) : (
                <ArrowDownRight size={15} />
              )}
              {esPositivo ? "+ " : "− "}
              {formatMonto(Math.abs(stats.diferencia) * 100)}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                esPositivo
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {esPositivo ? "+" : ""}
              {stats.porcentaje}%
            </span>
          </div>
        </div>

        <div className="hidden sm:block border-l border-neutral-200 pl-6 text-xs text-neutral-500">
          <div>
            <span className="text-neutral-400">Mínimo: </span>
            <span className="font-medium text-neutral-700">
              {formatMonto(stats.min * 100)}
            </span>
          </div>
          <div>
            <span className="text-neutral-400">Máximo: </span>
            <span className="font-medium text-neutral-700">
              {formatMonto(stats.max * 100)}
            </span>
          </div>
        </div>
      </div>

      {/* Gráfico ReCharts usando Shadcn Chart Container */}
      <div className="mt-4 pt-2">
        <ChartContainer config={chartConfig} className="h-64 w-full">
          <AreaChart
            data={datosFiltrados}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="patrimonioGrad" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor={esPositivo ? "#10b981" : "#ef4444"}
                  stopOpacity={0.35}
                />
                <stop
                  offset="95%"
                  stopColor={esPositivo ? "#10b981" : "#ef4444"}
                  stopOpacity={0.0}
                />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="oklch(0.92 0 0)"
              className="stroke-neutral-200/60"
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
              className="text-[11px] text-neutral-400"
            />

            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              domain={yDomain}
              tickFormatter={(value: number) => formatMontoCompacto(value)}
              className="text-[11px] text-neutral-400"
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
                  <div className="rounded-xl border border-neutral-200 bg-white p-3 shadow-lg">
                    <p className="text-[11px] font-medium text-neutral-500 capitalize">
                      {fechaFormat}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      <span className="text-xs text-neutral-600">Patrimonio:</span>
                      <span className="text-sm font-bold text-neutral-900">
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
              stroke={strokeColor}
              strokeWidth={2.2}
              fill="url(#patrimonioGrad)"
              activeDot={{
                r: 5,
                fill: strokeColor,
                stroke: "#ffffff",
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ChartContainer>
      </div>
    </div>
  );
}
