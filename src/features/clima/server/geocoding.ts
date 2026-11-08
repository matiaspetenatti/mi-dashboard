import "@tanstack/react-start/server-only"

import type { ResultadoGeocoding } from "../types"

type GeocodingResponse = {
  results?: Array<{
    id: number
    name: string
    latitude: number
    longitude: number
    country?: string
    admin1?: string
  }>
}

const cache = new Map<
  string,
  { expiresAt: number; data: ResultadoGeocoding[] }
>()
const TTL = 24 * 60 * 60 * 1000

export async function buscarUbicacionesEnApi(
  query: string,
): Promise<ResultadoGeocoding[]> {
  const clave = query.trim().toLowerCase()
  const cached = cache.get(clave)
  if (cached && cached.expiresAt > Date.now()) return cached.data

  const params = new URLSearchParams({
    name: query,
    count: "8",
    language: "es",
    format: "json",
  })

  const response = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?${params.toString()}`,
    { signal: AbortSignal.timeout(8_000) },
  )

  if (!response.ok) throw new Error("No se pudo buscar la ubicación")

  const payload = (await response.json()) as GeocodingResponse
  const data = (payload.results ?? [])
    .filter(
      (resultado) =>
        Number.isFinite(resultado.latitude) &&
        Number.isFinite(resultado.longitude),
    )
    .map((resultado) => ({
      id: resultado.id,
      nombre: resultado.name,
      provincia: resultado.admin1 ?? null,
      pais: resultado.country ?? null,
      latitud: resultado.latitude,
      longitud: resultado.longitude,
    }))

  cache.set(clave, { expiresAt: Date.now() + TTL, data })
  return data
}
