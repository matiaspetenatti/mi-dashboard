import "@tanstack/react-start/server-only"

import { eq } from "drizzle-orm"

import { getDb } from "@/server/db/client"
import { cuentas, movimientos } from "@/server/db/schema"
import type { CrearCuentaInput, CrearMovimientoInput } from "../schemas"

export async function crearMovimientoEnDb(input: CrearMovimientoInput) {
  const db = getDb()
  const cuenta = (
    await db
      .select({ id: cuentas.id })
      .from(cuentas)
      .where(eq(cuentas.id, input.cuentaId))
      .limit(1)
  ).at(0)

  if (!cuenta) throw new Error("La cuenta no existe")

  const movimiento = (
    await db
      .insert(movimientos)
      .values({
        cuentaId: input.cuentaId,
        tipo: input.tipo,
        monto: input.monto,
        categoria: input.categoria,
        descripcion: input.descripcion ?? null,
        fecha: input.fecha,
      })
      .returning({ id: movimientos.id })
  ).at(0)

  if (!movimiento) throw new Error("No se pudo crear el movimiento")
  return { id: movimiento.id }
}

export async function eliminarMovimientoEnDb(id: number) {
  const db = getDb()
  await db.delete(movimientos).where(eq(movimientos.id, id))
  return { ok: true }
}

export async function crearCuentaEnDb(input: CrearCuentaInput) {
  const db = getDb()
  const cuenta = (
    await db
      .insert(cuentas)
      .values({
        nombre: input.nombre,
        tipo: input.tipo,
        color: input.color,
        rendimientoAnual: input.rendimientoAnual,
      })
      .returning({ id: cuentas.id })
  ).at(0)

  if (!cuenta) throw new Error("No se pudo crear la cuenta")
  return { id: cuenta.id }
}
