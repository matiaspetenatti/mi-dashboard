import "@tanstack/react-start/server-only"

import { eq } from "drizzle-orm"

import { getDb } from "@/server/db/client"
import { climaUbicacion } from "@/server/db/schema"
import { describirClima, type IconoClima } from "../lib/weather"

export type ResumenClima =
  | { needsLocation: true }
  | {
      needsLocation: false
      ubicacion: {
        id: number
        etiqueta: string
        latitud: number
        longitud: number
      }
      actual: {
        temperatura: number
        sensacion: number
        humedad: number
        viento: number
        lluvia: number
        codigo: number
        descripcion: string
        icono: IconoClima
      }
      max: number
      min: number
      probLluvia: number
      uv: number
      actualizadoEn: string
    }

type OpenMeteoResponse = {
  current?: {
    temperature_2m?: number
    relative_humidity_2m?: number
    apparent_temperature?: number
    precipitation?: number
    weather_code?: number
    wind_speed_10m?: number
  }
  daily?: {
    temperature_2m_max?: Array<number>
    temperature_2m_min?: Array<number>
    precipitation_probability_max?: Array<number>
    uv_index_max?: Array<number>
  }
}

const cache = new Map<string, { expiresAt: number; data: ResumenClima }>()
const TTL = 10 * 60 * 1000

export async function obtenerResumenClima(): Promise<ResumenClima> {
  const db = getDb()

  const ubicacion = (
    await db
      .select()
      .from(climaUbicacion)
      .where(eq(climaUbicacion.esActiva, true))
      .limit(1)
  ).at(0)

  if (!ubicacion) return { needsLocation: true }

  const cacheKey = `${ubicacion.id}:${ubicacion.latitud}:${ubicacion.longitud}`
  const cached = cache.get(cacheKey)
  if (cached && cached.expiresAt > Date.now()) return cached.data

  const params = new URLSearchParams({
    latitude: String(ubicacion.latitud),
    longitude: String(ubicacion.longitud),
    current:
      "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m",
    daily:
      "temperature_2m_max,temperature_2m_min,precipitation_probability_max,uv_index_max",
    timezone: "auto",
    forecast_days: "1",
  })

  const response = await fetch(
    `https://api.open-meteo.com/v1/forecast?${params.toString()}`,
    { signal: AbortSignal.timeout(8_000) },
  )

  if (!response.ok) {
    throw new Error("No se pudo obtener el clima")
  }

  const payload = (await response.json()) as OpenMeteoResponse
  const current = payload.current
  const daily = payload.daily

  if (!current || current.temperature_2m === undefined) {
    throw new Error("Respuesta de clima inválida")
  }

  const codigo = current.weather_code ?? 0
  const descripcion = describirClima(codigo)

  const data: ResumenClima = {
    needsLocation: false,
    ubicacion: {
      id: ubicacion.id,
      etiqueta: ubicacion.etiqueta ?? "Ubicación guardada",
      latitud: ubicacion.latitud,
      longitud: ubicacion.longitud,
    },
    actual: {
      temperatura: Math.round(current.temperature_2m),
      sensacion: Math.round(
        current.apparent_temperature ?? current.temperature_2m,
      ),
      humedad: Math.round(current.relative_humidity_2m ?? 0),
      viento: Math.round(current.wind_speed_10m ?? 0),
      lluvia: Math.round(current.precipitation ?? 0),
      codigo,
      descripcion: descripcion.label,
      icono: descripcion.icono,
    },
    max: Math.round(daily?.temperature_2m_max?.[0] ?? current.temperature_2m),
    min: Math.round(daily?.temperature_2m_min?.[0] ?? current.temperature_2m),
    probLluvia: Math.round(daily?.precipitation_probability_max?.[0] ?? 0),
    uv: Math.round(daily?.uv_index_max?.[0] ?? 0),
    actualizadoEn: new Date().toISOString(),
  }

  cache.set(cacheKey, { expiresAt: Date.now() + TTL, data })
  return data
}
