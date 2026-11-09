import "@tanstack/react-start/server-only"

import {
  and,
  asc,
  desc,
  eq,
  gte,
  like,
  lte,
  or,
  sql,
  type SQL,
} from "drizzle-orm"

import { mesActual } from "@/lib/dates"
import { getDb } from "@/server/db/client"
import { cuentas, movimientos } from "@/server/db/schema"
import { CATEGORIA_AJUSTE } from "../lib/cuentas"
import type { MovimientosFinanzasInput } from "../schemas"
import type {
  MovimientoConCuenta,
  PaginaMovimientosFinanzas,
} from "../types"

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
  const sinAjustes = sql`lower(${movimientos.categoria}) <> ${CATEGORIA_AJUSTE.toLowerCase()}`

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
          sinAjustes,
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

export async function obtenerMovimientosFinanzas(
  input: MovimientosFinanzasInput,
): Promise<PaginaMovimientosFinanzas> {
  const db = getDb()
  const porPagina = Math.min(input.porPagina, 20)
  const condiciones: SQL[] = []

  if (input.tipo !== "todos") {
    condiciones.push(eq(movimientos.tipo, input.tipo))
  }

  if (input.cuentaId !== null) {
    condiciones.push(eq(movimientos.cuentaId, input.cuentaId))
  }

  if (input.categoria) {
    condiciones.push(eq(movimientos.categoria, input.categoria))
  }

  if (input.busqueda) {
    const patron = `%${input.busqueda}%`
    const filtroBusqueda = or(
      like(movimientos.descripcion, patron),
      like(movimientos.categoria, patron),
    )
    if (filtroBusqueda) condiciones.push(filtroBusqueda)
  }

  if (input.ocultarRendimientos) {
    condiciones.push(
      sql`lower(${movimientos.categoria}) not like '%rendimiento%'`,
    )
  }

  const filtro = condiciones.length > 0 ? and(...condiciones) : undefined

  const [totalFila, categoriasFilas] = await Promise.all([
    db
      .select({ total: sql<number>`count(*)` })
      .from(movimientos)
      .where(filtro),
    db
      .select({ categoria: movimientos.categoria })
      .from(movimientos)
      .groupBy(movimientos.categoria)
      .orderBy(asc(movimientos.categoria)),
  ])

  const total = Number(totalFila.at(0)?.total ?? 0)
  const totalPaginas = Math.max(1, Math.ceil(total / porPagina))
  const pagina = Math.min(Math.max(input.pagina, 1), totalPaginas)

  const filas = await db
    .select({
      movimiento: movimientos,
      cuenta: {
        id: cuentas.id,
        nombre: cuentas.nombre,
        color: cuentas.color,
      },
    })
    .from(movimientos)
    .leftJoin(cuentas, eq(movimientos.cuentaId, cuentas.id))
    .where(filtro)
    .orderBy(desc(movimientos.fecha), desc(movimientos.id))
    .limit(porPagina)
    .offset((pagina - 1) * porPagina)

  const movimientosConCuenta: MovimientoConCuenta[] = filas.map((fila) => ({
    ...fila.movimiento,
    cuenta: fila.cuenta?.id ? fila.cuenta : null,
  }))

  return {
    movimientos: movimientosConCuenta,
    total,
    pagina,
    porPagina,
    totalPaginas,
    categorias: categoriasFilas.map((fila) => fila.categoria),
  }
}
