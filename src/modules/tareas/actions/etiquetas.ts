"use server";

import { requireAuthorizedUser } from "@/lib/auth";
import { db } from "@/db";
import {
  etiquetas,
  tareas,
  tareasEtiquetas,
} from "@/modules/tareas/schema";
import { and, eq } from "drizzle-orm";
import { colorPorDefecto } from "@/modules/tareas/constantes";
import { etiquetaSchema, idSchema } from "@/modules/tareas/lib/validacion";
import { refrescarTareas } from "@/modules/tareas/lib/refrescar";
import { errorAccion, type ResultadoAccion } from "@/modules/tareas/lib/resultado";

export async function crearEtiqueta(datos: {
  nombre: string;
  color?: string;
  icono?: string | null;
}): Promise<ResultadoAccion<{ id: number }>> {
  await requireAuthorizedUser();
  const parsed = etiquetaSchema.safeParse(datos);
  if (!parsed.success) {
    return errorAccion(parsed.error.issues[0]?.message ?? "Datos inválidos");
  }

  const [existente] = await db
    .select({ id: etiquetas.id })
    .from(etiquetas)
    .where(eq(etiquetas.nombre, parsed.data.nombre));
  if (existente) return { ok: true, id: existente.id };

  const [nueva] = await db
    .insert(etiquetas)
    .values({
      nombre: parsed.data.nombre,
      color: parsed.data.color ?? colorPorDefecto(parsed.data.nombre),
      icono: parsed.data.icono ?? null,
    })
    .returning({ id: etiquetas.id });

  refrescarTareas();
  return { ok: true, id: nueva.id };
}

export async function actualizarEtiqueta(
  id: number,
  datos: { nombre: string; color: string; icono?: string | null },
): Promise<ResultadoAccion> {
  await requireAuthorizedUser();
  if (!idSchema.safeParse(id).success) return errorAccion("Etiqueta inválida");
  const parsed = etiquetaSchema.safeParse(datos);
  if (!parsed.success) {
    return errorAccion(parsed.error.issues[0]?.message ?? "Datos inválidos");
  }

  try {
    await db
      .update(etiquetas)
      .set({
        nombre: parsed.data.nombre,
        ...(parsed.data.color ? { color: parsed.data.color } : {}),
        icono: parsed.data.icono ?? null,
      })
      .where(eq(etiquetas.id, id));
  } catch {
    return errorAccion("Ya existe una etiqueta con ese nombre");
  }

  refrescarTareas();
  return { ok: true };
}

export async function borrarEtiqueta(id: number): Promise<ResultadoAccion> {
  await requireAuthorizedUser();
  if (!idSchema.safeParse(id).success) return errorAccion("Etiqueta inválida");

  await db
    .delete(tareasEtiquetas)
    .where(eq(tareasEtiquetas.etiquetaId, id));
  await db.delete(etiquetas).where(eq(etiquetas.id, id));

  refrescarTareas();
  return { ok: true };
}

export async function alternarEtiquetaTarea(
  tareaId: number,
  etiquetaId: number,
): Promise<ResultadoAccion<{ activa: boolean }>> {
  await requireAuthorizedUser();
  if (
    !idSchema.safeParse(tareaId).success ||
    !idSchema.safeParse(etiquetaId).success
  ) {
    return errorAccion("Datos inválidos");
  }

  const [tarea] = await db
    .select({ id: tareas.id })
    .from(tareas)
    .where(eq(tareas.id, tareaId));
  const [etiqueta] = await db
    .select({ id: etiquetas.id })
    .from(etiquetas)
    .where(eq(etiquetas.id, etiquetaId));
  if (!tarea || !etiqueta) return errorAccion("Datos inválidos");

  const [existente] = await db
    .select()
    .from(tareasEtiquetas)
    .where(
      and(
        eq(tareasEtiquetas.tareaId, tareaId),
        eq(tareasEtiquetas.etiquetaId, etiquetaId),
      ),
    );

  if (existente) {
    await db
      .delete(tareasEtiquetas)
      .where(
        and(
          eq(tareasEtiquetas.tareaId, tareaId),
          eq(tareasEtiquetas.etiquetaId, etiquetaId),
        ),
      );
    refrescarTareas();
    return { ok: true, activa: false };
  }

  await db
    .insert(tareasEtiquetas)
    .values({ tareaId, etiquetaId })
    .onConflictDoNothing();
  refrescarTareas();
  return { ok: true, activa: true };
}
