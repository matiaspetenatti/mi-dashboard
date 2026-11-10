const KITSU_API = "https://kitsu.io/api/edge"
const ANILIST_API = "https://graphql.anilist.co"
const JUSTWATCH_API = "https://www.justwatch.com/us/tv-show"
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
  episodes?: number | null
  title?: { english?: string | null; romaji?: string | null } | null
  studios?: {
    edges?: Array<{
      isMain?: boolean | null
      node?: { name?: string | null } | null
    } | null> | null
  } | null
}

type AniListMetadatosPayload = {
  data?: {
    Page?: { media?: Array<AniListMedia | null> | null } | null
  } | null
}

export type MetadatosAnime = {
  estudio: string | null
  episodios: number | null
}

type MetadatosAniList = MetadatosAnime & {
  tituloIngles: string | null
}

const cacheKitsu = new Map<
  number,
  { expiresAt: number; data: string | null }
>()
const cacheAniList = new Map<
  string,
  { expiresAt: number; data: MetadatosAniList }
>()
const cacheJustWatch = new Map<
  string,
  { expiresAt: number; data: number | null }
>()

const ALIAS_ESTUDIOS: Record<string, string> = {
  "8bit": "8-bit",
  "8-bit": "8-bit",
  pierrot: "Studio Pierrot",
  "studio pierrot": "Studio Pierrot",
}

export function normalizarEstudio(
  nombre: string | null | undefined,
): string | null {
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
    (item) => String(item.attributes?.role ?? "").toLowerCase() === "studio",
  )
  const id = produccion?.relationships?.producer?.data?.id
  if (!id) return null

  return normalizarEstudio(productores.get(id))
}

export function extraerMetadatosAniList(
  payload: AniListMetadatosPayload | null | undefined,
  anio?: number | null,
): MetadatosAniList {
  const media = payload?.data?.Page?.media ?? []
  if (media.length === 0) {
    return { estudio: null, episodios: null, tituloIngles: null }
  }

  const elegido =
    (anio ? media.find((item) => item?.seasonYear === anio) : null) ?? media[0]
  const edges = elegido?.studios?.edges ?? []
  const principal = edges.find((edge) => edge?.isMain) ?? edges[0]

  return {
    estudio: normalizarEstudio(principal?.node?.name),
    episodios:
      typeof elegido?.episodes === "number" && elegido.episodes > 0
        ? elegido.episodes
        : null,
    tituloIngles: elegido?.title?.english?.trim() || null,
  }
}

export function slugJustWatch(titulo: string): string {
  return titulo
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function extraerEpisodiosJustWatch(html: string): number | null {
  const coincidencia = html.match(/episodes-number[^>]*>\s*(\d+)\s+Episodes/i)
  if (!coincidencia) return null

  const episodios = Number(coincidencia[1])
  return Number.isFinite(episodios) && episodios > 0 ? episodios : null
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
        episodes
        title { english romaji }
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

async function consultarJustWatch(
  titulo: string,
  anio?: number | null,
): Promise<number | null> {
  const slug = slugJustWatch(titulo)
  if (!slug) return null

  const urls = [`${JUSTWATCH_API}/${slug}`]
  if (anio) urls.push(`${JUSTWATCH_API}/${slug}-${anio}`)

  for (const url of urls) {
    try {
      const respuesta = await fetch(url, {
        headers: {
          Accept: "text/html",
          "Accept-Language": "en-US,en;q=0.9",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
        },
        redirect: "follow",
        signal: AbortSignal.timeout(10000),
      })
      if (!respuesta.ok) continue

      const episodios = extraerEpisodiosJustWatch(await respuesta.text())
      if (episodios) return episodios
    } catch {
      // Se prueba el siguiente candidato.
    }
  }

  return null
}

async function obtenerEpisodiosJustWatch(
  titulos: string[],
  anio?: number | null,
): Promise<number | null> {
  const candidatos = [
    ...new Set(titulos.map((titulo) => titulo.trim()).filter(Boolean)),
  ]
  if (candidatos.length === 0) return null

  const cacheKey = `${candidatos.join("|")}::${anio ?? ""}`
  const cacheado = cacheJustWatch.get(cacheKey)
  if (cacheado && cacheado.expiresAt > Date.now()) return cacheado.data

  for (const titulo of candidatos) {
    const episodios = await consultarJustWatch(titulo, anio)
    if (episodios) {
      cacheJustWatch.set(cacheKey, {
        expiresAt: Date.now() + TTL,
        data: episodios,
      })
      return episodios
    }
  }

  cacheJustWatch.set(cacheKey, { expiresAt: Date.now() + TTL, data: null })
  return null
}

async function obtenerMetadatosAniList(
  titulos: string[],
  anio?: number | null,
): Promise<MetadatosAniList> {
  const candidatos = [
    ...new Set(titulos.map((titulo) => titulo.trim()).filter(Boolean)),
  ]
  if (candidatos.length === 0) {
    return { estudio: null, episodios: null, tituloIngles: null }
  }

  const cacheKey = `${candidatos.join("|")}::${anio ?? ""}`
  const cacheado = cacheAniList.get(cacheKey)
  if (cacheado && cacheado.expiresAt > Date.now()) return cacheado.data

  for (const titulo of candidatos) {
    const json = await consultarAniList(titulo)
    const metadatos = extraerMetadatosAniList(
      json as AniListMetadatosPayload | null | undefined,
      anio,
    )
    if (
      metadatos.estudio ||
      metadatos.episodios ||
      metadatos.tituloIngles
    ) {
      cacheAniList.set(cacheKey, {
        expiresAt: Date.now() + TTL,
        data: metadatos,
      })
      return metadatos
    }
  }

  const vacio: MetadatosAniList = {
    estudio: null,
    episodios: null,
    tituloIngles: null,
  }
  cacheAniList.set(cacheKey, { expiresAt: Date.now() + TTL, data: vacio })
  return vacio
}

/**
 * Completa estudio y cantidad de episodios cuando Kitsu no los informa.
 * Orden: Kitsu, AniList y, como último recurso, JustWatch.
 */
export async function obtenerMetadatos({
  kitsuId,
  titulos,
  anio,
  episodiosKitsu,
}: {
  kitsuId: number
  titulos: string[]
  anio?: number | null
  episodiosKitsu?: number | null
}): Promise<MetadatosAnime> {
  const episodiosValidos =
    typeof episodiosKitsu === "number" && episodiosKitsu > 0
      ? episodiosKitsu
      : null

  const deKitsu = await obtenerEstudioKitsu(kitsuId)
  if (deKitsu && episodiosValidos !== null) {
    return { estudio: deKitsu, episodios: episodiosValidos }
  }

  const deAniList = await obtenerMetadatosAniList(titulos, anio)
  const episodios =
    episodiosValidos ??
    deAniList.episodios ??
    (await obtenerEpisodiosJustWatch(
      [deAniList.tituloIngles ?? "", ...titulos],
      anio,
    ))

  return {
    estudio: deKitsu ?? deAniList.estudio,
    episodios,
  }
}
