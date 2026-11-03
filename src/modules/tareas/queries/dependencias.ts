import { cacheTag, cacheLife } from "next/cache";
import { and, eq, or } from "drizzle-orm";
import { db } from "@/db";
import { tareas } from "@/modules/tareas/schema";
import {
  tareaDependencias,
  type TareaDependencia,
} from "@/modules/tareas/schema";

export async function getDependencias(
  tareaId: number,
): Promise<TareaDependencia[]> {
  "use cache";
  cacheTag("tareas");
  cacheLife("hours");
  return db
    .select()
    .from(tareaDependencias)
    .where(
      or(
        eq(tareaDependencias.tareaId, tareaId),
        eq(tareaDependencias.dependeDeId, tareaId),
      ),
    );
}

export async function crearDependencia(datos: {
  tareaId: number;
  dependeDeId: number;
  tipo: "bloquea" | "relacionada";
}): Promise<TareaDependencia> {
  const [creada] = await db
    .insert(tareaDependencias)
    .values(datos)
    .returning();
  return creada;
}

export async function borrarDependencia(id: number): Promise<void> {
  await db.delete(tareaDependencias).where(eq(tareaDependencias.id, id));
}

// detecta ciclo: true si agregar tareaId -> dependeDeId crea ciclo
export async function hayCiclo(
  tareaId: number,
  dependeDeId: number,
): Promise<boolean> {
  // BFS desde dependeDeId siguiendo dependencias "bloquea" hacia tareas que dependen de ella
  const visitados = new Set<number>();
  const cola: number[] = [dependeDeId];
  while (cola.length) {
    const actual = cola.shift()!;
    if (actual === tareaId) return true;
    if (visitados.has(actual)) continue;
    visitados.add(actual);
    const hijos = await db
      .select({ tareaId: tareaDependencias.tareaId })
      .from(tareaDependencias)
      .where(eq(tareaDependencias.dependeDeId, actual));
    for (const h of hijos) cola.push(h.tareaId);
  }
  return false;
}