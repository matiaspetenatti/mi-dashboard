"use server";

import { requireAuthorizedUser } from "@/lib/auth";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import {
  carreras,
  materias,
  sesionesEstudio,
  type TipoSesion,
} from "../schema";
import { sesionEstudioSchema } from "../lib/validacion";
import { errorAccion, mensajeError, type ResultadoAccion } from "./_comun";

export async function registrarSesionEstudio(
  datos: {
    carreraId: number;
    materiaId: number;
    tipo: TipoSesion;
    duracionMinutos: number;
    fecha: string;
  },
): Promise<ResultadoAccion<{ id: number }>> {
  await requireAuthorizedUser();
  const parsed = sesionEstudioSchema.safeParse(datos);
  if (!parsed.success) {
    return errorAccion(parsed.error.issues[0]?.message ?? "Datos inválidos");
  }

  // Validar que la carrera y la materia existan y pertenezcan entre sí
  const [carrera] = await db
    .select({ id: carreras.id })
    .from(carreras)
    .where(eq(carreras.id, parsed.data.carreraId))
    .limit(1);
  if (!carrera) return errorAccion("La carrera no existe");

  const [materia] = await db
    .select({ id: materias.id, carreraId: materias.carreraId })
    .from(materias)
    .where(eq(materias.id, parsed.data.materiaId))
    .limit(1);
  if (!materia) return errorAccion("La materia no existe");
  if (materia.carreraId !== parsed.data.carreraId) {
    return errorAccion("La materia no pertenece a la carrera seleccionada");
  }

  try {
    const [sesion] = await db
      .insert(sesionesEstudio)
      .values(parsed.data)
      .returning({ id: sesionesEstudio.id });
    return { ok: true, id: sesion.id };
  } catch (error) {
    return errorAccion(mensajeError(error, "No se pudo registrar la sesión"));
  }
}
