import "@tanstack/react-start/server-only"

import { asc, eq } from "drizzle-orm"

import { getDb } from "@/server/db/client"
import { climaUbicacion } from "@/server/db/schema"
import type { CrearUbicacionInput } from "../schemas"

export async function crearUbicacionEnDb(input: CrearUbicacionInput) {
  const db = getDb()
  await db.update(climaUbicacion).set({ esActiva: false })

  const ubicacion = (
    await db
      .insert(climaUbicacion)
      .values({
        etiqueta: input.etiqueta,
        latitud: input.latitud,
        longitud: input.longitud,
        esActiva: true,
      })
      .returning({ id: climaUbicacion.id })
  ).at(0)

  if (!ubicacion) throw new Error("No se pudo guardar la ubicación")
  return { id: ubicacion.id }
}

export async function seleccionarUbicacionEnDb(id: number) {
  const db = getDb()
  await db.update(climaUbicacion).set({ esActiva: false })
  await db
    .update(climaUbicacion)
    .set({ esActiva: true })
    .where(eq(climaUbicacion.id, id))
  return { ok: true }
}

export async function eliminarUbicacionEnDb(id: number) {
  const db = getDb()
  const fila = (
    await db
      .select({ esActiva: climaUbicacion.esActiva })
      .from(climaUbicacion)
      .where(eq(climaUbicacion.id, id))
      .limit(1)
  ).at(0)

  if (!fila) return { ok: true }

  await db.delete(climaUbicacion).where(eq(climaUbicacion.id, id))

  if (fila.esActiva) {
    const primera = (
      await db
        .select({ id: climaUbicacion.id })
        .from(climaUbicacion)
        .orderBy(asc(climaUbicacion.id))
        .limit(1)
    ).at(0)

    if (primera) {
      await db
        .update(climaUbicacion)
        .set({ esActiva: true })
        .where(eq(climaUbicacion.id, primera.id))
    }
  }

  return { ok: true }
}
