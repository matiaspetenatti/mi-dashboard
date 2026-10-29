"use server";

import { requireAuthorizedUser } from "@/lib/auth";
import { db } from "@/db";
import { and, asc, eq, ne } from "drizzle-orm";
import {
  examenes,
  materias,
  type Cuatrimestre,
  type EstadoMateria,
} from "../schema";
import { materiaSchema } from "../lib/validacion";
import {
  errorAccion,
  mensajeError,
  refrescarEstudio,
  type ResultadoAccion,
} from "./_comun";

export type DatosMateria = {
  carreraId: number;
  nombre: string;
  anio?: number | string | null;
  cuatrimestre?: Cuatrimestre | null;
  creditos?: number | string | null;
  estado: EstadoMateria;
  notaFinal?: number | string | null;
  profesor?: string | null;
  notas?: string | null;
};

export async function obtenerMateriasPorCarrera(
  carreraId: number,
): Promise<{ id: number; nombre: string }[]> {
  await requireAuthorizedUser();
  const lista = await db
    .select({ id: materias.id, nombre: materias.nombre })
    .from(materias)
    .where(eq(materias.carreraId, carreraId))
    .orderBy(asc(materias.nombre));
  return lista;
}

async function existeMateria(
  carreraId: number,
  nombre: string,
  excluirId?: number,
) {
  const filtros = [
    eq(materias.carreraId, carreraId),
    eq(materias.nombre, nombre),
  ];
  if (excluirId) filtros.push(ne(materias.id, excluirId));

  const [fila] = await db
    .select({ id: materias.id })
    .from(materias)
    .where(and(...filtros))
    .limit(1);
  return Boolean(fila);
}

export async function crearMateria(
  datos: DatosMateria,
): Promise<ResultadoAccion<{ id: number }>> {
  await requireAuthorizedUser();
  const parsed = materiaSchema.safeParse(datos);
  if (!parsed.success) {
    return errorAccion(parsed.error.issues[0]?.message ?? "Datos inválidos");
  }

  if (await existeMateria(parsed.data.carreraId, parsed.data.nombre)) {
    return errorAccion("Ya tenés una materia con ese nombre en la carrera");
  }

  try {
    const [materia] = await db
      .insert(materias)
      .values(parsed.data)
      .returning({ id: materias.id });
    refrescarEstudio(parsed.data.carreraId);
    return { ok: true, id: materia.id };
  } catch (error) {
    return errorAccion(mensajeError(error, "No se pudo crear la materia"));
  }
}

export async function actualizarMateria(
  id: number,
  datos: DatosMateria,
): Promise<ResultadoAccion> {
  await requireAuthorizedUser();
  const parsed = materiaSchema.safeParse(datos);
  if (!parsed.success) {
    return errorAccion(parsed.error.issues[0]?.message ?? "Datos inválidos");
  }

  if (
    await existeMateria(parsed.data.carreraId, parsed.data.nombre, id)
  ) {
    return errorAccion("Ya tenés una materia con ese nombre en la carrera");
  }

  try {
    await db
      .update(materias)
      .set(parsed.data)
      .where(eq(materias.id, id));
    refrescarEstudio(parsed.data.carreraId);
    return { ok: true };
  } catch (error) {
    return errorAccion(mensajeError(error, "No se pudo actualizar la materia"));
  }
}

export async function actualizarEstadoMateria(
  id: number,
  estado: EstadoMateria,
): Promise<ResultadoAccion> {
  await requireAuthorizedUser();

  const [materia] = await db
    .select({ carreraId: materias.carreraId })
    .from(materias)
    .where(eq(materias.id, id))
    .limit(1);
  if (!materia) return errorAccion("La materia no existe");

  await db.update(materias).set({ estado }).where(eq(materias.id, id));
  refrescarEstudio(materia.carreraId);
  return { ok: true };
}

export async function borrarMateria(id: number): Promise<ResultadoAccion> {
  await requireAuthorizedUser();

  const [materia] = await db
    .select({ carreraId: materias.carreraId })
    .from(materias)
    .where(eq(materias.id, id))
    .limit(1);
  if (!materia) return errorAccion("La materia no existe");

  await db.delete(examenes).where(eq(examenes.materiaId, id));
  await db.delete(materias).where(eq(materias.id, id));

  refrescarEstudio(materia.carreraId);
  return { ok: true };
}
