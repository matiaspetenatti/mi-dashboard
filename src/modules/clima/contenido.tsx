"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Clock, CloudRain, RefreshCw } from "lucide-react";
import { cn } from "cn";
import type { ClimaData, ClimaHora } from "./types";
import { formatDateLabel, getWeatherInfo } from "./clima-utils";
import { ClimaGraficoCombinado } from "./clima-grafico-combinado";
import { BentoClima } from "./components/bento-clima";
import { actualizarClima } from "./actions";
import { Button } from "@/components/ui/button";

const entero = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 });
const unDecimal = new Intl.NumberFormat("es-AR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

function numero(valor?: number | null, formato = entero): string {
  return valor === undefined || valor === null || !Number.isFinite(valor)
    ? "--"
    : formato.format(valor);
}

function grados(valor?: number | null): string {
  return `${numero(valor)}°`;
}

/** Colores del índice UV alineados con el medidor del bento. */
function claseUv(indice: number): string {
  if (indice >= 8) return "bg-error-container text-on-error-container";
  if (indice >= 3) return "bg-warning-container text-on-warning-container";
  return "bg-success-container text-on-success-container";
}

function buscarHora<T extends { fullTimeStr: string }>(
  items: T[],
  referencia: string,
): T | null {
  if (items.length === 0) return null;

  const prefijo = referencia.slice(0, 13);
  return (
    items.findLast((item) => item.fullTimeStr.slice(0, 13) <= prefijo) ??
    items[0]
  );
}

export function ClimaContenido({ data }: { data: ClimaData }) {
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [detalleAbierto, setDetalleAbierto] = useState(false);
  const [actualizando, setActualizando] = useState(false);
  const router = useRouter();

  const { daily, hourly, current } = data;

  const fechaActual = current.time.slice(0, 10);
  const horaActual = current.time.slice(11, 13);
  const indiceHoy = Math.max(daily.time.indexOf(fechaActual), 0);
  const esDiaActual = selectedDayIndex === indiceHoy;
  const selectedDateStr = daily.time[selectedDayIndex] ?? fechaActual;

  const hourlyItems = useMemo(
    () =>
      hourly.time
        .map((timeStr, index) => {
          const [datePart, timePart] = timeStr.split("T");
          return {
            datePart,
            timePart,
            fullTimeStr: timeStr,
            temperature: hourly.temperature_2m[index],
            humidity: hourly.relativehumidity_2m[index],
            dewpoint: hourly.dewpoint_2m[index],
            apparentTemperature: hourly.apparent_temperature[index],
            precipitationProb: hourly.precipitation_probability[index],
            precipitation: hourly.precipitation[index],
            pressure: hourly.pressure_msl[index],
            cloudcover: hourly.cloudcover[index],
            visibility: hourly.visibility[index],
            windSpeed: hourly.windspeed_10m[index],
            windDirection: hourly.winddirection_10m[index],
            windGusts: hourly.windgusts_10m[index],
            uvIndex: hourly.uv_index[index],
          };
        })
        .filter((item) => item.datePart === selectedDateStr),
    [hourly, selectedDateStr],
  );

  // Hoy mostramos la hora en curso; los días futuros, el mediodía.
  const referenciaHora = esDiaActual
    ? `${selectedDateStr}T${horaActual}:00`
    : `${selectedDateStr}T12:00`;
  const dayData: ClimaHora | null = buscarHora(hourlyItems, referenciaHora);
  const horaReferencia =
    dayData?.timePart ?? (esDiaActual ? `${horaActual}:00` : "12:00");

  async function manejarActualizar() {
    setActualizando(true);
    const resultado = await actualizarClima();
    setActualizando(false);
    if (resultado.ok) {
      router.refresh();
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-end">
        <Button
          type="button"
          onClick={manejarActualizar}
          disabled={actualizando}
          size="sm"
          variant="outlined"
          className="border-primary text-primary hover:bg-primary/10 hover:text-primary"
        >
          {actualizando ? (
            <RefreshCw size={14} className="animate-spin" />
          ) : (
            <RefreshCw size={14} />
          )}
          <span className="ml-1.5 text-[11px] font-semibold">
            {actualizando ? "Actualizando…" : "Actualizar"}
          </span>
        </Button>
      </div>

      <BentoClima
        data={data}
        selectedDayIndex={selectedDayIndex}
        dayData={dayData}
        esDiaActual={esDiaActual}
        horaReferencia={horaReferencia}
      />

      {/* Selector de día: control principal, justo debajo del resumen. */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-on-surface">
              Pronóstico por día
            </h2>
            <p className="text-xs text-on-surface-variant">
              Elegí un día para actualizar el resumen y el detalle por hora.
            </p>
          </div>
          <span className="rounded-full bg-surface-container-high px-2.5 py-1 text-[11px] font-medium text-on-surface-variant">
            {daily.time.length} días
          </span>
        </div>

        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {daily.time.map((dateStr, index) => {
            const weather = getWeatherInfo(daily.weathercode[index]);
            const DayIcon = weather.icon;
            const isSelected = selectedDayIndex === index;

            return (
              <button
                key={dateStr}
                type="button"
                aria-pressed={isSelected}
                onClick={() => setSelectedDayIndex(index)}
                className={cn(
                  "flex w-24 shrink-0 snap-start flex-col gap-2 rounded-xl border p-2.5 text-left transition-colors",
                  isSelected
                    ? "border-primary bg-primary-container text-on-primary-container shadow-elevation-1"
                    : "border-outline-variant/40 bg-card text-charcoal hover:border-outline-variant hover:bg-surface-container",
                )}
              >
                <div className="flex w-full items-start justify-between gap-1">
                  <span
                    className={cn(
                      "text-[11px] font-semibold",
                      isSelected ? "text-on-primary-container" : "text-charcoal",
                    )}
                  >
                    {index === indiceHoy
                      ? "Hoy"
                      : formatDateLabel(dateStr).split(",")[0]}
                  </span>
                  <span
                    className={cn(
                      "text-[10px] tabular-nums",
                      isSelected
                        ? "text-on-primary-container/70"
                        : "text-pebble",
                    )}
                  >
                    {dateStr.split("-").slice(1).join("/")}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-1">
                  <DayIcon
                    aria-hidden="true"
                    className={cn(
                      "size-5 shrink-0",
                      isSelected ? "text-on-primary-container" : weather.color,
                    )}
                  />
                  <div className="text-right leading-tight">
                    <div
                      className={cn(
                        "text-sm font-semibold tabular-nums",
                        isSelected ? "text-on-primary-container" : "text-charcoal",
                      )}
                    >
                      {grados(daily.temperature_2m_max[index])}
                    </div>
                    <div
                      className={cn(
                        "text-[11px] tabular-nums",
                        isSelected
                          ? "text-on-primary-container/70"
                          : "text-on-surface-variant",
                      )}
                    >
                      {grados(daily.temperature_2m_min[index])}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <ClimaGraficoCombinado
        data={data}
        selectedIndex={selectedDayIndex}
        onSelectDay={setSelectedDayIndex}
      />

      {/* Detalle por hora del día seleccionado: cerrado por defecto. */}
      <section className="space-y-3">
        <button
          type="button"
          onClick={() => setDetalleAbierto((valor) => !valor)}
          aria-expanded={detalleAbierto}
          aria-controls="detalle-hora-clima"
          className="flex w-full items-center gap-3 rounded-2xl border border-outline-variant/40 bg-card px-4 py-3 text-left shadow-elevation-1 transition-shadow hover:shadow-elevation-2 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary-container text-on-primary-container">
            <Clock size={15} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-lg font-semibold tracking-tight text-charcoal">
              Detalle por hora
            </span>
            <span className="block text-xs text-on-surface-variant">
              {formatDateLabel(selectedDateStr)}
              <span aria-hidden="true"> · </span>
              <span className="tabular-nums">
                {hourlyItems.length} h
              </span>
              <span aria-hidden="true"> · </span>
              <span className="font-medium text-on-surface">
                {esDiaActual ? "ahora" : "mediodía"}{" "}
                {grados(dayData?.temperature)}
              </span>
            </span>
          </span>
          <ChevronDown
            aria-hidden="true"
            className={cn(
              "size-4 shrink-0 text-on-surface-variant transition-transform",
              detalleAbierto && "rotate-180",
            )}
          />
        </button>

        <div
          id="detalle-hora-clima"
          className={cn(
            "overflow-hidden rounded-2xl border border-outline-variant/40 bg-card shadow-elevation-1",
            !detalleAbierto && "hidden",
          )}
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-outline-variant/40 bg-surface-container-low text-[10px] font-semibold uppercase tracking-[0.12em] text-on-surface-variant">
                  <th className="px-4 py-3">Hora</th>
                  <th className="px-4 py-3">Temp</th>
                  <th className="px-4 py-3">Sensación</th>
                  <th className="px-4 py-3">Lluvia</th>
                  <th className="px-4 py-3">Viento</th>
                  <th className="px-4 py-3">Humedad</th>
                  <th className="px-4 py-3">Índice UV</th>
                </tr>
              </thead>
              <tbody>
                {hourlyItems.map((item) => {
                  const esHoraActual =
                    esDiaActual &&
                    item.fullTimeStr.slice(0, 13) ===
                      `${fechaActual}T${horaActual}`;

                  return (
                    <tr
                      key={item.fullTimeStr}
                      className={cn(
                        "border-b border-outline-variant/20 transition-colors last:border-0",
                        esHoraActual
                          ? "bg-primary-container/25 hover:bg-primary-container/30"
                          : "hover:bg-surface-container/60",
                      )}
                    >
                      <td className="flex items-center gap-1.5 px-4 py-2.5 font-medium text-on-surface">
                        <Clock
                          size={13}
                          aria-hidden="true"
                          className="text-on-surface-variant"
                        />
                        {item.timePart} hs
                        {esHoraActual && (
                          <span className="rounded-full bg-primary-container px-1.5 py-0.5 text-[10px] font-semibold text-on-primary-container">
                            Ahora
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 font-semibold tabular-nums text-on-surface">
                        {grados(item.temperature)}
                      </td>
                      <td className="px-4 py-2.5 tabular-nums text-on-surface-variant">
                        {grados(item.apparentTemperature)}
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium tabular-nums",
                            item.precipitationProb >= 30
                              ? "bg-secondary-container text-on-secondary-container"
                              : "bg-surface-container text-on-surface-variant",
                          )}
                        >
                          <CloudRain size={11} aria-hidden="true" />
                          {numero(item.precipitationProb)}%
                        </span>
                      </td>
                      <td className="px-4 py-2.5 tabular-nums text-on-surface-variant">
                        {numero(item.windSpeed)} km/h
                      </td>
                      <td className="px-4 py-2.5 tabular-nums text-on-surface-variant">
                        {numero(item.humidity)}%
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className={cn(
                            "inline-block rounded-md px-2 py-0.5 text-[11px] font-semibold tabular-nums",
                            claseUv(item.uvIndex),
                          )}
                        >
                          {numero(item.uvIndex, unDecimal)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}

export function ClimaSkeleton() {
  return (
    <div className="animate-pulse space-y-8">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <div className="col-span-2 min-h-[252px] rounded-2xl bg-surface-container-high lg:row-span-2" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="min-h-[136px] rounded-2xl bg-surface-container-high"
          />
        ))}
        <div className="col-span-2 h-24 rounded-2xl bg-surface-container-high lg:col-span-4" />
      </div>
      <div className="flex gap-2 overflow-hidden">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="h-[76px] w-24 shrink-0 rounded-xl bg-surface-container-high"
          />
        ))}
      </div>
      <div className="h-96 rounded-2xl bg-surface-container-high" />
      <div className="h-[72px] rounded-2xl bg-surface-container-high" />
    </div>
  );
}
