"use server";

import { requireAuthorizedUser } from "@/lib/auth";
import { z } from "zod";
import { idSchema } from "@/modules/tareas/lib/validacion";
import {
  crearComentario,
  editarComentario,
  borrarComentario,
} from "@/modules/tareas/queries/comentarios";
import { refrescarTareas } from "@/modules/tareas/lib/refrescar";
import { errorAccion, type ResultadoAccion } from "@/modules/tareas/lib/resultado";

const textoSchema = z.string().trim().min(1).max(5000);

export async function agregarComentario(
  tareaId: number,
  texto: string,
): Promise<ResultadoAccion<{ id: number }>> {
  await requireAuthorizedUser();
  if (!idSchema.safeParse(tareaId).success)
    return errorAccion("Tarea inválida");
  const parsed = textoSchema.safeParse(texto);
  if (!parsed.success) return errorAccion("Comentario inválido");

  const { currentUser } = await import("@clerk/nextjs/server");
  const user = await currentUser();
  const autorId = user?.id ?? "anon";

  const creado = await crearComentario(tareaId, autorId, parsed.data);
  refrescarTareas();
  return { ok: true, id: creado.id };
}

export async function actualizarComentario(
  id: number,
  texto: string,
): Promise<ResultadoAccion> {
  await requireAuthorizedUser();
  if (!idSchema.safeParse(id).success) return errorAccion("Comentario inválido");
  const parsed = textoSchema.safeParse(texto);
  if (!parsed.success) return errorAccion("Comentario inválido");
  await editarComentario(id, parsed.data);
  refrescarTareas();
  return { ok: true };
}

export async function eliminarComentario(id: number): Promise<ResultadoAccion> {
  await requireAuthorizedUser();
  if (!idSchema.safeParse(id).success) return errorAccion("Comentario inválido");
  await borrarComentario(id);
  refrescarTareas();
  return { ok: true };
}