import "@tanstack/react-start/server-only"

import { and, asc, eq, sql } from "drizzle-orm"

import { getDb } from "@/server/db/client"
import {
  estadosProyecto,
  etiquetas,
  proyectos,
  tareas,
  tareasEtiquetas,
  type EstadoProyecto,
} from "@/server/db/schema"
import { prefijoDe, slugify } from "../constantes"
import type {
  ActualizarTareaInput,
  AlternarTareaInput,
  CrearEtiquetaInput,
  CrearProyectoInput,
  CrearTareaInput,
  EtiquetaTareaInput,
  MoverTareaInput,
} from "../schemas"

function ahora(): string {
  return new Date().toISOString()
}

async function posicionFinal(estadoId: number): Promise<number> {
  const db = getDb()
  const fila = (
    await db
      .select({ max: sql<number>`coalesce(max(${tareas.posicion}), -1)` })
      .from(tareas)
      .where(eq(tareas.estadoId, estadoId))
  ).at(0)
  return Number(fila?.max ?? -1) + 1
}

async function estadoDeProyecto(
  proyectoId: number,
  categoria: EstadoProyecto["categoria"],
): Promise<EstadoProyecto | null> {
  const db = getDb()
  const filas = await db
    .select()
    .from(estadosProyecto)
    .where(
      and(
        eq(estadosProyecto.proyectoId, proyectoId),
        eq(estadosProyecto.categoria, categoria),
      ),
    )
    .orderBy(asc(estadosProyecto.posicion), asc(estadosProyecto.id))
    .limit(1)
  return filas.at(0) ?? null
}

export async function crearTareaEnDb(input: CrearTareaInput) {
  const db = getDb()

  const estado = (
    await db
      .select()
      .from(estadosProyecto)
      .where(eq(estadosProyecto.id, input.estadoId))
      .limit(1)
  ).at(0)

  if (!estado || estado.proyectoId !== input.proyectoId) {
    throw new Error("El estado no pertenece al proyecto")
  }

  const posicion = await posicionFinal(input.estadoId)

  const [tarea] = await db
    .insert(tareas)
    .values({
      proyectoId: input.proyectoId,
      estadoId: input.estadoId,
      parentId: input.parentId ?? null,
      titulo: input.titulo,
      descripcion: input.descripcion ?? null,
      prioridad: input.prioridad ?? null,
      fechaInicio: input.fechaInicio ?? null,
      fechaLimite: input.fechaLimite ?? null,
      posicion,
      completadaEn:
        estado.categoria === "completado" ? ahora() : null,
    })
    .returning({ id: tareas.id })

  return { id: tarea.id }
}

export async function actualizarTareaEnDb(input: ActualizarTareaInput) {
  const db = getDb()
  const { id, ...cambios } = input

  const update: Partial<typeof tareas.$inferInsert> = {
    actualizadaEn: ahora(),
  }

  if (cambios.titulo !== undefined) update.titulo = cambios.titulo
  if (cambios.descripcion !== undefined)
    update.descripcion = cambios.descripcion
  if (cambios.prioridad !== undefined) update.prioridad = cambios.prioridad
  if (cambios.fechaInicio !== undefined)
    update.fechaInicio = cambios.fechaInicio
  if (cambios.fechaLimite !== undefined)
    update.fechaLimite = cambios.fechaLimite

  if (cambios.estadoId !== undefined) {
    const estado = (
      await db
        .select()
        .from(estadosProyecto)
        .where(eq(estadosProyecto.id, cambios.estadoId))
        .limit(1)
    ).at(0)

    if (!estado) throw new Error("Estado inexistente")

    update.estadoId = estado.id
    update.completadaEn =
      estado.categoria === "completado" ? ahora() : null
  }

  await db.update(tareas).set(update).where(eq(tareas.id, id))
  return { ok: true }
}

