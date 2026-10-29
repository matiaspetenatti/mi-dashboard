"use server";

import { requireAuthorizedUser } from "@/lib/auth";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import {
  examenes,
  materias,
  type EstadoExamen,
  type ResultadoExamen,
  type TipoExamen,
} from "../schema";
import {
  estadoExamenSchema,
  examenSchema,
  notaExamenSchema,
  resultadoExamenSchema,
} from "../lib/validacion";
import {
  errorAccion,
  mensajeError,
  refrescarEstudio,
  type ResultadoAccion,
} from "./_comun";

export type DatosExamen = {
  materiaId: number;
  tipo: TipoExamen;
  titulo?: string | null;
  fecha: string;
  nota?: number | string | null;
  resultado?: ResultadoExamen | null;
  estado: EstadoExamen;
  observaciones?: string | null;
};

async function carreraDeMateria(materiaId: number) {
  const [fila] = await db
    .select({ carreraId: materias.carreraId })
    .from(materias)
    .where(eq(materias.id, materiaId))
    .limit(1);
  return fila?.carreraId ?? null;
}

function normalizarCalificacion(datos: {
  nota: number | null;
  resultado: ResultadoExamen | null;
  estado: EstadoExamen;
}) {
  if (datos.estado === "ausente") {
    return { nota: null, resultado: null, estado: "ausente" as const };
  }

  if (datos.nota !== null) {
    return {
      nota: datos.nota,
      resultado: null,
      estado: datos.estado === "programado" ? ("rendido" as const) : datos.estado,
    };
  }

  if (datos.resultado !== null) {
    return {
      nota: null,
      resultado: datos.resultado,
      estado: datos.estado === "programado" ? ("rendido" as const) : datos.estado,
    };
  }

  return { nota: null, resultado: null, estado: datos.estado };
}

export async function crearExamen(
  datos: DatosExamen,
): Promise<ResultadoAccion<{ id: number }>> {
  await requireAuthorizedUser();
  const parsed = examenSchema.safeParse(datos);
  if (!parsed.success) {
    return errorAccion(parsed.error.issues[0]?.message ?? "Datos inválidos");
  }

  const carreraId = await carreraDeMateria(parsed.data.materiaId);
  if (!carreraId) return errorAccion("La materia no existe");

  try {
    const [examen] = await db
      .insert(examenes)
      .values({ ...parsed.data, ...normalizarCalificacion(parsed.data) })
      .returning({ id: examenes.id });
    refrescarEstudio(carreraId);
    return { ok: true, id: examen.id };
  } catch (error) {
    return errorAccion(mensajeError(error, "No se pudo crear el examen"));
  }
}

export async function actualizarExamen(
  id: number,
  datos: DatosExamen,
): Promise<ResultadoAccion> {
  await requireAuthorizedUser();
  const parsed = examenSchema.safeParse(datos);
  if (!parsed.success) {
    return errorAccion(parsed.error.issues[0]?.message ?? "Datos inválidos");
  }

  const [anterior] = await db
    .select({ materiaId: examenes.materiaId })
    .from(examenes)
    .where(eq(examenes.id, id))
    .limit(1);
  if (!anterior) return errorAccion("El examen no existe");

  const carreraAnterior = await carreraDeMateria(anterior.materiaId);
  const carreraNueva = await carreraDeMateria(parsed.data.materiaId);
  if (!carreraNueva) return errorAccion("La materia no existe");

  try {
    await db
      .update(examenes)
      .set({ ...parsed.data, ...normalizarCalificacion(parsed.data) })
      .where(eq(examenes.id, id));
    refrescarEstudio(carreraNueva);
    if (carreraAnterior && carreraAnterior !== carreraNueva) {
      refrescarEstudio(carreraAnterior);
    }
    return { ok: true };
  } catch (error) {
    return errorAccion(mensajeError(error, "No se pudo actualizar el examen"));
  }
}

export async function registrarNotaExamen(
  id: number,
  nota: number | string,
): Promise<ResultadoAccion> {
  await requireAuthorizedUser();
  const parsed = notaExamenSchema.safeParse(nota);
  if (!parsed.success) {
    return errorAccion(parsed.error.issues[0]?.message ?? "Nota inválida");
  }

  const [examen] = await db
    .select({ materiaId: examenes.materiaId })
    .from(examenes)
    .where(eq(examenes.id, id))
    .limit(1);
  if (!examen) return errorAccion("El examen no existe");

  const carreraId = await carreraDeMateria(examen.materiaId);
  await db
    .update(examenes)
    .set({ nota: parsed.data, resultado: null, estado: "rendido" })
    .where(eq(examenes.id, id));

  refrescarEstudio(carreraId ?? undefined);
  return { ok: true };
}

export async function registrarResultadoExamen(
  id: number,
  resultado: ResultadoExamen,
): Promise<ResultadoAccion> {
  await requireAuthorizedUser();
  const parsed = resultadoExamenSchema.safeParse(resultado);
  if (!parsed.success) return errorAccion("Resultado inválido");

  const [examen] = await db
    .select({ materiaId: examenes.materiaId })
    .from(examenes)
    .where(eq(examenes.id, id))
    .limit(1);
  if (!examen) return errorAccion("El examen no existe");

  const carreraId = await carreraDeMateria(examen.materiaId);
  await db
    .update(examenes)
    .set({ nota: null, resultado: parsed.data, estado: "rendido" })
    .where(eq(examenes.id, id));

  refrescarEstudio(carreraId ?? undefined);
  return { ok: true };
}

export async function cambiarEstadoExamen(
  id: number,
  estado: EstadoExamen,
): Promise<ResultadoAccion> {
  await requireAuthorizedUser();
  const parsed = estadoExamenSchema.safeParse(estado);
  if (!parsed.success) return errorAccion("Estado inválido");

  const [examen] = await db
    .select({ materiaId: examenes.materiaId })
    .from(examenes)
    .where(eq(examenes.id, id))
    .limit(1);
  if (!examen) return errorAccion("El examen no existe");

  const carreraId = await carreraDeMateria(examen.materiaId);
  await db
    .update(examenes)
    .set({
      estado: parsed.data,
      ...(parsed.data === "rendido" ? {} : { nota: null, resultado: null }),
    })
    .where(eq(examenes.id, id));

  refrescarEstudio(carreraId ?? undefined);
  return { ok: true };
}

export async function borrarExamen(id: number): Promise<ResultadoAccion> {
  await requireAuthorizedUser();

  const [examen] = await db
    .select({ materiaId: examenes.materiaId })
    .from(examenes)
    .where(eq(examenes.id, id))
    .limit(1);
  if (!examen) return errorAccion("El examen no existe");

  const carreraId = await carreraDeMateria(examen.materiaId);
  await db.delete(examenes).where(eq(examenes.id, id));

  refrescarEstudio(carreraId ?? undefined);
  return { ok: true };
}
