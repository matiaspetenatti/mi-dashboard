import "@tanstack/react-start/server-only"

import { and, asc, desc, eq, isNull, sql } from "drizzle-orm"

import { fechaHoy } from "@/lib/dates"
import { getDb } from "@/server/db/client"
import { proyectos, tareas } from "@/server/db/schema"

export type ResumenTareas = {
  pendientes: number
  vencidas: number
  hoy: number
  items: Array<{
    id: number
    titulo: string
    proyecto: string
    fechaLimite: string | null
    prioridad: string | null
    vencida: boolean
  }>
}

export async function obtenerResumenTareas(): Promise<ResumenTareas> {
  const db = getDb()
  const hoy = fechaHoy()

  const filas = await db
    .select({
      id: tareas.id,
      titulo: tareas.titulo,
      proyecto: proyectos.nombre,
      fechaLimite: tareas.fechaLimite,
      prioridad: tareas.prioridad,
    })
    .from(tareas)
    .innerJoin(proyectos, eq(tareas.proyectoId, proyectos.id))
    .where(and(isNull(tareas.completadaEn), isNull(tareas.archivadaEn)))
    .orderBy(
      sql`${tareas.fechaLimite} is null`,
      asc(tareas.fechaLimite),
      desc(tareas.id),
    )

  const vencidas = filas.filter(
    (fila) => fila.fechaLimite !== null && fila.fechaLimite < hoy,
  ).length
  const paraHoy = filas.filter((fila) => fila.fechaLimite === hoy).length

  return {
    pendientes: filas.length,
    vencidas,
    hoy: paraHoy,
    items: filas.slice(0, 3).map((fila) => ({
      ...fila,
      vencida: fila.fechaLimite !== null && fila.fechaLimite < hoy,
    })),
  }
}
