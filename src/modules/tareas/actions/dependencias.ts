"use server";

import { requireAuthorizedUser } from "@/lib/auth";
import { z } from "zod";
import { idSchema } from "@/modules/tareas/lib/validacion";
import {
  crearDependencia,
  borrarDependencia,
  hayCiclo,
} from "@/modules/tareas/queries/dependencias";
import { refrescarTareas } from "@/modules/tareas/lib/refrescar";
import { errorAccion, type ResultadoAccion } from "@/modules/tareas/lib/resultado";

const depSchema = z.object({
  tareaId: z.number().int().positive(),
  dependeDeId: z.number().int().positive(),
  tipo: z.enum(["bloquea", "relacionada"]).default("bloquea"),
});

export async function agregarDependencia(datos: {
  tareaId: number;
  dependeDeId: number;
  tipo?: "bloquea" | "relacionada";
}): Promise<ResultadoAccion<{ id: number }>> {
  await requireAuthorizedUser();
  const parsed = depSchema.safeParse(datos);
  if (!parsed.success) return errorAccion("Dependencia inválida");
  if (parsed.data.tareaId === parsed.data.dependeDeId)
    return errorAccion("Una tarea no puede depender de sí misma");

  if (parsed.data.tipo === "bloquea") {
    const ciclo = await hayCiclo(parsed.data.tareaId, parsed.data.dependeDeId);
    if (ciclo) return errorAccion("Esta dependencia crearía un ciclo");
  }

  const creada = await crearDependencia(parsed.data);
  refrescarTareas();
  return { ok: true, id: creada.id };
}

export async function eliminarDependencia(id: number): Promise<ResultadoAccion> {
  await requireAuthorizedUser();
  if (!idSchema.safeParse(id).success) return errorAccion("Dependencia inválida");
  await borrarDependencia(id);
  refrescarTareas();
  return { ok: true };
}