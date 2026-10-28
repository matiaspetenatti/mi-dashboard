"use server";

import { requireAuthorizedUser } from "@/lib/auth";
import { db } from "@/db";
import {
  estadosProyecto,
  proyectos,
  tareas,
  tareasEtiquetas,
  vistasProyecto,
} from "@/modules/tareas/schema";
import { eq, inArray, sql } from "drizzle-orm";
import {
  proyectoActualizarSchema,
  proyectoCrearSchema,
} from "@/modules/tareas/lib/validacion";
import { prefijoDe } from "@/modules/tareas/constantes";
import { refrescarTareas } from "@/modules/tareas/lib/refrescar";
import { errorAccion, type ResultadoAccion } from "@/modules/tareas/lib/resultado";
import {
  crearDatosInicialesProyecto,
  siguientePosicionProyecto,
  slugUnico,
} from "@/modules/tareas/actions/_comun";

export async function crearProyecto(datos: {
  nombre: string;
  descripcion?: string | null;
  color: string;
  icono: string;
  prefijo?: string;
}): Promise<ResultadoAccion<{ id: number; slug: string }>> {
  await requireAuthorizedUser();
  const parsed = proyectoCrearSchema.safeParse(datos);
  if (!parsed.success) {
    return errorAccion(parsed.error.issues[0]?.message ?? "Datos inválidos");
  }

  const { nombre, descripcion, color, icono } = parsed.data;
  const slug = await slugUnico(nombre);
  const prefijo = parsed.data.prefijo ?? prefijoDe(nombre);
  const posicion = await siguientePosicionProyecto();

  const [proyecto] = await db
    .insert(proyectos)
    .values({
      nombre,
      slug,
      descripcion: descripcion || null,
      color,
      icono,
      prefijo,
      posicion,
    })
    .returning({ id: proyectos.id, slug: proyectos.slug });

  await crearDatosInicialesProyecto(proyecto.id);
  refrescarTareas();
  return { ok: true, id: proyecto.id, slug: proyecto.slug };
}

export async function actualizarProyecto(
  id: number,
  datos: {
    nombre?: string;
    descripcion?: string | null;
    color?: string;
    icono?: string;
    prefijo?: string;
  },
): Promise<ResultadoAccion> {
  await requireAuthorizedUser();
  const parsed = proyectoActualizarSchema.safeParse(datos);
  if (!parsed.success) {
    return errorAccion(parsed.error.issues[0]?.message ?? "Datos inválidos");
  }

  const cambios = parsed.data;
  await db
    .update(proyectos)
    .set({
      ...(cambios.nombre !== undefined ? { nombre: cambios.nombre } : {}),
      ...(cambios.descripcion !== undefined
        ? { descripcion: cambios.descripcion || null }
        : {}),
      ...(cambios.color !== undefined ? { color: cambios.color } : {}),
      ...(cambios.icono !== undefined ? { icono: cambios.icono } : {}),
      ...(cambios.prefijo !== undefined ? { prefijo: cambios.prefijo } : {}),
      actualizadoEn: sql`(datetime('now'))`,
    })
    .where(eq(proyectos.id, id));

  refrescarTareas();
  return { ok: true };
}

export async function archivarProyecto(
  id: number,
  archivado: boolean,
): Promise<ResultadoAccion> {
  await requireAuthorizedUser();
  await db
    .update(proyectos)
    .set({ archivado, actualizadoEn: sql`(datetime('now'))` })
    .where(eq(proyectos.id, id));
  refrescarTareas();
  return { ok: true };
}

export async function borrarProyecto(id: number): Promise<ResultadoAccion> {
  await requireAuthorizedUser();

  const filas = await db
    .select({ id: tareas.id })
    .from(tareas)
    .where(eq(tareas.proyectoId, id));
  const idsTareas = filas.map((fila) => fila.id);

  if (idsTareas.length > 0) {
    await db
      .delete(tareasEtiquetas)
      .where(inArray(tareasEtiquetas.tareaId, idsTareas));
  }
  await db.delete(tareas).where(eq(tareas.proyectoId, id));
  await db.delete(vistasProyecto).where(eq(vistasProyecto.proyectoId, id));
  await db.delete(estadosProyecto).where(eq(estadosProyecto.proyectoId, id));
  await db.delete(proyectos).where(eq(proyectos.id, id));

  refrescarTareas();
  return { ok: true };
}
