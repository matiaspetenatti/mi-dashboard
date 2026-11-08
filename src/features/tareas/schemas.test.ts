import { describe, expect, it } from "vitest"

import { crearTareaRapidaSchema } from "./schemas"

describe("crearTareaRapidaSchema", () => {
  it("acepta una tarea mínima y recorta el título", () => {
    const result = crearTareaRapidaSchema.parse({ titulo: "  Comprar pan  " })
    expect(result.titulo).toBe("Comprar pan")
    expect(result.fechaLimite).toBeUndefined()
    expect(result.prioridad).toBeUndefined()
  })

  it("rechaza títulos vacíos", () => {
    expect(() => crearTareaRapidaSchema.parse({ titulo: "   " })).toThrow()
  })

  it("valida fecha y prioridad", () => {
    const result = crearTareaRapidaSchema.parse({
      titulo: "Estudiar",
      fechaLimite: "2026-11-10",
      prioridad: "alta",
    })
    expect(result.fechaLimite).toBe("2026-11-10")
    expect(result.prioridad).toBe("alta")

    expect(() =>
      crearTareaRapidaSchema.parse({
        titulo: "Estudiar",
        fechaLimite: "10/11/2026",
      }),
    ).toThrow()
  })
})
