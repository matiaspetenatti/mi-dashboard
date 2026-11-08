import { describe, expect, it } from "vitest"

import {
  calcularPromedio,
  calcularResumenMaterias,
  estimarGraduacion,
} from "./calculo"
import type { Carrera, Materia } from "@/server/db/schema"

function carrera(overrides: Partial<Carrera> = {}): Carrera {
  return {
    id: 1,
    nombre: "Carrera",
    institucion: null,
    estado: "cursando",
    anioInicio: 2024,
    anioFin: null,
    materiasTotales: 40,
    color: "#8b4a2b",
    notas: null,
    creadaEn: "2024-01-01 00:00:00",
    ...overrides,
  }
}

function materia(overrides: Partial<Materia> = {}): Materia {
  return {
    id: 1,
    carreraId: 1,
    nombre: "Materia",
    anio: 1,
    cuatrimestre: "1",
    creditos: null,
    correlativas: [],
    estado: "pendiente",
    notaFinal: null,
    profesor: null,
    notas: null,
    creadaEn: "2024-01-01 00:00:00",
    ...overrides,
  }
}

describe("calcularPromedio", () => {
  it("pondera por créditos cuando hay materias con créditos", () => {
    const promedio = calcularPromedio([
      materia({ id: 1, estado: "aprobada", notaFinal: 8, creditos: 4 }),
      materia({ id: 2, estado: "aprobada", notaFinal: 6, creditos: 6 }),
    ])

    expect(promedio).toBe(6.8)
  })

  it("usa promedio simple si no hay créditos", () => {
    const promedio = calcularPromedio([
      materia({ id: 1, estado: "aprobada", notaFinal: 7 }),
      materia({ id: 2, estado: "aprobada", notaFinal: 9 }),
    ])

    expect(promedio).toBe(8)
  })

  it("ignora materias no aprobadas o sin nota", () => {
    const promedio = calcularPromedio([
      materia({ id: 1, estado: "aprobada", notaFinal: 8 }),
      materia({ id: 2, estado: "regular", notaFinal: 2 }),
      materia({ id: 3, estado: "aprobada", notaFinal: null }),
    ])

    expect(promedio).toBe(8)
  })

  it("devuelve null sin materias aprobadas", () => {
    expect(calcularPromedio([materia({ estado: "cursando" })])).toBeNull()
  })
})

describe("calcularResumenMaterias", () => {
  it("cuenta estados y calcula el avance sobre el plan", () => {
    const resumen = calcularResumenMaterias(carrera(), [
      materia({ id: 1, estado: "aprobada", notaFinal: 8 }),
      materia({ id: 2, estado: "aprobada", notaFinal: 7 }),
      materia({ id: 3, estado: "regular" }),
      materia({ id: 4, estado: "cursando" }),
      materia({ id: 5, estado: "pendiente" }),
      materia({ id: 6, estado: "libre" }),
    ])

    expect(resumen).toMatchObject({
      total: 6,
      aprobadas: 2,
      regulares: 1,
      cursando: 1,
      pendientes: 1,
      libres: 1,
      totalPlan: 40,
      progreso: 5,
      promedio: 7.5,
    })
  })

  it("usa la cantidad de materias si supera el plan declarado", () => {
    const resumen = calcularResumenMaterias(
      carrera({ materiasTotales: 2 }),
      [
        materia({ id: 1, estado: "aprobada", notaFinal: 8 }),
        materia({ id: 2, estado: "aprobada", notaFinal: 8 }),
        materia({ id: 3, estado: "pendiente" }),
      ],
    )

    expect(resumen.totalPlan).toBe(3)
    expect(resumen.progreso).toBe(67)
  })
})

describe("estimarGraduacion", () => {
  it("estima según el ritmo de materias aprobadas", () => {
    const materias = Array.from({ length: 10 }, (_, indice) =>
      materia({
        id: indice + 1,
        estado: "aprobada",
        notaFinal: 8,
      }),
    )

    expect(estimarGraduacion(carrera(), materias, "2026-06-01")).toBe(2032)
  })

  it("devuelve el año de fin si la carrera está graduada", () => {
    expect(
      estimarGraduacion(
        carrera({ estado: "graduada", anioFin: 2025 }),
        [],
        "2026-06-01",
      ),
    ).toBe(2025)
  })

  it("devuelve null sin año de inicio o sin materias restantes", () => {
    expect(
      estimarGraduacion(carrera({ anioInicio: null }), [], "2026-06-01"),
    ).toBeNull()

    const aprobadas = Array.from({ length: 40 }, (_, indice) =>
      materia({ id: indice + 1, estado: "aprobada", notaFinal: 8 }),
    )
    expect(
      estimarGraduacion(carrera(), aprobadas, "2026-06-01"),
    ).toBeNull()
  })
})
