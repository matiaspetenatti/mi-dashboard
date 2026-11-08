import "@tanstack/react-start/server-only"

import { eq, or, sql } from "drizzle-orm"

import { getDb } from "@/server/db/client"
import {
  animesVistos,
  type NuevoAnimeVisto,
} from "@/server/db/schema"
import {
  CRITERIOS_ANIME,
  aColumnasPuntaje,
  calcularTotalPuntajes,
  type PuntajesCriterios,
} from "../lib/criterios"
import type {
  ActualizarAnimeInput,
  ActualizarProgresoInput,
  CrearAnimeInput,
  PuntajesAnimeInput,
} from "../schemas"

function normalizarPuntajes(
  input: PuntajesAnimeInput,
): PuntajesCriterios {
  return Object.fromEntries(
    CRITERIOS_ANIME.map((criterio) => [
      criterio.key,
      input[criterio.key] ?? null,
    ]),
  ) as PuntajesCriterios
}

function columnasDesdePuntajes(input: PuntajesAnimeInput) {
  const puntajes = normalizarPuntajes(input)
  return {
    ...aColumnasPuntaje(puntajes),
    miPuntaje: calcularTotalPuntajes(puntajes),
  }
}

function limitarProgreso(vistos: number, total: number | null): number {
  const normalizado = Math.max(0, Math.trunc(vistos))
  if (total && total > 0) return Math.min(normalizado, total)
  return normalizado
}

export async function crearAnimeEnDb(input: CrearAnimeInput) {
  const db = getDb()
  const { puntajes, ...datos } = input

  const existente = (
    await db
      .select({ id: animesVistos.id })
      .from(animesVistos)
      .where(
        or(
          eq(animesVistos.kitsuId, datos.kitsuId),
          sql`lower(${animesVistos.titulo}) = lower(${datos.titulo})`,
        ),
      )
      .limit(1)
  ).at(0)

  if (existente) {
    throw new Error(
      "Ya tenés un anime con ese título o ID en tu catálogo. Abrilo para editarlo.",
    )
  }

  const valores: NuevoAnimeVisto = {
    ...datos,
    episodiosVistos: limitarProgreso(
      datos.episodiosVistos,
      datos.episodios ?? null,
    ),
    ...(puntajes ? columnasDesdePuntajes(puntajes) : {}),
    actualizadoEn: new Date().toISOString(),
  }

  const creado = (
    await db
      .insert(animesVistos)
      .values(valores)
      .returning({ id: animesVistos.id })
  ).at(0)

  if (!creado) throw new Error("No se pudo agregar el anime")
  return { id: creado.id }
}

export async function actualizarAnimeEnDb(input: ActualizarAnimeInput) {
  const db = getDb()
  const { id, puntajes, ...datos } = input

  const existente = (
    await db
      .select()
      .from(animesVistos)
      .where(eq(animesVistos.id, id))
      .limit(1)
  ).at(0)

  if (!existente) throw new Error("Anime no encontrado")

  const total = datos.episodios ?? existente.episodios

  const cambios: Partial<NuevoAnimeVisto> = {
    ...datos,
    episodiosVistos:
      datos.episodiosVistos !== undefined
        ? limitarProgreso(datos.episodiosVistos, total)
        : limitarProgreso(existente.episodiosVistos, total),
    actualizadoEn: new Date().toISOString(),
  }

  if (puntajes !== undefined) {
    Object.assign(cambios, columnasDesdePuntajes(puntajes))
  }

  await db.update(animesVistos).set(cambios).where(eq(animesVistos.id, id))
  return { ok: true }
}

export async function actualizarProgresoEnDb(input: ActualizarProgresoInput) {
  const db = getDb()

  const existente = (
    await db
      .select({
        id: animesVistos.id,
        episodios: animesVistos.episodios,
      })
      .from(animesVistos)
      .where(eq(animesVistos.id, input.id))
      .limit(1)
  ).at(0)

  if (!existente) throw new Error("Anime no encontrado")

  const episodiosVistos = limitarProgreso(
    input.episodiosVistos,
    existente.episodios,
  )

  await db
    .update(animesVistos)
    .set({
      episodiosVistos,
      actualizadoEn: new Date().toISOString(),
    })
    .where(eq(animesVistos.id, input.id))

  return { ok: true, episodiosVistos }
}

export async function alternarFavoritoEnDb(id: number) {
  const db = getDb()

  const existente = (
    await db
      .select({ id: animesVistos.id, favorito: animesVistos.favorito })
      .from(animesVistos)
      .where(eq(animesVistos.id, id))
      .limit(1)
  ).at(0)

  if (!existente) throw new Error("Anime no encontrado")

  const favorito = !existente.favorito
  await db
    .update(animesVistos)
    .set({ favorito, actualizadoEn: new Date().toISOString() })
    .where(eq(animesVistos.id, id))

  return { ok: true, favorito }
}

export async function borrarAnimeEnDb(id: number) {
  const db = getDb()
  await db.delete(animesVistos).where(eq(animesVistos.id, id))
  return { ok: true }
}
