"use server";

import { requireAuthorizedUser } from "@/lib/auth";

import { db } from "@/db";
import { examenes, materias } from "./schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

function refrescar() {
  revalidatePath("/estudio");
  revalidatePath("/");
}

export async function crearMateria(formData: FormData) {
  await requireAuthorizedUser();
  const parsed = z
    .string()
    .trim()
    .min(1)
    .max(100)
    .safeParse(formData.get("nombre"));
  if (!parsed.success) return;
  await db.insert(materias).values({ nombre: parsed.data });
  refrescar();
}

export async function borrarMateria(id: number) {
  await requireAuthorizedUser();
  // borramos primero sus exámenes para no dejar filas huérfanas
  await db.batch([
    db.delete(examenes).where(eq(examenes.materiaId, id)),
    db.delete(materias).where(eq(materias.id, id)),
  ]);
  refrescar();
}

const examenSchema = z.object({
  materiaId: z.coerce.number().int().positive(),
  tipo: z.enum(["parcial", "final", "recuperatorio", "tp"]),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function crearExamen(formData: FormData) {
  await requireAuthorizedUser();
  const parsed = examenSchema.safeParse({
    materiaId: formData.get("materiaId"),
    tipo: formData.get("tipo"),
    fecha: formData.get("fecha"),
  });
  if (!parsed.success) return;
  await db.insert(examenes).values(parsed.data);
  refrescar();
}

export async function borrarExamen(id: number) {
  await requireAuthorizedUser();
  await db.delete(examenes).where(eq(examenes.id, id));
  refrescar();
}

const notaSchema = z
  .string()
  .trim()
  .transform((v) => Number(v.replace(",", ".")))
  .pipe(z.number().min(0).max(10));

export async function guardarNota(id: number, formData: FormData) {
  await requireAuthorizedUser();
  const parsed = notaSchema.safeParse(formData.get("nota"));
  if (!parsed.success) return;
  await db
    .update(examenes)
    .set({ nota: parsed.data })
    .where(eq(examenes.id, id));
  refrescar();
}
