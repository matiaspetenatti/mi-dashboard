import "@tanstack/react-start/server-only"

import { desc, eq, sql } from "drizzle-orm"

import { getDb } from "@/server/db/client"
import { animesVistos } from "@/server/db/schema"

export type ResumenAnimes = {
  viendo: number
  episodiosVistos: number
  items: Array<{
    id: number
    titulo: string
    imagen: string
    episodios: number | null
    episodiosVistos: number
  }>
}

export async function obtenerResumenAnimes(): Promise<ResumenAnimes> {
  const db = getDb()

  const filas = await db
    .select({
      id: animesVistos.id,
      titulo: animesVistos.titulo,
      imagen: animesVistos.imagen,
      episodios: animesVistos.episodios,
      episodiosVistos: animesVistos.episodiosVistos,
    })
    .from(animesVistos)
    .where(eq(animesVistos.estado, "viendo"))
    .orderBy(
      sql`${animesVistos.actualizadoEn} is null`,
      desc(animesVistos.actualizadoEn),
      desc(animesVistos.id),
    )

  return {
    viendo: filas.length,
    episodiosVistos: filas.reduce(
      (total, anime) => total + anime.episodiosVistos,
      0,
    ),
    items: filas.slice(0, 2),
  }
}
