"use server";

import { requireAuthorizedUser } from "@/lib/auth";

import { db } from "@/db";
import { animesVistos } from "@/modules/animes/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { invalidarCacheAnimes } from "@/modules/animes/lib/cache";

const tagSchema = z.string().trim().min(1).max(40);

function normalizarTag(tag: string) {
  return tag.trim().toLowerCase();
}

export async function agregarTagAnime(id: number, tag: string) {
  await requireAuthorizedUser();

  const parsed = tagSchema.safeParse(tag);
  if (!parsed.success) return { error: "Tag inválido" };

  const [anime] = await db
    .select()
    .from(animesVistos)
    .where(eq(animesVistos.id, id))
    .limit(1);

  if (!anime) return { error: "Anime no encontrado" };

  const tagsActuales = Array.isArray(anime.tags) ? anime.tags : [];
  const nuevoTag = normalizarTag(parsed.data);
  if (tagsActuales.includes(nuevoTag)) {
    return { success: true, tags: tagsActuales };
  }

  const nuevosTags = [...tagsActuales, nuevoTag];

  await db
    .update(animesVistos)
    .set({ tags: nuevosTags, actualizadoEn: new Date().toISOString() })
    .where(eq(animesVistos.id, id));

  invalidarCacheAnimes();
  revalidatePath("/animes");

  return { success: true, tags: nuevosTags };
}

export async function quitarTagAnime(id: number, tag: string) {
  await requireAuthorizedUser();

  const [anime] = await db
    .select()
    .from(animesVistos)
    .where(eq(animesVistos.id, id))
    .limit(1);

  if (!anime) return { error: "Anime no encontrado" };

  const tagsActuales = Array.isArray(anime.tags) ? anime.tags : [];
  const tagNormalizado = normalizarTag(tag);
  const nuevosTags = tagsActuales.filter((t) => t !== tagNormalizado);

  await db
    .update(animesVistos)
    .set({ tags: nuevosTags, actualizadoEn: new Date().toISOString() })
    .where(eq(animesVistos.id, id));

  invalidarCacheAnimes();
  revalidatePath("/animes");

  return { success: true, tags: nuevosTags };
}