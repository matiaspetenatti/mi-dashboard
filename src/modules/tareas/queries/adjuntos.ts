import { cacheTag, cacheLife } from "next/cache";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { tareaAdjuntos, type TareaAdjunto } from "@/modules/tareas/schema";

export async function getAdjuntos(tareaId: number): Promise<TareaAdjunto[]> {
  "use cache";
  cacheTag("tareas");
  cacheLife("hours");
  return db
    .select()
    .from(tareaAdjuntos)
    .where(eq(tareaAdjuntos.tareaId, tareaId))
    .orderBy(asc(tareaAdjuntos.creadoEn));
}

export async function crearAdjunto(datos: {
  tareaId: number;
  tipo: "enlace" | "archivo";
  nombre: string;
  url: string;
  tamano?: number | null;
}): Promise<TareaAdjunto> {
  const [creado] = await db
    .insert(tareaAdjuntos)
    .values({
      tareaId: datos.tareaId,
      tipo: datos.tipo,
      nombre: datos.nombre,
      url: datos.url,
      tamano: datos.tamano ?? null,
    })
    .returning();
  return creado;
}

export async function borrarAdjunto(id: number): Promise<void> {
  await db.delete(tareaAdjuntos).where(eq(tareaAdjuntos.id, id));
}