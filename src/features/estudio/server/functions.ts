import { createServerFn } from "@tanstack/react-start"

import { authMiddleware } from "@/server/auth/middleware"
import {
  actualizarCarreraSchema,
  actualizarExamenSchema,
  actualizarMateriaSchema,
  crearCarreraSchema,
  crearExamenSchema,
  crearMateriaSchema,
  idSchema,
  registrarSesionSchema,
} from "../schemas"

export const getResumenEstudio = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async () => {
    const { obtenerResumenEstudio } = await import("./queries")
    return obtenerResumenEstudio()
  })

export const getWorkspaceEstudio = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async () => {
    const { obtenerWorkspaceEstudio } = await import("./workspace")
    return obtenerWorkspaceEstudio()
  })

export const crearCarrera = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(crearCarreraSchema)
  .handler(async ({ data }) => {
    const { crearCarreraEnDb } = await import("./mutations")
    return crearCarreraEnDb(data)
  })

export const actualizarCarrera = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(actualizarCarreraSchema)
  .handler(async ({ data }) => {
    const { actualizarCarreraEnDb } = await import("./mutations")
    return actualizarCarreraEnDb(data)
  })

export const borrarCarrera = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(idSchema)
  .handler(async ({ data }) => {
    const { borrarCarreraEnDb } = await import("./mutations")
    return borrarCarreraEnDb(data.id)
  })

export const crearMateria = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(crearMateriaSchema)
  .handler(async ({ data }) => {
    const { crearMateriaEnDb } = await import("./mutations")
    return crearMateriaEnDb(data)
  })

export const actualizarMateria = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(actualizarMateriaSchema)
  .handler(async ({ data }) => {
    const { actualizarMateriaEnDb } = await import("./mutations")
    return actualizarMateriaEnDb(data)
  })

export const borrarMateria = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(idSchema)
  .handler(async ({ data }) => {
    const { borrarMateriaEnDb } = await import("./mutations")
    return borrarMateriaEnDb(data.id)
  })

export const crearExamen = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(crearExamenSchema)
  .handler(async ({ data }) => {
    const { crearExamenEnDb } = await import("./mutations")
    return crearExamenEnDb(data)
  })

export const actualizarExamen = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(actualizarExamenSchema)
  .handler(async ({ data }) => {
    const { actualizarExamenEnDb } = await import("./mutations")
    return actualizarExamenEnDb(data)
  })

export const borrarExamen = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(idSchema)
  .handler(async ({ data }) => {
    const { borrarExamenEnDb } = await import("./mutations")
    return borrarExamenEnDb(data.id)
  })

export const registrarSesion = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(registrarSesionSchema)
  .handler(async ({ data }) => {
    const { registrarSesionEnDb } = await import("./mutations")
    return registrarSesionEnDb(data)
  })
