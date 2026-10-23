import { db } from "@/db";
import { cuentas, movimientos } from "./schema";
import { and, eq, gt, isNull, lte, sql } from "drizzle-orm";
import { fechaHoy, sumarFecha } from "@/lib/format";

export function calcularRendimientoDiario(
  saldoCentavos: number,
  tnaPorcentaje: number
): number {
  if (saldoCentavos <= 0 || tnaPorcentaje <= 0) return 0;
  // Fórmula TNA estándar diaria: (saldo * (TNA / 100)) / 365
  return Math.round((saldoCentavos * (tnaPorcentaje / 100)) / 365);
}

/**
 * Prepara Finanzas antes de calcular rendimientos.
 *
 * No debe llamarse desde lecturas cacheadas: crea/asocia cuentas y escribe
 * movimientos. Se ejecuta desde el endpoint diario y desde acciones.
 */
export async function prepararFinanzas() {
  await asegurarCuentasIniciales();
  return reconciliarRendimientos();
}

export async function asegurarCuentasIniciales() {
  const existentes = await db.select().from(cuentas).limit(1);
  if (existentes.length === 0) {
    const [cuenta] = await db
      .insert(cuentas)
      .values({
        nombre: "Cuenta Principal",
        tipo: "banco",
        color: "#3b82f6",
        rendimientoAnual: 0,
        ultimoRendimientoFecha: fechaHoy(),
      })
      .returning();

    if (cuenta) {
      await db
        .update(movimientos)
        .set({ cuentaId: cuenta.id })
        .where(isNull(movimientos.cuentaId));
    }
    return [cuenta];
  }

  // Si hay movimientos huérfanos, asociarlos a la primera cuenta existente
  const primerCuenta = existentes[0];
  if (primerCuenta) {
    await db
      .update(movimientos)
      .set({ cuentaId: primerCuenta.id })
      .where(isNull(movimientos.cuentaId));
  }

  return existentes;
}

export async function reconciliarRendimientos() {
  const hoy = fechaHoy();
  const ayer = sumarFecha(hoy, "dia", -1);

  // Cuentas con rendimiento anual activo
  const cuentasActivas = await db
    .select()
    .from(cuentas)
    .where(gt(cuentas.rendimientoAnual, 0));

  let totalGenerados = 0;
  let totalMontoCentavos = 0;

  for (const cuenta of cuentasActivas) {
    // Si no tiene fecha previa de cálculo, comenzamos desde ayer
    let fechaInicio: string;
    if (cuenta.ultimoRendimientoFecha) {
      fechaInicio = sumarFecha(cuenta.ultimoRendimientoFecha, "dia", 1);
    } else {
      fechaInicio = ayer;
    }

    // Límite de seguridad: máximo 30 días hacia atrás para evitar loops
    const limitePasado = sumarFecha(hoy, "dia", -30);
    if (fechaInicio < limitePasado) {
      fechaInicio = limitePasado;
    }

    let fechaIter = fechaInicio;

    while (fechaIter <= ayer) {
      // 1. Verificar si ya se registró el rendimiento de este día para evitar duplicados
      const [existente] = await db
        .select({ id: movimientos.id })
        .from(movimientos)
        .where(
          and(
            eq(movimientos.cuentaId, cuenta.id),
            eq(movimientos.categoria, "Rendimientos"),
            eq(movimientos.fecha, fechaIter)
          )
        )
        .limit(1);

      if (!existente) {
        // 2. Calcular el saldo de la cuenta al cierre de ese día
        // (excluyendo rendimientos de ese mismo día para no duplicar)
        const [res] = await db
          .select({
            ingresos: sql<number>`coalesce(sum(case when ${movimientos.tipo} = 'ingreso' and not (${movimientos.categoria} = 'Rendimientos' and ${movimientos.fecha} = ${fechaIter}) then ${movimientos.monto} end), 0)`,
            gastos: sql<number>`coalesce(sum(case when ${movimientos.tipo} = 'gasto' then ${movimientos.monto} end), 0)`,
          })
          .from(movimientos)
          .where(
            and(
              eq(movimientos.cuentaId, cuenta.id),
              lte(movimientos.fecha, fechaIter)
            )
          );

        const saldo = Number(res?.ingresos ?? 0) - Number(res?.gastos ?? 0);

        if (saldo > 0) {
          const rendimientoCentavos = calcularRendimientoDiario(
            saldo,
            cuenta.rendimientoAnual
          );

          if (rendimientoCentavos > 0) {
            await db.insert(movimientos).values({
              cuentaId: cuenta.id,
              tipo: "ingreso",
              monto: rendimientoCentavos,
              categoria: "Rendimientos",
              descripcion: `Rendimiento diario (${cuenta.rendimientoAnual}% TNA)`,
              fecha: fechaIter,
            });

            totalGenerados++;
            totalMontoCentavos += rendimientoCentavos;
          }
        }
      }

      // Avanzar al siguiente día
      fechaIter = sumarFecha(fechaIter, "dia", 1);
    }

    // Actualizar la última fecha calculada de la cuenta a ayer
    await db
      .update(cuentas)
      .set({ ultimoRendimientoFecha: ayer })
      .where(eq(cuentas.id, cuenta.id));
  }

  return { totalGenerados, totalMontoCentavos };
}
