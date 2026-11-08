import { describe, expect, it } from "vitest"

import {
  agruparPorSemanas,
  calcularRachaActual,
  calcularRachaMaxima,
  calcularResumen,
  estadoHabito,
} from "./habitos"
import type { GithubActividad, Habito, HabitoRegistro } from "@/server/db/schema"

function habito(overrides: Partial<Habito> = {}): Habito {
  return {
    id: 1,
    titulo: "Leer",
    descripcion: null,
    tipo: "bueno",
    color: "#163300",
    emoji: "📚",
    frecuencia: "diaria",
    activo: true,
    creadoEn: "2026-01-01 00:00:00",
    actualizadoEn: null,
    ...overrides,
  }
}

function registro(
  fecha: string,
  completado = true,
  overrides: Partial<HabitoRegistro> = {},
): HabitoRegistro {
  return {
    id: Number(fecha.replaceAll("-", "")),
    habitoId: 1,
    fecha,
    completado,
    notas: null,
    creadoEn: "2026-01-01 00:00:00",
    ...overrides,
  }
}

function github(
  fecha: string,
  commits: number,
  overrides: Partial<GithubActividad> = {},
): GithubActividad {
  return {
    id: Number(fecha.replaceAll("-", "")),
    fecha,
    commits,
    pullRequests: 0,
    issues: 0,
    actualizadoEn: null,
    ...overrides,
  }
}

describe("rachas", () => {
  const registros = [
    registro("2026-11-08"),
    registro("2026-11-07"),
    registro("2026-11-06"),
    registro("2026-11-05", false),
  ]

  it("calcula la racha actual hasta hoy", () => {
    expect(calcularRachaActual(registros, "2026-11-08")).toBe(3)
  })

  it("devuelve 0 si hoy no está completado", () => {
    expect(calcularRachaActual(registros, "2026-11-09")).toBe(0)
  })

  it("calcula la racha máxima respetando huecos", () => {
    expect(
      calcularRachaMaxima([
        registro("2026-11-01"),
        registro("2026-11-02"),
        registro("2026-11-03"),
        registro("2026-11-05"),
        registro("2026-11-06"),
      ]),
    ).toBe(3)
  })
})

describe("estadoHabito", () => {
  const registros = [registro("2026-11-08"), registro("2026-11-07")]

  it("arma los últimos 7 días y el último año", () => {
    const estado = estadoHabito(habito(), registros, "2026-11-08")
    expect(estado.completadoHoy).toBe(true)
    expect(estado.rachaActual).toBe(2)
    expect(estado.rachaMaxima).toBe(2)
    expect(estado.porcentaje).toBe(100)
    expect(estado.ultimos7).toHaveLength(7)
    expect(estado.registrosUltimoAnio).toHaveLength(365)
    expect(
      estado.registrosUltimoAnio.find((dia) => dia.fecha === "2026-11-08"),
    ).toMatchObject({ completado: true })
  })
})

describe("agruparPorSemanas", () => {
  it("arma semanas de 7 días empezando el lunes", () => {
    const semanas = agruparPorSemanas([
      "2026-11-02",
      "2026-11-03",
      "2026-11-09",
    ])
    expect(semanas).toHaveLength(2)
    expect(semanas[0][0]).toBe("2026-11-02")
    expect(semanas[0][1]).toBe("2026-11-03")
    expect(semanas[1][0]).toBe("2026-11-09")
  })
})

describe("calcularResumen", () => {
  it("cuenta hábitos activos, completados y GitHub", () => {
    const estados = [
      estadoHabito(habito(), [registro("2026-11-08")], "2026-11-08"),
      estadoHabito(
        habito({ id: 2, titulo: "Fumar", tipo: "malo", activo: false }),
        [],
        "2026-11-08",
      ),
    ]

    const resumen = calcularResumen(estados, [
      github("2026-11-08", 3),
      github("2026-11-07", 0),
    ])

    expect(resumen).toMatchObject({
      activos: 1,
      buenos: 1,
      malos: 0,
      archivados: 1,
      completadosHoy: 1,
      mejorRacha: 1,
      commitsGithub: 3,
      diasConActividad: 1,
    })
  })
})
