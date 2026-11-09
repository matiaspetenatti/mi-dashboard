import "@tanstack/react-start/server-only"

import { eq, sql } from "drizzle-orm"

import { fechaHoy } from "@/lib/dates"
import { getDb } from "@/server/db/client"
import { cuentas, movimientos } from "@/server/db/schema"
import {
  CATEGORIA_AJUSTE,
  calcularAjusteSaldo,
} from "../lib/cuentas"
import type {
  ActualizarCuentaInput,
  AjustarSaldoInput,
  CrearCuentaInput,
  CrearMovimientoInput,
} from "../schemas"

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

  return db.transaction(async (tx) => {
    const cuenta = (
      await tx
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

    const ajuste = calcularAjusteSaldo({
      saldoActualCentavos: 0,
      nuevoSaldoCentavos: input.saldoInicialCentavos,
    })

    if (ajuste.tipo) {
      await tx.insert(movimientos).values({
        cuentaId: cuenta.id,
        tipo: ajuste.tipo,
        monto: ajuste.monto,
        categoria: CATEGORIA_AJUSTE,
        descripcion: "Saldo inicial",
        fecha: fechaHoy(),
      })
    }

    return { id: cuenta.id }
  })
}

export async function actualizarCuentaEnDb(input: ActualizarCuentaInput) {
  const db = getDb()
  const { id, ...cambios } = input

  await db.update(cuentas).set(cambios).where(eq(cuentas.id, id))

  return { ok: true }
}

export async function ajustarSaldoCuentaEnDb(input: AjustarSaldoInput) {
  const db = getDb()
  const cuenta = (
    await db
      .select({ id: cuentas.id })
      .from(cuentas)
      .where(eq(cuentas.id, input.cuentaId))
      .limit(1)
  ).at(0)

  if (!cuenta) throw new Error("La cuenta no existe")

  const totales = (
    await db
      .select({
        ingresos: sql<number>`coalesce(sum(case when ${movimientos.tipo} = 'ingreso' then ${movimientos.monto} end), 0)`,
        gastos: sql<number>`coalesce(sum(case when ${movimientos.tipo} = 'gasto' then ${movimientos.monto} end), 0)`,
      })
      .from(movimientos)
      .where(eq(movimientos.cuentaId, input.cuentaId))
  ).at(0)

  const saldoActualCentavos =
    Number(totales?.ingresos ?? 0) - Number(totales?.gastos ?? 0)

  const ajuste = calcularAjusteSaldo({
    saldoActualCentavos,
    nuevoSaldoCentavos: input.nuevoSaldoCentavos,
  })

  if (!ajuste.tipo) {
    return { ok: true, sinCambios: true }
  }

  await db.insert(movimientos).values({
    cuentaId: input.cuentaId,
    tipo: ajuste.tipo,
    monto: ajuste.monto,
    categoria: CATEGORIA_AJUSTE,
    descripcion: input.descripcion?.trim() || "Ajuste de saldo",
    fecha: input.fecha ?? fechaHoy(),
  })

  return {
    ok: true,
    sinCambios: false,
    diferencia: ajuste.diferencia,
  }
}
