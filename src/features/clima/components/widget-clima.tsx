import { Link } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import {
  Cloud,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSun,
  Droplets,
  MapPin,
  Moon,
  Snowflake,
  Sun,
  Wind,
} from "lucide-react"

import { WidgetCard } from "@/components/organisms/widget-card"
import { WidgetError, WidgetLoading } from "@/components/molecules/widget-states"
import { resumenClimaQuery } from "@/features/clima/api"
import type { IconoClima } from "@/features/clima/lib/weather"

const ICONOS: Partial<Record<IconoClima, typeof Sun>> = {
  sol: Sun,
  luna: Moon,
  parcial: CloudSun,
  nublado: Cloud,
  lluvia: CloudRain,
  tormenta: CloudLightning,
  nieve: Snowflake,
  niebla: CloudFog,
}

export function WidgetClima() {
  const { data, isPending, isError } = useQuery(resumenClimaQuery)

  return (
    <WidgetCard
      title="Clima"
      subtitle={
        data && !data.needsLocation ? data.ubicacion.etiqueta : "Tu ubicación"
      }
      href="/clima"
      icon={CloudSun}
      accent="secondary"
      footer={
        <>
          <span>Open-Meteo</span>
          <span>{data && !data.needsLocation ? "Actualizado ahora" : "Sin datos"}</span>
        </>
      }
    >
      {isPending ? <WidgetLoading /> : null}

      {isError ? (
        <WidgetError message="No se pudo obtener el clima." />
      ) : null}

      {data?.needsLocation ? (
        <div className="flex flex-1 flex-col items-start justify-center gap-3 rounded-2xl bg-surface-container-low p-4">
          <MapPin className="size-5 text-secondary" aria-hidden="true" />
          <p className="text-xs font-semibold text-on-surface-variant">
            Guardá una ubicación para ver el clima actual y el pronóstico.
          </p>
          <Link
            to="/clima"
            className="text-xs font-bold text-heading underline underline-offset-4"
          >
            Configurar ubicación
          </Link>
        </div>
      ) : null}

      {data && !data.needsLocation ? (
        <div className="flex flex-1 flex-col">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="tabular text-display text-5xl leading-none text-heading">
                {data.actual.temperatura}°
              </p>
              <p className="mt-2 text-xs font-semibold text-on-surface-variant">
                {data.actual.descripcion} · Máx {data.max}° / Mín {data.min}°
              </p>
            </div>
            <span className="flex size-12 items-center justify-center rounded-full bg-linen-mist text-forest-ink dark:bg-primary-container dark:text-lime-voltage">
              {(() => {
                const Icon = ICONOS[data.actual.icono] ?? CloudSun
                return <Icon className="size-6" aria-hidden="true" />
              })()}
            </span>
          </div>

          <div className="mt-auto grid grid-cols-4 gap-2 pt-4">
            <div className="rounded-xl bg-surface-container-low p-2 text-center">
              <Droplets className="mx-auto size-3.5 text-secondary" aria-hidden="true" />
              <p className="tabular mt-1 text-[11px] font-bold text-heading">
                {data.actual.humedad}%
              </p>
              <p className="text-[9px] text-muted-foreground">Humedad</p>
            </div>
            <div className="rounded-xl bg-surface-container-low p-2 text-center">
              <CloudRain className="mx-auto size-3.5 text-secondary" aria-hidden="true" />
              <p className="tabular mt-1 text-[11px] font-bold text-heading">
                {data.probLluvia}%
              </p>
              <p className="text-[9px] text-muted-foreground">Lluvia</p>
            </div>
            <div className="rounded-xl bg-surface-container-low p-2 text-center">
              <Wind className="mx-auto size-3.5 text-secondary" aria-hidden="true" />
              <p className="tabular mt-1 text-[11px] font-bold text-heading">
                {data.actual.viento}
              </p>
              <p className="text-[9px] text-muted-foreground">km/h</p>
            </div>
            <div className="rounded-xl bg-surface-container-low p-2 text-center">
              <Sun className="mx-auto size-3.5 text-secondary" aria-hidden="true" />
              <p className="tabular mt-1 text-[11px] font-bold text-heading">
                {data.uv}
              </p>
              <p className="text-[9px] text-muted-foreground">UV</p>
            </div>
          </div>
        </div>
      ) : null}
    </WidgetCard>
  )
}
