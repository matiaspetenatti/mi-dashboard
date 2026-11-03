import { cacheTag, cacheLife } from "next/cache";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { vistasGuardadas, type VistaGuardada } from "@/modules/tareas/schema";
export type { VistaGuardada };

export async function getVistasGuardadas(
  usuarioId: string,
): Promise<VistaGuardada[]> {
  "use cache";
  cacheTag("tareas");
  cacheLife("hours");
  return db
    .select()
    .from(vistasGuardadas)
    .where(eq(vistasGuardadas.usuarioId, usuarioId))
    .orderBy(asc(vistasGuardadas.nombre));
}

export async function crearVistaGuardada(datos: {
  usuarioId: string;
  nombre: string;
  alcance: "global" | "proyecto";
  proyectoId?: number | null;
  config: unknown;
}): Promise<VistaGuardada> {
  const [creada] = await db
    .insert(vistasGuardadas)
    .values({
      usuarioId: datos.usuarioId,
      nombre: datos.nombre,
      alcance: datos.alcance,
      proyectoId: datos.proyectoId ?? null,
      config: datos.config as VistaGuardada["config"],
    })
    .returning();
  return creada;
}

export async function actualizarVistaGuardada(
  id: number,
  datos: { nombre?: string; config?: unknown },
): Promise<void> {
  await db
    .update(vistasGuardadas)
    .set({
      ...(datos.nombre !== undefined ? { nombre: datos.nombre } : {}),
      ...(datos.config !== undefined
        ? { config: datos.config as VistaGuardada["config"] }
        : {}),
      actualizadoEn: new Date().toISOString().slice(0, 19).replace("T", " "),
    })
    .where(eq(vistasGuardadas.id, id));
}

export async function borrarVistaGuardada(id: number): Promise<void> {
  await db.delete(vistasGuardadas).where(eq(vistasGuardadas.id, id));
}