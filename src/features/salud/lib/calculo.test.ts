import { describe, expect, it } from "vitest"

import { calcularResumenSalud, calcularResumenWidget } from "./calculo"
import type { EpisodioConFactores } from "../types"
import type { RegistroDiarioSalud } from "@/server/db/schema"

function episodio(
  overrides: Partial<EpisodioConFactores> = {},
): EpisodioConFactores {
  return {
    id: 1,
    inicioEn: "2026-11-06T10:00",
    finEn: "2026-11-06T12:00",
    intensidad: 8,
    patron: "pulsatil",
    lateralidad: "izquierdo",
    aura: true,
    auraTipos: ["visuales"],
    sintomas: ["nauseas", "fotofobia"],
    tomoTetralgin: true,
    dosisTetralgin: 1,
    tetralginEn: "2026-11-06T10:30",
    alivio: "completo",
    otroDesencadenante: null,
    notas: null,
    creadoEn: "2026-11-06 13:00:00",
    actualizadoEn: null,
    factores: ["estres", "falta-sueno"],
    ...overrides,
  }
}

function registro(
  overrides: Partial<RegistroDiarioSalud> = {},
): RegistroDiarioSalud {
  return {
    id: 1,
    fecha: "2026-11-01",
    horasSueno: 7,
    calidadSueno: 4,
    vasosAgua: 8,
    nivelEstres: 2,
    horasPantalla: 5,
    tazasCafeina: 1,
    comidasOmitidas: 0,
    actividadMin: 30,
    animo: 4,
    pesoKg: 75,
    notas: null,
    creadoEn: "2026-11-01 20:00:00",
    actualizadoEn: null,
    ...overrides,
  }
}

const episodios = [
  episodio(),
  episodio({
    id: 2,
    inicioEn: "2026-11-02T08:00",
    finEn: "2026-11-02T09:00",
    intensidad: 4,
    aura: false,
    auraTipos: [],
    sintomas: [],
    tomoTetralgin: false,
    dosisTetralgin: null,
    tetralginEn: null,
    alivio: null,
    factores: ["estres"],
  }),
  episodio({
    id: 3,
    inicioEn: "2026-10-15T20:00",
    finEn: "2026-10-15T21:00",
    intensidad: 6,
    aura: false,
    auraTipos: [],
    sintomas: ["mareo"],
    alivio: "parcial",
    factores: ["chocolate"],
  }),
]

const diario = Array.from({ length: 10 }, (_, indice) =>
  registro({
    id: indice + 1,
    fecha: `2026-11-${String(indice + 1).padStart(2, "0")}`,
    nivelEstres: indice === 1 || indice === 5 ? 5 : 2,
    horasSueno: indice === 1 || indice === 5 ? 5 : 8,
  }),
)

describe("calcularResumenSalud", () => {
  const resumen = calcularResumenSalud({
    hoy: "2026-11-08",
    episodios,
    diario,
  })

  it("calcula los indicadores del mes y la racha", () => {
    expect(resumen).toMatchObject({
      diasTranscurridos: 8,
      diasLibres: 6,
      rachaLibre: 2,
      episodiosMes: 2,
      episodiosMesAnterior: 1,
      evaPromedio: 6,
      duracionPromedioMin: 90,
      efectividadTetralgin: 100,
      episodiosConTetralgin: 2,
      episodiosConAlivio: 2,
      totalEpisodios: 3,
      totalConAura: 1,
    })
  })

  it("arma la serie diaria de 90 días", () => {
    expect(resumen.serie).toHaveLength(90)
    const dia = resumen.serie.find((punto) => punto.fecha === "2026-11-06")
    expect(dia).toMatchObject({
      eva: 8,
      duracionHoras: 2,
      episodios: 1,
    })
    const libre = resumen.serie.find((punto) => punto.fecha === "2026-11-07")
    expect(libre).toMatchObject({ eva: null, duracionHoras: 0, episodios: 0 })
  })

  it("ordena el mapa de desencadenantes por frecuencia", () => {
    expect(resumen.mapa[0]).toMatchObject({
      factor: "estres",
      episodios: 2,
      porcentaje: 67,
    })
  })

  it("calcula la correlación de hábitos", () => {
    expect(resumen.correlacion).toMatchObject({
      registros: 10,
      registrosConCrisis: 2,
      registrosSinCrisis: 8,
    })
    const estres = resumen.correlacion?.metricas.find(
      (metrica) => metrica.clave === "nivelEstres",
    )
    expect(estres).toMatchObject({ conCrisis: 5, sinCrisis: 2 })
  })
})

describe("calcularResumenWidget", () => {
  it("devuelve solo los indicadores del widget", () => {
    const resumen = calcularResumenWidget("2026-11-08", episodios)
    expect(resumen.episodiosMes).toBe(2)
    expect(resumen.rachaLibre).toBe(2)
    expect(resumen.totalEpisodios).toBe(3)
    expect("serie" in resumen).toBe(false)
  })
})
