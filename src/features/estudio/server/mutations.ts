import "@tanstack/react-start/server-only"

import { and, eq, ne } from "drizzle-orm"

import { getDb } from "@/server/db/client"
import {
  carreras,
  examenes,
  materias,
  sesionesEstudio,
} from "@/server/db/schema"
import { notasAprobado } from "../constantes"
import type {
  ActualizarCarreraInput,
  ActualizarExamenInput,
  ActualizarMateriaInput,
  CrearCarreraInput,
  CrearExamenInput,
  CrearMateriaInput,
  RegistrarSesionInput,
} from "../schemas"

function normalizarMateria<T extends { notaFinal?: number | null; estado?: string }>(
  datos: T,
): T {
  if (
    datos.notaFinal !== null &&
    datos.notaFinal !== undefined &&
    datos.notaFinal >= notasAprobado
  ) {
    return { ...datos, estado: "aprobada" }
  }
  return datos
}

function normalizarCalificacion(datos: {
  nota?: number | null
  resultado?: "aprobado" | "desaprobado" | null
  estado?: "programado" | "rendido" | "ausente"
}) {
  if (datos.estado === "ausente") {
    return { nota: null, resultado: null, estado: "ausente" as const }
  }

  if (datos.nota !== null && datos.nota !== undefined) {
    return {
      nota: datos.nota,
      resultado: null,
      estado: (datos.estado === "programado" ? "rendido" : datos.estado) ?? "rendido",
    }
  }

  if (datos.resultado !== null && datos.resultado !== undefined) {
    return {
      nota: null,
      resultado: datos.resultado,
      estado: (datos.estado === "programado" ? "rendido" : datos.estado) ?? "rendido",
    }
  }

  return {
    nota: null,
    resultado: null,
    estado: datos.estado ?? "programado",
  }
}

export async function crearCarreraEnDb(input: CrearCarreraInput) {
  const db = getDb()
  const carrera = (
    await db.insert(carreras).values(input).returning({ id: carreras.id })
  ).at(0)
  if (!carrera) throw new Error("No se pudo crear la carrera")
  return { id: carrera.id }
}

export async function actualizarCarreraEnDb(input: ActualizarCarreraInput) {
  const db = getDb()
  const { id, ...cambios } = input
  await db.update(carreras).set(cambios).where(eq(carreras.id, id))
  return { ok: true }
}

export async function borrarCarreraEnDb(id: number) {
  const db = getDb()
  await db.delete(carreras).where(eq(carreras.id, id))
  return { ok: true }
}

async function existeMateria(
  carreraId: number,
  nombre: string,
  excluirId?: number,
) {
  const db = getDb()
  const filtros = [
    eq(materias.carreraId, carreraId),
    eq(materias.nombre, nombre),
  ]
  if (excluirId) filtros.push(ne(materias.id, excluirId))

  const fila = (
    await db
      .select({ id: materias.id })
      .from(materias)
      .where(and(...filtros))
      .limit(1)
  ).at(0)
  return Boolean(fila)
}

export async function crearMateriaEnDb(input: CrearMateriaInput) {
  const db = getDb()
  if (await existeMateria(input.carreraId, input.nombre)) {
    throw new Error("Ya tenés una materia con ese nombre en la carrera")
  }

  const materia = (
    await db
      .insert(materias)
      .values(normalizarMateria(input))
      .returning({ id: materias.id })
  ).at(0)
  if (!materia) throw new Error("No se pudo crear la materia")
  return { id: materia.id }
}

export async function actualizarMateriaEnDb(input: ActualizarMateriaInput) {
  const db = getDb()
  const { id, ...cambios } = input

  if (
    cambios.carreraId !== undefined &&
    cambios.nombre !== undefined &&
    (await existeMateria(cambios.carreraId, cambios.nombre, id))
  ) {
    throw new Error("Ya tenés una materia con ese nombre en la carrera")
  }

  await db
    .update(materias)
    .set(normalizarMateria(cambios))
    .where(eq(materias.id, id))
  return { ok: true }
}

export async function borrarMateriaEnDb(id: number) {
  const db = getDb()
  await db.delete(materias).where(eq(materias.id, id))
  return { ok: true }
}

async function carreraDeMateria(materiaId: number): Promise<number | null> {
  const db = getDb()
  const fila = (
    await db
      .select({ carreraId: materias.carreraId })
      .from(materias)
      .where(eq(materias.id, materiaId))
      .limit(1)
  ).at(0)
  return fila?.carreraId ?? null
}

export async function crearExamenEnDb(input: CrearExamenInput) {
  const db = getDb()
  const carreraId = await carreraDeMateria(input.materiaId)
  if (!carreraId) throw new Error("La materia no existe")

  const examen = (
    await db
      .insert(examenes)
      .values({ ...input, ...normalizarCalificacion(input) })
      .returning({ id: examenes.id })
  ).at(0)
  if (!examen) throw new Error("No se pudo crear el examen")
  return { id: examen.id }
}

export async function actualizarExamenEnDb(input: ActualizarExamenInput) {
  const db = getDb()
  const { id, ...cambios } = input
  await db
    .update(examenes)
    .set({ ...cambios, ...normalizarCalificacion(cambios) })
    .where(eq(examenes.id, id))
  return { ok: true }
}

export async function borrarExamenEnDb(id: number) {
  const db = getDb()
  await db.delete(examenes).where(eq(examenes.id, id))
  return { ok: true }
}

export async function registrarSesionEnDb(input: RegistrarSesionInput) {
  const db = getDb()

  const carrera = (
    await db
      .select({ id: carreras.id })
      .from(carreras)
      .where(eq(carreras.id, input.carreraId))
      .limit(1)
  ).at(0)
  if (!carrera) throw new Error("La carrera no existe")

  const materia = (
    await db
      .select({ id: materias.id, carreraId: materias.carreraId })
      .from(materias)
      .where(eq(materias.id, input.materiaId))
      .limit(1)
  ).at(0)
  if (!materia) throw new Error("La materia no existe")
  if (materia.carreraId !== input.carreraId) {
    throw new Error("La materia no pertenece a la carrera")
  }

  const sesion = (
    await db
      .insert(sesionesEstudio)
      .values(input)
      .returning({ id: sesionesEstudio.id })
  ).at(0)
  if (!sesion) throw new Error("No se pudo registrar la sesión")
  return { id: sesion.id }
}
