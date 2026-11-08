import { Cloud, CloudFog, CloudLightning, CloudRain, CloudSun, Moon, Snowflake, Sun } from "lucide-react"

import type { IconoClima } from "../lib/weather"

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

export function IconoDelClima({
  icono,
  className,
}: {
  icono: IconoClima
  className?: string
}) {
  const Icon = ICONOS[icono] ?? CloudSun
  return <Icon className={className} aria-hidden="true" />
}
