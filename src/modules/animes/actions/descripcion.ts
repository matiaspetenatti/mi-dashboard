"use server";

import { requireAuthorizedUser } from "@/lib/auth";

import { db } from "@/db";
import { animesVistos } from "@/modules/animes/schema";
import { eq } from "drizzle-orm";
import { revalidatePath, updateTag } from "next/cache";

const ANIMES_TAG = "animes";

const invalidarCacheAnimes = () => {
  updateTag(ANIMES_TAG);
};

export async function obtenerDescripcionAnime(id: number) {
  await requireAuthorizedUser();
  const [anime] = await db
    .select()
    .from(animesVistos)
    .where(eq(animesVistos.id, id))
    .limit(1);

  if (!anime) {
    return { error: "Anime no encontrado" };
  }

  if (anime.descripcion?.trim()) {
    return { descripcion: anime.descripcion };
  }

  // Try to fetch from Kitsu API
  try {
    const res = await fetch(`https://kitsu.io/api/edge/anime/${anime.kitsuId}`, {
      headers: {
        Accept: "application/vnd.api+json",
        "Content-Type": "application/vnd.api+json",
      },
    });

    if (!res.ok) {
      return { descripcion: null };
    }

    const json = await res.json();
    const descripcion: string | null = json?.data?.attributes?.synopsis || null;

    if (!descripcion?.trim()) {
      return { descripcion: null };
    }

    await db
      .update(animesVistos)
      .set({ descripcion, actualizadoEn: new Date().toISOString() })
      .where(eq(animesVistos.id, anime.id));

    invalidarCacheAnimes();
    revalidatePath("/animes");

    return { descripcion };
  } catch {
    return { descripcion: null };
  }
}
