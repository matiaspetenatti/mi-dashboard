import "@tanstack/react-start/server-only"

import { desc, sql } from "drizzle-orm"

import { getDb } from "@/server/db/client"
import { animesVistos, type AnimeMetadatos, type AnimeVisto } from "@/server/db/schema"
import { estadosAnime } from "../constantes"
import { obtenerTemporadaAnime } from "../lib/utils"
import type {
  AnimesWorkspace,
  EstadisticasAnimes,
  ResumenAnimesWorkspace,
} from "../types"

function contarPorEstado(animes: AnimeVisto[]) {
  return estadosAnime.map((estado) => ({
    estado,
    total: animes.filter((anime) => anime.estado === estado).length,
  }))
}

const ordenTemporadas: Record<string, number> = {
  verano: 0,
  otono: 1,
  invierno: 2,
  primavera: 3,
}

function construirMetadatos(animes: AnimeVisto[]): AnimeMetadatos {
  const tipos = new Set<string>()
  const generos = new Set<string>()
  const anos = new Set<number>()
  const estudios = new Set<string>()
  const fuentes = new Set<string>()
  const formatos = new Set<string>()
  const tags = new Set<string>()
  const temporadas = new Map<string, AnimeMetadatos["temporadas"][number]>()

  for (const anime of animes) {
    if (anime.tipo) tipos.add(anime.tipo)
    if (anime.ano) anos.add(anime.ano)
    if (anime.estudio) estudios.add(anime.estudio)
    if (anime.fuente) fuentes.add(anime.fuente)
    if (anime.formato) formatos.add(anime.formato)

    for (const genero of anime.generos ?? []) {
      if (genero.trim()) generos.add(genero)
    }
    for (const tag of anime.tags ?? []) {
      if (tag.trim()) tags.add(tag)
    }

    const temporada = obtenerTemporadaAnime(anime.fechaEmision)
    if (temporada && !temporadas.has(temporada.key)) {
      temporadas.set(temporada.key, {
        key: temporada.key,
        label: temporada.label,
        año: temporada.anio,
        temporada: temporada.temporada,
      })
    }
  }

  const temporadasLista = [...temporadas.values()].sort((a, b) => {
    if (a.año !== b.año) return b.año - a.año
    return (ordenTemporadas[a.temporada] ?? 0) - (ordenTemporadas[b.temporada] ?? 0)
  })

  return {
    tipos: [...tipos].sort(),
    generos: [...generos].sort(),
    anos: [...anos].sort((a, b) => b - a),
    estudios: [...estudios].sort(),
    fuentes: [...fuentes].sort(),
    formatos: [...formatos].sort(),
    tags: [...tags].sort(),
    temporadas: temporadasLista,
  }
}

function construirEstadisticas(
  animes: AnimeVisto[],
  porEstado: EstadisticasAnimes["porEstado"],
): EstadisticasAnimes {
  const conteoGeneros = new Map<string, number>()
  for (const anime of animes) {
    for (const genero of anime.generos ?? []) {
      if (!genero.trim()) continue
      conteoGeneros.set(genero, (conteoGeneros.get(genero) ?? 0) + 1)
    }
  }

  const conteoAnos = new Map<number, number>()
  for (const anime of animes) {
    if (!anime.ano) continue
    conteoAnos.set(anime.ano, (conteoAnos.get(anime.ano) ?? 0) + 1)
  }

  const conteoEstudios = new Map<string, number>()
  for (const anime of animes) {
    if (!anime.estudio) continue
    conteoEstudios.set(
      anime.estudio,
      (conteoEstudios.get(anime.estudio) ?? 0) + 1,
    )
  }

  const porGenero = [...conteoGeneros.entries()]
    .map(([genero, total]) => ({ genero, total }))
    .sort((a, b) => b.total - a.total || a.genero.localeCompare(b.genero))

  const porAno = [...conteoAnos.entries()]
    .map(([ano, total]) => ({ ano, total }))
    .sort((a, b) => b.ano - a.ano)

  const porEstudio = [...conteoEstudios.entries()]
    .map(([valor, total]) => ({ valor, total }))
    .sort((a, b) => b.total - a.total || a.valor.localeCompare(b.valor))

  const top = animes
    .filter((anime) => anime.miPuntaje !== null)
    .sort((a, b) => (b.miPuntaje ?? 0) - (a.miPuntaje ?? 0))
    .slice(0, 10)
    .map((anime) => ({
      id: anime.id,
      titulo: anime.tituloIngles || anime.titulo,
      miPuntaje: anime.miPuntaje,
      scoreMal: anime.scoreMal,
    }))

  const comparativa = animes
    .filter(
      (anime) =>
        anime.miPuntaje !== null &&
        anime.miPuntaje > 0 &&
        anime.scoreMal !== null,
    )
    .map((anime) => ({
      titulo: anime.tituloIngles || anime.titulo,
      miPuntaje: anime.miPuntaje as number,
      scoreMal: Number(((anime.scoreMal as number) * 10).toFixed(1)),
    }))
    .sort((a, b) => b.miPuntaje - a.miPuntaje)

  return {
    porEstado,
    porGenero,
    porAno,
    porEstudio,
    top,
    comparativa,
  }
}

