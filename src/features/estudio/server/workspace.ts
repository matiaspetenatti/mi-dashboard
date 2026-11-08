import "@tanstack/react-start/server-only"

import { asc, desc, eq, gte } from "drizzle-orm"

import { fechaHoy, sumarFecha } from "@/lib/dates"
import { getDb } from "@/server/db/client"
import {
  carreras,
  examenes,
  materias,
  sesionesEstudio,
  type Carrera,
  type Materia,
} from "@/server/db/schema"
import {
  calcularPromedio,
  calcularResumenMaterias,
  estimarGraduacion,
} from "../lib/calculo"
import type {
  EstudioWorkspace,
  ExamenConContexto,
  ResumenCarrera,
  ResumenEstudio,
} from "../types"

const ordenEstadoCarrera: Record<Carrera["estado"], number> = {
  cursando: 0,
  pausada: 1,
  graduada: 2,
  abandonada: 3,
}

function agrupar<T>(items: T[], key: (item: T) => number): Map<number, T[]> {
  const mapa = new Map<number, T[]>()
  for (const item of items) {
    const id = key(item)
    const lista = mapa.get(id) ?? []
    lista.push(item)
    mapa.set(id, lista)
  }
  return mapa
}

export async function obtenerWorkspaceEstudio(): Promise<EstudioWorkspace> {
  const db = getDb()
  const hoy = fechaHoy()
  const desde = sumarFecha(hoy, "dia", -90)

  const [listaCarreras, listaMaterias, listaExamenes, sesiones] =
    await Promise.all([
      db.select().from(carreras),
      db
        .select()
        .from(materias)
        .orderBy(asc(materias.anio), asc(materias.nombre)),
      db
        .select({
          id: examenes.id,
          tipo: examenes.tipo,
          titulo: examenes.titulo,
          fecha: examenes.fecha,
          nota: examenes.nota,
          resultado: examenes.resultado,
          estado: examenes.estado,
          observaciones: examenes.observaciones,
          creadoEn: examenes.creadoEn,
          materiaId: examenes.materiaId,
          materia: materias.nombre,
          carreraId: carreras.id,
          carrera: carreras.nombre,
        })
        .from(examenes)
        .innerJoin(materias, eq(examenes.materiaId, materias.id))
        .innerJoin(carreras, eq(materias.carreraId, carreras.id))
        .orderBy(asc(examenes.fecha)),
      db
        .select()
        .from(sesionesEstudio)
        .where(gte(sesionesEstudio.fecha, desde))
        .orderBy(desc(sesionesEstudio.fecha)),
    ])

  const materiasPorCarrera = agrupar<Materia>(
    listaMaterias,
    (materia) => materia.carreraId,
  )
  const examenesPorCarrera = agrupar<ExamenConContexto>(
    listaExamenes,
    (examen) => examen.carreraId,
  )

  const proximosExamenes = listaExamenes.filter(
    (examen) => examen.estado === "programado" && examen.fecha >= hoy,
  )

  const carrerasOrdenadas = [...listaCarreras].sort(
    (a, b) =>
      ordenEstadoCarrera[a.estado] - ordenEstadoCarrera[b.estado] ||
      a.nombre.localeCompare(b.nombre),
  )

  const resumenCarreras: ResumenCarrera[] = carrerasOrdenadas.map((carrera) => {
    const materiasCarrera = materiasPorCarrera.get(carrera.id) ?? []
    const examenesCarrera = examenesPorCarrera.get(carrera.id) ?? []
    const resumenMaterias = calcularResumenMaterias(carrera, materiasCarrera)
    const proximoExamen =
      examenesCarrera.find(
        (examen) => examen.estado === "programado" && examen.fecha >= hoy,
      ) ?? null

    return {
      ...resumenMaterias,
      carrera,
      materias: materiasCarrera,
      examenes: examenesCarrera,
      proximoExamen,
      graduacionEstimada: estimarGraduacion(carrera, materiasCarrera, hoy),
    }
  })

  const totalPlan = resumenCarreras.reduce(
    (total, carrera) => total + carrera.totalPlan,
    0,
  )
  const aprobadas = resumenCarreras.reduce(
    (total, carrera) => total + carrera.aprobadas,
    0,
  )
  const resumen: ResumenEstudio = {
    totalCarreras: resumenCarreras.length,
    carrerasActivas: resumenCarreras.filter(
      (carrera) => carrera.carrera.estado === "cursando",
    ).length,
    totalMaterias: listaMaterias.length,
    aprobadas,
    totalPlan,
    progreso:
      totalPlan > 0 ? Math.round((aprobadas / totalPlan) * 100) : 0,
    promedio: calcularPromedio(listaMaterias),
    proximosExamenes: proximosExamenes.length,
  }

  return {
    hoy,
    carreras: resumenCarreras,
    proximosExamenes,
    resumen,
    sesiones,
  }
}
