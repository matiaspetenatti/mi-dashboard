"use server";

import { db } from "@/db";
import { tareas, tags, tareasTags, grupos } from "./schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { iconos } from "./iconos";

function refrescar() {
  revalidatePath("/tareas", "layout");
  revalidatePath("/");
}

const colorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/);

const tagSchema = z.object({
  nombre: z
    .string()
    .trim()
    .toLowerCase()
    .transform((v) => v.replace(/^#/, ""))
    .pipe(z.string().min(1).max(30)),
  color: colorSchema,
  icono: z
    .string()
    .refine((k) => k === "" || k in iconos)
    .transform((k) => k || null),
});

export async function actualizarTag(id: number, formData: FormData) {
  const parsed = tagSchema.safeParse({
    nombre: formData.get("nombre"),
    color: formData.get("color"),
    icono: formData.get("icono") ?? "",
  });
  if (!parsed.success) return;
  try {
    await db.update(tags).set(parsed.data).where(eq(tags.id, id));
  } catch {
    return; // nombre repetido (el nombre es único)
  }
  refrescar();
}

export async function borrarTag(id: number) {
  await db.batch([
    db.delete(tareasTags).where(eq(tareasTags.tagId, id)),
    db.delete(tags).where(eq(tags.id, id)),
  ]);
  refrescar();
}

const grupoSchema = z.object({
  nombre: z.string().trim().min(1).max(60),
  color: colorSchema,
});

export async function crearGrupo(formData: FormData) {
  const parsed = grupoSchema.safeParse({
    nombre: formData.get("nombre"),
    color: formData.get("color"),
  });
  if (!parsed.success) return;
  await db.insert(grupos).values(parsed.data);
  refrescar();
}

export async function actualizarGrupo(id: number, formData: FormData) {
  const parsed = grupoSchema.safeParse({
    nombre: formData.get("nombre"),
    color: formData.get("color"),
  });
  if (!parsed.success) return;
  await db.update(grupos).set(parsed.data).where(eq(grupos.id, id));
  refrescar();
}

export async function borrarGrupo(id: number) {
  // las tareas del grupo quedan "sin grupo"
  await db.batch([
    db.update(tareas).set({ grupoId: null }).where(eq(tareas.grupoId, id)),
    db.delete(grupos).where(eq(grupos.id, id)),
  ]);
  refrescar();
}