export async function obtenerWorkspaceAnimes(): Promise<AnimesWorkspace> {
  const db = getDb()

  const animes = await db
    .select()
    .from(animesVistos)
    .orderBy(
      sql`${animesVistos.actualizadoEn} is null`,
      desc(animesVistos.actualizadoEn),
      desc(animesVistos.id),
    )

  const porEstado = contarPorEstado(animes)
  const estadisticas = construirEstadisticas(animes, porEstado)
  const metadatos = construirMetadatos(animes)

  const episodiosVistos = animes.reduce(
    (total, anime) => total + anime.episodiosVistos,
    0,
  )
  const puntajes = animes
    .map((anime) => anime.miPuntaje)
    .filter((puntaje): puntaje is number => typeof puntaje === "number" && puntaje > 0)
  const promedio =
    puntajes.length > 0
      ? Number(
          (
            puntajes.reduce((total, puntaje) => total + puntaje, 0) /
            puntajes.length
          ).toFixed(1),
        )
      : null

  const promediosPorGenero = new Map<
    string,
    { suma: number; total: number }
  >()
  for (const anime of animes) {
    if (anime.miPuntaje === null || anime.miPuntaje <= 0) continue
    for (const genero of anime.generos ?? []) {
      if (!genero.trim()) continue
      const acumulado = promediosPorGenero.get(genero) ?? {
        suma: 0,
        total: 0,
      }
      acumulado.suma += anime.miPuntaje
      acumulado.total += 1
      promediosPorGenero.set(genero, acumulado)
    }
  }

  const mejorGenero =
    [...promediosPorGenero.entries()]
      .filter(([, acumulado]) => acumulado.total >= 2)
      .map(([genero, acumulado]) => ({
        genero,
        promedio: Number((acumulado.suma / acumulado.total).toFixed(1)),
        total: acumulado.total,
      }))
      .sort((a, b) => b.promedio - a.promedio || b.total - a.total)[0] ?? null

  const porEstadoMap = new Map(
    porEstado.map((item) => [item.estado, item.total]),
  )

  const resumen: ResumenAnimesWorkspace = {
    total: animes.length,
    viendo: porEstadoMap.get("viendo") ?? 0,
    completados: porEstadoMap.get("completado") ?? 0,
    planeados: porEstadoMap.get("planeado") ?? 0,
    pausados: porEstadoMap.get("en_pausa") ?? 0,
    abandonados: porEstadoMap.get("abandonado") ?? 0,
    favoritos: animes.filter((anime) => anime.favorito).length,
    episodiosVistos,
    horasEstimadas: Math.round((episodiosVistos * 24) / 60),
    promedio,
    mejorGenero,
  }

  return {
    animes,
    resumen,
    estadisticas,
    metadatos,
  }
}
