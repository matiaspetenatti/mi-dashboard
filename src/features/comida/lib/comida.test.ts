import { describe, expect, it } from "vitest"

import {
  convertir,
  mismoIngrediente,
  normalizarNombre,
  parsearIngredienteTexto,
  sumarCantidades,
} from "./cantidades"
import {
  calcularFaltantes,
  porVencer,
  proponerDescuento,
  stockBajo,
  vencimientoDe,
} from "./inventario"
import { diasDeSemana, inicioSemana, tituloSemana } from "./semana"
import type { IngredienteReceta, ItemComida } from "@/server/db/schema"

function item(overrides: Partial<ItemComida> = {}): ItemComida {
  return {
    id: 1,
    nombre: "Arroz",
    nombreNormalizado: "arroz",
    tipo: "ingrediente",
    categoria: "almacen",
    cantidad: 300,
    unidad: "g",
    ubicacion: "despensa",
    caducaEn: null,
    stockMinimo: null,
    notas: null,
    creadoEn: "2026-01-01 00:00:00",
    actualizadoEn: null,
    ...overrides,
  }
}

function ingrediente(
  overrides: Partial<IngredienteReceta> = {},
): IngredienteReceta {
  return {
    nombre: "Arroz",
    cantidad: 500,
    unidad: "g",
    detalle: null,
    opcional: false,
    ingredienteId: null,
    ...overrides,
  }
}

describe("cantidades", () => {
  it("normaliza y compara nombres", () => {
    expect(normalizarNombre("Pechuga de Pollo ")).toBe("pechuga de pollo")
    expect(mismoIngrediente("Pechuga de pollo", "pollo")).toBe(true)
    expect(mismoIngrediente("Arroz", "Fideos")).toBe(false)
  })

  it("convierte unidades compatibles", () => {
    expect(convertir(1, "kg", "g")).toBe(1000)
    expect(convertir(500, "ml", "l")).toBe(0.5)
    expect(convertir(1, "kg", "ml")).toBeNull()
  })

  it("suma cantidades y prioriza la mayor si no son compatibles", () => {
    expect(sumarCantidades(1, "kg", 500, "g")).toEqual({
      cantidad: 1.5,
      unidad: "kg",
    })
    expect(sumarCantidades(2, "unidad", 500, "g")).toEqual({
      cantidad: 500,
      unidad: "g",
    })
  })

  it("parsea ingredientes escritos como texto", () => {
    expect(parsearIngredienteTexto("500 g de pollo")).toMatchObject({
      nombre: "pollo",
      cantidad: 500,
      unidad: "g",
    })
    expect(parsearIngredienteTexto("sal")).toMatchObject({
      nombre: "sal",
      cantidad: null,
      unidad: "unidad",
    })
  })
})

describe("inventario", () => {
  it("calcula faltantes contra el stock", () => {
    const faltantes = calcularFaltantes(
      [ingrediente(), ingrediente({ nombre: "Huevos", cantidad: 2, unidad: "unidad" })],
      [item(), item({ id: 2, nombre: "Huevos", nombreNormalizado: "huevos", cantidad: 6, unidad: "unidad" })],
    )

    expect(faltantes).toHaveLength(1)
    expect(faltantes[0]).toMatchObject({
      nombre: "Arroz",
      faltante: 200,
      unidadFaltante: "g",
    })
  })

  it("propone descuentos de stock", () => {
    const propuestas = proponerDescuento([ingrediente()], [item()])
    expect(propuestas[0]).toMatchObject({
      ingredienteId: 1,
      cantidad: 300,
      restante: 0,
    })
  })

  it("detecta vencimientos y stock bajo", () => {
    expect(
      vencimientoDe("2026-11-08", "2026-11-08"),
    ).toMatchObject({ estado: "hoy" })
    expect(
      vencimientoDe("2026-11-06", "2026-11-08"),
    ).toMatchObject({ estado: "vencido", dias: -2 })

    const items = [
      item({ caducaEn: "2026-11-09" }),
      item({ id: 2, stockMinimo: 300 }),
    ]
    expect(porVencer(items, "2026-11-08")).toHaveLength(1)
    expect(stockBajo(items)).toHaveLength(1)
  })
})

describe("semana", () => {
  it("calcula el lunes de la semana", () => {
    expect(inicioSemana("2026-11-08")).toBe("2026-11-02")
    expect(inicioSemana("2026-11-02")).toBe("2026-11-02")
    expect(diasDeSemana("2026-11-02")).toHaveLength(7)
  })

  it("etiqueta la semana actual y la siguiente", () => {
    expect(tituloSemana("2026-11-02", "2026-11-08")).toBe("Esta semana")
    expect(tituloSemana("2026-11-09", "2026-11-08")).toBe("Próxima semana")
  })
})
