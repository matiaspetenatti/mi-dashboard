"use server";

import { requireAuthorizedUser } from "@/lib/auth";

import { db } from "@/db";
import { animesVistos } from "@/modules/animes/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { updateTag } from "next/cache";

const ANIMES_TAG = "animes";

const invalidarCacheAnimes = () => {
  updateTag(ANIMES_TAG);
};

export async function actualizarProgresoAnime(id: number, episodiosVistos: number) {
  await requireAuthorizedUser();

  const [anime] = await db
    .select()
    .from(animesVistos)
    .where(eq(animesVistos.id, id))
    .limit(1);

  if (!anime) {
    return { error: "Anime no encontrado" };
  }

  const vistos = Math.max(0, Math.min(episodiosVistos, anime.episodios || episodiosVistos));

  await db
    .update(animesVistos)
    .set({
      episodiosVistos: vistos,
      actualizadoEn: new Date().toISOString(),
    })
    .where(eq(animesVistos.id, anime.id));

  invalidarCacheAnimes();
  revalidatePath("/animes");
  return { success: true, episodiosVistos: vistos };
}
