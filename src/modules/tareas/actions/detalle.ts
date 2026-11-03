"use server";

import { requireAuthorizedUser } from "@/lib/auth";
import { db } from "@/db";
import { tareas } from "@/modules/tareas/schema";
import { and, asc, eq, isNull } from "drizzle-orm";
import {
  getComentarios,
  getAdjuntos,
  getDependencias,
} from "@/modules/tareas/queries";

export async function cargarDetalleTarea(tareaId: number) {
  await requireAuthorizedUser();
  const [comentarios, adjuntos, dependencias] = await Promise.all([
    getComentarios(tareaId),
    getAdjuntos(tareaId),
    getDependencias(tareaId),
  ]);
  // tareas disponibles para dependencias (del mismo proyecto y otras)
  const tarea = await db
    .select({ proyectoId: tareas.proyectoId })
    .from(tareas)
    .where(eq(tareas.id, tareaId));
  const proyectoId = tarea[0]?.proyectoId;
  const disponibles = await db
    .select({ id: tareas.id, titulo: tareas.titulo, proyectoId: tareas.proyectoId })
    .from(tareas)
    .where(
      proyectoId
        ? eq(tareas.proyectoId, proyectoId)
        : undefined,
    )
    .orderBy(asc(tareas.id))
    .limit(200);
  return {
    comentarios,
    adjuntos,
    dependencias,
    disponibles: disponibles.filter((t) => t.id !== tareaId),
  };
}