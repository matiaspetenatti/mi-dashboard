import { connection } from "next/server";
import { db } from "@/db";
import { movimientos } from "./schema";
import { desc, like, sql } from "drizzle-orm";
import { mesActual } from "@/lib/format";

export async function getMovimientosDelMes() {
  await connection(); // usa la fecha actual => siempre dinámico
  return db
    .select()
    .from(movimientos)
    .where(like(movimientos.fecha, `${mesActual()}%`))
    .orderBy(desc(movimientos.fecha), desc(movimientos.id));
}

export async function getResumenDelMes() {
  await connection();
  const [row] = await db
    .select({
      ingresos: sql<number>`coalesce(sum(case when ${movimientos.tipo} = 'ingreso' then ${movimientos.monto} end), 0)`,
      gastos: sql<number>`coalesce(sum(case when ${movimientos.tipo} = 'gasto' then ${movimientos.monto} end), 0)`,
    })
    .from(movimientos)
    .where(like(movimientos.fecha, `${mesActual()}%`));

  const ingresos = Number(row.ingresos);
  const gastos = Number(row.gastos);
  return { ingresos, gastos, balance: ingresos - gastos };
}
