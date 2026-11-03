"use server";

import { requireAuthorizedUser } from "@/lib/auth";
import { z } from "zod";
import { idSchema } from "@/modules/tareas/lib/validacion";
import { crearAdjunto, borrarAdjunto } from "@/modules/tareas/queries/adjuntos";
import { refrescarTareas } from "@/modules/tareas/lib/refrescar";
import { errorAccion, type ResultadoAccion } from "@/modules/tareas/lib/resultado";

const adjuntoSchema = z.object({
  tareaId: z.number().int().positive(),
  tipo: z.enum(["enlace", "archivo"]).default("enlace"),
  nombre: z.string().trim().min(1).max(120),
  url: z.string().trim().url().max(2000),
  tamano: z.number().int().nonnegative().nullable().optional(),
});

export async function agregarAdjunto(datos: {
  tareaId: number;
  tipo?: "enlace" | "archivo";
  nombre: string;
  url: string;
  tamano?: number | null;
}): Promise<ResultadoAccion<{ id: number }>> {
  await requireAuthorizedUser();
  const parsed = adjuntoSchema.safeParse(datos);
  if (!parsed.success) return errorAccion("Adjunto inválido");
  const creado = await crearAdjunto(parsed.data);
  refrescarTareas();
  return { ok: true, id: creado.id };
}

export async function eliminarAdjunto(id: number): Promise<ResultadoAccion> {
  await requireAuthorizedUser();
  if (!idSchema.safeParse(id).success) return errorAccion("Adjunto inválido");
  await borrarAdjunto(id);
  refrescarTareas();
  return { ok: true };
}