"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CloudRain,
  Droplets,
  MapPin,
  Sun,
  SunMedium,
  Wind,
  type LucideIcon,
} from "lucide-react";
import { WidgetCard } from "@/components/widget-card";
import { Skeleton } from "@/components/ui/skeleton";
import type { ClimaResumen } from "./types";
import { getWeatherInfo } from "./clima-utils";

function Metrica({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-[12px] border border-outline-variant/60 bg-surface-bright px-2.5 py-2 text-[11px]">
      <span className="flex min-w-0 items-center gap-1.5 text-on-surface-variant">
        <Icon size={13} className={`shrink-0 ${color}`} />
        <span className="truncate">{label}</span>
      </span>
      <span className="shrink-0 font-bold text-heading">{value}</span>
    </div>
  );
}

export function ClimaWidgetSkeleton() {
  return (
    <WidgetCard
      title="Clima"
      subtitle="Cargando ubicación"
      href="/clima"
      icon={Sun}
      accent="secondary"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-11 w-24" />
          <Skeleton className="h-3.5 w-40" />
        </div>
        <Skeleton className="size-12 rounded-full" />
      </div>
      <div className="mt-auto grid grid-cols-2 gap-2 pt-4">
        <Skeleton className="h-9 w-full rounded-[12px]" />
        <Skeleton className="h-9 w-full rounded-[12px]" />
        <Skeleton className="h-9 w-full rounded-[12px]" />
        <Skeleton className="h-9 w-full rounded-[12px]" />
      </div>
    </WidgetCard>
  );
}

function ClimaWidgetError() {
  return (
    <WidgetCard
      title="Clima"
      subtitle="Sin conexión con el servicio"
      href="/clima"
      icon={Sun}
      accent="secondary"
    >
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

export function ClimaWidget() {
  const [resumen, setResumen] = useState<ClimaResumen | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelado = false;

    async function cargar() {
      try {
        const res = await fetch("/api/clima/resumen", {
          next: { tags: ["clima"] },
        });
        if (!res.ok) throw new Error("Error al cargar el clima");
        const data = (await res.json()) as ClimaResumen;
        if (!cancelado) setResumen(data);
      } catch {
        if (!cancelado) setError(true);
      }
    }

    cargar();
    return () => {
      cancelado = true;
    };
  }, []);

  if (error) return <ClimaWidgetError />;
  if (!resumen) return <ClimaWidgetSkeleton />;

  const { actual, etiqueta, max, min, probabilidadLluvia } = resumen;
  const weather = getWeatherInfo(actual.weather_code);
  const WeatherIcon = weather.icon;

  return (
    <WidgetCard
      title="Clima"
      subtitle={
        <>
          <MapPin size={12} className="shrink-0 text-primary" />
          <span className="truncate">{etiqueta}</span>
        </>
      }
      href="/clima"
      icon={Sun}
      accent="secondary"
      footer={
        <>
          <Link
            href="/clima"
            className="inline-flex items-center gap-1 font-bold text-primary transition-opacity hover:opacity-75"
          >
            Ver pronóstico completo →
          </Link>
          <span>Actualizado ahora</span>
        </>
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[45px] font-black leading-none tracking-tight text-heading md:text-[52px]">
            {Math.round(actual.temperature_2m)}°
          </p>
          <p className="mt-1 truncate text-xs text-charcoal">
            {weather.label} · Máx {Math.round(max)}° / Mín{" "}
            {Math.round(min)}°
          </p>
        </div>
        <span
          className={`grid size-12 shrink-0 place-items-center rounded-full bg-lime-voltage/20 ${weather.color}`}
        >
          <WeatherIcon size={24} />
        </span>
      </div>

      <div className="mt-auto grid grid-cols-2 gap-2 pt-4">
        <Metrica
          icon={Droplets}
          label="Humedad"
          value={`${Math.round(actual.relative_humidity_2m)}%`}
          color="text-chart-4"
        />
        <Metrica
          icon={CloudRain}
          label="Lluvia"
          value={`${Math.round(probabilidadLluvia)}%`}
          color="text-primary"
        />
        <Metrica
          icon={Wind}
          label="Viento"
          value={`${Math.round(actual.wind_speed_10m)} km/h`}
          color="text-secondary"
        />
        <Metrica
          icon={SunMedium}
          label="UV"
          value={`${Math.round(actual.uv_index)}`}
          color="text-warning"
        />
      </div>
    </WidgetCard>
  );
}
