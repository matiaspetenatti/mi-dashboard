import { describe, expect, it } from "vitest"

import { construirComparacionServicios } from "./servicios"

const servicios = [
  { nombre: "Luz", orden: 2 },
  { nombre: "Agua", orden: 1 },
  { nombre: "Gas", orden: 3 },
]

describe("construirComparacionServicios", () => {
  it("compara ambos meses y excluye los servicios sin registrar del total", () => {
    const resultado = construirComparacionServicios({
      servicios,
      mesAnterior: "2026-10",
      mesActual: "2026-11",
      filas: [
        { categoria: "Luz", mes: "2026-10", total: 10_000 },
        { categoria: "Luz", mes: "2026-11", total: 12_500 },
        { categoria: "Agua", mes: "2026-10", total: 20_000 },
        { categoria: "Agua", mes: "2026-11", total: 18_000 },
        { categoria: "Gas", mes: "2026-10", total: 30_000 },
      ],
    })

    expect(resultado.servicios.map((servicio) => servicio.categoria)).toEqual([
      "Agua",
      "Luz",
      "Gas",
    ])
    expect(resultado.servicios[0]).toMatchObject({
      anterior: 20_000,
      actual: 18_000,
      diferencia: -2_000,
      porcentaje: -10,
    })
    expect(resultado.servicios[2]).toMatchObject({
      anterior: 30_000,
      actual: null,
      diferencia: null,
      porcentaje: null,
    })
    expect(resultado.totalAnterior).toBe(30_000)
    expect(resultado.totalActual).toBe(30_500)
    expect(resultado.diferencia).toBe(500)
    expect(resultado.porcentaje).toBeCloseTo(1.6667)
    expect(resultado.sinRegistrar).toBe(1)
    expect(resultado.sinBase).toBe(0)
  })

  it("marca los servicios nuevos como sin base", () => {
    const resultado = construirComparacionServicios({
      servicios: [{ nombre: "Internet", orden: 1 }],
      mesAnterior: "2026-10",
      mesActual: "2026-11",
      filas: [{ categoria: "Internet", mes: "2026-11", total: 5_000 }],
    })

    expect(resultado.servicios[0]).toMatchObject({
      anterior: null,
      actual: 5_000,
      diferencia: null,
      porcentaje: null,
    })
    expect(resultado.sinBase).toBe(1)
    expect(resultado.sinRegistrar).toBe(0)
    expect(resultado.totalAnterior).toBe(0)
    expect(resultado.totalActual).toBe(0)
    expect(resultado.porcentaje).toBeNull()
  })

  it("no calcula porcentaje cuando el mes anterior es cero", () => {
    const resultado = construirComparacionServicios({
      servicios: [{ nombre: "Gas", orden: 1 }],
      mesAnterior: "2026-10",
      mesActual: "2026-11",
      filas: [
        { categoria: "Gas", mes: "2026-10", total: 0 },
        { categoria: "Gas", mes: "2026-11", total: 8_000 },
      ],
    })

    expect(resultado.servicios[0]).toMatchObject({
      anterior: 0,
      actual: 8_000,
      diferencia: 8_000,
      porcentaje: null,
    })
  })

  it("acumula varios movimientos del mismo servicio y mes", () => {
    const resultado = construirComparacionServicios({
      servicios: [{ nombre: "Luz", orden: 1 }],
      mesAnterior: "2026-10",
      mesActual: "2026-11",
      filas: [
        { categoria: "Luz", mes: "2026-10", total: 2_000 },
        { categoria: "Luz", mes: "2026-10", total: 3_000 },
        { categoria: "Luz", mes: "2026-11", total: 6_000 },
      ],
    })

    expect(resultado.servicios[0]).toMatchObject({
      anterior: 5_000,
      actual: 6_000,
      diferencia: 1_000,
    })
  })
})
