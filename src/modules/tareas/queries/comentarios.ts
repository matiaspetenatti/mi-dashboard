import { cacheTag, cacheLife } from "next/cache";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { tareaComentarios, type TareaComentario } from "@/modules/tareas/schema";

export async function getComentarios(tareaId: number): Promise<TareaComentario[]> {
  "use cache";
  cacheTag("tareas");
  cacheLife("hours");
  return db
    .select()
    .from(tareaComentarios)
    .where(eq(tareaComentarios.tareaId, tareaId))
    .orderBy(asc(tareaComentarios.creadoEn));
}

export async function crearComentario(
  tareaId: number,
  autorId: string,
  texto: string,
): Promise<TareaComentario> {
  const [creado] = await db
    .insert(tareaComentarios)
    .values({ tareaId, autorId, texto })
    .returning();
  return creado;
}

export async function editarComentario(
  id: number,
  texto: string,
): Promise<void> {
  await db
    .update(tareaComentarios)
    .set({ texto, editadoEn: new Date().toISOString().slice(0, 19).replace("T", " ") })
    .where(eq(tareaComentarios.id, id));
}

export async function borrarComentario(id: number): Promise<void> {
  await db.delete(tareaComentarios).where(eq(tareaComentarios.id, id));
}