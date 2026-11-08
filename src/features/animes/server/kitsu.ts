import "@tanstack/react-start/server-only"

import type { KitsuAnime } from "../types"

const KITSU_API = "https://kitsu.io/api/edge"
const HEADERS = {
  Accept: "application/vnd.api+json",
  "Content-Type": "application/vnd.api+json",
}

const TTL_BUSQUEDA = 10 * 60 * 1000
const TTL_DETALLE = 60 * 60 * 1000

const cacheBusqueda = new Map<
  string,
  { expiresAt: number; data: KitsuAnime[] }
>()
const cacheDetalle = new Map<
  number,
  { expiresAt: number; data: KitsuAnime | null }
>()

type KitsuItem = {
  id?: string
  attributes?: {
    canonicalTitle?: string
    titles?: Record<string, string | null | undefined>
    posterImage?: {
      large?: string | null
      medium?: string | null
      original?: string | null
    }
    subtype?: string | null
    episodeCount?: number | null
    startDate?: string | null
    averageRating?: string | null
    synopsis?: string | null
  }
  relationships?: {
    categories?: { data?: Array<{ id?: string }> }
  }
}

type KitsuResponse = {
  data?: KitsuItem | KitsuItem[]
  included?: Array<{
    id?: string
    type?: string
    attributes?: {
      title?: string
      name?: string
    }
  }>
}

function leerCategorias(included: KitsuResponse["included"]): Map<string, string> {
  const categorias = new Map<string, string>()
  for (const item of included ?? []) {
    if (item.type !== "categories") continue
    const titulo = item.attributes?.title
    if (item.id && titulo) categorias.set(item.id, titulo)
  }
  return categorias
}

function normalizarAnime(
  item: KitsuItem,
  categorias: Map<string, string>,
  estudio: string | null = null,
): KitsuAnime | null {
  const attrs = item.attributes
  const kitsuId = Number(item.id)
  if (!attrs || !Number.isFinite(kitsuId) || kitsuId <= 0) return null

  const titulo =
    attrs.canonicalTitle?.trim() ||
    attrs.titles?.en_jp?.trim() ||
    attrs.titles?.en?.trim() ||
    ""
  if (!titulo) return null

  const poster = attrs.posterImage
  const imagen =
    poster?.large ?? poster?.medium ?? poster?.original ?? ""

  const fechaEmision = attrs.startDate?.slice(0, 10) ?? null
  const generos: string[] = []
  for (const categoria of item.relationships?.categories?.data ?? []) {
    if (!categoria.id) continue
    const nombre = categorias.get(categoria.id)
    if (nombre && !generos.includes(nombre)) generos.push(nombre)
  }

  return {
    kitsuId,
    titulo,
    tituloIngles: attrs.titles?.en?.trim() || null,
    imagen,
    tipo: attrs.subtype ? attrs.subtype.toUpperCase() : null,
    episodios: attrs.episodeCount ?? null,
    ano: fechaEmision ? Number(fechaEmision.slice(0, 4)) : null,
    fechaEmision,
    generos,
    descripcion: attrs.synopsis?.trim() || null,
    scoreMal: attrs.averageRating
      ? Number((Number(attrs.averageRating) / 10).toFixed(2))
      : null,
    estudio,
  }
}

async function obtenerEstudio(kitsuId: number): Promise<string | null> {
  try {
    const respuesta = await fetch(
      `${KITSU_API}/anime/${kitsuId}/media-productions?include=producer`,
      { headers: HEADERS, signal: AbortSignal.timeout(8000) },
    )
    if (!respuesta.ok) return null

    const json = (await respuesta.json()) as {
      data?: Array<{
        attributes?: { role?: string }
        relationships?: { producer?: { data?: { id?: string } } }
      }>
      included?: Array<{
        id?: string
        type?: string
        attributes?: { name?: string }
      }>
    }

    const productores = new Map<string, string>()
    for (const item of json.included ?? []) {
      if (item.type !== "producers") continue
      if (item.id && item.attributes?.name) {
        productores.set(item.id, item.attributes.name)
      }
    }

    for (const item of json.data ?? []) {
      if (item.attributes?.role !== "studio") continue
      const id = item.relationships?.producer?.data?.id
      if (!id) continue
      const nombre = productores.get(id)
      if (nombre) return nombre
    }
    return null
  } catch {
    return null
  }
}

export async function buscarAnimesKitsu(
  texto: string,
  limite = 12,
): Promise<KitsuAnime[]> {
  const consulta = texto.trim()
  if (consulta.length < 2) return []

  const cacheKey = `${consulta.toLowerCase()}:${limite}`
  const cacheado = cacheBusqueda.get(cacheKey)
  if (cacheado && cacheado.expiresAt > Date.now()) return cacheado.data

  const params = new URLSearchParams({
    "filter[text]": consulta,
    "page[limit]": String(limite),
    include: "categories",
  })

  try {
    const respuesta = await fetch(`${KITSU_API}/anime?${params.toString()}`, {
      headers: HEADERS,
      signal: AbortSignal.timeout(10000),
    })
    if (!respuesta.ok) return []

    const json = (await respuesta.json()) as KitsuResponse
    const categorias = leerCategorias(json.included)
    const data = Array.isArray(json.data) ? json.data : []

    const animes = data
      .map((item) => normalizarAnime(item, categorias))
      .filter((anime): anime is KitsuAnime => anime !== null)

    cacheBusqueda.set(cacheKey, {
      expiresAt: Date.now() + TTL_BUSQUEDA,
      data: animes,
    })
    return animes
  } catch {
    return []
  }
}

export async function obtenerAnimeKitsu(
  kitsuId: number,
): Promise<KitsuAnime | null> {
  const cacheado = cacheDetalle.get(kitsuId)
  if (cacheado && cacheado.expiresAt > Date.now()) return cacheado.data

  try {
    const respuesta = await fetch(
      `${KITSU_API}/anime/${kitsuId}?include=categories`,
      { headers: HEADERS, signal: AbortSignal.timeout(10000) },
    )
    if (!respuesta.ok) return null

    const json = (await respuesta.json()) as KitsuResponse
    if (!json.data || Array.isArray(json.data)) return null

    const categorias = leerCategorias(json.included)
    const studio = await obtenerEstudio(kitsuId)
    const anime = normalizarAnime(json.data, categorias, studio)

    cacheDetalle.set(kitsuId, {
      expiresAt: Date.now() + TTL_DETALLE,
      data: anime,
    })
    return anime
  } catch {
    return null
  }
}
