"use server";

import { requireAuthorizedUser } from "@/lib/auth";

import { db } from "@/db";
import { animesVistos } from "@/modules/animes/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { invalidarCacheAnimes } from "@/modules/animes/lib/cache";

export async function alternarFavoritoAnime(id: number) {
  await requireAuthorizedUser();

  const [anime] = await db
    .select()
    .from(animesVistos)
    .where(eq(animesVistos.id, id))
    .limit(1);

  if (!anime) {
    return { error: "Anime no encontrado" };
  }

  const nuevo = !anime.favorito;

  await db
    .update(animesVistos)
    .set({ favorito: nuevo, actualizadoEn: new Date().toISOString() })
    .where(eq(animesVistos.id, id));

  invalidarCacheAnimes();
  revalidatePath("/animes");

  return { success: true, favorito: nuevo };
}