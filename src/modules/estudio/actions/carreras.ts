"use server";

import { requireAuthorizedUser } from "@/lib/auth";
import { db } from "@/db";
import { eq, inArray } from "drizzle-orm";
import { carreras, examenes, materias, type EstadoCarrera } from "../schema";
import { carreraSchema } from "../lib/validacion";
import {
  errorAccion,
  mensajeError,
  refrescarEstudio,
  type ResultadoAccion,
} from "./_comun";

export type DatosCarrera = {
  nombre: string;
  institucion?: string | null;
  estado: EstadoCarrera;
  anioInicio?: number | string | null;
  anioFin?: number | string | null;
  materiasTotales?: number | string | null;
  color?: string;
  notas?: string | null;
};

export async function crearCarrera(
  datos: DatosCarrera,
): Promise<ResultadoAccion<{ id: number }>> {
  await requireAuthorizedUser();
  const parsed = carreraSchema.safeParse(datos);
  if (!parsed.success) {
    return errorAccion(parsed.error.issues[0]?.message ?? "Datos inválidos");
  }

  try {
    const [carrera] = await db
      .insert(carreras)
      .values(parsed.data)
      .returning({ id: carreras.id });
    refrescarEstudio(carrera.id);
    return { ok: true, id: carrera.id };
  } catch (error) {
    return errorAccion(mensajeError(error, "No se pudo crear la carrera"));
  }
}

export async function actualizarCarrera(
  id: number,
  datos: DatosCarrera,
): Promise<ResultadoAccion> {
  await requireAuthorizedUser();
  const parsed = carreraSchema.safeParse(datos);
  if (!parsed.success) {
    return errorAccion(parsed.error.issues[0]?.message ?? "Datos inválidos");
  }

  try {
    await db.update(carreras).set(parsed.data).where(eq(carreras.id, id));
    refrescarEstudio(id);
    return { ok: true };
  } catch (error) {
    return errorAccion(mensajeError(error, "No se pudo actualizar la carrera"));
  }
}

export async function borrarCarrera(id: number): Promise<ResultadoAccion> {
  await requireAuthorizedUser();

  const filas = await db
    .select({ id: materias.id })
    .from(materias)
    .where(eq(materias.carreraId, id));
  const idsMaterias = filas.map((fila) => fila.id);

  if (idsMaterias.length > 0) {
    await db
      .delete(examenes)
      .where(inArray(examenes.materiaId, idsMaterias));
  }
  await db.delete(materias).where(eq(materias.carreraId, id));
  await db.delete(carreras).where(eq(carreras.id, id));

  refrescarEstudio(id);
  return { ok: true };
}
