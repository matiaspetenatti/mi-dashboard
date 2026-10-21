"use server";

import { db } from "@/db";
import { tareas } from "./schema";
import { eq, not } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const crearSchema = z.object({
  titulo: z.string().trim().min(1, "Escribí un título").max(200),
  fechaLimite: z.string().optional(),
});

export async function crearTarea(formData: FormData) {
  const parsed = crearSchema.safeParse({
    titulo: formData.get("titulo"),
    fechaLimite: formData.get("fechaLimite") || undefined,
  });
  if (!parsed.success) return;

  await db.insert(tareas).values({
    titulo: parsed.data.titulo,
    fechaLimite: parsed.data.fechaLimite,
  });
  revalidatePath("/tareas");
  revalidatePath("/");
}

export async function alternarTarea(id: number) {
  await db
    .update(tareas)
    .set({ completada: not(tareas.completada) })
    .where(eq(tareas.id, id));
  revalidatePath("/tareas");
  revalidatePath("/");
}

export async function borrarTarea(id: number) {
  await db.delete(tareas).where(eq(tareas.id, id));
  revalidatePath("/tareas");
  revalidatePath("/");
}
