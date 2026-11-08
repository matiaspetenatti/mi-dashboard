import { createServerFn } from "@tanstack/react-start"

import { authMiddleware } from "@/server/auth/middleware"
import {
  buscarUbicacionesSchema,
  crearUbicacionSchema,
  eliminarUbicacionSchema,
  seleccionarUbicacionSchema,
} from "../schemas"

export const getResumenClima = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async () => {
    const { obtenerResumenClima } = await import("./queries")
    return obtenerResumenClima()
  })

export const getWorkspaceClima = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async () => {
    const { obtenerWorkspaceClima } = await import("./workspace")
    return obtenerWorkspaceClima()
  })

export const crearUbicacion = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(crearUbicacionSchema)
  .handler(async ({ data }) => {
    const { crearUbicacionEnDb } = await import("./mutations")
    return crearUbicacionEnDb(data)
  })

export const seleccionarUbicacion = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(seleccionarUbicacionSchema)
  .handler(async ({ data }) => {
    const { seleccionarUbicacionEnDb } = await import("./mutations")
    return seleccionarUbicacionEnDb(data.id)
  })

export const eliminarUbicacion = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(eliminarUbicacionSchema)
  .handler(async ({ data }) => {
    const { eliminarUbicacionEnDb } = await import("./mutations")
    return eliminarUbicacionEnDb(data.id)
  })

export const buscarUbicaciones = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator(buscarUbicacionesSchema)
  .handler(async ({ data }) => {
    const { buscarUbicacionesEnApi } = await import("./geocoding")
    return buscarUbicacionesEnApi(data.query)
  })

