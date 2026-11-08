import { createServerFn } from "@tanstack/react-start"

import { authMiddleware } from "@/server/auth/middleware"
import {
  actualizarEstadoSchema,
  actualizarProyectoSchema,
  actualizarTareaSchema,
  alternarTareaSchema,
  crearEstadoSchema,
  crearEtiquetaSchema,
  crearProyectoSchema,
  crearTareaRapidaSchema,
  crearTareaSchema,
  eliminarTareaSchema,
  etiquetaTareaSchema,
  moverTareaSchema,
} from "../schemas"

export const getResumenTareas = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async () => {
    const { obtenerResumenTareas } = await import("./queries")
    return obtenerResumenTareas()
  })

export const getWorkspaceTareas = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async () => {
    const { obtenerWorkspaceTareas } = await import("./workspace")
    return obtenerWorkspaceTareas()
  })

export const crearTareaRapida = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(crearTareaRapidaSchema)
  .handler(async ({ data }) => {
    const { crearTareaRapidaEnDb } = await import("./crear")
    return crearTareaRapidaEnDb(data)
  })

export const crearTarea = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(crearTareaSchema)
  .handler(async ({ data }) => {
    const { crearTareaEnDb } = await import("./mutations")
    return crearTareaEnDb(data)
  })

export const actualizarTarea = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(actualizarTareaSchema)
  .handler(async ({ data }) => {
    const { actualizarTareaEnDb } = await import("./mutations")
    return actualizarTareaEnDb(data)
  })

export const moverTarea = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(moverTareaSchema)
  .handler(async ({ data }) => {
    const { moverTareaEnDb } = await import("./mutations")
    return moverTareaEnDb(data)
  })

export const alternarTarea = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(alternarTareaSchema)
  .handler(async ({ data }) => {
    const { alternarTareaEnDb } = await import("./mutations")
    return alternarTareaEnDb(data)
  })

export const eliminarTarea = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(eliminarTareaSchema)
  .handler(async ({ data }) => {
    const { eliminarTareaEnDb } = await import("./mutations")
    return eliminarTareaEnDb(data.id)
  })

export const crearProyecto = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(crearProyectoSchema)
  .handler(async ({ data }) => {
    const { crearProyectoEnDb } = await import("./mutations")
    return crearProyectoEnDb(data)
  })

export const actualizarProyecto = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(actualizarProyectoSchema)
  .handler(async ({ data }) => {
    const { actualizarProyectoEnDb } = await import("./mutations")
    return actualizarProyectoEnDb(data)
  })

export const crearEstado = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(crearEstadoSchema)
  .handler(async ({ data }) => {
    const { crearEstadoEnDb } = await import("./mutations")
    return crearEstadoEnDb(data)
  })

export const actualizarEstado = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(actualizarEstadoSchema)
  .handler(async ({ data }) => {
    const { actualizarEstadoEnDb } = await import("./mutations")
    return actualizarEstadoEnDb(data)
  })

export const crearEtiqueta = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(crearEtiquetaSchema)
  .handler(async ({ data }) => {
    const { crearEtiquetaEnDb } = await import("./mutations")
    return crearEtiquetaEnDb(data)
  })

export const asignarEtiqueta = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(etiquetaTareaSchema)
  .handler(async ({ data }) => {
    const { asignarEtiquetaEnDb } = await import("./mutations")
    return asignarEtiquetaEnDb(data)
  })

export const quitarEtiqueta = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(etiquetaTareaSchema)
  .handler(async ({ data }) => {
    const { quitarEtiquetaEnDb } = await import("./mutations")
    return quitarEtiquetaEnDb(data)
  })
