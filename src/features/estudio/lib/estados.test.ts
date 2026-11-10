import { describe, expect, it } from "vitest"

import {
  claseNota,
  estadoVisualExamen,
  estadoVisualMateria,
} from "./estados"

describe("estadoVisualMateria", () => {
  it("marca desaprobada una nota menor a 6", () => {
    const estado = estadoVisualMateria({ estado: "aprobada", notaFinal: 5 })

    expect(estado.etiqueta).toBe("Desaprobada")
    expect(estado.clase).toContain("bg-error")
  })

  it("marca aprobada una nota de 6 o más", () => {
    const estado = estadoVisualMateria({ estado: "regular", notaFinal: 6 })

    expect(estado.etiqueta).toBe("Aprobada")
    expect(estado.clase).toContain("bg-success")
  })

  it("usa el estado cuando todavía no hay nota", () => {
    expect(estadoVisualMateria({ estado: "regular", notaFinal: null })).toMatchObject({
      etiqueta: "Regular",
    })
    expect(
      estadoVisualMateria({ estado: "aprobada", notaFinal: null }).etiqueta,
    ).toBe("Aprobada")
  })
})

describe("estadoVisualExamen", () => {
  it("marca desaprobado por nota o resultado", () => {
    const porNota = estadoVisualExamen({
      estado: "rendido",
      nota: 5,
      resultado: null,
    })
    const porResultado = estadoVisualExamen({
      estado: "rendido",
      nota: null,
      resultado: "desaprobado",
    })

    expect(porNota.etiqueta).toBe("Desaprobado")
    expect(porNota.clase).toContain("bg-error")
    expect(porResultado.etiqueta).toBe("Desaprobado")
    expect(porResultado.clase).toContain("bg-error")
  })

  it("marca aprobado por nota o resultado", () => {
    expect(
      estadoVisualExamen({ estado: "rendido", nota: 6, resultado: null }),
    ).toMatchObject({ etiqueta: "Aprobado" })
    expect(
      estadoVisualExamen({
        estado: "rendido",
        nota: null,
        resultado: "aprobado",
      }).clase,
    ).toContain("bg-success")
  })

  it("distingue ausente y programado", () => {
    expect(
      estadoVisualExamen({ estado: "ausente", nota: null, resultado: null })
        .etiqueta,
    ).toBe("Ausente")
    expect(
      estadoVisualExamen({ estado: "programado", nota: null, resultado: null })
        .etiqueta,
    ).toBe("Programado")
  })
})

describe("claseNota", () => {
  it("colorea la nota según apruebe o no", () => {
    expect(claseNota(5)).toBe("text-error")
    expect(claseNota(6)).toBe("text-success")
    expect(claseNota(null)).toBe("text-heading")
  })
})
