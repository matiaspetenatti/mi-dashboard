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
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";
import type { ClimaData } from "./types";
import { formatDateLabel, formatDiaCorto, getWeatherInfo } from "./clima-utils";

const DIAS_MOBILE = 7;
const DIAS_DESKTOP = 16;

export function ClimaGraficoCombinado({
  data,
  selectedIndex,
  onSelectDay,
}: {
  data: ClimaData;
  selectedIndex: number;
  onSelectDay: (index: number) => void;
}) {
  const { daily } = data;
  const esDesktop = useMediaQuery("(min-width: 640px)");
  const [ventana, setVentana] = useState({ seleccion: 0, offset: 0 });

  const tamanio = esDesktop ? DIAS_DESKTOP : DIAS_MOBILE;
  const maxInicio = Math.max(0, daily.time.length - tamanio);

  // La ventana se centra en el día seleccionado. El offset guarda cuántos días
  // se corrió con las flechas; si cambia la selección (por ejemplo desde las
  // tarjetas de abajo), volvemos a centrar en el día elegido.
  const offset = ventana.seleccion === selectedIndex ? ventana.offset : 0;
  const centro = Math.max(
    0,
    Math.min(selectedIndex - Math.floor(tamanio / 2), maxInicio),
  );
  const inicioVisible = esDesktop
    ? 0
    : Math.max(0, Math.min(centro + offset, maxInicio));

  const chartData = useMemo(
    () =>
      daily.time.map((dateStr, index) => {
        const weather = getWeatherInfo(daily.weathercode[index]);
        return {
          index,
          dateStr,
          label: formatDateLabel(dateStr),
          shortLabel: index === 0 ? "Hoy" : formatDiaCorto(dateStr),
          maxTemp: daily.temperature_2m_max[index],
          minTemp: daily.temperature_2m_min[index],
          precipitation: daily.precipitation_probability_max[index] ?? 0,
          weatherLabel: weather.label,
        };
      }),
    [daily],
  );

  const datosVisibles = useMemo(
    () => chartData.slice(inicioVisible, inicioVisible + tamanio),
    [chartData, inicioVisible, tamanio],
  );

  const { tempDomain } = useMemo(() => {
    if (datosVisibles.length === 0) {
      return { tempDomain: [0, 30] };
    }

    const maximos = datosVisibles.map((dia) => dia.maxTemp);
    const minimos = datosVisibles.map((dia) => dia.minTemp);
    const menor = Math.min(...minimos);
    const mayor = Math.max(...maximos);
    return {
      tempDomain: [Math.floor(menor - 3), Math.ceil(mayor + 3)],
    };
  }, [datosVisibles]);

  function moverVentana(paso: number) {
    setVentana({ seleccion: selectedIndex, offset: offset + paso });
  }

  /** Mantiene la ventana actual cuando se elige un día visible del gráfico. */
  function seleccionar(index: number) {
    if (!esDesktop) {
      const nuevoCentro = Math.max(
        0,
        Math.min(index - Math.floor(tamanio / 2), maxInicio),
      );
      setVentana({
        seleccion: index,
        offset: inicioVisible - nuevoCentro,
      });
    }
    onSelectDay(index);
  }

  const primerDia = chartData[inicioVisible];
  const ultimoDia = chartData[inicioVisible + tamanio - 1];

  return (
    <div className="space-y-4 rounded-3xl border border-outline-variant/40 bg-surface-container-low p-4 shadow-elevation-1 sm:p-6">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
        <div>
          <h3 className="text-lg font-semibold tracking-tight text-on-surface">
            {esDesktop
              ? "Evolución de temperaturas y lluvia (16 días)"
              : "Evolución de temperaturas y lluvia (7 días)"}
          </h3>
          <p className="text-xs text-on-surface-variant">
            Tocá un día del gráfico o usá las tarjetas para ver el detalle por
            hora.
          </p>
        </div>

        {!esDesktop && (
          <div className="flex items-center gap-1 self-start rounded-full bg-surface-container-lowest p-1 shadow-sm">
            <button
              type="button"
              aria-label="Ver días anteriores"
              onClick={() => moverVentana(-DIAS_MOBILE)}
              disabled={inicioVisible === 0}
              className="grid size-7 place-items-center rounded-full text-on-surface-variant transition-colors hover:bg-on-surface/5 disabled:opacity-30"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="min-w-24 px-1 text-center text-[11px] font-medium text-on-surface-variant">
              {primerDia && ultimoDia
                ? `${primerDia.shortLabel} – ${ultimoDia.shortLabel}`
                : ""}
            </span>
            <button
              type="button"
              aria-label="Ver días siguientes"
              onClick={() => moverVentana(DIAS_MOBILE)}
              disabled={inicioVisible >= maxInicio}
              className="grid size-7 place-items-center rounded-full text-on-surface-variant transition-colors hover:bg-on-surface/5 disabled:opacity-30"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium text-on-surface-variant">
        <div className="flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: "var(--chart-3)" }}
          />{" "}
          Máxima (°C)
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: "var(--chart-4)" }}
          />{" "}
          Mínima (°C)
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: "var(--chart-1)" }}
          />{" "}
          Prob. lluvia (%)
        </div>
      </div>

      <div className="relative h-[320px] w-full min-w-0 sm:h-[360px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={datosVisibles}
            onClick={(estado) => {
              if (estado.activeTooltipIndex === undefined) return;
              const local = Number(estado.activeTooltipIndex);
              if (!Number.isFinite(local)) return;
              const dia = datosVisibles[local];
              if (dia) seleccionar(dia.index);
            }}
            margin={{
              top: 16,
              right: esDesktop ? 8 : 0,
              left: esDesktop ? 0 : -12,
              bottom: 8,
            }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--outline-variant)"
              strokeOpacity={0.5}
              vertical={false}
            />
            <XAxis
              dataKey="shortLabel"
              stroke="var(--outline-variant)"
              tickLine={false}
              axisLine={{ stroke: "var(--outline-variant)" }}
              interval={0}
              tick={{ fontSize: 11, fill: "var(--on-surface-variant)" }}
            />
            <YAxis
              yAxisId="temp"
              stroke="var(--outline-variant)"
              fontSize={12}
              domain={tempDomain}
              tickLine={false}
              axisLine={false}
              width={44}
              unit="°C"
              tick={{ fontSize: 12, fill: "var(--on-surface-variant)" }}
            />
            {esDesktop ? (
              <YAxis
                yAxisId="rain"
                orientation="right"
                stroke="var(--outline-variant)"
                fontSize={12}
                domain={[0, 100]}
                tickLine={false}
                axisLine={false}
                unit="%"
                tick={{ fontSize: 12, fill: "var(--on-surface-variant)" }}
              />
            ) : (
              <YAxis yAxisId="rain" hide domain={[0, 100]} />
            )}
            <Tooltip
              cursor={{ fill: "var(--primary-container)", fillOpacity: 0.3 }}
              content={({ active, payload }) => {
                if (!active || !payload || payload.length === 0) return null;

                const dia = payload[0].payload as (typeof chartData)[number];

                return (
                  <div className="space-y-1 rounded-xl border border-outline-variant/40 bg-surface-container-lowest/95 p-3 text-xs shadow-elevation-2 backdrop-blur-md">
                    <p className="mb-1 border-b border-outline-variant/40 pb-1 font-semibold text-on-surface">
                      {dia.label} {dia.index === 0 ? "(Hoy)" : ""}
                    </p>
                    <p
                      className="font-medium"
                      style={{ color: "var(--chart-3)" }}
                    >
                      Temp. máx: <strong>{dia.maxTemp}°C</strong>
                    </p>
                    <p
                      className="font-medium"
                      style={{ color: "var(--chart-4)" }}
                    >
                      Temp. mín: <strong>{dia.minTemp}°C</strong>
                    </p>
                    <p
                      className="font-medium"
                      style={{ color: "var(--chart-1)" }}
                    >
                      Prob. lluvia: <strong>{dia.precipitation}%</strong>
                    </p>
                    <p className="pt-0.5 italic text-on-surface-variant">
                      {dia.weatherLabel}
                    </p>
                  </div>
                );
              }}
            />
            <Bar
              yAxisId="rain"
              dataKey="precipitation"
              name="Prob. lluvia"
              fill="var(--chart-1)"
              radius={[4, 4, 0, 0]}
              opacity={0.35}
            />
            <Line
              yAxisId="temp"
              type="monotone"
              dataKey="maxTemp"
              name="Máxima"
              stroke="var(--chart-3)"
              strokeWidth={3}
              dot={{ r: 4, fill: "var(--chart-3)", cursor: "pointer" }}
              activeDot={{
                r: 7,
                stroke: "var(--surface-container-low)",
                strokeWidth: 2,
              }}
            />
            <Line
              yAxisId="temp"
              type="monotone"
              dataKey="minTemp"
              name="Mínima"
              stroke="var(--chart-4)"
              strokeWidth={3}
              dot={{ r: 4, fill: "var(--chart-4)", cursor: "pointer" }}
              activeDot={{
                r: 7,
                stroke: "var(--surface-container-low)",
                strokeWidth: 2,
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 border-t border-outline-variant/20 pt-2">
        <span className="text-xs text-on-surface-variant">
          Día seleccionado actualmente:
        </span>
        <span className="rounded-full bg-primary-container px-2.5 py-1 text-xs font-semibold text-on-primary-container">
          {formatDateLabel(daily.time[selectedIndex])}{" "}
          {selectedIndex === 0 ? "(Hoy)" : ""}
        </span>
      </div>
    </div>
  );
}
