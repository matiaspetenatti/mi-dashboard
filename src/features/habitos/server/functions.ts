import { createServerFn } from "@tanstack/react-start"

import { authMiddleware } from "@/server/auth/middleware"
import {
  actualizarHabitoSchema,
  alternarActivoHabitoSchema,
  crearHabitoSchema,
  idHabitoSchema,
  registrarHabitoSchema,
} from "../schemas"

export const getWorkspaceHabitos = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async () => {
    const { obtenerWorkspaceHabitos } = await import("./queries")
    return obtenerWorkspaceHabitos()
  })

export const getResumenHabitos = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async () => {
    const { obtenerResumenHabitos } = await import("./queries")
    return obtenerResumenHabitos()
  })

export const crearHabito = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(crearHabitoSchema)
  .handler(async ({ data }) => {
    const { crearHabitoEnDb } = await import("./mutations")
    return crearHabitoEnDb(data)
  })

export const actualizarHabito = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(actualizarHabitoSchema)
  .handler(async ({ data }) => {
    const { actualizarHabitoEnDb } = await import("./mutations")
    return actualizarHabitoEnDb(data)
  })

export const alternarActivoHabito = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(alternarActivoHabitoSchema)
  .handler(async ({ data }) => {
    const { alternarActivoEnDb } = await import("./mutations")
    return alternarActivoEnDb(data.id, data.activo)
  })

export const eliminarHabito = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(idHabitoSchema)
  .handler(async ({ data }) => {
    const { eliminarHabitoEnDb } = await import("./mutations")
    return eliminarHabitoEnDb(data.id)
  })

export const registrarHabito = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(registrarHabitoSchema)
  .handler(async ({ data }) => {
    const { registrarHabitoEnDb } = await import("./mutations")
    return registrarHabitoEnDb(data)
  })

export const sincronizarGithub = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async () => {
    const { sincronizarGithubEnDb } = await import("./github")
    return sincronizarGithubEnDb()
  })
