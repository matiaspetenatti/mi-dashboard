import { Sun, CloudRain, Wind, Droplets, SunMedium } from "lucide-react";
import { WidgetCard } from "@/components/widget-card";
import { Skeleton } from "@/components/ui/skeleton";

export function ClimaWidgetSkeleton() {
  return (
    <WidgetCard
      title="Clima"
      href="/clima"
      icon={Sun}
      accent="secondary"
    >
      <div className="space-y-3">
        <Skeleton className="h-6 w-6 rounded-full bg-surface/60" />
        <Skeleton className="h-4 font-medium text-rose-300" />
        <div className="grid grid-cols-2 gap-2">
          <Skeleton className="h-6 w-full rounded-2xl bg-surface-container-high" />
          <Skeleton className="h-6 w-full rounded-2xl bg-surface-container-high" />
        </div>
        <Skeleton className="h-6 rounded-2xl bg-surface-container-high" />
      </div>
    </WidgetCard>
  );
}

export async function ClimaWidget() {
  const res = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=-33.14787323266141&longitude=-64.3562331031547&daily=temperature_2m_max,temperature_2m_min,weathercode,precipitation_probability_max&hourly=temperature_2m,relativehumidity_2m,apparent_temperature,precipitation_probability,windspeed_10m,uv_index&forecast_days=1&timezone=auto`,
    {
      next: { revalidate: 3600 },
    }
  );

  if (!res.ok) {
    throw new Error(`Error al obtener datos del clima: ${res.statusText}`);
  }

  const data = await res.json();

  return (
    <WidgetCard
      title="Clima"
      href="/clima"
      icon={Sun}
      accent="secondary"
    >
      <div className="space-y-3">
        {/* Información del día actual */}
        <div className="flex items-center gap-3">
          <Sun className="h-5 w-5 text-rose-400" />
          <div>
            <p className="text-xs font-medium text-on-surface-variant">Hoy</p>
            <p className="text-xl font-bold text-neutral-900">24°</p>
          </div>
        </div>

        {/* Métricas rápidas en tarjetas pastel */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          <div className="rounded-2xl bg-rose-50/60 p-2 text-xs">
            <div className="flex items-center gap-1.5">
              <Droplets className="h-3 w-3 text-rose-400" />
              <span className="text-neutral-500">Humedad</span>
            </div>
            <p className="text-neutral-700 font-medium">54%</p>
          </div>
          <div className="rounded-2xl bg-sky-50/60 p-2 text-xs">
            <div className="flex items-center gap-1.5">
              <CloudRain className="h-3 w-3 text-sky-400" />
              <span className="text-neutral-500">Lluvia</span>
            </div>
            <p className="text-neutral-700 font-medium">10%</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2">
          <div className="rounded-2xl bg-peach-50/60 p-2 text-xs">
            <div className="flex items-center gap-1.5">
              <Wind className="h-3 w-3 text-peach-400" />
              <span className="text-neutral-500">Viento</span>
            </div>
            <p className="text-neutral-700 font-medium">12 km/h</p>
          </div>
          <div className="rounded-2xl bg-sky-50/60 p-2 text-xs">
            <div className="flex items-center gap-1.5">
              <SunMedium className="h-3 w-3 text-sky-300" />
              <span className="text-neutral-500">UV</span>
            </div>
            <p className="text-neutral-700 font-medium">3</p>
          </div>
        </div>

        {/* Enlace a la página completa */}
        <div className="mt-3">
          <p className="text-xs text-on-surface-variant cursor-pointer hover:text-rose-500 transition-colors">
            Ver pronóstico completo
            <span className="ml-1">→</span>
          </p>
        </div>
      </div>
    </WidgetCard>
  );
}