import type { LucideIcon } from "lucide-react";
import {
  ArrowUp,
  Cloud,
  CloudRain,
  Droplets,
  Eye,
  Gauge,
  SunMedium,
  Wind,
} from "lucide-react";
import { cn } from "cn";
import type { ClimaData, ClimaHora } from "../types";
import {
  formatDateLabel,
  formatVisibility,
  getWeatherInfo,
  nivelUv,
  UV_COLORS,
  posicionEnRango,
  rotacionViento,
  windDirectionCardinal,
} from "../clima-utils";

const entero = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 });
const decimal = new Intl.NumberFormat("es-AR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

function numero(valor?: number | null, formato = entero): string {
  return valor === undefined || valor === null || !Number.isFinite(valor)
    ? "--"
    : formato.format(valor);
}

function temperatura(valor?: number | null): string {
  return valor === undefined || valor === null || !Number.isFinite(valor)
    ? "--"
    : `${entero.format(valor)}°`;
}

function capitalizar(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function TarjetaMetrica({
  etiqueta,
  icono: Icono,
  children,
}: {
  etiqueta: string;
  icono: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <article className="flex min-h-[136px] flex-col rounded-2xl border border-outline-variant/40 bg-card p-4 shadow-elevation-1 transition-shadow hover:shadow-elevation-2">
      <div className="flex items-center gap-2">
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-surface-container-high text-on-surface-variant">
          <Icono size={15} />
        </span>
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
          {etiqueta}
        </h3>
      </div>
      <div className="mt-auto pt-3">{children}</div>
    </article>
  );
}

export function BentoClima({
  data,
  selectedDayIndex,
  dayData,
  esDiaActual,
  horaReferencia,
}: {
  data: ClimaData;
  selectedDayIndex: number;
  dayData: ClimaHora | null;
  esDiaActual: boolean;
  horaReferencia: string;
}) {
  const { daily } = data;
  const fecha = daily.time[selectedDayIndex] ?? daily.time[0];
  const maxima = daily.temperature_2m_max[selectedDayIndex];
  const minima = daily.temperature_2m_min[selectedDayIndex];
  const weather = getWeatherInfo(daily.weathercode[selectedDayIndex] ?? 0);
  const WeatherIcon = weather.icon;

  const uv = nivelUv(dayData?.uvIndex);
  const porcentajeLluvia = dayData
    ? Math.min(100, Math.max(0, dayData.precipitationProb))
    : 0;
  const posicionTemperatura = posicionEnRango(
    dayData?.temperature,
    minima,
    maxima,
  );
  const direccionViento = dayData
    ? windDirectionCardinal(dayData.windDirection)
    : "--";

  const atmosfera = [
    {
      label: "Presión",
      icono: Gauge,
      valor: `${numero(dayData?.pressure)} hPa`,
    },
    {
      label: "Visibilidad",
      icono: Eye,
      valor: formatVisibility(dayData?.visibility),
    },
    {
      label: "Nubosidad",
      icono: Cloud,
      valor: `${numero(dayData?.cloudcover)}%`,
    },
  ];

  return (
    <section
      aria-label="Condiciones del día"
      className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4"
    >
      {/* Héroe: lo primero que se lee es la temperatura y el estado del cielo. */}
      <article className="relative col-span-2 flex min-h-[252px] flex-col overflow-hidden rounded-2xl border border-transparent bg-primary-container p-5 text-on-primary-container shadow-elevation-2 sm:p-6 lg:row-span-2">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-14 -top-14 size-48 rounded-full bg-white/30 blur-3xl dark:bg-white/10"
        />

        <header className="relative flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-on-primary-container/80">
              {esDiaActual ? "Ahora" : capitalizar(formatDateLabel(fecha))}
            </p>
            <p className="mt-1 text-sm font-medium">{weather.label}</p>
          </div>
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white/60 dark:bg-white/10">
            <WeatherIcon size={26} strokeWidth={1.7} />
          </span>
        </header>

        <div className="relative mt-auto pt-6">
          <div className="flex items-end gap-1">
            <span className="text-6xl font-medium leading-none tracking-[-0.03em] tabular-nums sm:text-7xl">
              {numero(dayData?.temperature)}
            </span>
            <span className="pb-1.5 text-2xl font-medium sm:pb-2">°</span>
            <span className="pb-2 pl-1 text-xs font-medium text-on-primary-container/80 sm:pl-2 sm:text-sm">
              Sensación {temperatura(dayData?.apparentTemperature)}
            </span>
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between gap-2 text-[10px] font-medium sm:text-[11px]">
              <span>Mín {temperatura(minima)}</span>
              <span className="text-on-primary-container/80">
                {esDiaActual ? `Actualizado ${horaReferencia}` : "Mediodía"}
              </span>
              <span>Máx {temperatura(maxima)}</span>
            </div>
            <div className="relative mt-2 h-2 rounded-full bg-on-primary-container/15">
              <div
                aria-hidden="true"
                className="absolute inset-0 rounded-full bg-gradient-to-r from-chart-4 to-chart-3"
              />
              {dayData && (
                <span
                  aria-hidden="true"
                  className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-on-primary-container ring-2 ring-primary-container"
                  style={{ left: `${posicionTemperatura}%` }}
                />
              )}
            </div>
          </div>
        </div>
      </article>

      <TarjetaMetrica etiqueta="Viento" icono={Wind}>
        <div className="flex items-end justify-between gap-1">
          <div className="min-w-0">
            <p className="text-xl font-semibold tracking-tight text-charcoal tabular-nums sm:text-2xl">
              {numero(dayData?.windSpeed)}{" "}
              <span className="text-xs font-medium text-on-surface-variant">
                km/h
              </span>
            </p>
            <p className="mt-1 truncate text-xs text-on-surface-variant">
              {dayData ? `desde el ${direccionViento}` : "Sin datos"}
            </p>
            <p className="text-[11px] text-on-surface-variant">
              Ráfagas {numero(dayData?.windGusts)} km/h
            </p>
          </div>
          <span
            aria-hidden="true"
            className="grid size-8 shrink-0 place-items-center rounded-full border border-outline-variant/60 text-primary"
          >
            <ArrowUp
              size={17}
              className="transition-transform duration-300"
              style={{ transform: `rotate(${rotacionViento(dayData?.windDirection)}deg)` }}
            />
          </span>
        </div>
      </TarjetaMetrica>

      <TarjetaMetrica etiqueta="Índice UV" icono={SunMedium}>
        <p className="text-2xl font-semibold tracking-tight text-charcoal tabular-nums">
          {numero(dayData?.uvIndex)}
        </p>
        <p className={cn("mt-0.5 text-xs font-medium", uv.texto)}>
          {uv.label}
        </p>
        <div aria-hidden="true" className="mt-2 grid grid-cols-5 gap-1">
          {Array.from({ length: 5 }).map((_, indice) => {
            const nivelSegmento = indice + 1;
            const estaLlenado = nivelSegmento <= uv.nivel;
            return (
              <span
                key={indice}
                className={cn(
                  "h-1.5 rounded-full transition-colors",
                  estaLlenado ? UV_COLORS[nivelSegmento].barra : "bg-surface-container-high",
                )}
              />
            );
          })}
        </div>
      </TarjetaMetrica>

      <TarjetaMetrica etiqueta="Humedad" icono={Droplets}>
        <p className="text-2xl font-semibold tracking-tight text-charcoal tabular-nums">
          {numero(dayData?.humidity)}
          <span className="text-xs font-medium text-on-surface-variant">%</span>
        </p>
        <p className="mt-1 text-xs text-on-surface-variant">
          Rocío {temperatura(dayData?.dewpoint)}
        </p>
      </TarjetaMetrica>

      <TarjetaMetrica etiqueta="Lluvia" icono={CloudRain}>
        <p className="text-2xl font-semibold tracking-tight text-charcoal tabular-nums">
          {numero(dayData?.precipitationProb)}
          <span className="text-xs font-medium text-on-surface-variant">%</span>
        </p>
        <div
          aria-hidden="true"
          className="mt-2 h-2 overflow-hidden rounded-full bg-surface-container-high"
        >
          <div
            className="h-full rounded-full bg-primary"
            style={{ width: `${porcentajeLluvia}%` }}
          />
        </div>
        <p className="mt-1.5 text-[11px] text-on-surface-variant">
          {numero(dayData?.precipitation, decimal)} mm previstos
        </p>
      </TarjetaMetrica>

      {/* Franja de atmósfera: datos de contexto, con menor jerarquía. */}
      <article className="col-span-2 rounded-2xl border border-outline-variant/40 bg-surface-container-low p-4 lg:col-span-4">
        <div className="grid grid-cols-3 divide-x divide-outline-variant/50">
          {atmosfera.map(({ label, icono: Icono, valor }, indice) => (
            <div
              key={label}
              className={cn(
                indice === 0 && "pr-2 sm:pr-3",
                indice === 1 && "px-2 sm:px-3",
                indice === 2 && "pl-2 sm:pl-3",
              )}
            >
              <div className="flex flex-col gap-1 text-on-surface-variant sm:flex-row sm:items-center sm:gap-1.5">
                <Icono size={13} className="shrink-0" />
                <span className="text-[9px] font-semibold uppercase leading-tight tracking-[0.1em] sm:truncate sm:text-[10px] sm:tracking-[0.14em]">
                  {label}
                </span>
              </div>
              <p className="mt-1 text-base font-semibold text-charcoal tabular-nums sm:text-lg">
                {valor}
              </p>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
