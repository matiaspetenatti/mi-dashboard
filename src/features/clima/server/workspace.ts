import "@tanstack/react-start/server-only"

import { asc, desc } from "drizzle-orm"

import { getDb } from "@/server/db/client"
import { climaUbicacion } from "@/server/db/schema"
import { describirClima } from "../lib/weather"
import type {
  ClimaActual,
  DiaClima,
  HoraClima,
  UbicacionClima,
  WorkspaceClima,
} from "../types"

type OpenMeteoResponse = {
  current?: {
    time?: string
    temperature_2m?: number
    relative_humidity_2m?: number
    apparent_temperature?: number
    is_day?: number
    precipitation?: number
    weather_code?: number
    wind_speed_10m?: number
    surface_pressure?: number
  }
  daily?: {
    time?: string[]
    weather_code?: number[]
    temperature_2m_max?: number[]
    temperature_2m_min?: number[]
    precipitation_probability_max?: number[]
    uv_index_max?: number[]
    sunrise?: string[]
    sunset?: string[]
  }
  hourly?: {
    time?: string[]
    temperature_2m?: number[]
    apparent_temperature?: number[]
    precipitation_probability?: number[]
    weather_code?: number[]
    wind_speed_10m?: number[]
    relative_humidity_2m?: number[]
    is_day?: number[]
  }
}

const cache = new Map<string, { expiresAt: number; data: WorkspaceClima }>()
const TTL = 10 * 60 * 1000

export function limpiarCacheClima() {
  cache.clear()
}

function aUbicacion(
  fila: typeof climaUbicacion.$inferSelect,
): UbicacionClima {
  return {
    id: fila.id,
    etiqueta: fila.etiqueta ?? "Ubicación guardada",
    latitud: fila.latitud,
    longitud: fila.longitud,
    esActiva: fila.esActiva,
  }
}

export async function obtenerWorkspaceClima(
  forzar = false,
): Promise<WorkspaceClima> {
  const db = getDb()
  const filas = await db
    .select()
    .from(climaUbicacion)
    .orderBy(desc(climaUbicacion.esActiva), asc(climaUbicacion.id))

  const ubicaciones = filas.map(aUbicacion)
  const activa = ubicaciones.find((ubicacion) => ubicacion.esActiva)

  if (!activa) {
    return { needsLocation: true, ubicaciones }
  }

  const cacheKey = `${activa.id}:${activa.latitud}:${activa.longitud}`
  if (!forzar) {
    const cached = cache.get(cacheKey)
    if (cached && cached.expiresAt > Date.now()) return cached.data
  }

  const params = new URLSearchParams({
    latitude: String(activa.latitud),
    longitude: String(activa.longitud),
    current:
      "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,surface_pressure",
    daily:
      "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,uv_index_max,sunrise,sunset",
    hourly:
      "temperature_2m,apparent_temperature,precipitation_probability,weather_code,wind_speed_10m,relative_humidity_2m,is_day",
    timezone: "auto",
    forecast_days: "14",
  })

  const response = await fetch(
    `https://api.open-meteo.com/v1/forecast?${params.toString()}`,
    { signal: AbortSignal.timeout(10_000) },
  )

  if (!response.ok) throw new Error("No se pudo obtener el clima")

  const payload = (await response.json()) as OpenMeteoResponse
  const current = payload.current
  const daily = payload.daily
  const hourly = payload.hourly

  if (!current || current.temperature_2m === undefined) {
    throw new Error("Respuesta de clima inválida")
  }

  const codigoActual = current.weather_code ?? 0
  const descripcionActual = describirClima(codigoActual)
  const actual: ClimaActual = {
    temperatura: Math.round(current.temperature_2m),
    sensacion: Math.round(
      current.apparent_temperature ?? current.temperature_2m,
    ),
    humedad: Math.round(current.relative_humidity_2m ?? 0),
    viento: Math.round(current.wind_speed_10m ?? 0),
    lluvia: Math.round((current.precipitation ?? 0) * 10) / 10,
    presion: Math.round(current.surface_pressure ?? 0),
    esDia: Boolean(current.is_day),
    codigo: codigoActual,
    descripcion: descripcionActual.label,
    icono: descripcionActual.icono,
    actualizadoEn: current.time ?? new Date().toISOString(),
  }

  const dias: DiaClima[] = (daily?.time ?? []).map((fecha, indice) => {
    const codigo = daily?.weather_code?.[indice] ?? 0
    const descripcion = describirClima(codigo)
    return {
      fecha,
      codigo,
      descripcion: descripcion.label,
      icono: descripcion.icono,
      max: Math.round(daily?.temperature_2m_max?.[indice] ?? 0),
      min: Math.round(daily?.temperature_2m_min?.[indice] ?? 0),
      probLluvia: Math.round(
        daily?.precipitation_probability_max?.[indice] ?? 0,
      ),
      uv: Math.round(daily?.uv_index_max?.[indice] ?? 0),
      amanecer: daily?.sunrise?.[indice] ?? "",
      atardecer: daily?.sunset?.[indice] ?? "",
    }
  })

  const horas: HoraClima[] = (hourly?.time ?? []).map((hora, indice) => {
    const codigo = hourly?.weather_code?.[indice] ?? 0
    const descripcion = describirClima(codigo)
    return {
      hora,
      temperatura: Math.round(hourly?.temperature_2m?.[indice] ?? 0),
      sensacion: Math.round(
        hourly?.apparent_temperature?.[indice] ??
          hourly?.temperature_2m?.[indice] ??
          0,
      ),
      probLluvia: Math.round(
        hourly?.precipitation_probability?.[indice] ?? 0,
      ),
      codigo,
      descripcion: descripcion.label,
      icono: descripcion.icono,
      viento: Math.round(hourly?.wind_speed_10m?.[indice] ?? 0),
      humedad: Math.round(hourly?.relative_humidity_2m?.[indice] ?? 0),
      esDia: Boolean(hourly?.is_day?.[indice]),
    }
  })

  const data: WorkspaceClima = {
    needsLocation: false,
    ubicaciones,
    activa,
    actual,
    dias,
    horas,
  }

  cache.set(cacheKey, { expiresAt: Date.now() + TTL, data })
  return data
}
