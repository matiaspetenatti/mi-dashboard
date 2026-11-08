import "@tanstack/react-start/server-only"

import { eq } from "drizzle-orm"

import { fechaHoy } from "@/lib/dates"
import { getDb } from "@/server/db/client"
import { animesVistos, type AnimeVisto } from "@/server/db/schema"
import type {
  AnimeCalendarioItem,
  AnimeSinHorario,
  CalendarioAnimes,
  DiaCalendarioAnime,
} from "../types"

const TIME_ZONE = "America/Argentina/Cordoba"
const TTL = 30 * 60 * 1000
const NOMBRES_DIAS = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
]

type MediaAniList = {
  status?: string | null
  airingSchedule?: {
    nodes?: Array<{
      airingAt?: number | null
      episode?: number | null
    } | null> | null
  } | null
}

let cache: {
  key: string
  expiresAt: number
  data: CalendarioAnimes
} | null = null

function fechaIso(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function formatearFecha(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date)
}

function rangoSemana() {
  const hoy = fechaHoy()
  const [anio, mes, dia] = hoy.split("-").map(Number)
  const base = new Date(Date.UTC(anio, mes - 1, dia))
  const diaSemana = base.getUTCDay()
  const diferencia = diaSemana === 0 ? -6 : 1 - diaSemana

  const lunes = new Date(base.getTime() + diferencia * 86_400_000)
  const domingo = new Date(lunes.getTime() + 6 * 86_400_000)

  return {
    inicio: fechaIso(lunes),
    fin: fechaIso(domingo),
    inicioUnix: Math.floor(lunes.getTime() / 1000),
    finUnix: Math.floor(domingo.getTime() / 1000) + 86_399,
  }
}

function indiceDia(airingAt: number): number {
  const dia = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    weekday: "short",
  }).format(new Date(airingAt * 1000))

  const mapa: Record<string, number> = {
    Mon: 0,
    Tue: 1,
    Wed: 2,
    Thu: 3,
    Fri: 4,
    Sat: 5,
    Sun: 6,
  }
  return mapa[dia] ?? 0
}

function horaLocal(airingAt: number): string {
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(airingAt * 1000))
}

function fechaLocal(airingAt: number): string {
  return formatearFecha(new Date(airingAt * 1000))
}

async function consultarAniList(anime: AnimeVisto): Promise<MediaAniList | null> {
  const buscarPorId = Boolean(anime.anilistId)
  const consulta = buscarPorId
    ? `query ($id: Int) {
        Media(id: $id, type: ANIME) {
          status
          airingSchedule { nodes { airingAt episode } }
        }
      }`
    : `query ($search: String) {
        Media(search: $search, type: ANIME, status: RELEASING) {
          status
          airingSchedule { nodes { airingAt episode } }
        }
      }`

  const intentar = async (variables: Record<string, unknown>) => {
    try {
      const respuesta = await fetch("https://graphql.anilist.co", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ query: consulta, variables }),
        signal: AbortSignal.timeout(10_000),
      })
      if (!respuesta.ok) return null
      const json = (await respuesta.json()) as {
        data?: { Media?: MediaAniList | null }
      }
      return json.data?.Media ?? null
    } catch {
      return null
    }
  }

  if (buscarPorId) {
    const media = await intentar({ id: anime.anilistId })
    if (media) return media
  }

  const candidatos = new Set<string>()
  candidatos.add(anime.titulo)
  const tituloCorto = anime.titulo.split(":")[0]?.trim()
  if (tituloCorto && tituloCorto.length >= 3) candidatos.add(tituloCorto)

  for (const search of candidatos) {
    const media = await intentar({ search })
    if (media) return media
  }

  return null
}

export async function obtenerCalendarioAnimes(
  forzar = false,
): Promise<CalendarioAnimes> {
  const db = getDb()
  const viendo = await db
    .select()
    .from(animesVistos)
    .where(eq(animesVistos.estado, "viendo"))

  const semana = rangoSemana()
  const cacheKey = `${semana.inicio}:${viendo
    .map((anime) => anime.id)
    .sort((a, b) => a - b)
    .join(",")}`

  if (!forzar && cache && cache.key === cacheKey && cache.expiresAt > Date.now()) {
    return cache.data
  }

  const dias: DiaCalendarioAnime[] = NOMBRES_DIAS.map((nombre, indice) => ({
    indice,
    nombre,
    fecha: new Date(
      Date.parse(`${semana.inicio}T00:00:00Z`) + indice * 86_400_000,
    )
      .toISOString()
      .slice(0, 10),
    items: [],
  }))

  const sinHorario: AnimeSinHorario[] = []
  const ahora = Math.floor(Date.now() / 1000)

  await Promise.all(
    viendo.map(async (anime) => {
      const entrada = {
        animeVistoId: anime.id,
        titulo: anime.titulo,
        imagen: anime.imagen,
      }

      let media: MediaAniList | null = null
      try {
        media = await consultarAniList(anime)
      } catch {
        media = null
      }

      if (!media) {
        sinHorario.push(entrada)
        return
      }

      const estado = (media.status ?? "").toUpperCase()
      const nodos = (media.airingSchedule?.nodes ?? []).filter(
        (nodo): nodo is { airingAt: number; episode?: number | null } =>
          Boolean(nodo) &&
          typeof nodo?.airingAt === "number" &&
          nodo.airingAt >= semana.inicioUnix &&
          nodo.airingAt <= semana.finUnix,
      )

      if (
        nodos.length === 0 ||
        estado === "FINISHED" ||
        estado === "CANCELLED"
      ) {
        sinHorario.push(entrada)
        return
      }

      for (const nodo of nodos) {
        const item: AnimeCalendarioItem = {
          id: `${anime.id}-${nodo.airingAt}`,
          animeVistoId: anime.id,
          titulo: anime.titulo,
          imagen: anime.imagen,
          episodio: nodo.episode ?? null,
          hora: horaLocal(nodo.airingAt),
          fecha: fechaLocal(nodo.airingAt),
          airingAt: new Date(nodo.airingAt * 1000).toISOString(),
          emitido: nodo.airingAt < ahora,
        }
        dias[indiceDia(nodo.airingAt)]?.items.push(item)
      }
    }),
  )

  for (const dia of dias) {
    dia.items.sort((a, b) => a.airingAt.localeCompare(b.airingAt))
  }

  const data: CalendarioAnimes = {
    semana: { inicio: semana.inicio, fin: semana.fin },
    dias,
    sinHorario: sinHorario.sort((a, b) => a.titulo.localeCompare(b.titulo)),
    actualizadoEn: new Date().toISOString(),
  }

  cache = { key: cacheKey, expiresAt: Date.now() + TTL, data }
  return data
}
