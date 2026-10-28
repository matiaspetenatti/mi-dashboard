"use server";

import { requireAuthorizedUser } from "@/lib/auth";
import { db } from "@/db";
import { estadosProyecto, tareas } from "@/modules/tareas/schema";
import { and, asc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { estadoSchema, idSchema } from "@/modules/tareas/lib/validacion";
import { refrescarTareas } from "@/modules/tareas/lib/refrescar";
import { errorAccion, type ResultadoAccion } from "@/modules/tareas/lib/resultado";
import { estadosDeProyecto } from "@/modules/tareas/actions/_comun";

export async function crearEstado(
  proyectoId: number,
  datos: { nombre: string; color: string; categoria: string },
): Promise<ResultadoAccion<{ id: number }>> {
  await requireAuthorizedUser();
  if (!idSchema.safeParse(proyectoId).success) {
    return errorAccion("Proyecto inválido");
  }
  const parsed = estadoSchema.safeParse(datos);
  if (!parsed.success) {
    return errorAccion(parsed.error.issues[0]?.message ?? "Datos inválidos");
  }

  const estados = await estadosDeProyecto(proyectoId);
  const repetido = estados.some(
    (estado) => estado.nombre.toLowerCase() === parsed.data.nombre.toLowerCase(),
  );
  if (repetido) return errorAccion("Ya existe un estado con ese nombre");

  const posicion =
    estados.length === 0
      ? 0
      : Math.max(...estados.map((estado) => estado.posicion)) + 1;

  const [estado] = await db
    .insert(estadosProyecto)
    .values({ proyectoId, ...parsed.data, posicion })
    .returning({ id: estadosProyecto.id });

  refrescarTareas();
  return { ok: true, id: estado.id };
}

export async function actualizarEstado(
  id: number,
  datos: { nombre: string; color: string; categoria: string },
): Promise<ResultadoAccion> {
  await requireAuthorizedUser();
  if (!idSchema.safeParse(id).success) return errorAccion("Estado inválido");
  const parsed = estadoSchema.safeParse(datos);
  if (!parsed.success) {
    return errorAccion(parsed.error.issues[0]?.message ?? "Datos inválidos");
  }

  const [estado] = await db
    .select()
    .from(estadosProyecto)
    .where(eq(estadosProyecto.id, id));
  if (!estado) return errorAccion("El estado no existe");

  await db.update(estadosProyecto).set(parsed.data).where(eq(estadosProyecto.id, id));

  if (estado.categoria !== parsed.data.categoria) {
    if (parsed.data.categoria === "completado") {
      await db
        .update(tareas)
        .set({
          completadaEn: sql`coalesce(${tareas.completadaEn}, datetime('now'))`,
          actualizadaEn: sql`(datetime('now'))`,
        })
        .where(eq(tareas.estadoId, id));
    } else {
      await db
        .update(tareas)
        .set({
          completadaEn: null,
          actualizadaEn: sql`(datetime('now'))`,
        })
        .where(eq(tareas.estadoId, id));
    }
  }

  refrescarTareas();
  return { ok: true };
}

export async function eliminarEstado(
  id: number,
  destinoId: number,
): Promise<ResultadoAccion> {
  await requireAuthorizedUser();
  if (
    !idSchema.safeParse(id).success ||
    !idSchema.safeParse(destinoId).success ||
    id === destinoId
  ) {
    return errorAccion("Elegí un estado de destino válido");
  }

  const [estado] = await db
    .select()
    .from(estadosProyecto)
    .where(eq(estadosProyecto.id, id));
  const [destino] = await db
    .select()
    .from(estadosProyecto)
    .where(eq(estadosProyecto.id, destinoId));
  if (!estado || !destino || estado.proyectoId !== destino.proyectoId) {
    return errorAccion("El estado de destino no pertenece al proyecto");
  }

  const estados = await estadosDeProyecto(estado.proyectoId);
  if (estados.length <= 1) {
    return errorAccion("El proyecto necesita al menos un estado");
  }

  await db
    .update(tareas)
    .set({
      estadoId: destinoId,
      ...(destino.categoria === "completado"
        ? {
            completadaEn: sql`coalesce(${tareas.completadaEn}, datetime('now'))`,
          }
        : { completadaEn: null }),
      actualizadaEn: sql`(datetime('now'))`,
    })
    .where(eq(tareas.estadoId, id));

  await db.delete(estadosProyecto).where(eq(estadosProyecto.id, id));
  refrescarTareas();
  return { ok: true };
}

export async function reordenarEstados(
  proyectoId: number,
  ids: number[],
): Promise<ResultadoAccion> {
  await requireAuthorizedUser();
  const parsed = z.array(idSchema).min(1).max(50).safeParse(ids);
  if (!parsed.success) return errorAccion("Orden inválido");

  const estados = await db
    .select({ id: estadosProyecto.id })
    .from(estadosProyecto)
    .where(eq(estadosProyecto.proyectoId, proyectoId))
    .orderBy(asc(estadosProyecto.posicion));
  const existentes = new Set(estados.map((estado) => estado.id));
  if (parsed.data.some((id) => !existentes.has(id))) {
    return errorAccion("Los estados no pertenecen al proyecto");
  }

  for (const [indice, id] of parsed.data.entries()) {
    await db
      .update(estadosProyecto)
      .set({ posicion: indice })
      .where(
        and(
          eq(estadosProyecto.id, id),
          eq(estadosProyecto.proyectoId, proyectoId),
        ),
      );
  }

  refrescarTareas();
  return { ok: true };
}
