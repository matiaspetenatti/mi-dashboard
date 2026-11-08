import "@tanstack/react-start/server-only"

import { and, eq, gte, lte, sql } from "drizzle-orm"

import { mesActual } from "@/lib/dates"
import { getDb } from "@/server/db/client"
import { cuentas, movimientos } from "@/server/db/schema"

export type ResumenFinanzas = {
  saldoTotal: number
  ingresosMes: number
  gastosMes: number
  rendimientoDiario: number
  cantidadCuentas: number
}

export async function obtenerResumenFinanzas(): Promise<ResumenFinanzas> {
  const db = getDb()
  const mes = mesActual()

  const [cuentasConSaldo, resumenMes] = await Promise.all([
    db
      .select({
        id: cuentas.id,
        rendimientoAnual: cuentas.rendimientoAnual,
        ingresos: sql<number>`coalesce(sum(case when ${movimientos.tipo} = 'ingreso' then ${movimientos.monto} end), 0)`,
        gastos: sql<number>`coalesce(sum(case when ${movimientos.tipo} = 'gasto' then ${movimientos.monto} end), 0)`,
      })
      .from(cuentas)
      .leftJoin(movimientos, eq(movimientos.cuentaId, cuentas.id))
      .groupBy(cuentas.id),
    db
      .select({
        ingresos: sql<number>`coalesce(sum(case when ${movimientos.tipo} = 'ingreso' then ${movimientos.monto} end), 0)`,
        gastos: sql<number>`coalesce(sum(case when ${movimientos.tipo} = 'gasto' then ${movimientos.monto} end), 0)`,
      })
      .from(movimientos)
      .where(
        and(
          gte(movimientos.fecha, `${mes}-01`),
          lte(movimientos.fecha, `${mes}-31`),
        ),
      ),
  ])

  let saldoTotal = 0
  let rendimientoDiario = 0

  for (const cuenta of cuentasConSaldo) {
    const saldo = Number(cuenta.ingresos) - Number(cuenta.gastos)
    saldoTotal += saldo

    if (saldo > 0 && Number(cuenta.rendimientoAnual) > 0) {
      rendimientoDiario += Math.round(
        (saldo * (Number(cuenta.rendimientoAnual) / 100)) / 365,
      )
    }
  }

  return {
    saldoTotal,
    ingresosMes: Number(resumenMes[0]?.ingresos ?? 0),
    gastosMes: Number(resumenMes[0]?.gastos ?? 0),
    rendimientoDiario,
    cantidadCuentas: cuentasConSaldo.length,
  }
}
