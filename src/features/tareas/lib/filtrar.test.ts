import { describe, expect, it } from "vitest"

import { filtrarTareas, resumenTareas } from "./filtrar"
import type { FiltrosTareas, TareaConDetalle } from "../types"

const filtrosBase: FiltrosTareas = {
  busqueda: "",
  prioridad: null,
  vencimiento: "todas",
  mostrarCompletadas: false,
}

function tarea(overrides: Partial<TareaConDetalle> = {}): TareaConDetalle {
  return {
    id: 1,
    proyectoId: 1,
    estadoId: 1,
    parentId: null,
    titulo: "Tarea",
    descripcion: null,
    prioridad: null,
    fechaInicio: null,
    fechaLimite: null,
    completadaEn: null,
    posicion: 0,
    destacada: false,
    archivadaEn: null,
    estimacionMinutos: null,
    tiempoRegistradoSegundos: 0,
    color: null,
    recurrencia: null,
    recurrenciaCada: 1,
    recurrenciaDiasSemana: null,
    recurrenciaFin: null,
    recurrenciaSaltada: null,
    asignadoA: null,
    creadaEn: "2026-01-01T00:00:00.000Z",
    actualizadaEn: null,
    estado: {
      id: 1,
      nombre: "Por hacer",
      color: "#737373",
      categoria: "pendiente",
      posicion: 0,
    },
    proyecto: {
      id: 1,
      nombre: "Casa",
      color: "#163300",
      prefijo: "CAS",
    },
    etiquetas: [],
    subtareas: [],
    subtareasCompletadas: 0,
    ...overrides,
  }
}

describe("filtrarTareas", () => {
  it("filtra por proyecto, texto y prioridad", () => {
    const t1 = tarea({ id: 1, titulo: "Comprar pintura", prioridad: "alta" })
    const t2 = tarea({
      id: 2,
      proyectoId: 2,
      titulo: "Estudiar",
      prioridad: "baja",
      proyecto: { id: 2, nombre: "Facultad", color: "#0b4c72", prefijo: "FAC" },
    })

    expect(filtrarTareas([t1, t2], 1, filtrosBase)).toHaveLength(1)
    expect(
      filtrarTareas([t1, t2], null, { ...filtrosBase, busqueda: "pintura" }),
    ).toEqual([t1])
    expect(
      filtrarTareas([t1, t2], null, { ...filtrosBase, prioridad: "baja" }),
    ).toEqual([t2])
  })

  it("filtra por vencimiento", () => {
    const vencida = tarea({ id: 1, fechaLimite: "2000-01-01" })
    const futura = tarea({ id: 2, fechaLimite: "2999-01-01" })
    const sinFecha = tarea({ id: 3 })

    expect(
      filtrarTareas([vencida, futura, sinFecha], null, {
        ...filtrosBase,
        vencimiento: "vencidas",
      }),
    ).toEqual([vencida])
    expect(
      filtrarTareas([vencida, futura, sinFecha], null, {
        ...filtrosBase,
        vencimiento: "sin_fecha",
      }),
    ).toEqual([sinFecha])
  })

  it("oculta completadas salvo que se pidan", () => {
    const pendiente = tarea({ id: 1 })
    const completada = tarea({
      id: 2,
      estado: {
        id: 2,
        nombre: "Hecho",
        color: "#22c55e",
        categoria: "completado",
        posicion: 1,
      },
    })

    expect(filtrarTareas([pendiente, completada], null, filtrosBase)).toEqual([
      pendiente,
    ])
    expect(
      filtrarTareas([pendiente, completada], null, {
        ...filtrosBase,
        mostrarCompletadas: true,
      }),
    ).toHaveLength(2)
  })
})

describe("resumenTareas", () => {
  it("cuenta pendientes, vencidas, de hoy y completadas", () => {
    const resumen = resumenTareas([
      tarea({ id: 1, fechaLimite: "2000-01-01" }),
      tarea({ id: 2 }),
      tarea({
        id: 3,
        estado: {
          id: 2,
          nombre: "Hecho",
          color: "#22c55e",
          categoria: "completado",
          posicion: 1,
        },
      }),
    ])

    expect(resumen.pendientes).toBe(2)
    expect(resumen.vencidas).toBe(1)
    expect(resumen.sinFecha).toBe(1)
    expect(resumen.completadas).toBe(1)
  })
})
