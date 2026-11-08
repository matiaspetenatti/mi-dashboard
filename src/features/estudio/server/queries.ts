import "@tanstack/react-start/server-only"

import { and, asc, eq, gte, inArray, sql } from "drizzle-orm"

import { diasHasta, fechaHoy } from "@/lib/dates"
import { getDb } from "@/server/db/client"
import { carreras, examenes, materias } from "@/server/db/schema"

export type ResumenEstudio = {
  carrerasActivas: number
  materiasAprobadas: number
  materiasTotales: number
  promedio: number | null
  proximoExamen: {
    materia: string
    fecha: string
    dias: number
  } | null
}

export async function obtenerResumenEstudio(): Promise<ResumenEstudio> {
  const db = getDb()
  const hoy = fechaHoy()

  const carrerasActivas = await db
    .select({ id: carreras.id, materiasTotales: carreras.materiasTotales })
    .from(carreras)
    .where(eq(carreras.estado, "cursando"))

  const idsCarreras = carrerasActivas.map((carrera) => carrera.id)
  const filtroCarreras =
    idsCarreras.length > 0
      ? inArray(materias.carreraId, idsCarreras)
      : undefined

  const [resumenMaterias, proximoExamen] = await Promise.all([
    db
      .select({
        total: sql<number>`count(*)`,
        aprobadas: sql<number>`coalesce(sum(case when ${materias.estado} = 'aprobada' then 1 else 0 end), 0)`,
        promedio: sql<number | null>`avg(${materias.notaFinal})`,
      })
      .from(materias)
      .where(filtroCarreras),
    db
      .select({
        materia: materias.nombre,
        fecha: examenes.fecha,
      })
      .from(examenes)
      .innerJoin(materias, eq(examenes.materiaId, materias.id))
      .where(and(gte(examenes.fecha, hoy), eq(examenes.estado, "programado")))
      .orderBy(asc(examenes.fecha))
      .limit(1),
  ])

  const materiasTotalesPlan = carrerasActivas.reduce(
    (total, carrera) => total + (carrera.materiasTotales ?? 0),
    0,
  )
  const materiasTotales = Math.max(
    materiasTotalesPlan,
    Number(resumenMaterias[0]?.total ?? 0),
  )
  const promedioRaw = resumenMaterias[0]?.promedio

  return {
    carrerasActivas: carrerasActivas.length,
    materiasAprobadas: Number(resumenMaterias[0]?.aprobadas ?? 0),
    materiasTotales,
    promedio:
      promedioRaw === null ? null : Number(promedioRaw),
    proximoExamen: proximoExamen[0]
      ? {
          ...proximoExamen[0],
          dias: diasHasta(proximoExamen[0].fecha, hoy),
        }
      : null,
  }
}
