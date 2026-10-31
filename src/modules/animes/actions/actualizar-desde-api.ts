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

export async function actualizarAnimeDesdeApi(id: number) {
  await requireAuthorizedUser();

  const [anime] = await db
    .select()
    .from(animesVistos)
    .where(eq(animesVistos.id, id))
    .limit(1);

  if (!anime) {
    return { error: "Anime no encontrado" };
  }

  if (!anime.kitsuId) {
    return { error: "El anime no tiene un ID de Kitsu asociado" };
  }

  try {
    const res = await fetch(
      `https://kitsu.io/api/edge/anime/${anime.kitsuId}?include=categories`,
      {
        headers: {
          Accept: "application/vnd.api+json",
          "Content-Type": "application/vnd.api+json",
        },
      },
    );

    if (!res.ok) {
      return {
        error: `Kitsu respondió con estado ${res.status}`,
      };
    }

    const json = await res.json();

    if (!json?.data) {
      return { error: "No se encontraron datos en Kitsu" };
    }

    const attrs = json.data.attributes || {};
    const titles = attrs.titles || {};
    const poster = attrs.posterImage || {};
    const startDate = attrs.startDate || null;
    const year = startDate ? Number(String(startDate).slice(0, 4)) : null;

    // Leer géneros desde included
    const categoriesById = new Map<string, string>();
    const included = json.included || [];
    for (const inc of included) {
      if (inc.type === "categories" && inc.attributes?.title) {
        categoriesById.set(inc.id, inc.attributes.title);
      }
    }
    const genres: string[] = [];
    const relCats = json.data.relationships?.categories?.data || [];
    for (const c of relCats) {
      const name = categoriesById.get(c.id);
      if (name && !genres.includes(name)) genres.push(name);
    }

    const cambios: Partial<typeof animesVistos.$inferInsert> = {
      titulo: attrs.canonicalTitle || titles.en_jp || titles.en || anime.titulo,
      tituloIngles: titles.en ?? anime.tituloIngles,
      imagen:
        poster.large || poster.medium || poster.original || anime.imagen,
      tipo: attrs.subtype ? attrs.subtype.toUpperCase() : anime.tipo,
      episodios: attrs.episodeCount ?? anime.episodios,
      ano: year ?? anime.ano,
      fechaEmision: startDate ?? anime.fechaEmision,
      generos: genres.length > 0 ? genres : anime.generos,
      descripcion: attrs.synopsis ?? anime.descripcion,
      scoreMal: attrs.averageRating
        ? Number((Number(attrs.averageRating) / 10).toFixed(2))
        : anime.scoreMal,
      actualizadoEn: new Date().toISOString(),
    };

    await db
      .update(animesVistos)
      .set(cambios)
      .where(eq(animesVistos.id, anime.id));

    invalidarCacheAnimes();
    revalidatePath("/animes");

    return { success: true, cambios };
  } catch (err) {
    console.error("[actualizarAnimeDesdeApi] Error:", err);
    return { error: "Error inesperado al consultar Kitsu" };
  }
}
