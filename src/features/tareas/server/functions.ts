import { createServerFn } from "@tanstack/react-start"

import { authMiddleware } from "@/server/auth/middleware"
import {
  actualizarTareaSchema,
  alternarTareaSchema,
  crearProyectoSchema,
  crearTareaRapidaSchema,
  crearTareaSchema,
  eliminarTareaSchema,
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
