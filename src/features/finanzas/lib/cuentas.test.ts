import { describe, expect, it } from "vitest"

import {
  calcularAjusteSaldo,
  calcularRendimientoDiarioCentavos,
} from "./cuentas"

describe("calcularAjusteSaldo", () => {
  it("genera un ingreso cuando el saldo sube", () => {
    expect(
      calcularAjusteSaldo({
        saldoActualCentavos: 10_000,
        nuevoSaldoCentavos: 15_000,
      }),
    ).toEqual({
      diferencia: 5_000,
      tipo: "ingreso",
      monto: 5_000,
    })
  })

  it("genera un gasto cuando el saldo baja", () => {
    expect(
      calcularAjusteSaldo({
        saldoActualCentavos: 20_000,
        nuevoSaldoCentavos: 12_500,
      }),
    ).toEqual({
      diferencia: -7_500,
      tipo: "gasto",
      monto: 7_500,
    })
  })

  it("no genera movimiento cuando el saldo coincide", () => {
    expect(
      calcularAjusteSaldo({
        saldoActualCentavos: 8_000,
        nuevoSaldoCentavos: 8_000,
      }),
    ).toEqual({
      diferencia: 0,
      tipo: null,
      monto: 0,
    })
  })

  it("permite ajustar a un saldo negativo", () => {
    expect(
      calcularAjusteSaldo({
        saldoActualCentavos: 0,
        nuevoSaldoCentavos: -4_000,
      }),
    ).toEqual({
      diferencia: -4_000,
      tipo: "gasto",
      monto: 4_000,
    })
  })
})

describe("calcularRendimientoDiarioCentavos", () => {
  it("calcula el rendimiento diario sobre el saldo", () => {
    expect(calcularRendimientoDiarioCentavos(10_000_000, 18.9)).toBe(5_178)
  })

  it("devuelve cero sin saldo o sin TNA", () => {
    expect(calcularRendimientoDiarioCentavos(0, 18.9)).toBe(0)
    expect(calcularRendimientoDiarioCentavos(10_000_000, 0)).toBe(0)
  })
})
