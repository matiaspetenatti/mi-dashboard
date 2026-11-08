import type { Carrera, Materia } from "@/server/db/schema"
import type { ResumenMaterias } from "../types"

export function calcularPromedio(materias: Materia[]): number | null {
  const aprobadas = materias.filter(
    (materia) => materia.estado === "aprobada" && materia.notaFinal !== null,
  )

  if (aprobadas.length === 0) return null

  const conCreditos = aprobadas.filter(
    (materia) => materia.creditos !== null && materia.creditos > 0,
  )

  if (conCreditos.length > 0) {
    const sumaNotas = conCreditos.reduce(
      (total, materia) =>
        total + (materia.notaFinal as number) * (materia.creditos as number),
      0,
    )
    const sumaCreditos = conCreditos.reduce(
      (total, materia) => total + (materia.creditos as number),
      0,
    )
    if (sumaCreditos > 0) {
      return Math.round((sumaNotas / sumaCreditos) * 100) / 100
    }
  }

  const suma = aprobadas.reduce(
    (total, materia) => total + (materia.notaFinal as number),
    0,
  )
  return Math.round((suma / aprobadas.length) * 100) / 100
}

export function calcularResumenMaterias(
  carrera: Carrera,
  materias: Materia[],
): ResumenMaterias {
  const total = materias.length
  const aprobadas = materias.filter(
    (materia) => materia.estado === "aprobada",
  ).length
  const totalPlan = Math.max(total, carrera.materiasTotales ?? 0)
  const progreso =
    totalPlan > 0
      ? Math.min(100, Math.max(0, Math.round((aprobadas / totalPlan) * 100)))
      : 0

  return {
    total,
    aprobadas,
    regulares: materias.filter((materia) => materia.estado === "regular")
      .length,
    cursando: materias.filter((materia) => materia.estado === "cursando")
      .length,
    pendientes: materias.filter((materia) => materia.estado === "pendiente")
      .length,
    libres: materias.filter((materia) => materia.estado === "libre").length,
    totalPlan,
    progreso,
    promedio: calcularPromedio(materias),
  }
}

export function estimarGraduacion(
  carrera: Carrera,
  materias: Materia[],
  hoy: string,
): number | null {
  if (!carrera.anioInicio) return null
  if (carrera.estado === "graduada") return carrera.anioFin ?? null

  const aprobadas = materias.filter(
    (materia) => materia.estado === "aprobada",
  ).length
  const totalPlan = Math.max(aprobadas, carrera.materiasTotales ?? materias.length)
  const restantes = Math.max(0, totalPlan - aprobadas)
  if (restantes === 0) return null

  const anioActual = Number(hoy.slice(0, 4))
  const aniosCursados = Math.max(1, anioActual - carrera.anioInicio)
  const ritmo = aprobadas / aniosCursados
  if (ritmo <= 0) return null

  return anioActual + Math.ceil(restantes / ritmo)
}
