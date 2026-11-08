import { createServerFn } from "@tanstack/react-start"

import { authMiddleware } from "@/server/auth/middleware"
import {
  actualizarEpisodioSchema,
  cerrarEpisodioSchema,
  crearEpisodioSchema,
  guardarRegistroDiarioSchema,
  idSaludSchema,
} from "../schemas"

export const getWorkspaceSalud = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async () => {
    const { obtenerWorkspaceSalud } = await import("./queries")
    return obtenerWorkspaceSalud()
  })

export const getResumenSalud = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async () => {
    const { obtenerResumenSalud } = await import("./queries")
    return obtenerResumenSalud()
  })

export const crearEpisodio = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(crearEpisodioSchema)
  .handler(async ({ data }) => {
    const { crearEpisodioEnDb } = await import("./mutations")
    return crearEpisodioEnDb(data)
  })

export const actualizarEpisodio = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(actualizarEpisodioSchema)
  .handler(async ({ data }) => {
    const { actualizarEpisodioEnDb } = await import("./mutations")
    return actualizarEpisodioEnDb(data)
  })

export const cerrarEpisodio = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(cerrarEpisodioSchema)
  .handler(async ({ data }) => {
    const { cerrarEpisodioEnDb } = await import("./mutations")
    return cerrarEpisodioEnDb(data)
  })

export const eliminarEpisodio = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(idSaludSchema)
  .handler(async ({ data }) => {
    const { eliminarEpisodioEnDb } = await import("./mutations")
    return eliminarEpisodioEnDb(data.id)
  })

export const guardarRegistroDiario = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(guardarRegistroDiarioSchema)
  .handler(async ({ data }) => {
    const { guardarRegistroDiarioEnDb } = await import("./mutations")
    return guardarRegistroDiarioEnDb(data)
  })

export const eliminarRegistroDiario = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(idSaludSchema)
  .handler(async ({ data }) => {
    const { eliminarRegistroDiarioEnDb } = await import("./mutations")
    return eliminarRegistroDiarioEnDb(data.id)
  })
