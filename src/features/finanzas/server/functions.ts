import { createServerFn } from "@tanstack/react-start"

import { authMiddleware } from "@/server/auth/middleware"
import {
  actualizarCuentaSchema,
  ajustarSaldoSchema,
  crearCuentaSchema,
  crearMovimientoSchema,
  eliminarCuentaSchema,
  eliminarMovimientoSchema,
  movimientosFinanzasSchema,
} from "../schemas"

export const getResumenFinanzas = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async () => {
    const { obtenerResumenFinanzas } = await import("./queries")
    return obtenerResumenFinanzas()
  })

export const getWorkspaceFinanzas = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async () => {
    const { obtenerWorkspaceFinanzas } = await import("./workspace")
    return obtenerWorkspaceFinanzas()
  })

export const getMovimientosFinanzas = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator(movimientosFinanzasSchema)
  .handler(async ({ data }) => {
    const { obtenerMovimientosFinanzas } = await import("./queries")
    return obtenerMovimientosFinanzas(data)
  })

export const crearMovimiento = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(crearMovimientoSchema)
  .handler(async ({ data }) => {
    const { crearMovimientoEnDb } = await import("./mutations")
    return crearMovimientoEnDb(data)
  })

export const eliminarMovimiento = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(eliminarMovimientoSchema)
  .handler(async ({ data }) => {
    const { eliminarMovimientoEnDb } = await import("./mutations")
    return eliminarMovimientoEnDb(data.id)
  })

export const crearCuenta = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(crearCuentaSchema)
  .handler(async ({ data }) => {
    const { crearCuentaEnDb } = await import("./mutations")
    return crearCuentaEnDb(data)
  })

export const actualizarCuenta = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(actualizarCuentaSchema)
  .handler(async ({ data }) => {
    const { actualizarCuentaEnDb } = await import("./mutations")
    return actualizarCuentaEnDb(data)
  })

export const ajustarSaldoCuenta = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(ajustarSaldoSchema)
  .handler(async ({ data }) => {
    const { ajustarSaldoCuentaEnDb } = await import("./mutations")
    return ajustarSaldoCuentaEnDb(data)
  })

export const eliminarCuenta = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(eliminarCuentaSchema)
  .handler(async ({ data }) => {
    const { eliminarCuentaEnDb } = await import("./mutations")
    return eliminarCuentaEnDb(data.id)
  })
