import { db } from "@/db";
import { tareas } from "./schema";
import { asc, count, desc, eq, sql } from "drizzle-orm";

export async function getTareas() {
  return db
    .select()
    .from(tareas)
    .orderBy(asc(tareas.completada), desc(tareas.id));
}

export async function getPendientesCount() {
  const [row] = await db
    .select({ total: count() })
    .from(tareas)
    .where(eq(tareas.completada, false));
  return row.total;
}

// Pendientes: primero las que tienen fecha (la más cercana arriba), después el resto
export async function getProximasTareas(limit = 3) {
  return db
    .select()
    .from(tareas)
    .where(eq(tareas.completada, false))
    .orderBy(
      sql`${tareas.fechaLimite} is null`,
      asc(tareas.fechaLimite),
      desc(tareas.id),
    )
    .limit(limit);
}
