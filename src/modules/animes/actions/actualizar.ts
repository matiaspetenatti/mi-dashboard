"use server";

import { requireAuthorizedUser } from "@/lib/auth";

import { db } from "@/db";
import { animesVistos } from "@/modules/animes/schema";
import type { AnimeVisto } from "@/modules/animes/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  aColumnasPuntaje,
  calcularTotalPuntajes,
} from "@/modules/animes/lib/criterios";
import { leerPuntajesFormData } from "./_puntajes";
import { invalidarCacheAnimes } from "@/modules/animes/lib/cache";

const parseNumero = (raw: FormDataEntryValue | null): number | null => {
  if (raw === null || raw === "") return null;
  const numero = Number(raw);
  return Number.isFinite(numero) ? numero : Number.NaN;
};

const actualizarSchema = z.object({
  id: z.coerce.number().int().positive(),
  estado: z.enum(["planeado", "viendo", "completado", "en_pausa", "abandonado"]),
  notas: z.string().nullable(),
  rewatch: z.boolean(),
  episodiosVistos: z.number().int().min(0).optional(),
  favorito: z.boolean().optional(),
  anilistId: z.number().int().nullable().optional(),
  estudio: z.string().nullable().optional(),
  fuente: z.string().nullable().optional(),
  formato: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
});

export async function actualizarAnimeVisto(formData: FormData) {
  await requireAuthorizedUser();
  const id = formData.get("id");

  let tags: string[] | undefined;
  if (formData.has("tags")) {
    try {
      const parsedTags = JSON.parse(String(formData.get("tags") ?? "[]"));
      tags = Array.isArray(parsedTags)
        ? Array.from(
            new Set(
              parsedTags
                .map((t: unknown) => String(t).trim().toLowerCase())
                .filter(Boolean),
            ),
          )
        : undefined;
    } catch {
      tags = undefined;
    }
  }

  const parsed = actualizarSchema.safeParse({
    id: Number(id),
    estado: formData.get("estado") || "completado",
    notas: formData.get("notas") || null,
    rewatch: formData.get("rewatch") === "true",
    episodiosVistos:
      formData.get("episodiosVistos") === null ||
      formData.get("episodiosVistos") === ""
        ? undefined
        : parseNumero(formData.get("episodiosVistos")),
    favorito:
      formData.get("favorito") === null
        ? undefined
        : formData.get("favorito") === "true",
    anilistId:
      formData.get("anilistId") === null || formData.get("anilistId") === ""
        ? undefined
        : parseNumero(formData.get("anilistId")),
    estudio:
      formData.get("estudio") === null
        ? undefined
        : formData.get("estudio") === ""
          ? null
          : String(formData.get("estudio")),
    fuente:
      formData.get("fuente") === null
        ? undefined
        : formData.get("fuente") === ""
          ? null
          : String(formData.get("fuente")),
    formato:
      formData.get("formato") === null
        ? undefined
        : formData.get("formato") === ""
          ? null
          : String(formData.get("formato")),
    tags,
  });

  if (!parsed.success) {
    return { error: "Datos inválidos" };
  }

  const puntajes = leerPuntajesFormData(formData);
  if (!puntajes) {
    return { error: "Puntajes inválidos" };
  }

  const data = parsed.data;

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
    const tope =
      anime.episodios && anime.episodios > 0
        ? anime.episodios
        : data.episodiosVistos;
    episodiosVistos = Math.max(0, Math.min(data.episodiosVistos, tope));
  }

  const cambios: Partial<typeof animesVistos.$inferInsert> = {
    estado: data.estado,
    notas: data.notas,
    rewatch: data.rewatch,
    episodiosVistos,
    actualizadoEn: new Date().toISOString(),
  };

  if (data.favorito !== undefined) cambios.favorito = data.favorito;
  if (data.anilistId !== undefined) cambios.anilistId = data.anilistId;
  if (data.estudio !== undefined) cambios.estudio = data.estudio;
  if (data.fuente !== undefined) cambios.fuente = data.fuente;
  if (data.formato !== undefined) cambios.formato = data.formato;
  if (data.tags !== undefined) cambios.tags = data.tags;

  // Si no hay ningún criterio calificado, no pisamos un puntaje anterior
  // sin desglose (los animes viejos guardaban solo el total).
  const hayPuntajes = Object.values(puntajes).some(
    (valor) => valor !== null,
  );
  if (hayPuntajes) {
    Object.assign(cambios, aColumnasPuntaje(puntajes));
    cambios.miPuntaje = calcularTotalPuntajes(puntajes);
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

export async function restaurarAnime(anime: AnimeVisto) {
  await requireAuthorizedUser();

  const { id: _id, ...datos } = anime;
  await db.insert(animesVistos).values({
    ...datos,
    actualizadoEn: new Date().toISOString(),
  });

  invalidarCacheAnimes();
  revalidatePath("/animes");
  return { success: true };
}
