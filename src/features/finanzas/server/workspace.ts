import "@tanstack/react-start/server-only"

import { and, asc, desc, eq, gte, lte, sql } from "drizzle-orm"

import { fechaHoy, mesActual, sumarFecha } from "@/lib/dates"
import { getDb } from "@/server/db/client"
import {
  categoriasFinanzas,
  cuentas,
  movimientos,
} from "@/server/db/schema"
import type {
  CuentaConSaldo,
  FinanzasWorkspace,
  MovimientoConCuenta,
  PuntoEvolucion,
} from "../types"

function calcularRendimientoDiario(
  saldoCentavos: number,
  tnaPorcentaje: number,
): number {
  if (saldoCentavos <= 0 || tnaPorcentaje <= 0) return 0
  return Math.round((saldoCentavos * (tnaPorcentaje / 100)) / 365)
}

export async function obtenerWorkspaceFinanzas(): Promise<FinanzasWorkspace> {
  const db = getDb()
  const hoy = fechaHoy()
  const mes = mesActual()
  const inicio = sumarFecha(hoy, "dia", -364)

  const [
    listaCuentas,
    totalesPorCuenta,
    resumenMes,
    categoriasMes,
    movimientosRecientes,
    categoriasDisponibles,
    saldoPrevio,
    cambios,
  ] = await Promise.all([
    db.select().from(cuentas).orderBy(asc(cuentas.id)),
    db
      .select({
        cuentaId: movimientos.cuentaId,
        ingresos: sql<number>`coalesce(sum(case when ${movimientos.tipo} = 'ingreso' then ${movimientos.monto} end), 0)`,
        gastos: sql<number>`coalesce(sum(case when ${movimientos.tipo} = 'gasto' then ${movimientos.monto} end), 0)`,
      })
      .from(movimientos)
      .groupBy(movimientos.cuentaId),
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
    db
      .select({
        nombre: movimientos.categoria,
        total: sql<number>`coalesce(sum(${movimientos.monto}), 0)`,
      })
      .from(movimientos)
      .where(
        and(
          eq(movimientos.tipo, "gasto"),
          gte(movimientos.fecha, `${mes}-01`),
          lte(movimientos.fecha, `${mes}-31`),
        ),
      )
      .groupBy(movimientos.categoria)
      .orderBy(desc(sql<number>`sum(${movimientos.monto})`))
      .limit(8),
    db
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
      .orderBy(desc(movimientos.fecha), desc(movimientos.id))
      .limit(40),
    db
      .select()
      .from(categoriasFinanzas)
      .where(eq(categoriasFinanzas.activo, true))
      .orderBy(asc(categoriasFinanzas.orden), asc(categoriasFinanzas.nombre)),
    db
      .select({
        neto: sql<number>`coalesce(sum(case when ${movimientos.tipo} = 'ingreso' then ${movimientos.monto} else -${movimientos.monto} end), 0)`,
      })
      .from(movimientos)
      .where(sql`${movimientos.fecha} < ${inicio}`),
    db
      .select({
        fecha: movimientos.fecha,
        neto: sql<number>`coalesce(sum(case when ${movimientos.tipo} = 'ingreso' then ${movimientos.monto} else -${movimientos.monto} end), 0)`,
      })
      .from(movimientos)
      .where(
        and(gte(movimientos.fecha, inicio), lte(movimientos.fecha, hoy)),
      )
      .groupBy(movimientos.fecha)
      .orderBy(asc(movimientos.fecha)),
  ])

  const totales = new Map(
    totalesPorCuenta.map((fila) => [
      fila.cuentaId,
      {
        ingresos: Number(fila.ingresos),
        gastos: Number(fila.gastos),
      },
    ]),
  )

  const cuentasConSaldo: CuentaConSaldo[] = listaCuentas.map((cuenta) => {
    const fila = totales.get(cuenta.id)
    const saldo = (fila?.ingresos ?? 0) - (fila?.gastos ?? 0)
    const estimadoDiario = calcularRendimientoDiario(
      saldo,
      Number(cuenta.rendimientoAnual),
    )
    return {
      ...cuenta,
      saldo,
      estimadoDiario,
      estimadoMensual: estimadoDiario * 30,
    }
  })

  const saldoTotal = cuentasConSaldo.reduce(
    (total, cuenta) => total + cuenta.saldo,
    0,
  )
  const rendimientoDiario = cuentasConSaldo.reduce(
    (total, cuenta) => total + cuenta.estimadoDiario,
    0,
  )

  const cambiosPorDia = new Map(
    cambios.map((fila) => [fila.fecha, Number(fila.neto)]),
  )
  // Si el rango pedido arranca antes del primer movimiento registrado, no
  // dibujamos un tramo plano en cero: el patrimonio previo es desconocido.
  const primeraFechaConCambios = cambios.at(0)?.fecha
  const inicioEvolucion =
    primeraFechaConCambios && primeraFechaConCambios > inicio
      ? primeraFechaConCambios
      : inicio

  let saldoCentavos = Number(saldoPrevio.at(0)?.neto ?? 0)
  const evolucion: PuntoEvolucion[] = []
  let fechaIter = inicioEvolucion

  while (fechaIter <= hoy) {
    saldoCentavos += cambiosPorDia.get(fechaIter) ?? 0
    evolucion.push({
      fecha: fechaIter,
      saldo: Math.round(saldoCentavos) / 100,
    })
    fechaIter = sumarFecha(fechaIter, "dia", 1)
  }

  const movimientosConCuenta: MovimientoConCuenta[] = movimientosRecientes.map(
    (fila) => ({
      ...fila.movimiento,
      cuenta: fila.cuenta?.id ? fila.cuenta : null,
    }),
  )

  return {
    cuentas: cuentasConSaldo,
    resumen: {
      saldoTotal,
      ingresosMes: Number(resumenMes.at(0)?.ingresos ?? 0),
      gastosMes: Number(resumenMes.at(0)?.gastos ?? 0),
      rendimientoDiario,
      rendimientoMensual: rendimientoDiario * 30,
      cantidadCuentas: cuentasConSaldo.length,
    },
    categorias: categoriasMes.map((fila) => ({
      nombre: fila.nombre,
      total: Number(fila.total),
    })),
    movimientos: movimientosConCuenta,
    evolucion,
    categoriasDisponibles,
  }
}
