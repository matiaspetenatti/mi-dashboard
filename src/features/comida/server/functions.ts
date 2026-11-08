import { createServerFn } from "@tanstack/react-start"

import { authMiddleware } from "@/server/auth/middleware"
import {
  actualizarItemComidaSchema,
  actualizarItemListaSchema,
  actualizarRecetaSchema,
  ajustarCantidadSchema,
  alternarCompradoSchema,
  alternarSlotSchema,
  cocinarRecetaSchema,
  crearRecetaSchema,
  faltantesMenuSchema,
  faltantesRecetaSchema,
  favoritaRecetaSchema,
  idComidaSchema,
  itemComidaSchema,
  itemListaSchema,
  limpiarSemanaSchema,
  slotDiaMomentoSchema,
  slotMenuSchema,
  workspaceComidaSchema,
} from "../schemas"

export const getWorkspaceComida = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator(workspaceComidaSchema)
  .handler(async ({ data }) => {
    const { obtenerWorkspaceComida } = await import("./queries")
    return obtenerWorkspaceComida(data.semana)
  })

export const getResumenComida = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async () => {
    const { obtenerResumenComida } = await import("./queries")
    return obtenerResumenComida()
  })

export const crearItemComida = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(itemComidaSchema)
  .handler(async ({ data }) => {
    const { crearItemEnDb } = await import("./mutations")
    return crearItemEnDb(data)
  })

export const actualizarItemComida = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(actualizarItemComidaSchema)
  .handler(async ({ data }) => {
    const { actualizarItemEnDb } = await import("./mutations")
    return actualizarItemEnDb(data)
  })

export const ajustarCantidadComida = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(ajustarCantidadSchema)
  .handler(async ({ data }) => {
    const { ajustarCantidadEnDb } = await import("./mutations")
    return ajustarCantidadEnDb(data.id, data.cantidad)
  })

export const eliminarItemComida = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(idComidaSchema)
  .handler(async ({ data }) => {
    const { eliminarItemEnDb } = await import("./mutations")
    return eliminarItemEnDb(data.id)
  })

export const crearReceta = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(crearRecetaSchema)
  .handler(async ({ data }) => {
    const { crearRecetaEnDb } = await import("./mutations")
    return crearRecetaEnDb(data)
  })

export const actualizarReceta = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(actualizarRecetaSchema)
  .handler(async ({ data }) => {
    const { actualizarRecetaEnDb } = await import("./mutations")
    return actualizarRecetaEnDb(data)
  })

export const alternarFavoritaReceta = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(favoritaRecetaSchema)
  .handler(async ({ data }) => {
    const { alternarFavoritaEnDb } = await import("./mutations")
    return alternarFavoritaEnDb(data.id, data.favorita)
  })

export const eliminarReceta = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(idComidaSchema)
  .handler(async ({ data }) => {
    const { eliminarRecetaEnDb } = await import("./mutations")
    return eliminarRecetaEnDb(data.id)
  })

export const cocinarReceta = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(cocinarRecetaSchema)
  .handler(async ({ data }) => {
    const { cocinarRecetaEnDb } = await import("./mutations")
    return cocinarRecetaEnDb(data.id, data.descontarStock)
  })

export const guardarSlotMenu = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(slotMenuSchema)
  .handler(async ({ data }) => {
    const { guardarSlotEnDb } = await import("./mutations")
    return guardarSlotEnDb(data)
  })

export const alternarSlotHecho = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(alternarSlotSchema)
  .handler(async ({ data }) => {
    const { alternarSlotHechoEnDb } = await import("./mutations")
    return alternarSlotHechoEnDb(data.dia, data.momento, data.hecho)
  })

export const eliminarSlotMenu = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(slotDiaMomentoSchema)
  .handler(async ({ data }) => {
    const { eliminarSlotEnDb } = await import("./mutations")
    return eliminarSlotEnDb(data.dia, data.momento)
  })

export const limpiarSemanaComida = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(limpiarSemanaSchema)
  .handler(async ({ data }) => {
    const { limpiarSemanaEnDb } = await import("./mutations")
    return limpiarSemanaEnDb(data.semana)
  })

export const crearItemLista = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(itemListaSchema)
  .handler(async ({ data }) => {
    const { crearItemListaEnDb } = await import("./mutations")
    return crearItemListaEnDb(data)
  })

export const actualizarItemLista = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(actualizarItemListaSchema)
  .handler(async ({ data }) => {
    const { actualizarItemListaEnDb } = await import("./mutations")
    return actualizarItemListaEnDb(data)
  })

export const alternarComprado = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(alternarCompradoSchema)
  .handler(async ({ data }) => {
    const { alternarCompradoEnDb } = await import("./mutations")
    return alternarCompradoEnDb(data.id, data.comprado)
  })

export const eliminarItemLista = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(idComidaSchema)
  .handler(async ({ data }) => {
    const { eliminarItemListaEnDb } = await import("./mutations")
    return eliminarItemListaEnDb(data.id)
  })

export const limpiarComprados = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async () => {
    const { limpiarCompradosEnDb } = await import("./mutations")
    return limpiarCompradosEnDb()
  })

export const agregarFaltantesReceta = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(faltantesRecetaSchema)
  .handler(async ({ data }) => {
    const { agregarFaltantesRecetaEnDb } = await import("./mutations")
    return agregarFaltantesRecetaEnDb(data.recetaId)
  })

export const agregarFaltantesMenu = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(faltantesMenuSchema)
  .handler(async ({ data }) => {
    const { agregarFaltantesMenuEnDb } = await import("./mutations")
    return agregarFaltantesMenuEnDb(data.semana)
  })

export const agregarSugerenciasStock = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async () => {
    const { agregarSugerenciasStockEnDb } = await import("./mutations")
    return agregarSugerenciasStockEnDb()
  })
