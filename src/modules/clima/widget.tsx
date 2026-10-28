import {
  CloudRain,
  Droplets,
  MapPin,
  Sun,
  SunMedium,
  Wind,
} from "lucide-react";
import { WidgetCard } from "@/components/widget-card";
import { Skeleton } from "@/components/ui/skeleton";
import { getClimaResumen } from "./queries";
import { getWeatherInfo } from "./clima-utils";

export function ClimaWidgetSkeleton() {
  return (
    <WidgetCard title="Clima" href="/clima" icon={Sun} accent="secondary">
      <div className="space-y-3">
        <Skeleton className="h-6 w-6 rounded-full bg-surface/60" />
        <Skeleton className="h-4 w-32" />
        <div className="grid grid-cols-2 gap-2">
          <Skeleton className="h-6 w-full rounded-2xl bg-surface-container-high" />
          <Skeleton className="h-6 w-full rounded-2xl bg-surface-container-high" />
        </div>
        <Skeleton className="h-6 rounded-2xl bg-surface-container-high" />
      </div>
    </WidgetCard>
  );
}

function ClimaWidgetError() {
  return (
    <WidgetCard title="Clima" href="/clima" icon={Sun} accent="secondary">
      <div className="flex flex-1 flex-col justify-center gap-1 py-4 text-center">
        <CloudRain className="mx-auto h-6 w-6 text-primary" />
        <p className="text-sm font-medium text-on-surface">
          No se pudo cargar el clima
        </p>
        <p className="text-xs text-on-surface-variant">
          Entrá al módulo para reintentar.
        </p>
      </div>
    </WidgetCard>
  );
}

export async function ClimaWidget() {
  let resumen;

  try {
    resumen = await getClimaResumen();
  } catch (error) {
    console.error("No se pudo obtener el resumen del clima:", error);
    return <ClimaWidgetError />;
  }

  const { actual, etiqueta, max, min, probabilidadLluvia } = resumen;
  const weather = getWeatherInfo(actual.weather_code);
  const WeatherIcon = weather.icon;

  return (
    <WidgetCard title="Clima" href="/clima" icon={Sun} accent="secondary">
      <div className="flex flex-1 flex-col space-y-3">
        <p className="flex items-center gap-1 truncate text-xs text-on-surface-variant">
          <MapPin className="h-3 w-3 shrink-0 text-primary" />
          <span className="truncate">{etiqueta}</span>
        </p>

        <div className="flex items-center gap-3">
          <WeatherIcon className={`h-8 w-8 ${weather.color}`} />
          <div>
            <p className="text-2xl font-bold leading-none text-on-surface">
              {Math.round(actual.temperature_2m)}°
            </p>
            <p className="mt-1 text-xs text-on-surface-variant">
              {weather.label} · Máx {Math.round(max)}° / Mín {Math.round(min)}°
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="rounded-2xl bg-surface-container-high/60 p-2 text-xs">
            <div className="flex items-center gap-1.5">
              <Droplets className="h-3 w-3 text-chart-4" />
              <span className="text-on-surface-variant">Humedad</span>
            </div>
            <p className="font-semibold text-on-surface">
              {Math.round(actual.relative_humidity_2m)}%
            </p>
          </div>
          <div className="rounded-2xl bg-surface-container-high/60 p-2 text-xs">
            <div className="flex items-center gap-1.5">
              <CloudRain className="h-3 w-3 text-primary" />
              <span className="text-on-surface-variant">Lluvia</span>
            </div>
            <p className="font-semibold text-on-surface">
              {Math.round(probabilidadLluvia)}%
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-2xl bg-surface-container-high/60 p-2 text-xs">
            <div className="flex items-center gap-1.5">
              <Wind className="h-3 w-3 text-secondary" />
              <span className="text-on-surface-variant">Viento</span>
            </div>
            <p className="font-semibold text-on-surface">
              {Math.round(actual.wind_speed_10m)} km/h
            </p>
          </div>
          <div className="rounded-2xl bg-surface-container-high/60 p-2 text-xs">
            <div className="flex items-center gap-1.5">
              <SunMedium className="h-3 w-3 text-warning" />
              <span className="text-on-surface-variant">UV</span>
            </div>
            <p className="font-semibold text-on-surface">
              {Math.round(actual.uv_index)}
            </p>
          </div>
        </div>

        <p className="mt-auto pt-1 text-xs text-on-surface-variant">
          Ver pronóstico completo
          <span className="ml-1">→</span>
        </p>
      </div>
    </WidgetCard>
  );
}