export async function moverTareaEnDb(input: MoverTareaInput) {
  const db = getDb()

  const estado = (
    await db
      .select()
      .from(estadosProyecto)
      .where(eq(estadosProyecto.id, input.estadoId))
      .limit(1)
  ).at(0)

  if (!estado) throw new Error("Estado inexistente")

  const posicion = input.posicion ?? (await posicionFinal(input.estadoId))

  await db
    .update(tareas)
    .set({
      estadoId: estado.id,
      posicion,
      completadaEn: estado.categoria === "completado" ? ahora() : null,
      actualizadaEn: ahora(),
    })
    .where(eq(tareas.id, input.id))

  return { ok: true }
}

export async function alternarTareaEnDb(input: AlternarTareaInput) {
  const db = getDb()

  const tarea = (
    await db
      .select({ id: tareas.id, proyectoId: tareas.proyectoId })
      .from(tareas)
      .where(eq(tareas.id, input.id))
      .limit(1)
  ).at(0)

  if (!tarea) throw new Error("Tarea inexistente")

  const estado = await estadoDeProyecto(
    tarea.proyectoId,
    input.completada ? "completado" : "pendiente",
  )

  if (!estado) throw new Error("El proyecto no tiene estados configurados")

  await db
    .update(tareas)
    .set({
      estadoId: estado.id,
      completadaEn: input.completada ? ahora() : null,
      actualizadaEn: ahora(),
    })
    .where(eq(tareas.id, input.id))

  return { ok: true }
}

export async function eliminarTareaEnDb(id: number) {
  const db = getDb()
  await db.delete(tareas).where(eq(tareas.id, id))
  return { ok: true }
}

export async function crearProyectoEnDb(input: CrearProyectoInput) {
  const db = getDb()
  const baseSlug = slugify(input.nombre)

  const existentes = await db
    .select({ slug: proyectos.slug })
    .from(proyectos)

  const usados = new Set(existentes.map((fila) => fila.slug))
  let slug = baseSlug
  let contador = 2
  while (usados.has(slug)) {
    slug = `${baseSlug}-${contador}`
    contador += 1
  }

  const [proyecto] = await db
    .insert(proyectos)
    .values({
      nombre: input.nombre,
      slug,
      descripcion: input.descripcion ?? null,
      color: input.color,
      icono: input.icono,
      prefijo: prefijoDe(input.nombre),
    })
    .returning({ id: proyectos.id, slug: proyectos.slug })

  await db.insert(estadosProyecto).values([
    {
      proyectoId: proyecto.id,
      nombre: "Por hacer",
      color: "#737373",
      categoria: "pendiente",
      posicion: 0,
    },
    {
      proyectoId: proyecto.id,
      nombre: "En curso",
      color: "#3b82f6",
      categoria: "en_progreso",
      posicion: 1,
    },
    {
      proyectoId: proyecto.id,
      nombre: "Hecho",
      color: "#22c55e",
      categoria: "completado",
      posicion: 2,
    },
  ])

  return proyecto
}

export async function crearEtiquetaEnDb(input: CrearEtiquetaInput) {
  const db = getDb()
  const [etiqueta] = await db
    .insert(etiquetas)
    .values({
      nombre: input.nombre,
      color: input.color,
      proyectoId: input.proyectoId ?? null,
    })
    .returning({ id: etiquetas.id })

  return { id: etiqueta.id }
}

export async function asignarEtiquetaEnDb(input: EtiquetaTareaInput) {
  const db = getDb()
  await db
    .insert(tareasEtiquetas)
    .values({ tareaId: input.tareaId, etiquetaId: input.etiquetaId })
    .onConflictDoNothing()
  return { ok: true }
}

export async function quitarEtiquetaEnDb(input: EtiquetaTareaInput) {
  const db = getDb()
  await db
    .delete(tareasEtiquetas)
    .where(
      and(
        eq(tareasEtiquetas.tareaId, input.tareaId),
        eq(tareasEtiquetas.etiquetaId, input.etiquetaId),
      ),
    )
  return { ok: true }
}
