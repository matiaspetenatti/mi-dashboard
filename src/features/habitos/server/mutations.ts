import "@tanstack/react-start/server-only"

import { and, eq } from "drizzle-orm"

import { getDb } from "@/server/db/client"
import { habitoRegistros, habitos } from "@/server/db/schema"
import type {
  ActualizarHabitoInput,
  CrearHabitoInput,
  RegistrarHabitoInput,
} from "../schemas"

export async function crearHabitoEnDb(input: CrearHabitoInput) {
  const db = getDb()
  const ahora = new Date().toISOString()

  const creado = (
    await db
      .insert(habitos)
      .values({
        ...input,
        creadoEn: ahora,
        actualizadoEn: ahora,
      })
      .returning({ id: habitos.id })
  ).at(0)

  if (!creado) throw new Error("No se pudo crear el hábito")
  return { id: creado.id }
}

export async function actualizarHabitoEnDb(input: ActualizarHabitoInput) {
  const db = getDb()
  const { id, ...cambios } = input

  await db
    .update(habitos)
    .set({ ...cambios, actualizadoEn: new Date().toISOString() })
    .where(eq(habitos.id, id))

  return { ok: true }
}

export async function alternarActivoEnDb(id: number, activo: boolean) {
  const db = getDb()
  await db
    .update(habitos)
    .set({ activo, actualizadoEn: new Date().toISOString() })
    .where(eq(habitos.id, id))
  return { ok: true }
}

export async function eliminarHabitoEnDb(id: number) {
  const db = getDb()
  await db.delete(habitos).where(eq(habitos.id, id))
  return { ok: true }
}

export async function registrarHabitoEnDb(input: RegistrarHabitoInput) {
  const db = getDb()
  const existente = (
    await db
      .select({ id: habitoRegistros.id })
      .from(habitoRegistros)
      .where(
        and(
          eq(habitoRegistros.habitoId, input.habitoId),
          eq(habitoRegistros.fecha, input.fecha),
        ),
      )
      .limit(1)
  ).at(0)

  if (existente) {
    const cambios: {
      completado: boolean
      notas?: string | null
    } = { completado: input.completado }
    if (input.notas !== undefined) cambios.notas = input.notas

    await db
      .update(habitoRegistros)
      .set(cambios)
      .where(eq(habitoRegistros.id, existente.id))

    return { ok: true, id: existente.id }
  }

  const creado = (
    await db
      .insert(habitoRegistros)
      .values({
        habitoId: input.habitoId,
        fecha: input.fecha,
        completado: input.completado,
        notas: input.notas ?? null,
        creadoEn: new Date().toISOString(),
      })
      .returning({ id: habitoRegistros.id })
  ).at(0)

  if (!creado) throw new Error("No se pudo guardar el registro")
  return { ok: true, id: creado.id }
}
