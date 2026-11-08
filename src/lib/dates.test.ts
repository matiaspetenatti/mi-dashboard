import { describe, expect, it } from "vitest"

import { diasHasta, fechaHoy, mesActual, saludoDelDia } from "./dates"

describe("fechas", () => {
  it("usa la zona de Córdoba para el día", () => {
    const fecha = new Date("2026-11-08T12:00:00Z")
    expect(fechaHoy(fecha)).toBe("2026-11-08")
    expect(mesActual(fecha)).toBe("2026-11")
  })

  it("calcula días entre fechas ISO", () => {
    expect(diasHasta("2026-11-10", "2026-11-08")).toBe(2)
    expect(diasHasta("2026-11-06", "2026-11-08")).toBe(-2)
    expect(diasHasta("2026-11-08", "2026-11-08")).toBe(0)
  })

  it("saluda según la hora local", () => {
    expect(saludoDelDia(new Date("2026-11-08T13:00:00Z"))).toBe("Buen día")
    expect(saludoDelDia(new Date("2026-11-08T18:00:00Z"))).toBe(
      "Buenas tardes",
    )
    expect(saludoDelDia(new Date("2026-11-09T02:00:00Z"))).toBe(
      "Buenas noches",
    )
  })
})
