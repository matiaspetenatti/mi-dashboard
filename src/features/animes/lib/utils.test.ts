import { describe, expect, it } from "vitest"

import { obtenerTemporadaAnime } from "./utils"

describe("obtenerTemporadaAnime", () => {
  it("devuelve null sin fecha o con una fecha inválida", () => {
    expect(obtenerTemporadaAnime()).toBeNull()
    expect(obtenerTemporadaAnime(null)).toBeNull()
    expect(obtenerTemporadaAnime("")).toBeNull()
    expect(obtenerTemporadaAnime("2024")).toBeNull()
  })

  it("agrupa diciembre con el verano del año siguiente", () => {
    expect(obtenerTemporadaAnime("2024-12-15")).toEqual({
      key: "verano-2025",
      label: "Verano 2025",
      temporada: "verano",
      anio: 2025,
    })
  })

  it.each([
    ["2024-01-10", "verano-2024", "Verano 2024", "verano"],
    ["2024-02-29", "verano-2024", "Verano 2024", "verano"],
    ["2024-03-01", "otono-2024", "Otoño 2024", "otono"],
    ["2024-05-31", "otono-2024", "Otoño 2024", "otono"],
    ["2024-06-01", "invierno-2024", "Invierno 2024", "invierno"],
    ["2024-08-31", "invierno-2024", "Invierno 2024", "invierno"],
    ["2024-09-01", "primavera-2024", "Primavera 2024", "primavera"],
    ["2024-11-30", "primavera-2024", "Primavera 2024", "primavera"],
  ])("mapea %s a %s", (fecha, key, label, temporada) => {
    expect(obtenerTemporadaAnime(fecha)).toEqual({
      key,
      label,
      temporada,
      anio: 2024,
    })
  })

  it("toma solo la parte de fecha cuando viene con hora", () => {
    expect(obtenerTemporadaAnime("2024-07-09T12:30:00.000Z")).toMatchObject({
      key: "invierno-2024",
      label: "Invierno 2024",
    })
  })
})
