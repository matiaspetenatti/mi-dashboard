import { createServerFn } from "@tanstack/react-start"

import { authMiddleware } from "@/server/auth/middleware"
import {
  actualizarAnimeSchema,
  actualizarProgresoSchema,
  buscarKitsuSchema,
  calendarioAnimesSchema,
  crearAnimeSchema,
  detalleKitsuSchema,
  idAnimeSchema,
} from "../schemas"

export const getResumenAnimes = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async () => {
    const { obtenerResumenAnimes } = await import("./queries")
    return obtenerResumenAnimes()
  })

export const getWorkspaceAnimes = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async () => {
    const { obtenerWorkspaceAnimes } = await import("./workspace")
    return obtenerWorkspaceAnimes()
  })

export const buscarKitsu = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator(buscarKitsuSchema)
  .handler(async ({ data }) => {
    const { buscarAnimesKitsu } = await import("./kitsu")
    return buscarAnimesKitsu(data.q)
  })

export const getDetalleKitsu = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator(detalleKitsuSchema)
  .handler(async ({ data }) => {
    const { obtenerAnimeKitsu } = await import("./kitsu")
    return obtenerAnimeKitsu(data.id)
  })

export const getCalendarioAnimes = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator(calendarioAnimesSchema)
  .handler(async ({ data }) => {
    const { obtenerCalendarioAnimes } = await import("./calendario")
    return obtenerCalendarioAnimes(data.forzar)
  })

export const crearAnime = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(crearAnimeSchema)
  .handler(async ({ data }) => {
    const { crearAnimeEnDb } = await import("./mutations")
    return crearAnimeEnDb(data)
  })

export const actualizarAnime = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(actualizarAnimeSchema)
  .handler(async ({ data }) => {
    const { actualizarAnimeEnDb } = await import("./mutations")
    return actualizarAnimeEnDb(data)
  })

export const actualizarProgresoAnime = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(actualizarProgresoSchema)
  .handler(async ({ data }) => {
    const { actualizarProgresoEnDb } = await import("./mutations")
    return actualizarProgresoEnDb(data)
  })

export const alternarFavoritoAnime = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(idAnimeSchema)
  .handler(async ({ data }) => {
    const { alternarFavoritoEnDb } = await import("./mutations")
    return alternarFavoritoEnDb(data.id)
  })

export const borrarAnime = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(idAnimeSchema)
  .handler(async ({ data }) => {
    const { borrarAnimeEnDb } = await import("./mutations")
    return borrarAnimeEnDb(data.id)
  })
