"use server";

import { requireAuthorizedUser } from "@/lib/auth";

import { db } from "@/db";
import { animesVistos } from "@/modules/animes/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { updateTag } from "next/cache";
import { z } from "zod";

const ANIMES_TAG = "animes";

const invalidarCacheAnimes = () => {
  updateTag(ANIMES_TAG);
};

const parseNumero = (raw: FormDataEntryValue | null): number | null => {
  if (raw === null || raw === "") return null;
  const numero = Number(raw);
  return Number.isFinite(numero) ? numero : Number.NaN;
};

const leerPuntajes = (
  formData: FormData,
  criterios: readonly any[],
) => {
  const puntajes: Record<string, number | null> = {};
  for (const criterio of criterios) {
    const valor = formData.get(criterio.campo);
    puntajes[criterio.key] = valor !== null && valor !== "" ? Number(valor) : null;
  }
  return puntajes;
};

const actualizarSchema = z.object({
  id: z.coerce.number().int().positive(),
  estado: z.enum(["viendo", "completado", "en_pausa", "abandonado"]),
  notas: z.string().optional().nullable(),
  rewatch: z.coerce.boolean().optional(),
  episodiosVistos: z.number().int().min(0).optional(),
});

export async function actualizarAnimeVisto(
  formData: FormData,
  criterios: readonly any[],
) {
  await requireAuthorizedUser();
  const id = formData.get("id");

  const parsed = actualizarSchema.safeParse({
    id: Number(id),
    estado: formData.get("estado") || "completado",
    notas: formData.get("notas") || null,
    rewatch: formData.get("rewatch") === "true",
    episodiosVistos:
      formData.get("episodiosVistos") === null || formData.get("episodiosVistos") === ""
        ? undefined
        : parseNumero(formData.get("episodiosVistos")),
  });

  if (!parsed.success) {
    return { error: "Datos inválidos" };
  }

  const data = parsed.data;
  const puntajes = leerPuntajes(formData, criterios);
  const hayPuntajes = criterios.some(
    (c) => puntajes[c.key] !== null,
  );

  const [anime] = await db
    .select()
    .from(animesVistos)
    .where(eq(animesVistos.id, data.id))
    .limit(1);

  if (!anime) {
    return { error: "Anime no encontrado" };
  }

  let episodiosVistos = anime.episodiosVistos;
  if (data.episodiosVistos !== undefined) {
    // Would need total episodes to clamp
    episodiosVistos = data.episodiosVistos;
  }

  const cambios: Partial<typeof animesVistos.$inferInsert> = {
    estado: data.estado,
    notas: data.notas,
    rewatch: data.rewatch ?? false,
    episodiosVistos,
    actualizadoEn: new Date().toISOString(),
  };

  if (hayPuntajes) {
    // Would calculate total scores
    cambios.miPuntaje = 0; // placeholder
  }

  await db
    .update(animesVistos)
    .set(cambios)
    .where(eq(animesVistos.id, data.id));

  invalidarCacheAnimes();
  revalidatePath("/animes");
  return { success: true };
}

export async function eliminarAnimeVisto(id: number) {
  await requireAuthorizedUser();
  await db.delete(animesVistos).where(eq(animesVistos.id, id));
  invalidarCacheAnimes();
  revalidatePath("/animes");
  return { success: true };
}
