const KITSU_API = "https://kitsu.io/api/edge"
const ANILIST_API = "https://graphql.anilist.co"
const TTL = 60 * 60 * 1000
const HEADERS_KITSU = { Accept: "application/vnd.api+json" }

type KitsuProduccion = {
  attributes?: { role?: string | null }
  relationships?: { producer?: { data?: { id?: string } | null } | null }
}

type KitsuEstudioPayload = {
  data?: KitsuProduccion[]
  included?: Array<{
    id?: string
    type?: string
    attributes?: { name?: string | null }
  }>
}

type AniListMedia = {
  seasonYear?: number | null
  studios?: {
    edges?: Array<{
      isMain?: boolean | null
      node?: { name?: string | null } | null
    } | null> | null
  } | null
}

type AniListEstudioPayload = {
  data?: {
    Page?: { media?: Array<AniListMedia | null> | null } | null
  } | null
}

const cacheKitsu = new Map<
  number,
  { expiresAt: number; data: string | null }
>()
const cacheAniList = new Map<
  string,
  { expiresAt: number; data: string | null }
>()

const ALIAS_ESTUDIOS: Record<string, string> = {
  "8bit": "8-bit",
  "8-bit": "8-bit",
  pierrot: "Studio Pierrot",
  "studio pierrot": "Studio Pierrot",
}

export function normalizarEstudio(nombre: string | null | undefined): string | null {
  const limpio = nombre?.trim()
  if (!limpio) return null

  return ALIAS_ESTUDIOS[limpio.toLowerCase()] ?? limpio
}

export function extraerEstudioKitsu(
  payload: KitsuEstudioPayload | null | undefined,
): string | null {
  const productores = new Map<string, string>()
  for (const item of payload?.included ?? []) {
    if (item.type !== "producers") continue
    const nombre = item.attributes?.name?.trim()
    if (item.id && nombre) productores.set(item.id, nombre)
  }

  const produccion = (payload?.data ?? []).find(
    (item) =>
      String(item.attributes?.role ?? "").toLowerCase() === "studio",
  )
  const id = produccion?.relationships?.producer?.data?.id
  if (!id) return null

  return normalizarEstudio(productores.get(id))
}

export function extraerEstudioAniList(
  payload: AniListEstudioPayload | null | undefined,
  anio?: number | null,
): string | null {
  const media = payload?.data?.Page?.media ?? []
  if (media.length === 0) return null

  const elegido =
    (anio ? media.find((item) => item?.seasonYear === anio) : null) ?? media[0]
  const edges = elegido?.studios?.edges ?? []
  const principal = edges.find((edge) => edge?.isMain) ?? edges[0]

  return normalizarEstudio(principal?.node?.name)
}

async function consultarKitsu(kitsuId: number): Promise<unknown | null> {
  const params = new URLSearchParams({
    "filter[role]": "studio",
    include: "producer",
  })

  try {
    const respuesta = await fetch(
      `${KITSU_API}/anime/${kitsuId}/anime-productions?${params.toString()}`,
      { headers: HEADERS_KITSU, signal: AbortSignal.timeout(8000) },
    )
    if (!respuesta.ok) return null
    return (await respuesta.json()) as unknown
  } catch {
    return null
  }
}

async function consultarAniList(titulo: string): Promise<unknown | null> {
  const consulta = `query ($search: String) {
    Page(perPage: 5) {
      media(search: $search, type: ANIME) {
        seasonYear
        studios { edges { isMain node { name } } }
      }
    }
  }`

  for (let intento = 0; intento < 2; intento += 1) {
    try {
      const respuesta = await fetch(ANILIST_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ query: consulta, variables: { search: titulo } }),
        signal: AbortSignal.timeout(8000),
      })

      if (respuesta.status === 429) {
        await new Promise((resolver) => setTimeout(resolver, 1500))
        continue
      }
      if (!respuesta.ok) return null

      return (await respuesta.json()) as unknown
    } catch {
      return null
    }
  }

  return null
}

async function obtenerEstudioKitsu(kitsuId: number): Promise<string | null> {
  const cacheado = cacheKitsu.get(kitsuId)
  if (cacheado && cacheado.expiresAt > Date.now()) return cacheado.data

  const json = await consultarKitsu(kitsuId)
  const estudio = extraerEstudioKitsu(
    json as KitsuEstudioPayload | null | undefined,
  )

  cacheKitsu.set(kitsuId, { expiresAt: Date.now() + TTL, data: estudio })
  return estudio
}

async function obtenerEstudioAniList(
  titulos: string[],
  anio?: number | null,
): Promise<string | null> {
  const candidatos = [
    ...new Set(titulos.map((titulo) => titulo.trim()).filter(Boolean)),
  ]
  if (candidatos.length === 0) return null

  const cacheKey = `${candidatos.join("|")}::${anio ?? ""}`
  const cacheado = cacheAniList.get(cacheKey)
  if (cacheado && cacheado.expiresAt > Date.now()) return cacheado.data

  for (const titulo of candidatos) {
    const json = await consultarAniList(titulo)
    const estudio = extraerEstudioAniList(
      json as AniListEstudioPayload | null | undefined,
      anio,
    )
    if (estudio) {
      cacheAniList.set(cacheKey, {
        expiresAt: Date.now() + TTL,
        data: estudio,
      })
      return estudio
    }
  }

  cacheAniList.set(cacheKey, { expiresAt: Date.now() + TTL, data: null })
  return null
}

/**
 * Busca el estudio principal de un anime. Primero consulta Kitsu y, si el
 * catálogo no tiene producciones cargadas, usa AniList como respaldo.
 */
export async function obtenerEstudio({
  kitsuId,
  titulos,
  anio,
}: {
  kitsuId: number
  titulos: string[]
  anio?: number | null
}): Promise<string | null> {
  const deKitsu = await obtenerEstudioKitsu(kitsuId)
  if (deKitsu) return deKitsu

  return obtenerEstudioAniList(titulos, anio)
}
