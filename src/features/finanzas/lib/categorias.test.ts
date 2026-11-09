import { describe, expect, it } from "vitest"

import { expandirCategoriaSeleccionada } from "./categorias"

const categorias = [
  { id: 1, nombre: "Servicios", parentId: null },
  { id: 2, nombre: "Agua", parentId: 1 },
  { id: 3, nombre: "Luz", parentId: 1 },
  { id: 4, nombre: "Comida", parentId: null },
  { id: 5, nombre: "Delivery", parentId: 4 },
  { id: 6, nombre: "Sushi", parentId: 5 },
]

describe("expandirCategoriaSeleccionada", () => {
  it("incluye la categoría padre y todos sus descendientes", () => {
    expect(expandirCategoriaSeleccionada(categorias, "Servicios")).toEqual([
      "Servicios",
      "Agua",
      "Luz",
    ])
  })

  it("expande categorías anidadas de varios niveles", () => {
    expect(expandirCategoriaSeleccionada(categorias, "Comida")).toEqual([
      "Comida",
      "Delivery",
      "Sushi",
    ])
  })

  it("devuelve solo la categoría cuando no tiene hijos", () => {
    expect(expandirCategoriaSeleccionada(categorias, "Agua")).toEqual(["Agua"])
  })

  it("devuelve el nombre tal cual si no está configurado", () => {
    expect(expandirCategoriaSeleccionada(categorias, "Otros")).toEqual([
      "Otros",
    ])
  })
})
