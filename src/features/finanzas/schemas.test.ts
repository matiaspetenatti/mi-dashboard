import { describe, expect, it } from "vitest"

import {
  MOVIMIENTOS_FINANZAS_INICIALES,
  movimientosFinanzasSchema,
} from "./schemas"

describe("movimientosFinanzasSchema", () => {
  it("usa 20 por página y oculta rendimientos por defecto", () => {
    expect(MOVIMIENTOS_FINANZAS_INICIALES).toMatchObject({
      pagina: 1,
      porPagina: 20,
      tipo: "todos",
      cuentaId: null,
      categoria: "",
      busqueda: "",
      ocultarRendimientos: true,
    })
  })

  it("no permite pedir más de 20 movimientos por página", () => {
    expect(
      movimientosFinanzasSchema.safeParse({ porPagina: 21 }).success,
    ).toBe(false)
    expect(
      movimientosFinanzasSchema.safeParse({ porPagina: 20 }).success,
    ).toBe(true)
  })

  it("acepta filtros válidos", () => {
    const resultado = movimientosFinanzasSchema.parse({
      pagina: 2,
      tipo: "gasto",
      cuentaId: 2,
      categoria: "Comida",
      busqueda: "pizza",
      ocultarRendimientos: false,
    })

    expect(resultado).toMatchObject({
      pagina: 2,
      porPagina: 20,
      tipo: "gasto",
      cuentaId: 2,
      categoria: "Comida",
      busqueda: "pizza",
      ocultarRendimientos: false,
    })
  })
})
